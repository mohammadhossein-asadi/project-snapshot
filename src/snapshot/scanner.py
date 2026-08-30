"""Core file scanner for Project Snapshot."""

import os
import stat
from datetime import datetime
from pathlib import Path, PurePosixPath
from typing import Optional

from .constants import TEXT_EXTENSIONS, BINARY_EXTENSIONS, DEFAULT_EXCLUDED_DIRS
from .language import detect_language
from .hashing import compute_sha256
from .secrets import scan_for_secrets


def _human_readable_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size_bytes < 1024:
            if unit == "B":
                return f"{size_bytes} B"
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} PB"


def _get_permissions(file_path: Path) -> str:
    """Get file permissions in a portable way."""
    try:
        st = file_path.stat()
        mode = stat.S_IMODE(st.st_mode)
        return oct(mode)[-3:]
    except (OSError, PermissionError):
        return "???"


def _is_binary(file_path: Path) -> bool:
    """Determine if a file is binary based on extension and content."""
    suffix = file_path.suffix.lower()
    if suffix in BINARY_EXTENSIONS:
        return True
    if suffix in TEXT_EXTENSIONS:
        return False

    try:
        with open(file_path, "rb") as f:
            chunk = f.read(8192)
            if b"\x00" in chunk:
                return True
    except (OSError, PermissionError):
        pass

    return False


def _read_text_content(file_path: Path, max_size: int) -> Optional[str]:
    """Read text content of a file, handling encoding gracefully."""
    try:
        size = file_path.stat().st_size
        if size > max_size:
            return None

        try:
            return file_path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, UnicodeError):
            try:
                return file_path.read_text(encoding="latin-1")
            except Exception:
                return "[Error: Unable to decode file]"
    except (OSError, PermissionError):
        return None


def _get_mime_type(file_path: Path) -> str:
    """Get MIME type using mimetypes module."""
    import mimetypes

    mime_type, _ = mimetypes.guess_type(str(file_path))
    return mime_type or "application/octet-stream"


def scan_file(
    file_path: Path,
    project_root: Path,
    max_size: int,
    exclude_output_files: set[str],
) -> Optional[dict]:
    """
    Scan a single file and return its metadata.

    Returns None if the file should be skipped.
    """
    rel_path = file_path.relative_to(project_root)
    posix_path = PurePosixPath(rel_path).as_posix()

    if file_path.name in exclude_output_files:
        return None

    is_sym = file_path.is_symlink()
    is_dir = file_path.is_dir()
    is_bin = False
    file_size = 0
    file_hash = ""
    modified = ""
    permissions = ""
    mime_type = ""
    language = ""
    content = None
    symlink_target = None
    secret_info = {"is_secret_file": False, "content_secrets": [], "has_secrets": False}

    try:
        if is_sym:
            symlink_target = str(file_path.resolve())
            try:
                st = file_path.stat()
                file_size = st.st_size
                modified = datetime.fromtimestamp(st.st_mtime).isoformat()
            except (OSError, PermissionError):
                pass
        elif is_dir:
            permissions = _get_permissions(file_path)
        else:
            try:
                st = file_path.stat()
                file_size = st.st_size
                modified = datetime.fromtimestamp(st.st_mtime).isoformat()
            except (OSError, PermissionError):
                pass

            permissions = _get_permissions(file_path)
            mime_type = _get_mime_type(file_path)
            language = detect_language(file_path)
            is_bin = _is_binary(file_path)

            if not is_bin:
                file_hash = compute_sha256(file_path)
                content = _read_text_content(file_path, max_size)
                secret_info = scan_for_secrets(file_path, max_size)
            else:
                file_hash = compute_sha256(file_path)
    except (OSError, PermissionError):
        pass

    return {
        "path": posix_path,
        "absolute_path": str(file_path),
        "is_directory": is_dir,
        "is_symlink": is_sym,
        "is_binary": is_bin,
        "symlink_target": symlink_target,
        "size_bytes": file_size,
        "size_human": _human_readable_size(file_size),
        "modified": modified,
        "permissions": permissions,
        "mime_type": mime_type,
        "language": language,
        "sha256": file_hash,
        "content": content,
        "secret_info": secret_info,
    }


def scan_project(
    project_root: Path,
    excluded_dirs: Optional[set[str]] = None,
    user_excluded_dirs: Optional[set[str]] = None,
    max_size: int = 10 * 1024 * 1024,
    include_default_heavy: bool = False,
) -> dict:
    """
    Scan the entire project directory.

    Returns a dict with:
        - files: list of file metadata dicts
        - errors: list of error strings
        - stats: aggregated statistics
    """
    if excluded_dirs is None:
        excluded_dirs = set(DEFAULT_EXCLUDED_DIRS)
    if user_excluded_dirs is None:
        user_excluded_dirs = set()

    if include_default_heavy:
        heavy_only = {
            ".git", "node_modules", ".next", ".nuxt",
            "dist", "build", "coverage", ".venv", "venv",
            "__pycache__", ".cache", ".idea", ".vscode",
        }
        excluded_dirs = excluded_dirs - heavy_only

    excluded_dirs = excluded_dirs | user_excluded_dirs

    exclude_output_files = {"README.md", "PROJECT-SNAPSHOT.json"}

    files = []
    errors = []
    dir_count = 0
    total_size = 0

    for root, dirs, filenames in os.walk(
        str(project_root),
        topdown=True,
        followlinks=False,
    ):
        root_path = Path(root)

        dirs[:] = sorted(d for d in dirs if d not in excluded_dirs)

        for d in dirs:
            dir_count += 1
            dir_path = root_path / d
            info = scan_file(dir_path, project_root, max_size, exclude_output_files)
            if info:
                files.append(info)

        for fname in sorted(filenames):
            file_path = root_path / fname
            try:
                info = scan_file(file_path, project_root, max_size, exclude_output_files)
                if info:
                    files.append(info)
                    total_size += info.get("size_bytes", 0)
            except Exception as e:
                errors.append(f"Error scanning {file_path}: {e}")

    stats = _compute_stats(files, dir_count, total_size, excluded_dirs, include_default_heavy)

    return {
        "files": files,
        "errors": errors,
        "stats": stats,
    }


def _compute_stats(
    files: list[dict],
    dir_count: int,
    total_size: int,
    excluded_dirs: set[str],
    include_default_heavy: bool,
) -> dict:
    """Compute aggregated project statistics."""
    text_files = 0
    binary_files = 0
    symlink_count = 0
    secret_count = 0
    languages: dict[str, int] = {}
    extensions: dict[str, int] = {}
    largest_files = []

    for f in files:
        if f["is_directory"]:
            continue

        if f["is_symlink"]:
            symlink_count += 1

        if f["is_binary"]:
            binary_files += 1
        else:
            text_files += 1

        if f.get("secret_info", {}).get("has_secrets"):
            secret_count += 1

        lang = f.get("language", "Unknown")
        if lang and lang != "Unknown":
            languages[lang] = languages.get(lang, 0) + 1

        suffix = Path(f["path"]).suffix.lower()
        if suffix:
            extensions[suffix] = extensions.get(suffix, 0) + 1

        largest_files.append({
            "path": f["path"],
            "size": f["size_bytes"],
        })

    largest_files.sort(key=lambda x: x["size"], reverse=True)
    largest_files = largest_files[:20]

    sorted_langs = dict(sorted(languages.items(), key=lambda x: x[1], reverse=True))
    sorted_exts = dict(sorted(extensions.items(), key=lambda x: x[1], reverse=True))

    return {
        "total_files": text_files + binary_files,
        "total_directories": dir_count,
        "total_size_bytes": total_size,
        "total_size_human": _human_readable_size(total_size),
        "text_files": text_files,
        "binary_files": binary_files,
        "symlinks": symlink_count,
        "secret_detections": secret_count,
        "languages": sorted_langs,
        "extensions": sorted_exts,
        "largest_files": largest_files,
        "excluded_directories": sorted(excluded_dirs) if not include_default_heavy else [],
    }

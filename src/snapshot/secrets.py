"""Secret detection for Project Snapshot."""

import re
from pathlib import Path

from .constants import SECRET_PATTERNS, SECRET_FILENAMES


def is_secret_filename(filename: str) -> bool:
    """Check if a filename matches known secret file patterns."""
    name = filename.lower()
    for pattern in SECRET_FILENAMES:
        if pattern.startswith("*."):
            if name.endswith(pattern[1:]):
                return True
        elif name == pattern:
            return True
    return False


def detect_secrets_in_content(content: str) -> list[dict]:
    """Scan file content for likely secret patterns."""
    detections = []
    for pattern in SECRET_PATTERNS:
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            line_num = content[:match.start()].count("\n") + 1
            detections.append({
                "pattern": pattern,
                "match_start": match.start(),
                "line": line_num,
                "snippet": match.group()[:20] + "..." if len(match.group()) > 20 else match.group(),
            })
    return detections


def is_secret_file(file_path: Path) -> bool:
    """Check if a file is likely a secret file based on name."""
    return is_secret_filename(file_path.name)


def scan_for_secrets(file_path: Path, max_size: int = 1_048_576) -> dict:
    """
    Scan a file for potential secrets.

    Returns a dict with:
        - is_secret_file: bool
        - content_secrets: list of detected patterns in content
        - has_secrets: bool (True if any detection)
    """
    result = {
        "is_secret_file": is_secret_file(file_path),
        "content_secrets": [],
        "has_secrets": False,
    }

    if result["is_secret_file"]:
        result["has_secrets"] = True

    try:
        size = file_path.stat().st_size
        if size > max_size:
            return result

        try:
            content = file_path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, UnicodeError):
            try:
                content = file_path.read_text(encoding="latin-1")
            except Exception:
                return result

        content_secrets = detect_secrets_in_content(content)
        if content_secrets:
            result["content_secrets"] = content_secrets
            result["has_secrets"] = True

    except (OSError, PermissionError):
        pass

    return result

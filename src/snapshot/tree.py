"""Directory tree generation for Project Snapshot."""

from pathlib import Path
from typing import Optional


def _sort_key(path: Path) -> tuple:
    """Deterministic sort key: directories first, then alphabetically by lowercase name."""
    name = path.name.lower()
    return (not path.is_dir(), name)


def build_tree(
    root: Path,
    prefix: str = "",
    excluded_dirs: Optional[set[str]] = None,
    is_last: bool = True,
    is_root: bool = True,
) -> list[str]:
    """
    Build a deterministic project tree representation.

    Returns a list of tree lines (without trailing newlines).
    """
    if excluded_dirs is None:
        excluded_dirs = set()

    lines = []

    if is_root:
        lines.append(".")

    try:
        entries = sorted(root.iterdir(), key=_sort_key)
    except (PermissionError, OSError):
        return lines

    filtered = []
    for entry in entries:
        if entry.is_dir():
            if entry.name in excluded_dirs:
                continue
        filtered.append(entry)

    for i, entry in enumerate(filtered):
        is_entry_last = (i == len(filtered) - 1)
        connector = "\u2514\u2500\u2500 " if is_entry_last else "\u251c\u2500\u2500 "

        if entry.is_dir():
            lines.append(f"{prefix}{connector}{entry.name}/")
            extension = "    " if is_entry_last else "\u2502   "
            sub_lines = build_tree(
                entry,
                prefix=prefix + extension,
                excluded_dirs=excluded_dirs,
                is_last=is_entry_last,
                is_root=False,
            )
            lines.extend(sub_lines)
        else:
            lines.append(f"{prefix}{connector}{entry.name}")

    return lines


def generate_tree(root: Path, excluded_dirs: Optional[set[str]] = None) -> str:
    """Generate a tree string for the project."""
    lines = build_tree(root, excluded_dirs=excluded_dirs)
    return "\n".join(lines)

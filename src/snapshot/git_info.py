"""Git integration for Project Snapshot."""

import subprocess
from pathlib import Path
from typing import Optional


def _run_git(args: list[str], cwd: str) -> Optional[str]:
    """Run a git command and return stdout, or None on failure."""
    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return None
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return None


def get_git_info(project_root: Path) -> dict:
    """Collect Git repository information if available."""
    root_str = str(project_root)

    is_repo = _run_git(["rev-parse", "--is-inside-work-tree"], cwd=root_str)
    if not is_repo:
        return {"is_repository": False}

    branch = _run_git(["rev-parse", "--abbrev-ref", "HEAD"], cwd=root_str)
    commit = _run_git(["rev-parse", "HEAD"], cwd=root_str)
    short_commit = _run_git(["rev-parse", "--short", "HEAD"], cwd=root_str)
    origin = _run_git(["remote", "get-url", "origin"], cwd=root_str)
    repo_root = _run_git(["rev-parse", "--show-toplevel"], cwd=root_str)

    status_output = _run_git(["status", "--porcelain"], cwd=root_str)
    modified_files = []
    untracked_files = []
    if status_output:
        for line in status_output.splitlines():
            if not line.strip():
                continue
            status_code = line[:2].strip()
            file_path = line[3:].strip()
            if status_code == "??":
                untracked_files.append(file_path)
            elif status_code:
                modified_files.append({"path": file_path, "status": status_code})

    return {
        "is_repository": True,
        "branch": branch,
        "commit": commit,
        "short_commit": short_commit,
        "origin": origin,
        "repository_root": repo_root,
        "modified_files": modified_files,
        "untracked_files": untracked_files,
    }

"""File hashing utilities for Project Snapshot."""

import hashlib
from pathlib import Path


def compute_sha256(file_path: Path, chunk_size: int = 8192) -> str:
    """Compute SHA-256 hash of a file, reading in chunks for memory efficiency."""
    sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                sha256.update(chunk)
        return sha256.hexdigest()
    except (OSError, PermissionError, IOError):
        return "error:unable_to_read"


def compute_hash(data: bytes) -> str:
    """Compute SHA-256 hash of bytes data."""
    return hashlib.sha256(data).hexdigest()

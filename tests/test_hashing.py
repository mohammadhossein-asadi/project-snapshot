"""Tests for the hashing module."""

import tempfile
from pathlib import Path

import pytest

from snapshot.hashing import compute_sha256, compute_hash


def test_compute_sha256_basic(tmp_path):
    f = tmp_path / "test.txt"
    f.write_text("hello world")
    result = compute_sha256(f)
    assert len(result) == 64
    assert result == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"


def test_compute_sha256_empty_file(tmp_path):
    f = tmp_path / "empty.txt"
    f.write_text("")
    result = compute_sha256(f)
    assert len(result) == 64


def test_compute_sha256_binary(tmp_path):
    f = tmp_path / "binary.bin"
    f.write_bytes(b"\x00\x01\x02\x03\x04\x05")
    result = compute_sha256(f)
    assert len(result) == 64


def test_compute_sha256_nonexistent():
    result = compute_sha256(Path("/nonexistent/path/file.txt"))
    assert result == "error:unable_to_read"


def test_compute_hash():
    data = b"hello world"
    result = compute_hash(data)
    assert len(result) == 64
    assert result == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"


def test_compute_hash_empty():
    result = compute_hash(b"")
    assert len(result) == 64


def test_same_content_same_hash(tmp_path):
    f1 = tmp_path / "a.txt"
    f2 = tmp_path / "b.txt"
    f1.write_text("identical")
    f2.write_text("identical")
    assert compute_sha256(f1) == compute_sha256(f2)


def test_different_content_different_hash(tmp_path):
    f1 = tmp_path / "a.txt"
    f2 = tmp_path / "b.txt"
    f1.write_text("content A")
    f2.write_text("content B")
    assert compute_sha256(f1) != compute_sha256(f2)

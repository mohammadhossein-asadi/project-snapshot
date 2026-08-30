"""Tests for the scanner module."""

import os
import tempfile
from pathlib import Path

import pytest

from snapshot.scanner import (
    scan_project,
    scan_file,
    _human_readable_size,
    _is_binary,
    _get_permissions,
)


@pytest.fixture
def sample_project(tmp_path):
    """Create a sample project for scanning."""
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text("print('hello')")
    (tmp_path / "src" / "app.js").write_text("console.log('hello')")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "test_main.py").write_text("def test_pass(): assert True")
    (tmp_path / "README.md").write_text("# Test Project")
    (tmp_path / "package.json").write_text('{"name": "test"}')
    (tmp_path / ".gitignore").write_text("node_modules")
    (tmp_path / ".env").write_text("SECRET=abc123")
    return tmp_path


class TestHumanReadableSize:
    def test_bytes(self):
        assert _human_readable_size(500) == "500 B"

    def test_zero(self):
        assert _human_readable_size(0) == "0 B"

    def test_kilobytes(self):
        result = _human_readable_size(1536)
        assert "KB" in result

    def test_megabytes(self):
        result = _human_readable_size(1024 * 1024 * 5)
        assert "MB" in result

    def test_gigabytes(self):
        result = _human_readable_size(1024 * 1024 * 1024 * 2)
        assert "GB" in result


class TestIsBinary:
    def test_text_file(self, tmp_path):
        f = tmp_path / "test.py"
        f.write_text("print('hello')")
        assert _is_binary(f) is False

    def test_binary_extension(self, tmp_path):
        f = tmp_path / "image.png"
        f.write_bytes(b"\x89PNG\r\n\x1a\n")
        assert _is_binary(f) is True

    def test_unknown_extension_with_text(self, tmp_path):
        f = tmp_path / "file.xyz"
        f.write_text("hello world")
        assert _is_binary(f) is False

    def test_unknown_extension_with_nulls(self, tmp_path):
        f = tmp_path / "file.xyz"
        f.write_bytes(b"\x00\x01\x02\x03")
        assert _is_binary(f) is True


class TestGetPermissions:
    def test_regular_file(self, tmp_path):
        f = tmp_path / "test.txt"
        f.write_text("hello")
        perms = _get_permissions(f)
        assert len(perms) == 3
        assert perms.isdigit()

    def test_nonexistent(self):
        perms = _get_permissions(Path("/nonexistent/file"))
        assert perms == "???"


class TestScanProject:
    def test_basic_scan(self, sample_project):
        result = scan_project(sample_project)
        assert "files" in result
        assert "stats" in result
        assert "errors" in result
        assert result["stats"]["total_files"] > 0

    def test_excludes_default_dirs(self, sample_project):
        (sample_project / "node_modules").mkdir()
        (sample_project / "node_modules" / "dep").mkdir()
        (sample_project / "node_modules" / "dep" / "index.js").write_text("module.exports = {}")
        result = scan_project(sample_project)
        paths = [f["path"] for f in result["files"]]
        assert not any("node_modules" in p for p in paths)

    def test_includes_default_heavy(self, sample_project):
        (sample_project / "node_modules").mkdir()
        (sample_project / "node_modules" / "dep").mkdir()
        (sample_project / "node_modules" / "dep" / "index.js").write_text("module.exports = {}")
        result = scan_project(sample_project, include_default_heavy=True)
        paths = [f["path"] for f in result["files"]]
        assert any("node_modules" in p for p in paths)

    def test_user_exclusions(self, sample_project):
        (sample_project / "vendor").mkdir()
        (sample_project / "vendor" / "lib.py").write_text("x = 1")
        result = scan_project(sample_project, user_excluded_dirs={"vendor"})
        paths = [f["path"] for f in result["files"]]
        assert not any("vendor" in p for p in paths)

    def test_hidden_files_included(self, sample_project):
        result = scan_project(sample_project)
        paths = [f["path"] for f in result["files"]]
        assert any(".gitignore" in p for p in paths)
        assert any(".env" in p for p in paths)

    def test_file_metadata(self, sample_project):
        result = scan_project(sample_project)
        py_files = [f for f in result["files"] if f["path"] == "src/main.py"]
        assert len(py_files) == 1
        f = py_files[0]
        assert f["size_bytes"] > 0
        assert f["sha256"]
        assert f["language"] == "Python"
        assert f["is_binary"] is False
        assert f["content"] == "print('hello')"

    def test_secret_detection(self, sample_project):
        result = scan_project(sample_project)
        env_files = [f for f in result["files"] if f["path"].endswith(".env")]
        assert len(env_files) == 1
        assert env_files[0]["secret_info"]["has_secrets"] is True

    def test_stats_languages(self, sample_project):
        result = scan_project(sample_project)
        stats = result["stats"]
        assert "Python" in stats["languages"]
        assert "JavaScript" in stats["languages"]

    def test_stats_extensions(self, sample_project):
        result = scan_project(sample_project)
        stats = result["stats"]
        assert ".py" in stats["extensions"]
        assert ".js" in stats["extensions"]

    def test_symlink_detection(self, sample_project):
        target = sample_project / "src" / "main.py"
        link = sample_project / "src" / "link.py"
        try:
            link.symlink_to(target)
            result = scan_project(sample_project)
            symlinks = [f for f in result["files"] if f["is_symlink"]]
            assert len(symlinks) >= 1
        except (OSError, NotImplementedError):
            pytest.skip("Symlinks not supported on this platform")

    def test_output_files_excluded(self, sample_project):
        (sample_project / "README.md").write_text("# Original")
        result = scan_project(sample_project)
        md_files = [f for f in result["files"] if f["path"] == "README.md"]
        assert len(md_files) == 0

    def test_empty_project(self, tmp_path):
        result = scan_project(tmp_path)
        assert result["stats"]["total_files"] == 0


class TestScanFile:
    def test_scan_text_file(self, sample_project):
        f = sample_project / "src" / "main.py"
        info = scan_file(f, sample_project, 10 * 1024 * 1024, {"README.md"})
        assert info is not None
        assert info["path"] == "src/main.py"
        assert info["language"] == "Python"
        assert info["is_binary"] is False

    def test_scan_directory(self, sample_project):
        d = sample_project / "src"
        info = scan_file(d, sample_project, 10 * 1024 * 1024, {"README.md"})
        assert info is not None
        assert info["is_directory"] is True

    def test_scan_excluded_file(self, sample_project):
        f = sample_project / "README.md"
        info = scan_file(f, sample_project, 10 * 1024 * 1024, {"README.md"})
        assert info is None

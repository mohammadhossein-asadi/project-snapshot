"""Tests for the CLI module."""

import sys
from pathlib import Path

import pytest

from snapshot.cli import main
from snapshot import __version__


@pytest.fixture
def sample_project(tmp_path):
    """Create a sample project for CLI testing."""
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text("print('hello')")
    (tmp_path / "README.md").write_text("# Test")
    return tmp_path


def test_cli_default(sample_project, monkeypatch):
    monkeypatch.chdir(sample_project)
    result = main([])
    assert result == 0
    assert (sample_project / "README.md").exists()
    assert (sample_project / "PROJECT-SNAPSHOT.json").exists()


def test_cli_custom_output(sample_project, monkeypatch):
    monkeypatch.chdir(sample_project)
    result = main(["--output", "SNAPSHOT.md", "--manifest", "snapshot.json"])
    assert result == 0
    assert (sample_project / "SNAPSHOT.md").exists()
    assert (sample_project / "snapshot.json").exists()


def test_cli_path_argument(sample_project):
    result = main([str(sample_project)])
    assert result == 0
    assert (sample_project / "README.md").exists()


def test_cli_invalid_path():
    result = main(["/nonexistent/path/that/does/not/exist"])
    assert result == 1


def test_cli_exclude(sample_project):
    (sample_project / "vendor").mkdir()
    (sample_project / "vendor" / "lib.py").write_text("x = 1")
    result = main([str(sample_project), "--exclude", "vendor"])
    assert result == 0


def test_cli_include_default_heavy(sample_project):
    (sample_project / "node_modules").mkdir()
    (sample_project / "node_modules" / "dep").mkdir()
    (sample_project / "node_modules" / "dep" / "index.js").write_text("module.exports = {}")
    result = main([str(sample_project), "--include-default-heavy"])
    assert result == 0


def test_cli_max_size(sample_project):
    result = main([str(sample_project), "--max-size", "100"])
    assert result == 0


def test_cli_version(capsys):
    with pytest.raises(SystemExit) as exc_info:
        main(["--version"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert __version__ in captured.out

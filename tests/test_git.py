"""Tests for the git_info module."""

import pytest

from snapshot.git_info import get_git_info, _run_git


def test_non_git_directory(tmp_path):
    result = get_git_info(tmp_path)
    assert result["is_repository"] is False


def test_run_git_nonexistent():
    result = _run_git(["status"], cwd="/nonexistent/path")
    assert result is None

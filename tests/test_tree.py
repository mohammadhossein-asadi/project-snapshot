"""Tests for the tree module."""

import os
import tempfile
from pathlib import Path

import pytest

from snapshot.tree import build_tree, generate_tree


@pytest.fixture
def sample_project(tmp_path):
    """Create a sample project directory structure."""
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "components").mkdir()
    (tmp_path / "src" / "components" / "Button.tsx").write_text("export default function Button() {}")
    (tmp_path / "src" / "components" / "Modal.tsx").write_text("export default function Modal() {}")
    (tmp_path / "src" / "pages").mkdir()
    (tmp_path / "src" / "utils").mkdir()
    (tmp_path / "tests").mkdir()
    (tmp_path / "package.json").write_text('{"name": "test"}')
    (tmp_path / "tsconfig.json").write_text("{}")
    (tmp_path / ".gitignore").write_text("node_modules")
    (tmp_path / "README.md").write_text("# Test")
    return tmp_path


def test_tree_starts_with_dot(sample_project):
    tree = generate_tree(sample_project)
    assert tree.startswith(".")


def test_tree_contains_files(sample_project):
    tree = generate_tree(sample_project)
    assert "package.json" in tree
    assert "README.md" in tree
    assert ".gitignore" in tree


def test_tree_contains_directories(sample_project):
    tree = generate_tree(sample_project)
    assert "src/" in tree
    assert "tests/" in tree


def test_tree_contains_nested_files(sample_project):
    tree = generate_tree(sample_project)
    assert "Button.tsx" in tree
    assert "Modal.tsx" in tree


def test_tree_excludes_directories(sample_project):
    (sample_project / "node_modules").mkdir()
    (sample_project / "node_modules" / "dep").mkdir()
    (sample_project / "node_modules" / "dep" / "index.js").write_text("module.exports = {};")

    tree = generate_tree(sample_project, excluded_dirs={"node_modules"})
    assert "node_modules" not in tree


def test_tree_deterministic(sample_project):
    tree1 = generate_tree(sample_project)
    tree2 = generate_tree(sample_project)
    assert tree1 == tree2


def test_tree_empty_directory(tmp_path):
    tree = generate_tree(tmp_path)
    assert tree == "."


def test_tree_hidden_files(sample_project):
    (sample_project / ".env").write_text("SECRET=123")
    tree = generate_tree(sample_project)
    assert ".env" in tree


def test_tree_hidden_directories(sample_project):
    (sample_project / ".github").mkdir()
    (sample_project / ".github" / "workflows").mkdir()
    tree = generate_tree(sample_project)
    assert ".github/" in tree
    assert "workflows/" in tree


def test_build_tree_returns_list(sample_project):
    lines = build_tree(sample_project)
    assert isinstance(lines, list)
    assert len(lines) > 0

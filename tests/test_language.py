"""Tests for the language detection module."""

from pathlib import Path

import pytest

from snapshot.language import detect_language


class TestDetectLanguage:
    @pytest.mark.parametrize("filename,expected", [
        ("main.py", "Python"),
        ("app.js", "JavaScript"),
        ("index.jsx", "React JavaScript"),
        ("app.ts", "TypeScript"),
        ("App.tsx", "React TypeScript"),
        ("Main.java", "Java"),
        ("main.c", "C"),
        ("header.h", "C Header"),
        ("app.cpp", "C++"),
        ("app.hpp", "C++ Header"),
        ("Program.cs", "C#"),
        ("main.go", "Go"),
        ("lib.rs", "Rust"),
        ("app.rb", "Ruby"),
        ("index.php", "PHP"),
        ("main.swift", "Swift"),
        ("App.kt", "Kotlin"),
        ("main.dart", "Dart"),
        ("script.lua", "Lua"),
        ("build.sh", "Shell"),
        ("script.ps1", "PowerShell"),
        ("index.html", "HTML"),
        ("style.css", "CSS"),
        ("style.scss", "SCSS"),
        ("data.json", "JSON"),
        ("config.yaml", "YAML"),
        ("config.toml", "TOML"),
        ("data.xml", "XML"),
        ("query.sql", "SQL"),
        ("README.md", "Markdown"),
        ("doc.rst", "reStructuredText"),
        ("notes.txt", "Text"),
        ("style.less", "Less"),
        ("App.vue", "Vue"),
        ("App.svelte", "Svelte"),
        ("script.bat", "Batch"),
        ("main.R", "R"),
        ("script.pl", "Perl"),
    ])
    def test_language_detection(self, filename, expected):
        assert detect_language(Path(filename)) == expected

    def test_dockerfile(self):
        assert detect_language(Path("Dockerfile")) == "Dockerfile"

    def test_makefile(self):
        assert detect_language(Path("Makefile")) == "Makefile"

    def test_unknown_extension(self):
        assert detect_language(Path("file.xyz123")) == "Unknown"

    def test_case_insensitive(self):
        assert detect_language(Path("APP.PY")) == "Python"

    def test_package_json(self):
        assert detect_language(Path("package.json")) == "JSON"

    def test_cargo_toml(self):
        assert detect_language(Path("Cargo.toml")) == "TOML"

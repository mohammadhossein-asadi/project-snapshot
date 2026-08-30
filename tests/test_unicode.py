"""Tests for Unicode handling."""

from pathlib import Path

import pytest

from snapshot.scanner import scan_project
from snapshot.hashing import compute_sha256
from snapshot.secrets import detect_secrets_in_content


def test_unicode_filename(tmp_path):
    (tmp_path / "\u0639\u0631\u0628\u064a.py").write_text(
        "print('\u0645\u0631\u062d\u0628\u0627')", encoding="utf-8"
    )
    (tmp_path / "\u65e5\u672c\u8a9e.py").write_text(
        "print('\u3053\u3093\u306b\u3061\u306f')", encoding="utf-8"
    )
    (tmp_path / "\u0410\u043d\u044f.py").write_text(
        "print('\u041f\u0440\u0438\u0432\u0435\u0442')", encoding="utf-8"
    )
    result = scan_project(tmp_path)
    assert result["stats"]["total_files"] == 3


def test_unicode_content(tmp_path):
    f = tmp_path / "unicode.py"
    f.write_text(
        "# \u00e9\u00e8\u00ea\u00eb\n# \u00f1\u00f2\u00f3\n# \u0410\u0411\u0412\u0413",
        encoding="utf-8",
    )
    result = scan_project(tmp_path)
    files = [f for f in result["files"] if f["path"] == "unicode.py"]
    assert len(files) == 1
    assert "\u00e9" in files[0]["content"]


def test_unicode_hash(tmp_path):
    f = tmp_path / "unicode.txt"
    f.write_text("\u4e16\u754c", encoding="utf-8")
    result = compute_sha256(f)
    assert len(result) == 64


def test_unicode_secret_detection():
    content = "key = \u00e7\u00e0\u00e9\u00e8"
    results = detect_secrets_in_content(content)
    assert isinstance(results, list)

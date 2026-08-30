"""Tests for the secrets module."""

import tempfile
from pathlib import Path

import pytest

from snapshot.secrets import (
    is_secret_filename,
    detect_secrets_in_content,
    is_secret_file,
    scan_for_secrets,
)


class TestIsSecretFilename:
    def test_env_file(self):
        assert is_secret_filename(".env") is True

    def test_env_local(self):
        assert is_secret_filename(".env.local") is True

    def test_credentials_json(self):
        assert is_secret_filename("credentials.json") is True

    def test_service_account(self):
        assert is_secret_filename("service-account.json") is True

    def test_npmrc(self):
        assert is_secret_filename(".npmrc") is True

    def test_pypirc(self):
        assert is_secret_filename(".pypirc") is True

    def test_netrc(self):
        assert is_secret_filename(".netrc") is True

    def test_id_rsa(self):
        assert is_secret_filename("id_rsa") is True

    def test_pem_file(self):
        assert is_secret_filename("server.pem") is True

    def test_key_file(self):
        assert is_secret_filename("private.key") is True

    def test_regular_file(self):
        assert is_secret_filename("README.md") is False

    def test_python_file(self):
        assert is_secret_filename("main.py") is False

    def test_package_json(self):
        assert is_secret_filename("package.json") is False


class TestDetectSecretsInContent:
    def test_private_key(self):
        content = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQ..."
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_github_token(self):
        content = "token = ghp_abcdefghijklmnopqrstuvwxyz0123456789"
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_aws_key(self):
        content = "aws_access_key_id = AKIAIOSFODNN7EXAMPLE"
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_google_api_key(self):
        content = "api_key = AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI"
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_openai_key(self):
        content = "openai_key = sk-" + "a" * 48
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_slack_token(self):
        content = "token = xoxb-1234567890-1234567890123-abc123def456"
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_password_assignment(self):
        content = 'password = "supersecret123"'
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_api_key_assignment(self):
        content = 'api_key = "my-api-key-here"'
        results = detect_secrets_in_content(content)
        assert len(results) >= 1

    def test_no_secrets(self):
        content = "print('hello world')\nx = 42\n"
        results = detect_secrets_in_content(content)
        assert len(results) == 0

    def test_line_number_tracking(self):
        content = "line1\nline2\n-----BEGIN PRIVATE KEY-----\nline4"
        results = detect_secrets_in_content(content)
        assert any(r["line"] == 3 for r in results)


class TestIsSecretFile:
    def test_env(self):
        assert is_secret_file(Path(".env")) is True

    def test_regular(self):
        assert is_secret_file(Path("main.py")) is False


class TestScanForSecrets:
    def test_secret_filename(self, tmp_path):
        f = tmp_path / ".env"
        f.write_text("API_KEY=abc123")
        result = scan_for_secrets(f)
        assert result["is_secret_file"] is True
        assert result["has_secrets"] is True

    def test_secret_content(self, tmp_path):
        f = tmp_path / "config.txt"
        f.write_text("token = ghp_abcdefghijklmnopqrstuvwxyz0123456789")
        result = scan_for_secrets(f)
        assert result["is_secret_file"] is False
        assert result["has_secrets"] is True
        assert len(result["content_secrets"]) >= 1

    def test_clean_file(self, tmp_path):
        f = tmp_path / "readme.md"
        f.write_text("# Hello World\n\nThis is clean.")
        result = scan_for_secrets(f)
        assert result["has_secrets"] is False

    def test_nonexistent_file(self):
        result = scan_for_secrets(Path("/nonexistent/file.env"))
        assert result["has_secrets"] is False

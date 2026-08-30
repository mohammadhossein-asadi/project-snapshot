<div align="center">

# Project Snapshot

**Cross-platform zero-dependency project documentation and codebase snapshot generator.**

[![Tests](https://github.com/mohammadhossein-asadi/project-snapshot/actions/workflows/tests.yml/badge.svg)](https://github.com/mohammadhossein-asadi/project-snapshot/actions/workflows/tests.yml)
[![Python](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-windows%20%7C%20linux%20%7C%20macos%20%7C%20wsl-lightgrey.svg)]()

Scan any project. Get a complete snapshot. Zero dependencies.

[Features](#features) | [Quick Start](#quick-start) | [Usage](#usage) | [Output](#output-examples) | [Security](#security) | [Architecture](#architecture) | [Roadmap](#roadmap) | [Contributing](#contributing)

</div>

---

## Why Project Snapshot?

When working with AI assistants, code reviewers, or new team members, they need **full context** about your project — not just a single file. Manually gathering this context is tedious and error-prone.

Project Snapshot solves this by **automatically scanning your entire codebase** and producing:

1. A **Markdown file** with every source file's content, metadata, and project structure
2. A **JSON manifest** with machine-readable metadata for tooling and automation

Run one command. Get complete project context. Share it with anyone.

---

## Features

| Feature | Description |
|---------|-------------|
| **Complete Project Tree** | Deterministic, sorted directory tree — no external `tree` command needed |
| **Full File Index** | Every file with path, size, permissions, timestamps, MIME type, language |
| **Text Content Embedding** | Source code embedded in fenced code blocks, fully readable |
| **Binary Detection** | Binary files recorded with metadata only — no raw data dumps |
| **Secret Protection** | Detects `.env`, API keys, tokens, private keys — content hidden with security warnings |
| **Git Integration** | Branch, commit, origin, modified/untracked files — all captured |
| **40+ Languages** | Python, JavaScript, TypeScript, React, Java, Go, Rust, C/C++, and more |
| **SHA-256 Hashing** | Every file hashed for integrity verification |
| **JSON Manifest** | Structured machine-readable output for tooling |
| **Configurable Exclusions** | Skip `node_modules`, `dist`, `.git`, etc. — or include them |
| **Cross-Platform** | Windows, Linux, macOS, WSL, Termux, BSD — anywhere Python 3 runs |
| **Zero Dependencies** | Pure Python standard library — no `pip install` needed |
| **Read-Only Scanner** | Never modifies your source files |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/mohammadhossein-asadi/project-snapshot.git
cd project-snapshot
```

### 2. Run the scanner

```bash
python project_snapshot.py
```

### 3. Get your snapshot

Two files are generated in the current directory:

| File | Description |
|------|-------------|
| `README.md` | Human-readable Markdown snapshot with full source code |
| `PROJECT-SNAPSHOT.json` | Machine-readable JSON manifest |

**That's it.** No installation, no dependencies, no configuration required.

---

## Usage

### Scan the current directory

```bash
python project_snapshot.py
```

### Scan a specific directory

```bash
python project_snapshot.py /path/to/your/project
```

### Custom output filenames

```bash
python project_snapshot.py --output SNAPSHOT.md --manifest snapshot.json
```

### Exclude specific directories

```bash
python project_snapshot.py --exclude node_modules --exclude dist --exclude .cache
```

### Include normally-excluded heavy directories

By default, generated/dependency directories are skipped:

```bash
python project_snapshot.py --include-default-heavy
```

### Limit file content embedding size

```bash
python project_snapshot.py --max-size 10485760
```

Files larger than the limit (in bytes) get metadata recorded but content omitted.

### Run as a Python module

```bash
python -m src.snapshot
```

### Full CLI Reference

```
usage: project-snapshot [-h] [--output OUTPUT] [--manifest MANIFEST]
                        [--max-size MAX_SIZE] [--exclude EXCLUDE]
                        [--include-default-heavy] [--version] [path]

positional arguments:
  path                  Path to the project directory (default: current directory)

optional arguments:
  -h, --help            show this help message and exit
  --output, -o OUTPUT   Output Markdown file (default: README.md)
  --manifest, -m MANIFEST
                        Output JSON manifest file (default: PROJECT-SNAPSHOT.json)
  --max-size MAX_SIZE   Max file size in bytes for text embedding (default: 10MB)
  --exclude, -e EXCLUDE
                        Directory name to exclude from scanning (repeatable)
  --include-default-heavy
                        Include normally excluded heavy directories
  --version, -v         show program's version number and exit
```

---

## Output Examples

### Markdown Snapshot

The generated Markdown contains structured sections:

```markdown
# Project Snapshot: `my-project`

> Generated by Project Snapshot v1.0.0 on 2026-08-30 12:00:00 UTC

## Environment
- OS: Windows-11-10.0.26200-SP0
- Python: 3.14.5
- Architecture: AMD64

## Git Information
- Repository: Yes
- Branch: main
- Commit: a1b2c3d
- Origin: https://github.com/user/repo.git

## Project Statistics
| Metric         | Value |
|----------------|-------|
| Total files    | 42    |
| Total dirs     | 8     |
| Total size     | 156 KB|
| Text files     | 38    |
| Binary files   | 4     |
| Secrets found  | 1     |

## Languages
| Language       | Files |
|----------------|-------|
| Python         | 12    |
| TypeScript     | 8     |
| JavaScript     | 5     |

## Project Tree
.
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── tests/
│   └── test_main.py
├── package.json
└── README.md

## File Contents

### `src/index.ts`
- Size: 245 B
- SHA-256: a1b2c3d4...
- Language: TypeScript

​```typescript
import { Button } from './components/Button';
export const app = new Button();
​```
```

### JSON Manifest

```json
{
  "tool": {
    "name": "project-snapshot",
    "version": "1.0.0"
  },
  "timestamp": "2026-08-30T12:00:00+00:00",
  "environment": {
    "python_version": "3.14.5",
    "platform": "Windows-11-10.0.26200-SP0",
    "architecture": "AMD64",
    "os": "Windows"
  },
  "project": {
    "root": "/path/to/project",
    "name": "my-project"
  },
  "git": {
    "is_repository": true,
    "branch": "main",
    "commit": "a1b2c3d4e5f6...",
    "short_commit": "a1b2c3d",
    "origin": "https://github.com/user/repo.git"
  },
  "statistics": {
    "total_files": 42,
    "total_directories": 8,
    "total_size_bytes": 159744,
    "total_size_human": "156.0 KB",
    "text_files": 38,
    "binary_files": 4,
    "symlinks": 0,
    "secret_detections": 1,
    "languages": { "Python": 12, "TypeScript": 8 },
    "extensions": { ".py": 12, ".ts": 8 },
    "largest_files": [...],
    "excluded_directories": [...]
  },
  "files": [
    {
      "path": "src/index.ts",
      "is_directory": false,
      "is_binary": false,
      "size_bytes": 245,
      "sha256": "a1b2c3d4...",
      "language": "TypeScript",
      "modified": "2026-08-30T12:00:00"
    }
  ],
  "errors": []
}
```

---

## Security

Project Snapshot is designed with security as a core principle.

### What it detects

| Category | Examples |
|----------|----------|
| **Environment files** | `.env`, `.env.local`, `.env.production` |
| **Credential files** | `credentials.json`, `service-account.json`, `.npmrc`, `.pypirc` |
| **Private keys** | `id_rsa`, `id_ed25519`, `*.pem`, `*.key` |
| **GitHub tokens** | `ghp_...`, `github_pat_...` |
| **AWS keys** | `AKIA...` |
| **Google API keys** | `AIza...` |
| **OpenAI keys** | `sk-...` |
| **Slack tokens** | `xoxb-...`, `xoxp-...` |
| **Password patterns** | `password = "..."`, `secret = "..."` |
| **API key patterns** | `api_key = "..."`, `access_token = "..."` |

### How secrets are handled

- **Never exposed** in generated Markdown or JSON content
- Metadata recorded (path, size, hash)
- Security warning displayed instead of content
- Original source file untouched

```
> 🔒 Potential secret detected.
> Content intentionally not embedded.
> This file appears to contain sensitive information.
```

> **Note:** Secret detection is a safety mechanism, not a replacement for dedicated secret-scanning software like [gitleaks](https://github.com/gitleaks/gitleaks) or [trufflehog](https://github.com/trufflesecurity/trufflehog).

---

## Default Excluded Directories

These directories are excluded by default to avoid scanning generated, cached, or dependency content:

| Directory | Reason |
|-----------|--------|
| `.git` | Git internals |
| `node_modules` | npm dependencies |
| `.next` | Next.js build output |
| `.nuxt` | Nuxt.js build output |
| `dist` | Build output |
| `build` | Build output |
| `coverage` | Test coverage reports |
| `.venv` / `venv` | Python virtual environments |
| `__pycache__` | Python bytecode cache |
| `.cache` | General cache |
| `.idea` / `.vscode` | IDE configuration |
| `.tox` | Tox test environments |
| `.mypy_cache` | Mypy type-checking cache |
| `.pytest_cache` | Pytest cache |
| `eggs` / `.eggs` | Python eggs |
| `tmp` / `.tmp` | Temporary files |

Include them with `--include-default-heavy`.

---

## Architecture

```
project-snapshot/
├── project_snapshot.py          # Entry point (thin wrapper)
├── src/snapshot/
│   ├── __init__.py              # Package version (v1.0.0)
│   ├── __main__.py              # python -m snapshot support
│   ├── cli.py                   # Argument parsing & orchestration
│   ├── scanner.py               # Core os.walk-based file scanner
│   ├── tree.py                  # Deterministic directory tree builder
│   ├── output.py                # Markdown & JSON generators
│   ├── hashing.py               # Chunked SHA-256 computation
│   ├── secrets.py               # Filename + content secret detection
│   ├── git_info.py              # Git metadata via subprocess
│   ├── language.py              # 40+ language detection
│   └── constants.py             # Excluded dirs, extensions, patterns
├── tests/                       # 130 tests
│   ├── test_scanner.py
│   ├── test_tree.py
│   ├── test_hashing.py
│   ├── test_secrets.py
│   ├── test_language.py
│   ├── test_cli.py
│   ├── test_git.py
│   └── test_unicode.py
├── .github/workflows/tests.yml  # CI: Ubuntu, Windows, macOS
├── conftest.py                  # Pytest path configuration
├── README.md
├── LICENSE (MIT)
└── .gitignore
```

### Design principles

- **Standard library only** — no `pip install` for core functionality
- **Portable** — no Linux-specific commands, no GNU-only behavior
- **Deterministic** — same input always produces same output
- **Fault-tolerant** — one bad file never crashes the entire scan
- **Read-only** — scanner never modifies user source files
- **Memory-efficient** — chunked hashing, streaming for large files

---

## Supported Languages

<details>
<summary>Click to expand full language list (40+)</summary>

| Language | Extensions |
|----------|------------|
| Python | `.py` |
| JavaScript | `.js`, `.mjs`, `.cjs` |
| React JavaScript | `.jsx` |
| TypeScript | `.ts` |
| React TypeScript | `.tsx` |
| Java | `.java` |
| C | `.c`, `.h` |
| C++ | `.cpp`, `.hpp`, `.cxx`, `.cc` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| Ruby | `.rb` |
| PHP | `.php` |
| Swift | `.swift` |
| Kotlin | `.kt`, `.kts` |
| Dart | `.dart` |
| Lua | `.lua` |
| Shell | `.sh`, `.bash`, `.zsh`, `.fish` |
| PowerShell | `.ps1`, `.psm1` |
| Batch | `.bat`, `.cmd` |
| HTML | `.html`, `.htm`, `.xhtml` |
| CSS | `.css` |
| SCSS | `.scss` |
| Sass | `.sass` |
| Less | `.less` |
| Vue | `.vue` |
| Svelte | `.svelte` |
| JSON | `.json`, `.jsonl` |
| YAML | `.yaml`, `.yml` |
| TOML | `.toml` |
| XML | `.xml` |
| SQL | `.sql` |
| Markdown | `.md`, `.mdx` |
| reStructuredText | `.rst` |
| Text | `.txt` |
| R | `.r`, `.R` |
| Perl | `.pl`, `.pm` |
| Tcl | `.tcl` |
| INI | `.ini`, `.cfg`, `.conf` |
| Dockerfile | `Dockerfile` |
| Makefile | `Makefile` |

</details>

---

## Testing

```bash
# Install pytest
pip install pytest

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --tb=short
```

**Test coverage:** 130 tests covering scanner, tree, hashing, secrets, language detection, CLI, git integration, Unicode handling, and error handling.

### CI/CD

Tests run automatically on every push and pull request via GitHub Actions:

| OS | Python Versions |
|----|-----------------|
| Ubuntu | 3.9, 3.10, 3.11, 3.12, 3.13 |
| Windows | 3.9, 3.10, 3.11, 3.12, 3.13 |
| macOS | 3.9, 3.10, 3.11, 3.12, 3.13 |

---

## Roadmap

### v1.0 — Current

- [x] Cross-platform core (pure Python stdlib)
- [x] Recursive scanning with hidden files
- [x] Deterministic project tree
- [x] Complete file index with metadata
- [x] Text content embedding (UTF-8/latin-1)
- [x] Binary file detection
- [x] SHA-256 chunked hashing
- [x] Secret detection (filename + content patterns)
- [x] Git integration (branch, commit, origin, status)
- [x] Language detection (40+ languages)
- [x] JSON manifest output
- [x] Markdown snapshot output
- [x] Configurable exclusions
- [x] `--include-default-heavy` flag
- [x] `--max-size` for content embedding limits
- [x] 130 tests, CI on 3 platforms

### v1.1

- [ ] `.gitignore` integration
- [ ] `.snapshotignore` support
- [ ] Enhanced secret detection patterns
- [ ] Lines of code / blank lines / comment lines statistics
- [ ] Code-to-comment ratio

### v1.2

- [ ] Snapshot diff (`diff old.json new.json`)
- [ ] Change detection (added/deleted/modified files)
- [ ] Improved Git integration (tags, branches)

### v1.3

- [ ] HTML reports with interactive directory tree
- [ ] Searchable file browser
- [ ] Syntax highlighting

### v2.0

- [ ] Professional multi-command CLI (`snapshot scan`, `snapshot diff`, etc.)
- [ ] Plugin architecture
- [ ] AI-oriented project context generation (`AI-CONTEXT.md`)
- [ ] Dependency detection (npm, pip, cargo, go)
- [ ] Framework detection (React, Next.js, Django, Flask, etc.)
- [ ] Duplicate file detection
- [ ] Incremental scanning
- [ ] Parallel hashing
- [ ] PyPI distribution

---

## Use Cases

| Use Case | How |
|----------|-----|
| **AI-assisted development** | Generate a snapshot, paste it to your AI assistant for full project context |
| **Code review** | Share a snapshot with reviewers for quick project understanding |
| **Onboarding** | New team members get complete codebase context instantly |
| **Documentation** | Auto-generated project documentation with source code |
| **Auditing** | File hashes and metadata for compliance/verification |
| **Backup metadata** | Machine-readable project state at a point in time |
| **Change tracking** | Compare snapshots over time to see what changed |

---

## Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development setup

```bash
git clone https://github.com/mohammadhossein-asadi/project-snapshot.git
cd project-snapshot
pip install pytest
pytest tests/ -v
```

### Guidelines

- Follow existing code style
- Add tests for new functionality
- Ensure all 130+ tests pass
- Update documentation if needed
- Keep the zero-dependency principle for core functionality

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built as a tool for the AI-assisted development workflow — making it easy to give AI assistants complete project context without manual file gathering.

---

<div align="center">

**[Get Started](#quick-start)** | **[Report Bug](https://github.com/mohammadhossein-asadi/project-snapshot/issues)** | **[Request Feature](https://github.com/mohammadhossein-asadi/project-snapshot/issues)**

</div>

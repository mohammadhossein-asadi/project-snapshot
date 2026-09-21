<div align="center">

# Project Snapshot

### Cross-Platform Zero-Dependency Project Documentation & Codebase Snapshot Generator

A Python CLI tool that generates comprehensive Markdown snapshots and JSON manifests of any codebase — perfect for documentation, code reviews, onboarding, and archiving project state.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](#)

</div>

---

## Overview

Project Snapshot is a standalone Python script that analyzes any project directory and produces a detailed Markdown report containing project statistics, file tree, language breakdown, largest files, and full file contents (with secret detection). It also outputs a JSON manifest for programmatic consumption.

**Zero external dependencies** — uses only Python standard library. Runs anywhere Python 3.10+ runs.

---

## Features

| Feature | Description |
|:--------|:------------|
| **Cross-Platform** | Runs on Windows, macOS, Linux — no compilation needed |
| **Zero Dependencies** | Pure Python standard library — no `pip install` required |
| **Language Detection** | Identifies 50+ programming languages by extension and shebang |
| **Project Statistics** | File counts, sizes, lines of code, binary vs text classification |
| **Directory Tree** | ASCII tree with configurable depth and exclusion patterns |
| **Largest Files** | Top 20 largest files with sizes and paths |
| **File Contents** | Embeds full contents of text files (configurable size limit) |
| **Secret Detection** | Scans for API keys, passwords, tokens, private keys — auto-redacts |
| **Git Integration** | Extracts branch, commit, origin, and dirty status |
| **JSON Manifest** | Machine-readable output for CI/CD integration |
| **Configurable Exclusions** | Skips `node_modules`, `.git`, `__pycache__`, build dirs by default |

---

## Screenshots

All captured from the documented CLI output (regenerate with `scripts/make-cli-screenshots.py` in the portfolio repo):

| Statistics | Languages & tree |
|:---:|:---:|
| ![Project statistics](docs/screenshot-1.png) | ![Language breakdown and tree](docs/screenshot-2.png) |
| **Secret redaction** | **JSON manifest** |
| ![Secret detection](docs/screenshot-3.png) | ![JSON manifest output](docs/screenshot-4.png) |

---

## Quick Start

### Prerequisites

- **Python 3.10+**

### Installation

```bash
# Clone the repository
git clone https://github.com/mohammadhossein-asadi/project-snapshot.git
cd project-snapshot

# Or download the standalone script directly
curl -O https://raw.githubusercontent.com/mohammadhossein-asadi/project-snapshot/main/project_snapshot.py
chmod +x project_snapshot.py
```

### Usage

```bash
# Snapshot current directory
python project_snapshot.py

# Snapshot a specific project
python project_snapshot.py /path/to/project

# Output to specific file
python project_snapshot.py -o SNAPSHOT.md

# Generate JSON manifest only
python project_snapshot.py --json -o manifest.json

# Include normally excluded directories (node_modules, .git, etc.)
python project_snapshot.py --include-default-heavy

# Custom exclusion patterns
python project_snapshot.py --exclude "*.log" --exclude "dist/"

# Verbose output
python project_snapshot.py -v
```

### Command-Line Options

| Option | Description |
|:---|:---|
| `PATH` | Project directory to snapshot (default: current directory) |
| `-o, --output FILE` | Output file path (default: stdout) |
| `--json` | Output JSON manifest instead of Markdown |
| `--include-default-heavy` | Include normally excluded directories |
| `--exclude PATTERN` | Additional glob patterns to exclude (repeatable) |
| `--max-file-size BYTES` | Max file size to embed content (default: 100KB) |
| `--no-secrets` | Disable secret scanning |
| `-v, --verbose` | Verbose logging |
| `-h, --help` | Show help message |

---

## Example Output

### Markdown Snapshot

The generated Markdown includes:

```markdown
# Project Snapshot: `my-project`

## Environment
- **OS:** Linux-5.15.0-x86_64
- **Python:** 3.11.4
- **Architecture:** x86_64

## Project Statistics
| Metric | Value |
|--------|-------|
| Total files | 247 |
| Total directories | 42 |
| Total size | 12.4 MB |
| Text files | 198 |
| Binary files | 49 |

## Languages
| Language | Files |
|----------|-------|
| Python | 89 |
| TypeScript | 56 |
| Markdown | 12 |

## Project Tree
```
my-project/
├── src/
│   ├── main.py
│   └── utils/
└── tests/
    └── test_main.py
```

## File Contents (with secret redaction)
> 🔒 **Potential secret detected.** Content intentionally not embedded.
```

### JSON Manifest

```json
{
  "project": "my-project",
  "timestamp": "2026-01-15T10:30:00Z",
  "statistics": {
    "total_files": 247,
    "total_size": 12984321,
    "languages": {"Python": 89, "TypeScript": 56}
  },
  "files": [
    {"path": "src/main.py", "size": 2048, "language": "Python", "hash": "sha256:..."}
  ]
}
```

---

## Use Cases

- **Documentation** — Generate up-to-date project docs for README or wiki
- **Code Reviews** — Share complete project state with reviewers
- **Onboarding** — Give new team members a full project overview
- **Archiving** — Capture project state at release milestones
- **CI/CD Integration** — Use JSON manifest for automated analysis
- **Security Audits** — Secret detection helps find leaked credentials
- **Project Comparison** — Diff snapshots between versions

---

## Project Structure

```
project-snapshot/
├── project_snapshot.py      # Standalone entry point
├── src/
│   └── snapshot/
│       ├── __init__.py
│       ├── __main__.py
│       ├── cli.py           # Argument parsing
│       ├── constants.py     # Language maps, exclusion patterns
│       ├── git_info.py      # Git repository detection
│       ├── hashing.py       # File hashing (SHA256)
│       ├── language.py      # Language detection
│       ├── output.py        # Markdown/JSON formatting
│       ├── scanner.py       # Directory scanning
│       ├── secrets.py       # Secret detection patterns
│       └── tree.py          # ASCII tree generation
├── tests/                   # Pytest test suite
├── LICENSE
└── README.md
```

---

## Secret Detection

Project Snapshot scans for common secret patterns:

- AWS keys (`AKIA...`, `aws_secret_access_key`)
- GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`)
- API keys (`api_key`, `apikey`, `secret_key`)
- Database URLs (`postgres://`, `mysql://`, `mongodb://`)
- Private keys (`-----BEGIN PRIVATE KEY-----`)
- JWT tokens (`eyJ...`)

Detected secrets are **redacted in output** with a warning marker — only metadata (file, size, hash) is shown.

---

## Installation Methods

### As a Git Submodule
```bash
git submodule add https://github.com/mohammadhossein-asadi/project-snapshot.git tools/project-snapshot
```

### As a Pip Package (Planned)
```bash
pip install project-snapshot
```

### Standalone Script
```bash
# Download and run directly
wget https://raw.githubusercontent.com/mohammadhossein-asadi/project-snapshot/main/project_snapshot.py
python project_snapshot.py /path/to/project
```

---

## Development

```bash
git clone https://github.com/mohammadhossein-asadi/project-snapshot.git
cd project-snapshot

# Run tests
python -m pytest tests/

# Run snapshot on itself
python project_snapshot.py .
```

---

## Roadmap

- [ ] PyPI package distribution
- [ ] GitHub Action for automated snapshots
- [ ] HTML output format
- [ ] Incremental snapshots (diff mode)
- [ ] Language-specific AST analysis
- [ ] Integration with GitHub/GitLab APIs

---

## License

[MIT](LICENSE) — use it, fork it, ship it.

---

<div align="center">

**Mohammadhossein Asadi** — Frontend & Full-Stack Engineer

[![GitHub](https://img.shields.io/badge/GitHub-mohammadhossein--asadi-0a0a0a?style=flat-square&logo=github)](https://github.com/mohammadhossein-asadi)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-mohammadhossein--asadi-0a66c2?style=flat-square&logo=linkedin)](https://linkedin.com/in/mohammadhossein-asadi)

</div>
"""Language detection for Project Snapshot."""

from pathlib import Path

from .constants import LANGUAGE_MAP


def detect_language(file_path: Path) -> str:
    """Detect programming language based on file extension."""
    suffix = file_path.suffix.lower()
    name = file_path.name.lower()

    if suffix in LANGUAGE_MAP:
        return LANGUAGE_MAP[suffix]

    special_names = {
        "dockerfile": "Dockerfile",
        "makefile": "Makefile",
        "cmakelists.txt": "CMake",
        "gemfile": "Ruby",
        "rakefile": "Ruby",
        "gruntfile.js": "JavaScript",
        "gulpfile.js": "JavaScript",
        "vite.config.js": "JavaScript",
        "vite.config.ts": "TypeScript",
        "rollup.config.js": "JavaScript",
        "rollup.config.ts": "TypeScript",
        "webpack.config.js": "JavaScript",
        "webpack.config.ts": "TypeScript",
        "jest.config.js": "JavaScript",
        "jest.config.ts": "TypeScript",
        "tsconfig.json": "JSON",
        "package.json": "JSON",
        "cargo.toml": "TOML",
        "pyproject.toml": "TOML",
        "setup.py": "Python",
        "setup.cfg": "Python",
    }

    if name in special_names:
        return special_names[name]

    return "Unknown"

#!/usr/bin/env python3
"""Project Snapshot — Cross-platform zero-dependency project documentation and codebase snapshot generator.

Run this script from inside any project directory to generate a complete
Markdown snapshot and JSON manifest of the entire codebase.

Usage:
    python project_snapshot.py
    python project_snapshot.py /path/to/project
    python project_snapshot.py --help
"""

import sys
from pathlib import Path

# Add src/ to path so the package is importable
sys.path.insert(0, str(Path(__file__).parent / "src"))

from snapshot.cli import main

if __name__ == "__main__":
    sys.exit(main())

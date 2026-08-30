"""CLI entry point for Project Snapshot."""

import argparse
import sys
from pathlib import Path

from . import __version__
from .constants import DEFAULT_OUTPUT, DEFAULT_MANIFEST, DEFAULT_EXCLUDED_DIRS
from .scanner import scan_project
from .git_info import get_git_info
from .output import write_output


def main(argv: list[str] | None = None) -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="project-snapshot",
        description=(
            "Cross-platform zero-dependency project documentation and codebase snapshot generator.\n"
            "Scans a project directory and generates a complete Markdown snapshot and JSON manifest."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python project_snapshot.py\n"
            "  python project_snapshot.py /path/to/project\n"
            "  python project_snapshot.py --output SNAPSHOT.md --manifest snapshot.json\n"
            "  python project_snapshot.py --exclude node_modules --exclude dist\n"
            "  python project_snapshot.py --max-size 10485760\n"
            "  python project_snapshot.py --include-default-heavy\n"
        ),
    )

    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the project directory (default: current directory)",
    )
    parser.add_argument(
        "--output", "-o",
        default=DEFAULT_OUTPUT,
        help=f"Output Markdown file (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--manifest", "-m",
        default=DEFAULT_MANIFEST,
        help=f"Output JSON manifest file (default: {DEFAULT_MANIFEST})",
    )
    parser.add_argument(
        "--max-size",
        type=int,
        default=10 * 1024 * 1024,
        help="Maximum file size in bytes for text content embedding (default: 10MB)",
    )
    parser.add_argument(
        "--exclude", "-e",
        action="append",
        default=[],
        help="Directory name to exclude from scanning (repeatable)",
    )
    parser.add_argument(
        "--include-default-heavy",
        action="store_true",
        default=False,
        help="Include normally excluded heavy directories (node_modules, .git, dist, etc.)",
    )
    parser.add_argument(
        "--version", "-v",
        action="version",
        version=f"%(prog)s {__version__}",
    )

    args = parser.parse_args(argv)

    project_root = Path(args.path).resolve()
    if not project_root.is_dir():
        print(f"Error: '{project_root}' is not a valid directory.", file=sys.stderr)
        return 1

    user_excluded = set(args.exclude)
    all_excluded = DEFAULT_EXCLUDED_DIRS | user_excluded

    print(f"Scanning project: {project_root}")
    print(f"Excluded directories: {', '.join(sorted(all_excluded))}")
    print(f"Max file size for embedding: {args.max_size:,} bytes")
    print()

    scan_result = scan_project(
        project_root=project_root,
        user_excluded_dirs=user_excluded,
        max_size=args.max_size,
        include_default_heavy=args.include_default_heavy,
    )

    git_info = get_git_info(project_root)

    write_output(
        scan_result=scan_result,
        project_root=project_root,
        git_info=git_info,
        excluded_dirs=all_excluded,
        include_default_heavy=args.include_default_heavy,
        output_path=args.output,
        manifest_path=args.manifest,
    )

    stats = scan_result["stats"]
    print()
    print("Scan complete!")
    print(f"  Files: {stats['total_files']}")
    print(f"  Directories: {stats['total_directories']}")
    print(f"  Total size: {stats['total_size_human']}")
    print(f"  Languages detected: {len(stats['languages'])}")
    if stats["secret_detections"]:
        print(f"  Secret detections: {stats['secret_detections']}")
    if scan_result.get("errors"):
        print(f"  Errors: {len(scan_result['errors'])}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

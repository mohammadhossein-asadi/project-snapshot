import { LANGUAGE_MAP } from './constants';

export function detectLanguage(filePath: string): string {
  const parts = filePath.split('/');
  const name = parts[parts.length - 1].toLowerCase();
  
  // Extract extension
  const dotIndex = name.lastIndexOf('.');
  const ext = dotIndex !== -1 ? name.substring(dotIndex) : '';

  if (ext && LANGUAGE_MAP[ext]) {
    return LANGUAGE_MAP[ext];
  }

  const specialNames: Record<string, string> = {
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
  };

  if (specialNames[name]) {
    return specialNames[name];
  }

  return "Unknown";
}

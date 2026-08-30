interface TreeNode {
  name: string;
  isDir: boolean;
  children: Map<string, TreeNode>;
}

export function generateTreeString(
  filePaths: Array<{ path: string; isDirectory: boolean }>,
  excludedDirs: Set<string> = new Set()
): string {
  const root: TreeNode = {
    name: ".",
    isDir: true,
    children: new Map(),
  };

  // Build hierarchy
  for (const file of filePaths) {
    const parts = file.path.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    // Check if any ancestor folder is in excludedDirs
    let isExcluded = false;
    for (let i = 0; i < parts.length - 1; i++) {
      if (excludedDirs.has(parts[i])) {
        isExcluded = true;
        break;
      }
    }
    if (isExcluded) continue;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isFolder = !isLast || file.isDirectory;

      if (isFolder && excludedDirs.has(part)) {
        break;
      }

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          isDir: isFolder,
          children: new Map(),
        });
      }
      current = current.children.get(part)!;
    }
  }

  // Recursive tree formatting with standard box drawing characters
  const lines: string[] = ["."];

  function renderChildren(node: TreeNode, prefix: string) {
    // Sort entries: directories first, then alphabetical
    const entries = Array.from(node.children.values()).sort((a, b) => {
      if (a.isDir !== b.isDir) {
        return a.isDir ? -1 : 1;
      }
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    entries.forEach((child, index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const displaySuffix = child.isDir ? "/" : "";

      lines.push(`${prefix}${connector}${child.name}${displaySuffix}`);

      if (child.isDir && child.children.size > 0) {
        const subPrefix = prefix + (isLast ? "    " : "│   ");
        renderChildren(child, subPrefix);
      }
    });
  }

  renderChildren(root, "");
  return lines.join("\n");
}

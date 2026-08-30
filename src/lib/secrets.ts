import { SECRET_PATTERNS, SECRET_FILENAMES } from './constants';
import { SecretDetection, SecretInfo } from '../types';

export function isSecretFilename(filename: string): boolean {
  const name = filename.toLowerCase();
  
  for (const pattern of SECRET_FILENAMES) {
    if (pattern.startsWith("*.")) {
      if (name.endsWith(pattern.substring(1))) {
        return true;
      }
    } else if (name === pattern) {
      return true;
    }
  }

  // Common additional checks
  if (name.startsWith(".env.") || name === ".env") {
    return true;
  }
  if (name.endsWith(".pem") || name.endsWith(".key") || name.endsWith(".p12") || name.endsWith(".pfx")) {
    return true;
  }

  return false;
}

export function detectSecretsInContent(content: string): SecretDetection[] {
  const detections: SecretDetection[] = [];

  for (const pattern of SECRET_PATTERNS) {
    // Reset regex index
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const linesBefore = content.substring(0, matchIndex).split('\n');
      const lineNum = linesBefore.length;
      const rawMatch = match[0];
      const snippet = rawMatch.length > 24 ? rawMatch.substring(0, 24) + '...' : rawMatch;

      detections.push({
        pattern: pattern.source,
        line: lineNum,
        snippet,
      });

      // Break infinite loop if pattern matches 0-width
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }
  }

  return detections;
}

export function scanForSecrets(filename: string, content?: string | null): SecretInfo {
  const isFileSecret = isSecretFilename(filename);
  let contentSecrets: SecretDetection[] = [];

  if (content && typeof content === 'string') {
    contentSecrets = detectSecretsInContent(content);
  }

  return {
    isSecretFile: isFileSecret,
    contentSecrets,
    hasSecrets: isFileSecret || contentSecrets.length > 0,
  };
}

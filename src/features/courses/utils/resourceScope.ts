export type ResourceScope = {
  semester: string;
  term: string;
};

const SCOPE_PATTERN = /^\[SEM:([^\]|]+)\|TERM:([^\]|]+)\]\s*/i;

export function buildResourceScopePrefix(scope: ResourceScope): string {
  return `[SEM:${scope.semester}|TERM:${scope.term}] `;
}

export function stripResourceScope(title: string): string {
  return title.replace(SCOPE_PATTERN, "").trim();
}

export function parseResourceScope(title: string): ResourceScope | null {
  const match = title.match(SCOPE_PATTERN);
  if (!match) return null;
  return {
    semester: String(match[1] || "").trim(),
    term: String(match[2] || "").trim(),
  };
}

export function withResourceScope(title: string, scope: ResourceScope): string {
  return `${buildResourceScopePrefix(scope)}${stripResourceScope(title)}`.trim();
}

export function matchesResourceScope(
  title: string,
  scope: ResourceScope,
): boolean {
  const parsed = parseResourceScope(title);
  if (!parsed) return true;
  return (
    parsed.semester.toLowerCase() === scope.semester.toLowerCase() &&
    parsed.term.toLowerCase() === scope.term.toLowerCase()
  );
}


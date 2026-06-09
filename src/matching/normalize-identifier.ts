export function normalizeIdentifier(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized ? normalized : undefined;
}

export function exactNormalizedMatch(left: string | undefined, right: string | undefined): boolean {
  const normalizedLeft = normalizeIdentifier(left);
  const normalizedRight = normalizeIdentifier(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

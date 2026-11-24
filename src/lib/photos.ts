/**
 * Photo URL parsing utility.
 * Supports legacy single URL string, JSON array strings, and comma-separated URLs.
 */
export function parsePhotoUrls(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0
        );
      }
    } catch {}
  }

  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [trimmed];
}

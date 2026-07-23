export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export function slugCandidate(base: string, attempt = 0) {
  const normalized = slugify(base) || 'item';
  return attempt === 0 ? normalized : `${normalized}-${attempt + 1}`;
}

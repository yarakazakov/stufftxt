// Генерация slug из названия папки + случайный суффикс
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);

  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

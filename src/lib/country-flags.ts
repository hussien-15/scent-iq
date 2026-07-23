const FLAGS: Record<string, string> = {
  France: '🇫🇷',
  Sweden: '🇸🇪',
  'United Arab Emirates': '🇦🇪',
  Iraq: '🇮🇶',
  Italy: '🇮🇹',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Saudi Arabia': '🇸🇦',
};

export function countryFlag(country: string | null | undefined): string {
  if (!country) return '';
  return FLAGS[country] ?? '';
}

export const PRODUCT_IMPORT_COLUMNS = [
  'NameArabic', 'NameEnglish', 'Brand', 'Category', 'Price', 'OldPrice', 'Stock',
  'BottleSize', 'Gender', 'Concentration', 'FragranceFamilies', 'TopNotes',
  'HeartNotes', 'BaseNotes', 'Season', 'Occasion', 'Style', 'Tags',
  'ShortDescriptionArabic', 'ShortDescriptionEnglish', 'DescriptionArabic',
  'DescriptionEnglish', 'SeoTitleArabic', 'SeoDescriptionArabic', 'ImageFileName',
  'SKU', 'Slug', 'Status', 'Longevity', 'Projection', 'Sillage',
] as const;

export const MIN_IMPORT_PUBLISH_SCORE = 80;

export type ImportRawRow = Record<string, unknown>;
export type ImportIssue = { severity: 'error' | 'warning'; field: string; message: string };
export type ImportLookup = {
  brands: { id: string; name: string; nameAr: string | null; slug: string; searchAliases: string[] }[];
  categories: { id: string; nameEn: string; nameAr: string; slug: string }[];
  notes: { id: string; nameEn: string; nameAr: string; slug: string }[];
  tags: { id: string; name: string; nameAr: string | null; slug: string }[];
  media: { id: string; fileName: string | null; originalName: string | null }[];
  existingSkus: string[];
  existingSlugs: string[];
};

export type ValidatedImportRow = {
  rowNumber: number;
  values: Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>;
  sku: string;
  slug: string;
  brandId: string | null;
  categoryId: string | null;
  noteIds: { top: string[]; heart: string[]; base: string[] };
  tagIds: string[];
  mediaId: string | null;
  completionScore: number;
  effectiveStatus: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED' | 'DISCONTINUED';
  issues: ImportIssue[];
};

export type ProductImportReport = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  duplicateRows: number;
  rows: ValidatedImportRow[];
};

function headerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function comparable(value: string) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9\u0600-\u06ff]/g, '');
}

function csvRecords(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell.trim()); cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function spreadsheetXmlRecords(text: string) {
  const cells = [...text.matchAll(/<Row[^>]*>([\s\S]*?)<\/Row>/gi)].map((row) =>
    [...row[1].matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/gi)].map((cell) =>
      cell[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    )
  );
  const headers = cells.shift() ?? [];
  return cells.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

export function parseProductImport(text: string, extension: string): ImportRawRow[] {
  if (extension === 'json') {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
      throw new Error('JSON import must be an array of product objects.');
    }
    return parsed as ImportRawRow[];
  }
  if (extension === 'xls' || text.includes('<Workbook')) return spreadsheetXmlRecords(text);
  return csvRecords(text);
}

export function productImportTemplateCsv() {
  const example = [
    'عطر تجريبي', 'Verified Sample', 'Lattafa', 'Unisex Perfumes', '75000', '', '10',
    '100ml', 'UNISEX', 'EDP', 'amber|sweet', 'Bergamot|Saffron', 'Rose', 'Amber|Vanilla',
    'winter|autumn', 'evening|date', 'elegant|sweet', 'Winter Favorite|Elegant',
    'وصف قصير تتم مراجعته قبل النشر.', 'Short description reviewed before publishing.',
    'وصف عربي كامل ومفيد للعميل.', 'Complete English product description.',
    'عطر تجريبي أصلي | ScentIQ', 'تفاصيل العطر التجريبي وسعره ونوتاته داخل العراق.',
    'SCENTIQ-LAT-VERIFIED-SAMPLE-100ML.webp', '', '', 'DRAFT', 'HIGH', 'MODERATE', 'MODERATE',
  ];
  const cell = (value: string) => /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  return `\uFEFF${PRODUCT_IMPORT_COLUMNS.join(',')}\n${example.map(cell).join(',')}\n`;
}

function rowValues(raw: ImportRawRow) {
  const source = new Map(Object.entries(raw).map(([key, value]) => [headerKey(key), String(value ?? '').trim()]));
  return Object.fromEntries(PRODUCT_IMPORT_COLUMNS.map((column) => [column, source.get(headerKey(column)) ?? ''])) as ValidatedImportRow['values'];
}

export function splitList(value: string) {
  return value.split(/[|;،]/).map((item) => item.trim()).filter(Boolean);
}

export function importSlug(value: string) {
  return value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
}

function importSku(brand: string, product: string, size: string) {
  const segment = (value: string, fallback: string) => importSlug(value).replaceAll('-', '').slice(0, 12).toUpperCase() || fallback;
  return `SCENTIQ-${segment(brand, 'BRAND')}-${segment(product, 'PRODUCT')}-${segment(size, 'SIZE')}`;
}

function uniqueCandidate(base: string, used: Set<string>, separator = '-') {
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) { candidate = `${base}${separator}${suffix}`; suffix += 1; }
  used.add(candidate.toLowerCase());
  return candidate;
}

function numberIssue(value: string, field: string, integer = false): ImportIssue | null {
  const number = Number(value);
  if (!value || !Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
    return { severity: 'error', field, message: `${field} must be a valid non-negative ${integer ? 'whole number' : 'number'}.` };
  }
  return null;
}

function completion(values: ValidatedImportRow['values'], linked: { brand: boolean; category: boolean; media: boolean; notes: boolean; tags: boolean }) {
  const factors = [
    Boolean(values.NameArabic && values.NameEnglish), linked.brand, linked.category,
    Boolean(values.Price), Boolean(values.Stock), linked.media,
    Boolean(values.DescriptionArabic && values.DescriptionEnglish), linked.notes, linked.tags,
    Boolean(values.SeoTitleArabic), Boolean(values.SeoDescriptionArabic),
    Boolean(values.Longevity && values.Projection && values.Sillage),
  ];
  return Math.round(factors.filter(Boolean).length / factors.length * 100);
}

export function validateProductImport(rawRows: ImportRawRow[], lookup: ImportLookup): ProductImportReport {
  const rows = rawRows.slice(0, 1000);
  const usedSkus = new Set(lookup.existingSkus.map((value) => value.toLowerCase()));
  const usedSlugs = new Set(lookup.existingSlugs.map((value) => value.toLowerCase()));
  const inputSkus = new Set<string>();
  const inputSlugs = new Set<string>();
  const brandMap = new Map<string, ImportLookup['brands'][number]>();
  for (const brand of lookup.brands) for (const key of [brand.name, brand.nameAr ?? '', brand.slug, ...brand.searchAliases]) if (key) brandMap.set(comparable(key), brand);
  const categoryMap = new Map<string, ImportLookup['categories'][number]>();
  for (const category of lookup.categories) for (const key of [category.nameEn, category.nameAr, category.slug]) categoryMap.set(comparable(key), category);
  const noteMap = new Map<string, ImportLookup['notes'][number]>();
  for (const note of lookup.notes) for (const key of [note.nameEn, note.nameAr, note.slug]) noteMap.set(comparable(key), note);
  const tagMap = new Map<string, ImportLookup['tags'][number]>();
  for (const tag of lookup.tags) for (const key of [tag.name, tag.nameAr ?? '', tag.slug]) if (key) tagMap.set(comparable(key), tag);
  const mediaMap = new Map<string, string>();
  for (const media of lookup.media) for (const key of [media.fileName, media.originalName]) if (key) mediaMap.set(key.toLowerCase(), media.id);

  const validated = rows.map((raw, index): ValidatedImportRow => {
    const values = rowValues(raw);
    const issues: ImportIssue[] = [];
    if (!values.NameArabic) issues.push({ severity: 'error', field: 'NameArabic', message: 'Arabic product name is required.' });
    if (!values.NameEnglish) issues.push({ severity: 'error', field: 'NameEnglish', message: 'English product name is required.' });
    const brand = brandMap.get(comparable(values.Brand));
    if (!brand) issues.push({ severity: 'error', field: 'Brand', message: values.Brand ? `Brand “${values.Brand}” was not matched. Add or correct it before import.` : 'Brand is required.' });
    const category = categoryMap.get(comparable(values.Category));
    if (!category) issues.push({ severity: 'error', field: 'Category', message: values.Category ? `Category “${values.Category}” was not matched.` : 'Category is required.' });
    const priceIssue = numberIssue(values.Price, 'Price'); if (priceIssue) issues.push(priceIssue);
    const stockIssue = numberIssue(values.Stock, 'Stock', true); if (stockIssue) issues.push(stockIssue);
    if (values.OldPrice && (!Number.isFinite(Number(values.OldPrice)) || Number(values.OldPrice) < 0)) issues.push({ severity: 'error', field: 'OldPrice', message: 'OldPrice must be a valid non-negative number.' });
    if (values.OldPrice && Number(values.OldPrice) < Number(values.Price)) issues.push({ severity: 'warning', field: 'OldPrice', message: 'Old price is lower than selling price.' });
    const allowedGenders = ['MEN', 'WOMEN', 'MASCULINE', 'FEMININE', 'UNISEX'];
    if (values.Gender && !allowedGenders.includes(values.Gender.toUpperCase())) issues.push({ severity: 'error', field: 'Gender', message: `Gender “${values.Gender}” is invalid.` });
    const allowedPerformance = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
    for (const field of ['Longevity', 'Projection', 'Sillage'] as const) if (values[field] && !allowedPerformance.includes(values[field].toUpperCase())) issues.push({ severity: 'error', field, message: `${field} must be LOW, MODERATE, HIGH, or VERY_HIGH.` });

    const desiredSku = values.SKU.trim().toUpperCase() || importSku(brand?.name ?? values.Brand, values.NameEnglish, values.BottleSize);
    if (!values.SKU) issues.push({ severity: 'warning', field: 'SKU', message: `SKU will be generated as ${desiredSku}.` });
    const skuInputKey = desiredSku.toLowerCase();
    if (lookup.existingSkus.some((sku) => sku.toLowerCase() === skuInputKey)) issues.push({ severity: 'error', field: 'SKU', message: `SKU ${desiredSku} already exists.` });
    if (inputSkus.has(skuInputKey)) issues.push({ severity: 'error', field: 'SKU', message: `SKU ${desiredSku} is duplicated in this file.` });
    inputSkus.add(skuInputKey);
    const sku = uniqueCandidate(desiredSku, usedSkus);

    const desiredSlug = importSlug(values.Slug || values.NameEnglish);
    const slugInputKey = desiredSlug.toLowerCase();
    if (lookup.existingSlugs.some((slug) => slug.toLowerCase() === slugInputKey)) issues.push({ severity: 'error', field: 'Slug', message: `Slug ${desiredSlug} already exists.` });
    if (inputSlugs.has(slugInputKey)) issues.push({ severity: 'error', field: 'Slug', message: `Slug ${desiredSlug} is duplicated in this file.` });
    inputSlugs.add(slugInputKey);
    const slug = uniqueCandidate(desiredSlug, usedSlugs);

    const resolveNotes = (value: string, tier: string) => splitList(value).flatMap((name) => {
      const note = noteMap.get(comparable(name));
      if (!note) { issues.push({ severity: 'warning', field: tier, message: `Note “${name}” was not matched and will not be created silently.` }); return []; }
      return [note.id];
    });
    const noteIds = { top: resolveNotes(values.TopNotes, 'TopNotes'), heart: resolveNotes(values.HeartNotes, 'HeartNotes'), base: resolveNotes(values.BaseNotes, 'BaseNotes') };
    if (!noteIds.top.length && !noteIds.heart.length && !noteIds.base.length) issues.push({ severity: 'warning', field: 'Notes', message: 'No recognized fragrance notes were supplied.' });
    const tagIds = splitList(values.Tags).flatMap((name) => {
      const tag = tagMap.get(comparable(name));
      if (!tag) { issues.push({ severity: 'warning', field: 'Tags', message: `Tag “${name}” was not matched.` }); return []; }
      return [tag.id];
    });
    if (!tagIds.length) issues.push({ severity: 'warning', field: 'Tags', message: 'No recognized tags were supplied.' });
    const explicitMedia = values.ImageFileName ? mediaMap.get(values.ImageFileName.toLowerCase()) : undefined;
    const automaticMedia = [...mediaMap.entries()].find(([fileName]) => {
      const base = fileName.replace(/\.[a-z0-9]+$/i, '');
      return base === sku.toLowerCase() || base === slug.toLowerCase();
    })?.[1];
    const mediaId = explicitMedia ?? automaticMedia ?? null;
    if (!mediaId) issues.push({ severity: 'warning', field: 'ImageFileName', message: values.ImageFileName ? `Media file “${values.ImageFileName}” was not found.` : 'No approved product image was matched.' });
    if (!values.DescriptionArabic) issues.push({ severity: 'warning', field: 'DescriptionArabic', message: 'Arabic full description is missing.' });
    if (!values.DescriptionEnglish) issues.push({ severity: 'warning', field: 'DescriptionEnglish', message: 'English full description is missing.' });
    if (!values.SeoTitleArabic) issues.push({ severity: 'warning', field: 'SeoTitleArabic', message: 'Arabic SEO title is missing.' });
    if (!values.SeoDescriptionArabic) issues.push({ severity: 'warning', field: 'SeoDescriptionArabic', message: 'Arabic SEO description is missing.' });
    const allowedStatuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'DISCONTINUED'] as const;
    const requested = values.Status.toUpperCase();
    if (requested && !allowedStatuses.includes(requested as typeof allowedStatuses[number])) issues.push({ severity: 'error', field: 'Status', message: `Status “${values.Status}” is invalid.` });
    const score = completion(values, { brand: Boolean(brand), category: Boolean(category), media: Boolean(mediaId), notes: Object.values(noteIds).some((ids) => ids.length), tags: Boolean(tagIds.length) });
    const publishBlocked = score < MIN_IMPORT_PUBLISH_SCORE || !mediaId;
    if (publishBlocked) issues.push({ severity: 'warning', field: 'Completion', message: `Completion is ${score}%${!mediaId ? ' and no approved image is matched' : ''}; the product will remain Draft.` });
    const effectiveStatus = publishBlocked ? 'DRAFT' : (allowedStatuses.includes(requested as typeof allowedStatuses[number]) ? requested : 'DRAFT') as ValidatedImportRow['effectiveStatus'];
    return { rowNumber: index + 2, values, sku, slug, brandId: brand?.id ?? null, categoryId: category?.id ?? null, noteIds, tagIds, mediaId, completionScore: score, effectiveStatus, issues };
  });
  return {
    totalRows: validated.length,
    validRows: validated.filter((row) => !row.issues.some((issue) => issue.severity === 'error')).length,
    errorRows: validated.filter((row) => row.issues.some((issue) => issue.severity === 'error')).length,
    warningRows: validated.filter((row) => row.issues.some((issue) => issue.severity === 'warning')).length,
    duplicateRows: validated.filter((row) => row.issues.some((issue) => /duplicate|already exists/i.test(issue.message))).length,
    rows: validated,
  };
}

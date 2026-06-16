// Slugify Swedish commune names for SEO-friendly URLs (/kommun/upplands-vasby).
// kommunkod stays the internal key; the slug is only for the URL + SEO.

/** "Upplands Väsby" -> "upplands-vasby" */
export function slugify(name) {
  return name
    .toLowerCase()
    .replaceAll('å', 'a')
    .replaceAll('ä', 'a')
    .replaceAll('ö', 'o')
    .replaceAll('é', 'e')
    .replaceAll('ü', 'u')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip any remaining diacritics
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

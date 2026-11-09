/** Canonical public origin for CompareIt.pk (www is the live host). */
export const SITE_URL = "https://www.compareit.pk";

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

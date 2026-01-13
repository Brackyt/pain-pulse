/**
 * Normalizes a query string into a URL-safe slug
 */
export function queryToSlug(query: string): string {
    return query
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validates that a slug is non-empty and reasonable
 */
export function isValidSlug(slug: string): boolean {
    return slug.length > 0 && slug.length <= 100 && /^[a-z0-9-]+$/.test(slug);
}

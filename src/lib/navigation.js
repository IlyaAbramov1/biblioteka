export const DEFAULT_HOME_HREF = "/";

export function resolveInternalHref(value, fallback = DEFAULT_HOME_HREF) {
    const normalizedValue = String(value || "");

    return normalizedValue.startsWith("/") ? normalizedValue : fallback;
}

export function buildSiteDetailHref(slug, homeHref = DEFAULT_HOME_HREF) {
    const searchParams = new URLSearchParams();

    searchParams.set("from", resolveInternalHref(homeHref));

    return `/site/${slug}?${searchParams.toString()}`;
}

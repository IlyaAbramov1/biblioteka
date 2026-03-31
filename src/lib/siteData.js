import rawSites from "@/data/sites.json";
import { mediaUrl } from "@/lib/media";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";
import { getSiteTags } from "@/lib/siteTags";

const CATEGORY_ORDER = ["Дизайнер", "Дизайн-студия", "Креативная студия"];
const SITE_PAGE_FALLBACK_DESCRIPTION = "Подборка сайта из дизайн-библиотеки.";

function compareCategories(left, right) {
    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;

    return leftIndex - rightIndex;
}

export const allSites = rawSites;
export const browsableSites = rawSites.filter((site) => site.slug && site.enabled !== false);
export const publishedSiteCount = rawSites.filter((site) => site.enabled).length;

export function getSiteBySlug(slug) {
    return rawSites.find((site) => site.slug === slug);
}

export function getStaticSiteParams() {
    const uniqueSlugs = new Set();

    rawSites.forEach((site) => {
        if (site.slug) uniqueSlugs.add(site.slug);
    });

    return Array.from(uniqueSlugs, (slug) => ({ slug }));
}

export function getSiteCategories(sites = browsableSites) {
    const uniqueCategories = [...new Set(sites.map((site) => site.category).filter(Boolean))];

    return uniqueCategories.sort(compareCategories);
}

export function getSiteSpecializations(sites = browsableSites) {
    return [...new Set(sites.flatMap((site) => getSiteTags(site.specialization, Number.POSITIVE_INFINITY)))];
}

export function filterSitesBySelection(
    sites,
    {
        category = null,
        tags = [],
    } = {}
) {
    return sites.filter((site) => {
        const byCategory = category === null || site.category === category;
        const siteTags = getSiteTags(site.specialization, Number.POSITIVE_INFINITY);
        const byTags = tags.length === 0 || tags.every((tag) => siteTags.includes(tag));

        return byCategory && byTags;
    });
}

export function getSiteDescription(site) {
    return (
        site.subtitle ||
        site.description ||
        getSiteTags(site.specialization, Number.POSITIVE_INFINITY).join(", ") ||
        SITE_PAGE_FALLBACK_DESCRIPTION
    );
}

export function getSiteKeywords(site) {
    return [
        site.title,
        site.category,
        ...getSiteTags(site.specialization, Number.POSITIVE_INFINITY),
        "дизайн-библиотека",
        "сайты дизайнеров",
        "дизайн-студии",
    ];
}

export function getSiteSocialTitle(site) {
    return `${site.title} — ${site.category}`;
}

export function getSitePreviewImage(site) {
    return site.previewScreen ? mediaUrl(site.previewScreen) : DEFAULT_SOCIAL_IMAGE;
}

export function getSiteScreens(site) {
    return Array.isArray(site.siteScreens) ? site.siteScreens : [];
}

export function getSiteVideoUrl(site) {
    return site.fullVideoKey ? mediaUrl(site.fullVideoKey) : null;
}

export const siteCategories = getSiteCategories();
export const siteSpecializations = getSiteSpecializations();

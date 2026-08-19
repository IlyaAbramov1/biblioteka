import rawSites from "@/data/sites.json";
import { mediaUrl } from "@/lib/media";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";
import { getSiteTags } from "@/lib/siteTags";

const CATEGORY_ORDER = ["Дизайнер", "Дизайн-студия"];
const SPECIALIZATION_ORDER = [
    "Design Engineer",
    "Branding",
    "Web",
    "Motion Design",
    "Art",
    "Product",
    "3D in Web",
    "Illustration",
    "CGI",
    "Gaming",
    "Fonts",
    "IT",
];

function compareCategories(left, right) {
    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;

    return leftIndex - rightIndex;
}

function compareSpecializations(left, right) {
    const leftIndex = SPECIALIZATION_ORDER.indexOf(left);
    const rightIndex = SPECIALIZATION_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;

    return leftIndex - rightIndex;
}

function isBrowsableSite(site) {
    return Boolean(site.slug) && site.enabled !== false;
}

export const browsableSites = rawSites.filter(isBrowsableSite);
export const publishedSiteCount = browsableSites.length;

export function getSiteBySlug(slug) {
    return browsableSites.find((site) => site.slug === slug);
}

export function getStaticSiteParams() {
    return browsableSites.map((site) => ({ slug: site.slug }));
}

export function getSiteCategories(sites = browsableSites) {
    const categories = sites
        .map((site) => site.category)
        .filter(Boolean);

    return [...new Set(categories)].sort(compareCategories);
}

export function getSiteSpecializations(sites = browsableSites) {
    return [
        ...new Set(
            sites.flatMap((site) => getSiteTags(site.specialization, Number.POSITIVE_INFINITY))
        ),
    ].sort(compareSpecializations);
}

export function getSitePreviewImage(site) {
    return site.previewScreen ? mediaUrl(site.previewScreen) : "";
}

export function getSiteSocialImage(site) {
    return getSitePreviewImage(site) || DEFAULT_SOCIAL_IMAGE;
}

export function getSiteDescription(site) {
    return site.subtitle || site.description || "Подборка сайта из дизайн-библиотеки.";
}

export function getSiteKeywords(site) {
    return [
        site.title,
        site.category,
        ...getSiteTags(site.specialization, Number.POSITIVE_INFINITY),
        "дизайн-библиотека",
        "сайты дизайнеров",
        "дизайн-студии",
    ].filter(Boolean);
}

export function getSiteSocialTitle(site) {
    return `${site.title} — ${site.category}`;
}

export function getSiteScreens(site) {
    return Array.isArray(site.siteScreens) ? site.siteScreens : [];
}

export function getSiteVideoUrl(site) {
    return site.fullVideoKey ? mediaUrl(site.fullVideoKey) : null;
}

export const siteCategories = getSiteCategories();
export const siteSpecializations = getSiteSpecializations();

import sites from "@/data/sites.json";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ilyaabramov1.github.io/biblioteka";

export const dynamic = "force-static";

export default function sitemap() {
    const now = new Date();

    const sitePages = sites
        .filter((site) => site.enabled === true && site.slug)
        .map((site) => ({
            url: `${SITE_URL}/site/${site.slug}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
        }));

    return [
        {
            url: SITE_URL,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1,
        },
        ...sitePages,
    ];
}

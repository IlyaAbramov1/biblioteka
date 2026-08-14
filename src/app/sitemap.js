import { SITE_URL } from "@/lib/seo";
import { browsableSites } from "@/lib/siteData";

export const dynamic = "force-static";

export default function sitemap() {
    const now = new Date();
    const sitePages = browsableSites.map((site) => ({
        url: `${SITE_URL}/site/${site.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    return [
        {
            url: `${SITE_URL}/`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1,
        },
        ...sitePages,
    ];
}

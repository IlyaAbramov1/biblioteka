import sites from "@/data/sites.json";
import FullSiteItem from "@/components/FullSiteItem/FullSiteItem";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const site = sites.find((s) => s.slug === slug);

    if (!site) return {};

    return {
        title: site.title,
        description: site.description || site.specialization?.join(", "),
    };
}

export function generateStaticParams() {
    const uniqueSlugs = new Set();
    sites.forEach((site) => {
        if (site.slug) uniqueSlugs.add(site.slug);
    });

    return Array.from(uniqueSlugs, (slug) => ({ slug }));
}

export default async function SitePage({ params }) {
    const { slug } = await params;
    const site = sites.find((s) => s.slug === slug);

    if (!site) return notFound();

    return (
        <main>
            <FullSiteItem site={site} />
        </main>
    );
}

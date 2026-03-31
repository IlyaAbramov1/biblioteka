import { Suspense } from "react";
import { notFound } from "next/navigation";

import FullSiteItem from "@/components/FullSiteItem/FullSiteItem";
import DetailFullSiteItem from "@/components/FullSiteItem/DetailFullSiteItem";
import NavPanel from "@/components/NavPanel/NavPanel";
import DetailNavPanel from "@/components/NavPanel/DetailNavPanel";
import PageTransitionSurface from "@/components/RouteTransition/PageTransitionSurface";
import { SITE_URL } from "@/lib/seo";
import {
    getSiteBySlug,
    getSiteDescription,
    getSiteKeywords,
    getSitePreviewImage,
    getSiteSocialTitle,
    getStaticSiteParams,
} from "@/lib/siteData";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const site = getSiteBySlug(slug);

    if (!site) return {};

    const description = getSiteDescription(site);
    const previewImage = getSitePreviewImage(site);
    const socialTitle = getSiteSocialTitle(site);

    return {
        title: site.title,
        description,
        keywords: getSiteKeywords(site),
        alternates: {
            canonical: `/site/${site.slug}`,
        },
        openGraph: {
            type: "article",
            url: `${SITE_URL}/site/${site.slug}`,
            title: socialTitle,
            description,
            images: [
                {
                    url: previewImage,
                    alt: `${site.title} preview`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: socialTitle,
            description,
            images: [previewImage],
        },
    };
}

export function generateStaticParams() {
    return getStaticSiteParams();
}

export default async function SitePage({ params }) {
    const { slug } = await params;
    const site = getSiteBySlug(slug);

    if (!site) return notFound();

    return (
        <div className="mainContainer">
            <div className="sidebarColumn">
                <Suspense fallback={<NavPanel />}>
                    <DetailNavPanel />
                </Suspense>
            </div>
            <PageTransitionSurface as="main">
                <Suspense fallback={<FullSiteItem site={site} />}>
                    <DetailFullSiteItem site={site} />
                </Suspense>
            </PageTransitionSurface>
        </div>
    );
}

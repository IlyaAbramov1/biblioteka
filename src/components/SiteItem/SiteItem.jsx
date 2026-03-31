import { getHomeStateKey, persistHomeState } from "@/lib/homeState";
import { buildSiteDetailHref } from "@/lib/navigation";
import { getSitePreviewImage } from "@/lib/siteData";
import TagList from "@/components/TagList/TagList";
import TransitionLink from "@/components/RouteTransition/TransitionLink";

import styles from "./SiteItem.module.css";

export default function SiteItem({ site, homeHref = "/", visibleCount = 20 }) {
    const previewSrc = site.previewScreen ? getSitePreviewImage(site) : null;
    const customStyleClass = site.customStyle
        ? (styles[site.customStyle] || site.customStyle)
        : "";
    const containerClassName = [styles.siteContainer, customStyleClass]
        .filter(Boolean)
        .join(" ");
    const siteHref = buildSiteDetailHref(site.slug, homeHref);
    const homeStateKey = getHomeStateKey(homeHref);

    const persistHomeContext = () => {
        persistHomeState(homeStateKey, visibleCount);
    };

    const siteImageCover = previewSrc ? (
        <img
            src={previewSrc}
            alt={`${site.title} preview`}
            className={styles.siteCover}
        />
    ) : (
        <p>Not Found</p>
    );

    return (
        <TransitionLink href={siteHref} onClick={persistHomeContext} className={containerClassName}>
            <div className={styles.siteCoverAndInfo}>
                {siteImageCover}
                <div className={styles.siteInfoAndButton}>
                    <div className={styles.siteInfo}>
                        <div className={styles.siteTextInfo}>
                            <div className={styles.siteTitle}>{site.title}</div>
                            <div className={styles.siteCategory}>{site.category}</div>
                        </div>
                        <TagList specialization={site.specialization} className={styles.siteTags} />
                    </div>
                    {/* <p className={styles.secondaryButton}>Подробнее ↗</p> */}
                </div>
            </div>
        </TransitionLink>
    );
}

import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import TagList from "@/components/TagList/TagList";

import styles from "./SiteItem.module.css";

export default function SiteItem({ site }) {
    const previewSrc = site.previewScreen ? mediaUrl(site.previewScreen) : null;
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
        <Link href={`/site/${site.slug}`} className={styles.siteContainer}>
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
                    <p className={styles.secondaryButton}>Подробнее ↗</p>
                </div>
            </div>
        </Link>
    );
}

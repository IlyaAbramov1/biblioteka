import styles from "./FullSiteItem.module.css";

import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import TagList from "@/components/TagList/TagList";

export default function FullSiteItem({ site }) {
    const fullVideoSrc = site.fullVideoKey ? mediaUrl(site.fullVideoKey) : null;
    const siteScreens = Array.isArray(site.siteScreens)
        ? site.siteScreens
        : [];

    return (
        <div className={styles.siteInfoAndVideo}>
            <Link href="/" className="link">← На главную</Link>

            <div className={styles.siteInfo}>
                
                <div className={styles.siteTitleAndSubtitle}>
                    <div className={styles.siteTitle}>{site.title}</div>
                    <p className={styles.siteSubtitle}>{site.subtitle}</p>
                </div>

                <div className={styles.siteTagsAndButton}>
                    <div className={styles.siteTags}>
                        <div className={styles.siteTag}>
                            <div className={styles.siteTagName}>Категория</div>
                            <div className={styles.siteTagValue}>{site.category}</div>
                        </div>
                        <div className={styles.siteTag}>
                            <div className={styles.siteTagName}>Специализация</div>
                            <TagList specialization={site.specialization} className={styles.siteTagValue} />
                        </div>
                    </div>
                    <a href={site.link} target="_blank" className="mainButton">Перейти к сайту ↗</a>
                </div>

            </div>

            {siteScreens.length > 0 ? (
                <div className={styles.siteImages}>
                    {siteScreens.map((screenPath, index) => (
                        <img
                            key={screenPath}
                            src={mediaUrl(screenPath)}
                            alt={`${site.title} screen ${index + 1}`}
                            loading="lazy"
                            className={styles.siteImage}
                        />
                    ))}
                </div>
            ) : null}

            {fullVideoSrc ? (
                <video
                    src={fullVideoSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className={styles.siteVideo}
                />
            ) : null}

        </div>
    )
}

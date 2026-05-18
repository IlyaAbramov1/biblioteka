"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton/SecondaryButton";
import { mediaUrl } from "@/lib/media";
import { getSiteScreens, getSiteVideoUrl } from "@/lib/siteData";
import { getSiteTags, getTagIconPath, getTagMeta } from "@/lib/siteTags";

import styles from "./FullSiteItem.module.css";

const BOOK_LOADER_PAGES = Array.from({ length: 18 }, (_, index) => index + 1);

function BookLoader() {
    return (
        <div className={styles.bookLoader} role="status" aria-label="Видео загружается">
            <div className={styles.bookLoaderInner}>
                <div className={styles.bookLoaderLeft} />
                <div className={styles.bookLoaderMiddle} />
                <div className={styles.bookLoaderRight} />
            </div>
            <ul className={styles.bookLoaderPages} aria-hidden="true">
                {BOOK_LOADER_PAGES.map((page) => (
                    <li className={styles.bookLoaderPage} key={page} />
                ))}
            </ul>
        </div>
    );
}

function SiteVideo({ src }) {
    const [isReady, setIsReady] = useState(false);

    return (
        <div className={styles.siteVideoFrame}>
            {!isReady ? (
                <div className={styles.siteVideoLoader}>
                    <BookLoader />
                </div>
            ) : null}
            <video
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => setIsReady(true)}
                className={`${styles.siteVideo} ${isReady ? styles.siteVideoReady : ""}`}
            />
        </div>
    );
}

export default function FullSiteItem({
    site,
    backHref = "/",
    mode = "page",
    onClose,
}) {
    const router = useRouter();
    const isModal = mode === "modal";
    const siteScreens = getSiteScreens(site);
    const fullVideoSrc = getSiteVideoUrl(site);
    const tags = getSiteTags(site.specialization, Number.POSITIVE_INFINITY);

    useEffect(() => {
        if (!isModal) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                if (onClose) {
                    onClose();
                    return;
                }

                router.back();
            }
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [isModal, onClose, router]);

    const closeModal = () => {
        if (onClose) {
            onClose();
            return;
        }

        router.back();
    };

    const backControl = isModal ? (
        <SecondaryButton as="button" onClick={closeModal}>
            Назад
        </SecondaryButton>
    ) : (
        <SecondaryButton href={backHref} external={false}>
            Назад
        </SecondaryButton>
    );

    const content = (
        <div className={styles.siteInfoAndVideo}>
            {backControl}

            <div className={styles.siteInfo}>
                <div className={styles.siteHeader}>
                    <div className={styles.siteTitleAndSubtitle}>
                        <div className={styles.siteTitleLine}>
                            <div className={styles.siteTitle}>{site.title}</div>
                            <div className={styles.siteCategory}>{site.category}</div>
                        </div>
                        <p className={styles.siteSubtitle}>{site.subtitle}</p>
                    </div>
                    <div className={styles.tagsAndButton}>
                        <div className={styles.siteTags}>
                            {tags.map((tag) => {
                                const meta = getTagMeta(tag);
                                const iconPath = getTagIconPath(meta.icon);

                                return (
                                    <span
                                        className={styles.siteTagItem}
                                        key={tag}
                                        data-tag-tone={meta.tone}
                                    >
                                        <span className={styles.siteTagIcon} aria-hidden="true">
                                            {iconPath ? (
                                                <Image src={iconPath} alt="" width={22} height={22} />
                                            ) : (
                                                <span className={styles.defaultTagIcon} />
                                            )}
                                        </span>
                                        <span>{meta.label}</span>
                                    </span>
                                );
                            })}
                        </div>

                        {site.link ? (
                            <PrimaryButton href={site.link}>
                                Перейти к сайту
                            </PrimaryButton>
                        ) : null}
                    </div>
                </div>
            </div>

            {siteScreens.length > 0 ? (
                <div className={styles.siteImages}>
                    {siteScreens.map((screenPath, index) => (
                        <Image
                            key={screenPath}
                            src={mediaUrl(screenPath)}
                            alt={`${site.title} screen ${index + 1}`}
                            width={1600}
                            height={1000}
                            sizes="(max-width: 1200px) 100vw, 1040px"
                            unoptimized
                            className={styles.siteImage}
                        />
                    ))}
                </div>
            ) : null}

            {fullVideoSrc ? (
                <SiteVideo key={fullVideoSrc} src={fullVideoSrc} />
            ) : null}
        </div>
    );

    if (isModal) {
        return (
            <div
                className={styles.modalOverlay}
                role="dialog"
                aria-modal="true"
                aria-label={site.title}
                onClick={closeModal}
            >
                <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()}>
                    {content}
                </div>
            </div>
        );
    }

    return (
        <main className={styles.pageShell}>
            {content}
        </main>
    );
}

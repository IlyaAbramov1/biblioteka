"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import CanvasLogo from "@/components/CanvasLogo/CanvasLogo";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { mediaUrl } from "@/lib/media";
import { getSiteScreens, getSiteVideoUrl } from "@/lib/siteData";
import { getSiteTags, getTagIconPath, getTagMeta } from "@/lib/siteTags";

import styles from "./FullSiteItem.module.css";

const BOOK_LOADER_PAGES = Array.from({ length: 18 }, (_, index) => index + 1);
const MODAL_EXIT_DURATION = 280;

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
    const closeTimerRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const isModal = mode === "modal";
    const siteScreens = getSiteScreens(site);
    const fullVideoSrc = getSiteVideoUrl(site);
    const tags = getSiteTags(site.specialization, Number.POSITIVE_INFINITY);

    const completeClose = useCallback(() => {
        if (onClose) {
            onClose();
            return;
        }

        if (isModal) {
            router.back();
            return;
        }

        router.push(backHref);
    }, [backHref, isModal, onClose, router]);

    const closeFullSite = useCallback(() => {
        if (!isModal) {
            completeClose();
            return;
        }

        if (isClosing || closeTimerRef.current) return;

        setIsClosing(true);
        closeTimerRef.current = window.setTimeout(completeClose, MODAL_EXIT_DURATION);
    }, [completeClose, isClosing, isModal]);

    useEffect(() => {
        if (!isModal) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                closeFullSite();
            }
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [closeFullSite, isModal]);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    const content = (
        <div className={styles.siteInfoAndVideo}>
            <button
                type="button"
                className={styles.closeButton}
                onClick={closeFullSite}
                aria-label="Закрыть"
            />

            <div className={styles.siteInfo}>
                <div className={styles.siteHeader}>
                    <div className={styles.siteTextColumn}>
                        <div className={styles.siteTitleLine}>
                            <div className={styles.siteTitle}>
                                <span className="titleAccentText">{site.title}</span>
                            </div>
                            <div className={styles.siteCategory}>{site.category}</div>
                        </div>
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
                                        <span
                                            className={styles.siteTagIcon}
                                            style={{ "--icon-url": iconPath ? `url(${iconPath})` : "none" }}
                                            aria-hidden="true"
                                        />
                                        <span>{meta.label}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.siteAction}>
                        {site.link ? (
                            <PrimaryButton href={site.link}>
                                Перейти к сайту
                            </PrimaryButton>
                        ) : null}
                    </div>
                </div>
                <p className={styles.siteSubtitle}>{site.subtitle}</p>
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
                className={`${styles.modalOverlay} ${isClosing ? styles.modalOverlayClosing : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label={site.title}
                onClick={closeFullSite}
            >
                <div
                    className={`${styles.modalPanel} ${isClosing ? styles.modalPanelClosing : ""}`}
                    onClick={(event) => event.stopPropagation()}
                >
                    {content}
                </div>
            </div>
        );
    }

    return (
        <main className={styles.pageShell}>
            <CanvasLogo />
            {content}
        </main>
    );
}

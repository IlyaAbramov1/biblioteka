"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CanvasLogo from "@/components/CanvasLogo/CanvasLogo";
import CloseButton from "@/components/CloseButton/CloseButton";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { mediaUrl } from "@/lib/media";
import { getSiteBySlug, getSiteScreens, getSiteVideoUrl } from "@/lib/siteData";
import { getDescriptionMentions } from "@/lib/siteRelations";
import { getSiteTags, getTagIconPath, getTagMeta } from "@/lib/siteTags";

import styles from "./FullSiteItem.module.css";

const BOOK_LOADER_PAGES = Array.from({ length: 18 }, (_, index) => index + 1);
const MODAL_EXIT_DURATION = 280;

function isPlainLeftClick(event) {
    return (
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
    );
}

function SiteDescription({ site, onRelatedSiteOpen }) {
    const mentions = getDescriptionMentions(site);

    if (!mentions.length) return site.subtitle;

    const mentionByText = new Map(
        mentions.map((mention) => [mention.text.toLocaleLowerCase("ru"), mention])
    );
    const pattern = new RegExp(
        `(${mentions
            .map((mention) => mention.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .sort((left, right) => right.length - left.length)
            .join("|")})`,
        "giu"
    );

    return site.subtitle.split(pattern).map((part, index) => {
        const mention = mentionByText.get(part.toLocaleLowerCase("ru"));
        const relatedSite = mention ? getSiteBySlug(mention.slug) : null;

        if (!relatedSite) return part;

        return (
            <Link
                href={`/site/${relatedSite.slug}`}
                key={`${relatedSite.slug}-${index}`}
                onClick={(event) => {
                    if (!onRelatedSiteOpen || !isPlainLeftClick(event)) return;
                    event.preventDefault();
                    onRelatedSiteOpen(relatedSite);
                }}
            >
                {part}
            </Link>
        );
    });
}

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
    onRelatedSiteOpen,
}) {
    const router = useRouter();
    const closeTimerRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [portalNode, setPortalNode] = useState(null);
    const isModal = mode === "modal";
    const siteScreens = getSiteScreens(site);
    const fullVideoSrc = getSiteVideoUrl(site);
    const tags = getSiteTags(site.specialization, Number.POSITIVE_INFINITY);
    const renderSiteAction = () => (
        site.link ? (
            <PrimaryButton href={site.link}>
                Перейти к сайту
            </PrimaryButton>
        ) : null
    );

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
        const frame = window.requestAnimationFrame(() => {
            setPortalNode(document.body);
        });

        return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!isModal) return undefined;

        const scrollY = window.scrollY;
        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyWidth = document.body.style.width;
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.documentElement.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";

        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                closeFullSite();
            }
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.width = previousBodyWidth;
            document.body.style.overflow = previousBodyOverflow;
            window.scrollTo(0, scrollY);
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
            <CloseButton
                className={styles.closeButtonPosition}
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
                                        {iconPath ? (
                                            <Image
                                                className={styles.siteTagIcon}
                                                src={iconPath}
                                                alt=""
                                                width={16}
                                                height={16}
                                                unoptimized
                                            />
                                        ) : null}
                                        <span>{meta.label}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`${styles.siteAction} ${styles.siteActionDesktop}`}>
                        {renderSiteAction()}
                    </div>
                </div>
                <p className={styles.siteSubtitle}>
                    <SiteDescription site={site} onRelatedSiteOpen={onRelatedSiteOpen} />
                </p>
                <div className={styles.siteActionInline}>
                    {renderSiteAction()}
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
        const modal = (
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

        return portalNode ? createPortal(modal, portalNode) : null;
    }

    return (
        <main className={styles.pageShell}>
            <CanvasLogo />
            {content}
        </main>
    );
}

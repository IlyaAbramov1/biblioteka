"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AccentText from "@/components/AccentText/AccentText";
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
const MODAL_GHOST_CLICK_GUARD = 600;

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
                scroll
                onClick={(event) => {
                    if (!isPlainLeftClick(event)) return;

                    if (!onRelatedSiteOpen) {
                        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                        return;
                    }

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
    const videoRef = useRef(null);

    const markReady = useCallback(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        const video = videoRef.current;

        // On a statically rendered page the browser can finish loading the
        // video before React attaches the media event listeners.
        if (video?.readyState >= 2) {
            const frame = window.requestAnimationFrame(markReady);
            return () => window.cancelAnimationFrame(frame);
        }

        return undefined;
    }, [markReady, src]);

    return (
        <div className={styles.siteVideoFrame}>
            {!isReady ? (
                <div className={styles.siteVideoLoader}>
                    <BookLoader />
                </div>
            ) : null}
            <video
                ref={videoRef}
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={markReady}
                onLoadedData={markReady}
                onCanPlay={markReady}
                onError={markReady}
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
    const siteInfoRef = useRef(null);
    const modalOpenedAtRef = useRef(0);
    const [isClosing, setIsClosing] = useState(false);
    const [portalNode, setPortalNode] = useState(null);
    const isModal = mode === "modal";
    const siteScreens = getSiteScreens(site);
    const fullVideoSrc = getSiteVideoUrl(site);
    const isJoguman = site.slug === "joguman";
    const hasTomatMedal = [
        "alex-ezhov",
        "chester",
        "esh-gruppa",
        "reboot",
        "oddworks",
        "pentagram",
        "dfy",
    ].includes(site.slug);
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

        modalOpenedAtRef.current = performance.now();

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

    useLayoutEffect(() => {
        siteInfoRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });

        if (!isModal) {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
    }, [isModal, site.slug]);

    const content = (
        <div ref={siteInfoRef} className={styles.siteInfoAndVideo}>
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
                                <AccentText>{site.title}</AccentText>
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
                <div className={`${styles.siteMedia} ${isJoguman ? styles.jogumanMedia : ""}`}>
                    <SiteVideo key={fullVideoSrc} src={fullVideoSrc} />
                    {hasTomatMedal ? (
                        <a
                            className={styles.tomatSticker}
                            href="https://tomat.team/"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Перейти на сайт агентства Tomat"
                        >
                            <span className={styles.tomatStickerInner}>
                                <Image
                                    src="/tomat-medal.svg"
                                    alt=""
                                    width={139}
                                    height={139}
                                    unoptimized
                                    className={styles.tomatStickerImage}
                                />
                                <span className={styles.tomatStickerPeel} aria-hidden="true">
                                    <span className={styles.tomatStickerPeelInner} />
                                </span>
                            </span>
                        </a>
                    ) : null}
                </div>
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
                onClick={(event) => {
                    if (event.target !== event.currentTarget) return;

                    if (performance.now() - modalOpenedAtRef.current < MODAL_GHOST_CLICK_GUARD) return;

                    closeFullSite();
                }}
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

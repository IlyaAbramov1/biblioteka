"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { getSitePreviewImage } from "@/lib/siteData";
import { HOVER_SPRING } from "@/lib/motion";
import { getSiteTags, getTagMeta, getTagIconPath } from "@/lib/siteTags";

import styles from "./SiteItem.module.css";

const SITE_HOVER_VARIANTS = {
    rest: { y: 0 },
    hover: { y: -4 },
};

const PREVIEW_HOVER_VARIANTS = {
    rest: { y: 0, scale: 1 },
    hover: { y: -2, scale: 1.012 },
};

function isPlainLeftClick(event) {
    return (
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
    );
}

export default function SiteItem({ site, onOpen }) {
    const previewSrc = getSitePreviewImage(site);
    const tags = getSiteTags(site.specialization);
    const backplateGradientId = `site-item-backplate-${String(site.slug || site.title || "site").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const customStyleClass = site.customStyle
        ? (styles[site.customStyle] || site.customStyle)
        : "";
    const containerClassName = [styles.siteContainer, customStyleClass]
        .filter(Boolean)
        .join(" ");
    const content = (
        <div className={styles.siteCoverAndInfo}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 308 226"
                fill="none"
                preserveAspectRatio="none"
                className={styles.siteBackplate}
                aria-hidden="true"
            >
                <path
                    d="M0 22.1377C0 9.91138 9.91137 0 22.1377 0H92.9738C98.0465 0 102.965 1.74212 106.907 4.93486L126.474 20.7831C130.416 23.9759 135.335 25.718 140.408 25.718H285.862C298.089 25.718 308 35.6294 308 47.8556V203.253C308 215.479 298.089 225.391 285.862 225.391H22.1377C9.91136 225.391 0 215.479 0 203.253V22.1377Z"
                    fill={`url(#${backplateGradientId})`}
                />
                <defs>
                    <linearGradient id={backplateGradientId} x1="154" y1="0" x2="154" y2="225.391" gradientUnits="userSpaceOnUse">
                        <stop className={styles.siteBackplateStart} />
                        <stop className={styles.siteBackplateEnd} offset="1" />
                    </linearGradient>
                </defs>
            </svg>
            <div className={styles.sitePreviewStage}>
                {previewSrc ? (
                    <motion.div
                        className={styles.siteCoverFrame}
                        variants={PREVIEW_HOVER_VARIANTS}
                        transition={HOVER_SPRING}
                    >
                        <Image
                            src={previewSrc}
                            alt={`${site.title} preview`}
                            className={styles.siteCover}
                            fill
                            sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                        />
                        {site.isNew ? <span className={styles.newBadge}>Новое</span> : null}
                    </motion.div>
                ) : (
                    <motion.div
                        className={`${styles.siteCoverFrame} ${styles.siteCoverPlaceholder}`}
                        variants={PREVIEW_HOVER_VARIANTS}
                        transition={HOVER_SPRING}
                    >
                        Preview not found
                    </motion.div>
                )}
            </div>
            <div className={styles.siteInfo}>
                <div className={styles.siteTextInfo}>
                    <div className={styles.siteTitle}>{site.title}</div>
                    <div className={styles.siteCategory}>{site.category}</div>
                </div>
                {tags.length ? (
                    <div className={styles.siteTags}>
                        {tags.map((tag) => {
                            const meta = getTagMeta(tag);
                            const iconPath = getTagIconPath(meta.icon);

                            return (
                                <span
                                    className={styles.siteTag}
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
                ) : null}
            </div>
        </div>
    );

    const handleClick = (event) => {
        if (!isPlainLeftClick(event)) return;

        event.preventDefault();
        onOpen(site);
    };

    return (
        <motion.div
            className={styles.siteReveal}
            initial="rest"
            animate="rest"
            whileHover="hover"
            variants={SITE_HOVER_VARIANTS}
            transition={HOVER_SPRING}
        >
            <Link
                href={`site/${site.slug}`}
                scroll={false}
                className={containerClassName}
                onClick={handleClick}
            >
                {content}
            </Link>
        </motion.div>
    );
}

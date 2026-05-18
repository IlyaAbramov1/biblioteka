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
                viewBox="0 0 302 219"
                fill="none"
                preserveAspectRatio="none"
                className={styles.siteBackplate}
                aria-hidden="true"
            >
                <path
                    d="M32 0.452148H90.5918C95.9321 0.452148 101.185 1.80826 105.858 4.39258L122.538 13.6162C127.346 16.2747 132.75 17.6689 138.243 17.6689H270C287.423 17.6689 301.548 31.7935 301.548 49.2168V187C301.548 204.423 287.423 218.548 270 218.548H32C14.5766 218.548 0.452153 204.423 0.452148 187V32C0.452148 14.5766 14.5766 0.452148 32 0.452148Z"
                    fill="var(--site-card-fill)"
                    stroke="var(--stroke)"
                    strokeWidth="0.6"
                    vectorEffect="non-scaling-stroke"
                />
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
                                    <span className={styles.siteTagIcon} aria-hidden="true">
                                        {iconPath ? (
                                            <Image src={iconPath} alt="" width={18} height={18} />
                                        ) : (
                                            <span className={styles.defaultTagIcon} />
                                        )}
                                    </span>
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

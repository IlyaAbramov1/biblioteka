"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import CanvasLogo from "@/components/CanvasLogo/CanvasLogo";
import FullSiteItem from "@/components/FullSiteItem/FullSiteItem";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton/SecondaryButton";
import SiteItem from "@/components/SiteItem/SiteItem";
import SiteGraph from "@/components/SiteGraph/SiteGraph";
import {
    browsableSites,
    getSiteBySlug,
    siteCategories,
    siteSpecializations,
} from "@/lib/siteData";
import { getSiteTags, getTagIconPath, getTagMeta } from "@/lib/siteTags";
import { HOVER_SPRING } from "@/lib/motion";

import styles from "./page.module.css";

const BATCH_SIZE = 20;
const TELEGRAM_CHANNEL_HREF = "https://t.me/design_biblioteka";
const CONTACT_HREF = "https://t.me/abramovdesiqn";
const REVEAL_INITIAL = { opacity: 0, filter: "blur(12px)", y: -20 };
const REVEAL_VISIBLE = { opacity: 1, filter: "blur(0px)", y: 0 };
const REVEAL_TRANSITION = {
    duration: 1,
    ease: [0.22, 1, 0.36, 1],
};
const HERO_TITLE_DELAY = 0.12;
const HERO_SUBTITLE_DELAY = HERO_TITLE_DELAY + 0.08;
const HERO_FIRST_BUTTON_DELAY = HERO_SUBTITLE_DELAY + 0.08;
const HERO_SECOND_BUTTON_DELAY = HERO_FIRST_BUTTON_DELAY + 0.08;
const HERO_NAV_DELAY = HERO_SECOND_BUTTON_DELAY + 0.08;
const ASSET_VERSION = "20260812";
const TELEGRAM_ICON_PATH = `/tg.svg?v=${ASSET_VERSION}`;
const ADD_WEBSITE_ICON_PATH = `/add_website.svg?v=${ASSET_VERSION}`;
const PLUS_ICON_PATH = `/tag-icons/plus.svg?v=${ASSET_VERSION}`;
const MINUS_ICON_PATH = `/tag-icons/minus.svg?v=${ASSET_VERSION}`;

function getSlugFromPathname(pathname) {
    const match = String(pathname || "").match(/(?:^|\/)site\/([^/]+)\/?$/);

    return match ? decodeURIComponent(match[1]) : null;
}

function buildSitePath(slug) {
    if (typeof window === "undefined") return `/site/${slug}`;

    const pathname = window.location.pathname;
    const homePath = pathname.replace(/\/site\/[^/]+\/?$/, "/");
    const normalizedHomePath = homePath.endsWith("/") ? homePath : `${homePath}/`;
    const nextUrl = new URL(`site/${slug}`, `${window.location.origin}${normalizedHomePath}`);

    return nextUrl.pathname;
}

export default function HomePage() {
    const categoryGroupRef = useRef(null);
    const categoryButtonRefs = useRef([]);
    const sentinelRef = useRef(null);
    const homeUrlRef = useRef("/");
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [activeSiteSlug, setActiveSiteSlug] = useState(null);
    const [viewMode, setViewMode] = useState("gallery");
    const [categoryIndicatorStyle, setCategoryIndicatorStyle] = useState({
        "--category-indicator-left": "3px",
        "--category-indicator-width": "0px",
    });

    const filteredSites = useMemo(() => {
        return browsableSites.filter((site) => {
            const siteTags = getSiteTags(site.specialization, Number.POSITIVE_INFINITY);
            const matchesCategory = selectedCategory === null || site.category === selectedCategory;
            const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => siteTags.includes(tag));

            return matchesCategory && matchesTags;
        });
    }, [selectedCategory, selectedTags]);

    const visibleSites = filteredSites.slice(0, visibleCount);
    const activeSite = activeSiteSlug ? getSiteBySlug(activeSiteSlug) : null;
    const categoryOptions = useMemo(() => [
        { label: "Все", value: null },
        ...siteCategories.map((category) => ({ label: category, value: category })),
    ], []);
    const selectedCategoryIndex = Math.max(
        0,
        categoryOptions.findIndex((option) => option.value === selectedCategory)
    );

    useLayoutEffect(() => {
        const updateCategoryIndicator = () => {
            const activeButton = categoryButtonRefs.current[selectedCategoryIndex];

            if (!activeButton) return;

            setCategoryIndicatorStyle({
                "--category-indicator-left": `${activeButton.offsetLeft}px`,
                "--category-indicator-width": `${activeButton.offsetWidth}px`,
            });
        };

        updateCategoryIndicator();
        window.addEventListener("resize", updateCategoryIndicator);

        return () => window.removeEventListener("resize", updateCategoryIndicator);
    }, [selectedCategoryIndex]);

    useEffect(() => {
        const syncActiveSiteFromUrl = () => {
            const nextSlug = getSlugFromPathname(window.location.pathname);

            setActiveSiteSlug(nextSlug);

            if (!nextSlug) {
                homeUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            }
        };

        syncActiveSiteFromUrl();
        window.addEventListener("popstate", syncActiveSiteFromUrl);

        return () => window.removeEventListener("popstate", syncActiveSiteFromUrl);
    }, []);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || visibleCount >= filteredSites.length) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;

                setVisibleCount((count) => Math.min(count + BATCH_SIZE, filteredSites.length));
            },
            { root: null, rootMargin: "120px 0px" }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [filteredSites.length, visibleCount]);

    const resetVisibleCount = () => {
        setVisibleCount(BATCH_SIZE);
    };

    const clearFilters = () => {
        resetVisibleCount();
        setSelectedCategory(null);
        setSelectedTags([]);
    };

    const selectCategory = (category) => {
        resetVisibleCount();
        setSelectedCategory((currentCategory) => (
            currentCategory === category ? null : category
        ));
    };

    const toggleTag = (tag) => {
        resetVisibleCount();
        setSelectedTags((currentTags) => (
            currentTags.includes(tag)
                ? currentTags.filter((item) => item !== tag)
                : [...currentTags, tag]
        ));
    };

    const openSite = (site) => {
        if (!site.slug || typeof window === "undefined") return;

        if (!getSlugFromPathname(window.location.pathname)) {
            homeUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        }

        window.history.pushState({ siteSlug: site.slug }, "", buildSitePath(site.slug));
        setActiveSiteSlug(site.slug);
    };

    const closeSite = () => {
        if (typeof window === "undefined") {
            setActiveSiteSlug(null);
            return;
        }

        setActiveSiteSlug(null);

        if (getSlugFromPathname(window.location.pathname) && window.history.length > 1) {
            window.history.back();
            return;
        }

        window.history.pushState(null, "", homeUrlRef.current);
    };

    return (
        <main className={styles.page}>
            <CanvasLogo />
            <div className={styles.viewSwitcher} role="group" aria-label="Режим отображения">
                <button
                    type="button"
                    className={viewMode === "gallery" ? styles.viewButtonActive : styles.viewButton}
                    onClick={() => setViewMode("gallery")}
                    aria-pressed={viewMode === "gallery"}
                >
                    Галерея
                </button>
                <button
                    type="button"
                    className={viewMode === "graph" ? styles.viewButtonActive : styles.viewButton}
                    onClick={() => setViewMode("graph")}
                    aria-pressed={viewMode === "graph"}
                >
                    Граф
                </button>
            </div>
            <section className={styles.heroBlock} aria-labelledby="library-title">
                <div className={styles.heroBlockText}>
                    <div className={styles.titleRow}>
                        <motion.h1
                            id="library-title"
                            className={styles.title}
                            initial={REVEAL_INITIAL}
                            animate={REVEAL_VISIBLE}
                            transition={{
                                ...REVEAL_TRANSITION,
                                delay: HERO_TITLE_DELAY,
                            }}
                        >
                            <span className="titleAccentText">Дизайн-библиотека</span> — курируемая коллекция сайтов дизайнеров и студий
                        </motion.h1>
                    </div>
                    <motion.p
                        className={styles.subtitle}
                        initial={REVEAL_INITIAL}
                        animate={REVEAL_VISIBLE}
                        transition={{
                            ...REVEAL_TRANSITION,
                            delay: HERO_SUBTITLE_DELAY,
                        }}
                    >
                        Библиотекарь - {" "}
                        <a href={CONTACT_HREF} target="_blank" rel="noreferrer">
                            Илья Абрамов
                        </a>
                        . Ваш сайт тоже может стать частью библиотеки.
                    </motion.p>
                </div>
                <div className={styles.actions}>
                    <motion.div
                        initial={REVEAL_INITIAL}
                        animate={REVEAL_VISIBLE}
                        transition={{
                            ...REVEAL_TRANSITION,
                            delay: HERO_FIRST_BUTTON_DELAY,
                        }}
                    >
                        <PrimaryButton
                            href={TELEGRAM_CHANNEL_HREF}
                            icon={(
                                <Image
                                    src={TELEGRAM_ICON_PATH}
                                    alt=""
                                    width={22}
                                    height={22}
                                    unoptimized
                                />
                            )}
                        >
                            Подписаться
                        </PrimaryButton>
                    </motion.div>
                    <motion.div
                        initial={REVEAL_INITIAL}
                        animate={REVEAL_VISIBLE}
                        transition={{
                            ...REVEAL_TRANSITION,
                            delay: HERO_SECOND_BUTTON_DELAY,
                        }}
                    >
                        <SecondaryButton
                            href={CONTACT_HREF}
                            icon={(
                                <Image
                                    src={ADD_WEBSITE_ICON_PATH}
                                    alt=""
                                    width={22}
                                    height={22}
                                    unoptimized
                                />
                            )}
                        >
                            Добавить сайт
                        </SecondaryButton>
                    </motion.div>
                </div>
            </section>

            <div className={styles.navGradient} aria-hidden="true" />
            <motion.nav
                className={styles.navBar}
                aria-label="Фильтры библиотеки"
                initial={REVEAL_INITIAL}
                animate={REVEAL_VISIBLE}
                transition={{
                    ...REVEAL_TRANSITION,
                    delay: HERO_NAV_DELAY,
                }}
            >
                <div className={styles.categoryViewport}>
                    <div
                        ref={categoryGroupRef}
                        className={styles.categoryGroup}
                        style={categoryIndicatorStyle}
                    >
                        {categoryOptions.map((option, index) => {
                            const isSelected = selectedCategory === option.value;

                            return (
                                <motion.button
                                    ref={(node) => {
                                        categoryButtonRefs.current[index] = node;
                                    }}
                                    type="button"
                                    className={styles.categoryOption}
                                    key={option.label}
                                    onClick={() => (option.value === null ? clearFilters() : selectCategory(option.value))}
                                    aria-pressed={isSelected}
                                    transition={HOVER_SPRING}
                                >
                                    <span>{option.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.tagScroller}>
                    <div className={styles.tagTrack}>
                        {siteSpecializations.map((tag) => {
                            const meta = getTagMeta(tag);
                            const iconPath = getTagIconPath(meta.icon);
                            const isSelected = selectedTags.includes(tag);
                            const toggleIconPath = isSelected ? MINUS_ICON_PATH : PLUS_ICON_PATH;

                            return (
                                <motion.button
                                    type="button"
                                    className={`${styles.filterOption} ${styles.tagOption} ${isSelected ? styles.filterOptionSelected : ""}`}
                                    key={tag}
                                    data-tag-tone={meta.tone}
                                    onClick={() => toggleTag(tag)}
                                    aria-pressed={isSelected}
                                    whileTap={{ scale: 0.95 }}
                                    transition={HOVER_SPRING}
                                >
                                    {iconPath ? (
                                        <Image
                                            className={styles.optionIcon}
                                            src={iconPath}
                                            alt=""
                                            width={16}
                                            height={16}
                                            unoptimized
                                        />
                                    ) : null}
                                    <span>{meta.label}</span>
                                    <Image
                                        className={styles.toggleIcon}
                                        src={toggleIconPath}
                                        alt=""
                                        width={20}
                                        height={20}
                                        unoptimized
                                    />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.nav>

            {viewMode === "graph" ? (
                <SiteGraph sites={filteredSites} onOpen={openSite} />
            ) : (
                <motion.section
                    id="sites"
                    className={styles.sitesGrid}
                    aria-label="Сайты библиотеки"
                    initial={REVEAL_INITIAL}
                    animate={REVEAL_VISIBLE}
                    transition={REVEAL_TRANSITION}
                >
                    {visibleSites.map((site) => (
                        <SiteItem
                            key={site.slug}
                            site={site}
                            onOpen={openSite}
                        />
                    ))}

                    {!filteredSites.length ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyFolder}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 308 226"
                                    fill="none"
                                    preserveAspectRatio="none"
                                    className={styles.emptyFolderShape}
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M0 22.1377C0 9.91138 9.91137 0 22.1377 0H92.9738C98.0465 0 102.965 1.74212 106.907 4.93486L126.474 20.7831C130.416 23.9759 135.335 25.718 140.408 25.718H285.862C298.089 25.718 308 35.6294 308 47.8556V203.253C308 215.479 298.089 225.391 285.862 225.391H22.1377C9.91136 225.391 0 215.479 0 203.253V22.1377Z"
                                        fill="url(#empty-folder-gradient)"
                                    />
                                    <defs>
                                        <linearGradient id="empty-folder-gradient" x1="154" y1="0" x2="154" y2="225.391" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#F0F2F5" />
                                            <stop offset="1" stopColor="#CFD9E0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className={styles.emptyPreview}>
                                    <div className={styles.emptyFace} aria-hidden="true">:-(</div>
                                    <div className={styles.emptyMessage}>
                                    По этим фильтрам пока ничего не найдено. Попробуйте снять часть тегов или вернуться ко всем сайтам.
                                    </div>
                                </div>
                                <div className={styles.emptyInfo} aria-hidden="true" />
                            </div>
                        </div>
                    ) : null}

                    {visibleCount < filteredSites.length ? (
                        <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />
                    ) : null}
                </motion.section>
            )}

            {activeSite ? (
                <FullSiteItem site={activeSite} mode="modal" onClose={closeSite} />
            ) : null}
        </main>
    );
}

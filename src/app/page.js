"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import CanvasLogo from "@/components/CanvasLogo/CanvasLogo";
import FullSiteItem from "@/components/FullSiteItem/FullSiteItem";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton/SecondaryButton";
import SiteItem from "@/components/SiteItem/SiteItem";
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
const PLUS_ICON_PATH = "/tag-icons/plus.svg";
const MINUS_ICON_PATH = "/tag-icons/minus.svg";

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
                        Библиотекарь - Илья Абрамов. Ваш сайт тоже может стать частью библиотеки.
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" viewBox="0 0 30 24" fill="none">
                                    <path d="M29.8937 0.59644C29.8181 0.283552 29.7031 0.19004 29.5161 0.0965328C29.1097 -0.104867 28.3688 0.0713772 28.3688 0.0713772C28.3688 0.0713772 2.1401 6.79308 0.593635 7.66701C0.259168 7.85403 0.144085 7.97271 0.0793497 8.11657C-0.240732 8.81067 0.510924 9.20265 0.510924 9.20265L6.84781 11.9503C6.84781 11.9503 7.08877 12.0079 7.18228 11.9611C8.75751 11.1627 23.0389 3.92314 23.8445 3.71095C23.9704 3.68578 24.0567 3.7361 24.0243 3.81882C23.6107 4.87976 10.9226 14.1801 10.9226 14.1801C10.9226 14.1801 10.8722 14.2305 10.8399 14.2952L10.8255 14.2844L9.60268 20.7112C9.60268 20.7112 9.16032 22.6749 11.3326 20.8731C12.8682 19.6035 14.332 18.557 15.0656 18.0535C17.166 19.8193 19.4245 21.765 20.3847 22.7612C20.8667 23.2611 21.2982 23.3762 21.6615 23.3977C22.6577 23.4553 23.0353 22.3907 23.0353 22.3907C23.0353 22.3907 29.4154 4.22161 29.8038 1.74368C29.8433 1.50272 29.8757 1.34809 29.8937 1.17906C29.9188 0.945291 29.9188 0.711526 29.8937 0.59644Z" fill="white"/>
                                </svg>
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
                        <SecondaryButton href={CONTACT_HREF}>
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
                                    <span
                                        className={styles.optionIcon}
                                        style={{ "--icon-url": iconPath ? `url(${iconPath})` : "none" }}
                                        aria-hidden="true"
                                    />
                                    <span>{meta.label}</span>
                                    <span
                                        className={styles.toggleIcon}
                                        style={{ "--icon-url": `url(${toggleIconPath})` }}
                                        aria-hidden="true"
                                    />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.nav>

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
                        По этим фильтрам пока ничего не найдено. Попробуйте снять часть тегов или вернуться ко всем сайтам.
                    </div>
                ) : null}

                {visibleCount < filteredSites.length ? (
                    <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />
                ) : null}
            </motion.section>

            {activeSite ? (
                <FullSiteItem site={activeSite} mode="modal" onClose={closeSite} />
            ) : null}
        </main>
    );
}

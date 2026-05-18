"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import FullSiteItem from "@/components/FullSiteItem/FullSiteItem";
import LibraryBook from "@/components/LibraryBook/LibraryBook";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton/SecondaryButton";
import SiteItem from "@/components/SiteItem/SiteItem";
import {
    browsableSites,
    getSiteBySlug,
    getSitePreviewImage,
    siteCategories,
    siteSpecializations,
} from "@/lib/siteData";
import { getSiteTags, getTagIconPath, getTagMeta } from "@/lib/siteTags";
import { HOVER_SPRING } from "@/lib/motion";

import styles from "./page.module.css";

const BATCH_SIZE = 20;
const TELEGRAM_CHANNEL_HREF = "https://t.me/tehnichka_design/";
const CONTACT_HREF = "https://t.me/abramovdesiqn";
const REVEAL_INITIAL = { opacity: 0, filter: "blur(12px)", y: -20 };
const REVEAL_VISIBLE = { opacity: 1, filter: "blur(0px)", y: 0 };
const REVEAL_TRANSITION = {
    duration: 1,
    ease: [0.22, 1, 0.36, 1],
};
const HERO_TITLE_WORDS = [
    { label: "Дизайн-библиотека" },
    { label: "–", isSubtext: true  },
    { label: "курируемая", isSubtext: true },
    { label: "коллекция", isSubtext: true },
    { label: "сайтов", isSubtext: true },
    { label: "дизайнеров", isSubtext: true },
    { label: "и", isSubtext: true },
    { label: "студий.", isSubtext: true },
];
const HERO_WORD_DELAY = 0.12;
const HERO_WORD_STAGGER = 0.0;
const HERO_SUBTITLE_DELAY = HERO_WORD_DELAY + (HERO_TITLE_WORDS.length + 1) * HERO_WORD_STAGGER + 0.08;
const HERO_FIRST_BUTTON_DELAY = HERO_SUBTITLE_DELAY + 0.08;
const HERO_SECOND_BUTTON_DELAY = HERO_FIRST_BUTTON_DELAY + 0.08;
const HERO_NAV_DELAY = HERO_SECOND_BUTTON_DELAY + 0.08;

const BOOK_IMAGE_BY_SLUG = {
    after: "/book-item/after-preview.png",
    "andrew-trousdale": "/book-item/andrew-trousdale-preview.png",
    "eva-sanchez": "/book-item/eva-sanchez-preview.png",
    "jake-down-smith": "/book-item/jake-down-smith-preview.png",
    kowalski: "/book-item/kowalski-preview.png",
    "michael-garcia": "/book-item/michael-garcia-preview.png",
    rauno: "/book-item/rauno-preview.png",
    "ryo-lu": "/book-item/ryo-preview.png",
};

const HERO_BOOK_SLUGS = [
    ["ryo-lu", "rauno", "andrew-trousdale", "michael-garcia"],
    ["after", "eva-sanchez", "jake-down-smith", "kowalski"],
];

function BookmarkLogo({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="193"
            height="329"
            viewBox="0 0 193 329"

            fill="none"
            className={className}
        >
            <path d="M0 328.5V0H193V328.5L96.5 232L0 328.5Z" fill="currentColor" />
        </svg>
    );
}

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

function formatSiteHost(link) {
    try {
        return new URL(link).hostname.replace(/^www\./, "");
    } catch {
        return String(link || "").replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
}

function buildBookItems(slugs) {
    return slugs
        .map((slug, index) => {
            const site = getSiteBySlug(slug);

            if (!site) return null;

            return {
                id: site.slug,
                title: site.title,
                subtitle: site.category,
                url: formatSiteHost(site.link),
                image: BOOK_IMAGE_BY_SLUG[site.slug] || getSitePreviewImage(site),
                targetAngle: 158 - index * 34,
                delay: 0.14 + index * 0.1,
            };
        })
        .filter(Boolean);
}

const HERO_BOOK_ITEMS = HERO_BOOK_SLUGS.map(buildBookItems);

export default function HomePage() {
    const navSentinelRef = useRef(null);
    const sentinelRef = useRef(null);
    const homeUrlRef = useRef("/");
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [activeSiteSlug, setActiveSiteSlug] = useState(null);
    const [isNavPinned, setIsNavPinned] = useState(false);

    const filteredSites = useMemo(() => {
        return browsableSites.filter((site) => {
            const siteTags = getSiteTags(site.specialization, Number.POSITIVE_INFINITY);
            const matchesCategory = selectedCategory === null || site.category === selectedCategory;
            const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => siteTags.includes(tag));

            return matchesCategory && matchesTags;
        });
    }, [selectedCategory, selectedTags]);

    const visibleSites = filteredSites.slice(0, visibleCount);
    const hasActiveFilters = Boolean(selectedCategory) || selectedTags.length > 0;
    const activeSite = activeSiteSlug ? getSiteBySlug(activeSiteSlug) : null;

    useEffect(() => {
        const updateNavPinned = () => {
            const sentinel = navSentinelRef.current;

            if (!sentinel) return;

            setIsNavPinned(sentinel.getBoundingClientRect().top <= 0);
        };

        updateNavPinned();
        window.addEventListener("scroll", updateNavPinned, { passive: true });
        window.addEventListener("resize", updateNavPinned);

        return () => {
            window.removeEventListener("scroll", updateNavPinned);
            window.removeEventListener("resize", updateNavPinned);
        };
    }, []);

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
            <section className={styles.heroBlock} aria-labelledby="library-title">
                <div className={styles.heroBooks} aria-hidden="true">
                    <LibraryBook
                        items={HERO_BOOK_ITEMS[0]}
                        className={styles.heroBookLeft}
                        animateOnMount={false}
                    />
                    <LibraryBook items={HERO_BOOK_ITEMS[1]} className={styles.heroBookRight} isOpen={false} />
                </div>
                <div className={styles.heroBlockText}>
                    <div className={styles.titleRow}>
                        <h1 id="library-title" className={styles.title}>
                            <motion.span
                                className={styles.logoMark}
                                aria-hidden="true"
                                initial={REVEAL_INITIAL}
                                animate={REVEAL_VISIBLE}
                                transition={{
                                    ...REVEAL_TRANSITION,
                                    delay: HERO_WORD_DELAY,
                                }}
                            >
                                <BookmarkLogo className={styles.logoImage} />
                            </motion.span>
                            {HERO_TITLE_WORDS.map((word, index) => (
                                <Fragment key={`${word.label}-${index}`}>
                                    <motion.span
                                        className={`${styles.titleWord} ${word.isSubtext ? styles.titleSubtext : ""}`}
                                        initial={REVEAL_INITIAL}
                                        animate={REVEAL_VISIBLE}
                                        transition={{
                                            ...REVEAL_TRANSITION,
                                            delay: HERO_WORD_DELAY + (index + 1) * HERO_WORD_STAGGER,
                                        }}
                                    >
                                        {word.label}
                                    </motion.span>
                                    {index < HERO_TITLE_WORDS.length - 1 ? " " : null}
                                </Fragment>
                            ))}
                        </h1>
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

            <div ref={navSentinelRef} className={styles.navSentinel} aria-hidden="true" />
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
                <span
                    className={`${styles.navLogoMark} ${isNavPinned ? styles.navLogoVisible : ""}`}
                    aria-hidden="true"
                >
                    <BookmarkLogo className={styles.navLogoImage} />
                </span>
                <div className={styles.navBarScroller}>
                    <div className={styles.navBarTrack}>
                        <motion.button
                            type="button"
                            className={`${styles.filterOption} ${styles.allOption} ${!hasActiveFilters ? styles.filterOptionSelected : ""}`}
                            onClick={clearFilters}
                            aria-pressed={!hasActiveFilters}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={HOVER_SPRING}
                        >
                            <span>Все</span>
                        </motion.button>

                        {siteCategories.map((category) => {
                            return (
                                <motion.button
                                    type="button"
                                    className={`${styles.filterOption} ${styles.typeOption} ${selectedCategory === category ? styles.filterOptionSelected : ""}`}
                                    key={category}
                                    onClick={() => selectCategory(category)}
                                    aria-pressed={selectedCategory === category}
                                    whileTap={{ scale: 0.95 }}
                                    transition={HOVER_SPRING}
                                >
                                    <span>{category}</span>
                                </motion.button>
                            );
                        })}

                        {siteSpecializations.length ? (
                            <span className={styles.trackDivider} aria-hidden="true" />
                        ) : null}

                        {siteSpecializations.map((tag) => {
                            const meta = getTagMeta(tag);
                            const iconPath = getTagIconPath(meta.icon);
                            const isSelected = selectedTags.includes(tag);

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
                                    <span className={styles.optionIcon} aria-hidden="true">
                                        {iconPath ? (
                                            <Image src={iconPath} alt="" width={22} height={22} />
                                        ) : (
                                            <span className={styles.defaultTagIcon} />
                                        )}
                                    </span>
                                    <span>{meta.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
                {isNavPinned ? (
                    <span className={styles.navPinnedFade} aria-hidden="true" />
                ) : null}
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

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
const FILTER_ICON_PATH = `/filter.svg?v=${ASSET_VERSION}`;
const GRAPH_ICON_PATH = `/graph.svg?v=${ASSET_VERSION}`;

function ShelfIcon() {
    return (
        <span className={styles.shelfIcon} aria-hidden="true">
            <span className={styles.shelfLineTop} />
            <span className={styles.shelfLineBottom} />
            <span className={styles.shelfBracketTop} />
            <span className={styles.shelfBracketBottom} />
        </span>
    );
}

function BookmarkIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 35 55" fill="none">
            <path d="M0 52.6577V2C0 0.895431 0.89543 0 2 0H33C34.1046 0 35 0.895432 35 2V52.6577C35 54.5068 32.706 55.3656 31.4917 53.9711L19.0083 39.6352C18.2111 38.7197 16.7889 38.7197 15.9917 39.6352L3.5083 53.9711C2.294 55.3656 0 54.5068 0 52.6577Z" fill="currentColor" />
        </svg>
    );
}

function ViewTabs({ viewMode, onChange, className = "" }) {
    return (
        <div
            className={`${styles.viewTabs} ${viewMode === "graph" ? styles.viewTabsGraph : ""} ${className}`.trim()}
            role="group"
            aria-label="Режим отображения"
        >
            <button
                type="button"
                className={styles.viewTab}
                onClick={() => onChange("gallery")}
                aria-pressed={viewMode === "gallery"}
            >
                <ShelfIcon />
                <span>Полки</span>
            </button>
            <button
                type="button"
                className={styles.viewTab}
                onClick={() => onChange("graph")}
                aria-pressed={viewMode === "graph"}
            >
                <Image
                    className={styles.viewTabIcon}
                    src={GRAPH_ICON_PATH}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                />
                <span>Граф</span>
            </button>
        </div>
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

export default function HomePage() {
    const categoryGroupRef = useRef(null);
    const categoryButtonRefs = useRef([]);
    const modalCategoryButtonRefs = useRef([]);
    const tagScrollerRef = useRef(null);
    const sentinelRef = useRef(null);
    const homeUrlRef = useRef("/");
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [activeSiteSlug, setActiveSiteSlug] = useState(null);
    const [viewMode, setViewMode] = useState("gallery");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [draftCategory, setDraftCategory] = useState(null);
    const [draftTags, setDraftTags] = useState([]);
    const [tagScrollEdges, setTagScrollEdges] = useState({
        hasHiddenLeft: false,
        hasHiddenRight: false,
    });
    const [categoryIndicatorStyle, setCategoryIndicatorStyle] = useState({
        "--category-indicator-left": "3px",
        "--category-indicator-width": "0px",
    });
    const [modalCategoryIndicatorStyle, setModalCategoryIndicatorStyle] = useState({
        "--modal-category-indicator-left": "4px",
        "--modal-category-indicator-width": "0px",
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
    const draftFiltersChanged = draftCategory !== selectedCategory
        || draftTags.length !== selectedTags.length
        || draftTags.some((tag) => !selectedTags.includes(tag));
    const hasDraftFilters = draftCategory !== null || draftTags.length > 0;
    const draftCategoryIndex = Math.max(
        0,
        categoryOptions.findIndex((option) => option.value === draftCategory)
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

    useLayoutEffect(() => {
        if (!isFilterModalOpen) return undefined;

        const updateModalCategoryIndicator = () => {
            const activeButton = modalCategoryButtonRefs.current[draftCategoryIndex];

            if (!activeButton) return;

            setModalCategoryIndicatorStyle({
                "--modal-category-indicator-left": `${activeButton.offsetLeft}px`,
                "--modal-category-indicator-width": `${activeButton.offsetWidth}px`,
            });
        };

        updateModalCategoryIndicator();
        window.addEventListener("resize", updateModalCategoryIndicator);

        return () => window.removeEventListener("resize", updateModalCategoryIndicator);
    }, [draftCategoryIndex, isFilterModalOpen]);

    useEffect(() => {
        const scroller = tagScrollerRef.current;

        if (!scroller) return undefined;

        const updateTagScrollEdges = () => {
            const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            const hasHiddenLeft = scroller.scrollLeft > 1;
            const hasHiddenRight = maxScrollLeft - scroller.scrollLeft > 1;

            setTagScrollEdges((current) => {
                if (
                    current.hasHiddenLeft === hasHiddenLeft
                    && current.hasHiddenRight === hasHiddenRight
                ) {
                    return current;
                }

                return { hasHiddenLeft, hasHiddenRight };
            });
        };

        updateTagScrollEdges();
        scroller.addEventListener("scroll", updateTagScrollEdges, { passive: true });
        window.addEventListener("resize", updateTagScrollEdges);

        const resizeObserver = new ResizeObserver(updateTagScrollEdges);
        resizeObserver.observe(scroller);

        return () => {
            scroller.removeEventListener("scroll", updateTagScrollEdges);
            window.removeEventListener("resize", updateTagScrollEdges);
            resizeObserver.disconnect();
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
        document.documentElement.classList.toggle("graph-view-active", viewMode === "graph");

        return () => document.documentElement.classList.remove("graph-view-active");
    }, [viewMode]);

    useEffect(() => {
        if (!isFilterModalOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setIsFilterModalOpen(false);
        };

        document.body.classList.add("filter-modal-open");
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.classList.remove("filter-modal-open");
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFilterModalOpen]);

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

    const openFilterModal = () => {
        setDraftCategory(selectedCategory);
        setDraftTags(selectedTags);
        setIsFilterModalOpen(true);
    };

    const toggleDraftTag = (tag) => {
        setDraftTags((currentTags) => (
            currentTags.includes(tag)
                ? currentTags.filter((item) => item !== tag)
                : [...currentTags, tag]
        ));
    };

    const clearDraftFilters = () => {
        setDraftCategory(null);
        setDraftTags([]);
    };

    const applyDraftFilters = () => {
        if (!draftFiltersChanged) return;

        resetVisibleCount();
        setSelectedCategory(draftCategory);
        setSelectedTags(draftTags);
        setIsFilterModalOpen(false);
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
        <main className={`${styles.page} ${viewMode === "graph" ? styles.pageGraph : ""}`}>
            <CanvasLogo />
            <ViewTabs
                viewMode={viewMode}
                onChange={setViewMode}
                className={styles.desktopViewTabs}
            />
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
                <div
                    ref={tagScrollerRef}
                    className={`${styles.tagScroller} ${tagScrollEdges.hasHiddenLeft ? styles.tagScrollerHasHiddenLeft : ""} ${tagScrollEdges.hasHiddenRight ? styles.tagScrollerHasHiddenRight : ""}`}
                >
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

            <div className={styles.mobileControls}>
                <button
                    type="button"
                    className={styles.mobileFilterButton}
                    onClick={openFilterModal}
                    aria-label="Открыть фильтры"
                    aria-haspopup="dialog"
                    aria-expanded={isFilterModalOpen}
                >
                    <Image
                        src={FILTER_ICON_PATH}
                        alt=""
                        width={22}
                        height={22}
                        unoptimized
                    />
                </button>
                <ViewTabs
                    viewMode={viewMode}
                    onChange={setViewMode}
                    className={styles.mobileViewTabs}
                />
            </div>

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
                <FullSiteItem
                    site={activeSite}
                    mode="modal"
                    onClose={closeSite}
                    onRelatedSiteOpen={openSite}
                />
            ) : null}

            {isFilterModalOpen ? (
                <div
                    className={styles.filterModalBackdrop}
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsFilterModalOpen(false);
                    }}
                >
                    <section
                        className={styles.filterModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="filter-modal-title"
                    >
                        <header className={styles.filterModalHeader}>
                            <span className={styles.filterModalBookmark}>
                                <BookmarkIcon />
                            </span>
                            <h2 id="filter-modal-title">Фильтры</h2>
                            <button
                                type="button"
                                className={styles.filterModalClose}
                                onClick={() => setIsFilterModalOpen(false)}
                                aria-label="Закрыть фильтры"
                            />
                        </header>

                        <div className={styles.filterModalSection}>
                            <h3>Категории</h3>
                            <div
                                className={styles.modalCategoryGroup}
                                style={modalCategoryIndicatorStyle}
                            >
                                {categoryOptions.map((option, index) => {
                                    const isSelected = draftCategory === option.value;

                                    return (
                                        <button
                                            type="button"
                                            key={option.label}
                                            className={styles.modalCategoryOption}
                                            ref={(node) => {
                                                modalCategoryButtonRefs.current[index] = node;
                                            }}
                                            onClick={() => setDraftCategory(option.value)}
                                            aria-pressed={isSelected}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.filterModalSection}>
                            <h3>Теги</h3>
                            <div className={styles.modalTagList}>
                                {siteSpecializations.map((tag) => {
                                    const meta = getTagMeta(tag);
                                    const iconPath = getTagIconPath(meta.icon);
                                    const isSelected = draftTags.includes(tag);

                                    return (
                                        <button
                                            type="button"
                                            className={`${styles.modalTag} ${isSelected ? styles.modalTagSelected : ""}`}
                                            key={tag}
                                            data-tag-tone={meta.tone}
                                            onClick={() => toggleDraftTag(tag)}
                                            aria-pressed={isSelected}
                                        >
                                            {iconPath ? (
                                                <Image
                                                    className={styles.modalTagIcon}
                                                    src={iconPath}
                                                    alt=""
                                                    width={18}
                                                    height={18}
                                                    unoptimized
                                                />
                                            ) : null}
                                            <span>{meta.label}</span>
                                            <Image
                                                className={styles.modalTagToggle}
                                                src={isSelected ? MINUS_ICON_PATH : PLUS_ICON_PATH}
                                                alt=""
                                                width={20}
                                                height={20}
                                                unoptimized
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.filterModalActions}>
                            <SecondaryButton
                                as="button"
                                disabled={!hasDraftFilters}
                                onClick={clearDraftFilters}
                            >
                                Удалить
                            </SecondaryButton>
                            <PrimaryButton
                                as="button"
                                disabled={!draftFiltersChanged}
                                onClick={applyDraftFilters}
                            >
                                Применить
                            </PrimaryButton>
                        </div>
                    </section>
                </div>
            ) : null}
        </main>
    );
}

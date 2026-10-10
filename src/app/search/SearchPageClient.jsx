"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import CanvasLogo from "@/components/CanvasLogo/CanvasLogo";
import SiteItem from "@/components/SiteItem/SiteItem";
import { usePageTransition } from "@/components/PageTransition/PageTransition";
import { browsableSites } from "@/lib/siteData";

import shelfStyles from "../page.module.css";
import styles from "./search.module.css";

const PAGE_SIZE = 30;
const uniqueSites = browsableSites.filter((site, index, sites) => (
    sites.findIndex((candidate) => candidate.slug === site.slug) === index
));
const designerNames = [...new Set(
    uniqueSites
        .filter((site) => site.category === "Дизайнер")
        .map((site) => site.title.trim())
        .filter(Boolean)
)];

function normalize(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("ru");
}

export default function SearchPageClient() {
    const navigateWithTransition = usePageTransition();
    const [query, setQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
    const [isInputFocused, setIsInputFocused] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") navigateWithTransition("/");
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigateWithTransition]);

    useEffect(() => {
        if (query.trim() || isInputFocused || !designerNames.length) return undefined;

        let timer;
        let cancelled = false;
        let previousName = "";

        const beginCycle = () => {
            if (cancelled) return;

            const candidates = designerNames.filter((name) => name !== previousName);
            const name = candidates[Math.floor(Math.random() * candidates.length)] || designerNames[0];
            previousName = name;
            let position = 0;

            const eraseNext = () => {
                if (cancelled) return;
                position -= 1;
                setAnimatedPlaceholder(name.slice(0, position));
                if (position > 0) timer = window.setTimeout(eraseNext, 26);
                else timer = window.setTimeout(beginCycle, 420);
            };

            const typeNext = () => {
                if (cancelled) return;
                position += 1;
                setAnimatedPlaceholder(name.slice(0, position));
                if (position < name.length) timer = window.setTimeout(typeNext, 48);
                else timer = window.setTimeout(eraseNext, 2200);
            };

            typeNext();
        };

        timer = window.setTimeout(beginCycle, 500);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [isInputFocused, query]);

    const matchingSites = useMemo(() => {
        const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
        if (!terms.length) return [];

        return uniqueSites.filter((site) => {
            const searchable = normalize([
                site.title,
                site.subtitle,
                site.category,
                site.slug,
                ...(site.specialization || []),
            ].join(" "));
            return terms.every((term) => searchable.includes(term));
        });
    }, [query]);

    return (
        <main className={styles.page}>
            <CanvasLogo />
            <h1 className={`${shelfStyles.title} ${styles.searchTitle}`}>Поиск по главной</h1>
            <section className={styles.searchHero} aria-label="Поиск сайтов">
                <div className={styles.searchControls}>
                    <div className={styles.searchField}>
                        <Image src="/search.svg" alt="" width={22} height={22} unoptimized />
                        <div className={styles.inputWrap}>
                            {!query && !isInputFocused ? (
                                <span className={styles.animatedPlaceholder} aria-hidden="true">
                                    {animatedPlaceholder}
                                    <span className={styles.caret} />
                                </span>
                            ) : null}
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setAnimatedPlaceholder("");
                                    setVisibleCount(PAGE_SIZE);
                                }}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                aria-label="Поиск по сайтам"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={() => navigateWithTransition("/")}
                        aria-label="Закрыть поиск"
                        title="Закрыть поиск"
                    />
                </div>
            </section>

            {!query.trim() ? (
                <section className={`${shelfStyles.sitesGrid} ${styles.emptyShelves}`} aria-label="Пустые полки">
                    <div className={shelfStyles.shelfBeam} data-transition-shelf="true" aria-hidden="true" />
                </section>
            ) : matchingSites.length ? (
                <>
                    <section className={shelfStyles.sitesGrid} aria-label="Результаты поиска">
                        <div className={shelfStyles.shelfBeam} data-transition-shelf="true" aria-hidden="true" />
                        {matchingSites.slice(0, visibleCount).map((site) => (
                            <SiteItem key={site.slug} site={site} />
                        ))}
                    </section>
                    {query.trim() && visibleCount < matchingSites.length ? (
                        <button
                            className={styles.moreButton}
                            type="button"
                            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        >
                            Показать ещё
                        </button>
                    ) : null}
                </>
            ) : query.trim() ? (
                <>
                    <section className={shelfStyles.sitesGrid} aria-hidden="true">
                        <div className={shelfStyles.shelfBeam} data-transition-shelf="true" />
                    </section>
                    <div className={styles.emptyState} role="status">
                        <span className={styles.emptyFace} aria-hidden="true">:-(</span>
                        <p>По этому запросу ничего не найдено.</p>
                        <span>Попробуйте другое имя, студию или специализацию.</span>
                    </div>
                </>
            ) : null}
        </main>
    );
}

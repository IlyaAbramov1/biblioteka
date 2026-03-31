"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import NavPanel from "@/components/NavPanel/NavPanel";
import PageTransitionSurface from "@/components/RouteTransition/PageTransitionSurface";
import SiteItem from "@/components/SiteItem/SiteItem";
import {
    buildHomeHref,
    getStoredHomeState,
    getHomeStateKey,
    persistHomeState,
} from "@/lib/homeState";
import {
    browsableSites,
    filterSitesBySelection,
    siteCategories,
    siteSpecializations,
} from "@/lib/siteData";

const BATCH_SIZE = 20;

export default function HomePageClient() {
    const sentinelRef = useRef(null);
    const didRestoreFromStorage = useRef(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [pendingRestore, setPendingRestore] = useState(null);
    const searchParamsString = searchParams.toString();
    const homeHref = useMemo(
        () => buildHomeHref(pathname, searchParamsString),
        [pathname, searchParamsString]
    );
    const homeStateKey = useMemo(
        () => getHomeStateKey(homeHref),
        [homeHref]
    );
    const selectedCategory = searchParams.get("category") || null;
    const selectedSpecializations = useMemo(
        () => [...new Set(searchParams.getAll("tag").map((value) => value.trim()).filter(Boolean))],
        [searchParams]
    );

    const filteredSites = useMemo(() => {
        return filterSitesBySelection(browsableSites, {
            category: selectedCategory,
            tags: selectedSpecializations,
        });
    }, [selectedCategory, selectedSpecializations]);

    useEffect(() => {
        if (didRestoreFromStorage.current) return;

        didRestoreFromStorage.current = true;

        const savedState = getStoredHomeState(homeStateKey, BATCH_SIZE);

        if (!savedState) return;

        const frameId = window.requestAnimationFrame(() => {
            setVisibleCount(savedState.visibleCount);
            setPendingRestore({
                scrollY: savedState.scrollY,
                visibleCount: savedState.visibleCount,
            });
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [homeStateKey]);

    useEffect(() => {
        if (!pendingRestore || visibleCount < pendingRestore.visibleCount) return undefined;

        let secondFrameId = null;
        const firstFrameId = window.requestAnimationFrame(() => {
            secondFrameId = window.requestAnimationFrame(() => {
                window.scrollTo(0, pendingRestore.scrollY);
                setPendingRestore(null);
            });
        });

        return () => {
            window.cancelAnimationFrame(firstFrameId);
            if (secondFrameId !== null) {
                window.cancelAnimationFrame(secondFrameId);
            }
        };
    }, [pendingRestore, visibleCount]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const persistState = () => {
            persistHomeState(homeStateKey, visibleCount);
        };

        persistState();
        window.addEventListener("scroll", persistState, { passive: true });

        return () => {
            persistState();
            window.removeEventListener("scroll", persistState);
        };
    }, [homeStateKey, visibleCount]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                setVisibleCount((count) =>
                    Math.min(count + BATCH_SIZE, filteredSites.length)
                );
            },
            { root: null, rootMargin: "100px 0px" }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [filteredSites.length]);

    const updateFiltersInUrl = ({
        category = selectedCategory,
        tags = selectedSpecializations,
    }) => {
        const nextSearchParams = new URLSearchParams();

        if (category) {
            nextSearchParams.set("category", category);
        }

        tags.forEach((tag) => {
            nextSearchParams.append("tag", tag);
        });

        const nextSearch = nextSearchParams.toString();
        const nextHref = buildHomeHref(pathname, nextSearch);

        router.replace(nextHref, { scroll: false });
    };

    const selectCategory = (category) => {
        setVisibleCount(BATCH_SIZE);
        updateFiltersInUrl({
            category: selectedCategory === category ? null : category,
        });
    };

    const toggleSpecialization = (specialization) => {
        setVisibleCount(BATCH_SIZE);
        updateFiltersInUrl({
            tags: selectedSpecializations.includes(specialization)
                ? selectedSpecializations.filter((item) => item !== specialization)
                : [...selectedSpecializations, specialization],
        });
    };

    return (
        <div className="mainContainer">
            <div className="sidebarColumn">
                <NavPanel
                    categories={siteCategories}
                    specializations={siteSpecializations}
                    selectedCategory={selectedCategory}
                    selectedSpecializations={selectedSpecializations}
                    onSelectCategory={selectCategory}
                    onToggleSpecialization={toggleSpecialization}
                />
            </div>
            <PageTransitionSurface as="section" className="gridContainer">
                {filteredSites.slice(0, visibleCount).map((site, index) => (
                    <SiteItem
                        key={`${site.slug}-${index}`}
                        site={site}
                        homeHref={homeHref}
                        visibleCount={visibleCount}
                    />
                ))}
                <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
            </PageTransitionSurface>
        </div>
    );
}

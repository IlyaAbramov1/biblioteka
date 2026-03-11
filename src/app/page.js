"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import sites from "@/data/sites.json";
import NavPanel from "@/components/NavPanel/NavPanel";
import PageTransitionSurface from "@/components/RouteTransition/PageTransitionSurface";
import SiteItem from "@/components/SiteItem/SiteItem";

const CATEGORY_ORDER = ["Дизайнер", "Дизайн-студия", "Креативная студия"];

export default function Home() {
    const BATCH_SIZE = 20;
    const sentinelRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);

    const baseSites = useMemo(
        () => sites.filter((site) => site.slug && site.enabled !== false),
        []
    );

    const categories = useMemo(
        () => {
            const uniqueCategories = [...new Set(baseSites.map((site) => site.category).filter(Boolean))];

            return uniqueCategories.sort((left, right) => {
                const leftIndex = CATEGORY_ORDER.indexOf(left);
                const rightIndex = CATEGORY_ORDER.indexOf(right);

                if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
                if (leftIndex === -1) return 1;
                if (rightIndex === -1) return -1;

                return leftIndex - rightIndex;
            });
        },
        [baseSites]
    );

    const specializations = useMemo(() => {
        const all = baseSites.flatMap((site) => {
            const specs = Array.isArray(site.specialization)
                ? site.specialization
                : String(site.specialization || "").split(",");

            return specs.map((spec) => String(spec).trim()).filter(Boolean);
        });

        return [...new Set(all)];
    }, [baseSites]);

    const filteredSites = useMemo(() => {
        return baseSites.filter((site) => {
            const byCategory =
                selectedCategory === null || site.category === selectedCategory;

            const specs = Array.isArray(site.specialization)
                ? site.specialization
                : String(site.specialization || "").split(",").map((spec) => spec.trim());
            const bySpecialization =
                selectedSpecializations.length === 0 ||
                selectedSpecializations.every((selected) => specs.includes(selected));

            return byCategory && bySpecialization;
        });
    }, [baseSites, selectedCategory, selectedSpecializations]);

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

    const selectCategory = (category) => {
        setVisibleCount(BATCH_SIZE);
        setSelectedCategory((prev) => (prev === category ? null : category));
    };

    const toggleSpecialization = (specialization) => {
        setVisibleCount(BATCH_SIZE);
        setSelectedSpecializations((prev) =>
            prev.includes(specialization)
                ? prev.filter((item) => item !== specialization)
                : [...prev, specialization]
        );
    };

    const clearFilters = () => {
        setVisibleCount(BATCH_SIZE);
        setSelectedCategory(null);
        setSelectedSpecializations([]);
    };

    return (
        <div className="mainContainer">
            <NavPanel
                categories={categories}
                specializations={specializations}
                selectedCategory={selectedCategory}
                selectedSpecializations={selectedSpecializations}
                onSelectCategory={selectCategory}
                onToggleSpecialization={toggleSpecialization}
                onClear={clearFilters}
                showInfo
            />
            <PageTransitionSurface as="section" className="gridContainer">
                {filteredSites.slice(0, visibleCount).map((site, index) => (
                    <SiteItem key={`${site.slug}-${index}`} site={site} />
                ))}
                <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
            </PageTransitionSurface>
        </div>
    );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import sites from "@/data/sites.json";
import SiteItem from "@/components/SiteItem/SiteItem";
import SiteFilters from "@/components/SiteFilters/SiteFilters";

export default function Home() {
    const BATCH_SIZE = 20;
    const containerRef = useRef(null);
    const sentinelRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);

    const baseSites = useMemo(
        () => sites.filter((site) => site.slug && site.enabled !== false),
        []
    );

    const categories = useMemo(
        () => [...new Set(baseSites.map((site) => site.category).filter(Boolean))],
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
                selectedCategories.length === 0 || selectedCategories.includes(site.category);

            const specs = Array.isArray(site.specialization)
                ? site.specialization
                : String(site.specialization || "").split(",").map((spec) => spec.trim());
            const bySpecialization =
                selectedSpecializations.length === 0 ||
                selectedSpecializations.some((selected) => specs.includes(selected));

            return byCategory && bySpecialization;
        });
    }, [baseSites, selectedCategories, selectedSpecializations]);

    useEffect(() => {
        setVisibleCount(Math.min(BATCH_SIZE, filteredSites.length));
    }, [filteredSites.length]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        const container = containerRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                setVisibleCount((count) =>
                    Math.min(count + BATCH_SIZE, filteredSites.length)
                );
            },
            { root: container, rootMargin: "100px 0px" }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [filteredSites.length]);

    const toggleCategory = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((item) => item !== category)
                : [...prev, category]
        );
    };

    const toggleSpecialization = (specialization) => {
        setSelectedSpecializations((prev) =>
            prev.includes(specialization)
                ? prev.filter((item) => item !== specialization)
                : [...prev, specialization]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSpecializations([]);
    };

    return (
        <>
            <SiteFilters
                categories={categories}
                specializations={specializations}
                selectedCategories={selectedCategories}
                selectedSpecializations={selectedSpecializations}
                onToggleCategory={toggleCategory}
                onToggleSpecialization={toggleSpecialization}
                onClear={clearFilters}
            />

            <section ref={containerRef} className="gridContainer">
                {filteredSites.slice(0, visibleCount).map((site, index) => (
                    <SiteItem key={`${site.slug}-${index}`} site={site} />
                ))}
                <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
            </section>
        </>
    );
}

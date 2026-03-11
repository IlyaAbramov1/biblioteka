"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const RouteTransitionContext = createContext(null);

function parseDuration(value, fallback = 320) {
    const normalized = String(value || "").trim();

    if (!normalized) return fallback;
    if (normalized.endsWith("ms")) return Number.parseFloat(normalized);
    if (normalized.endsWith("s")) return Number.parseFloat(normalized) * 1000;

    const numeric = Number.parseFloat(normalized);

    return Number.isFinite(numeric) ? numeric : fallback;
}

function readTransitionDuration() {
    if (typeof window === "undefined") return 320;

    return parseDuration(
        window.getComputedStyle(document.documentElement)
            .getPropertyValue("--page-transition-duration"),
        320
    );
}

export function RouteTransitionProvider({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [stage, setStage] = useState("idle");
    const previousPathname = useRef(pathname);
    const navigationTimer = useRef(null);
    const resetTimer = useRef(null);
    const isNavigating = useRef(false);

    useEffect(() => {
        return () => {
            window.clearTimeout(navigationTimer.current);
            window.clearTimeout(resetTimer.current);
        };
    }, []);

    useEffect(() => {
        if (pathname === previousPathname.current) return;

        previousPathname.current = pathname;

        isNavigating.current = false;

        const frameId = window.requestAnimationFrame(() => {
            setStage("entering");
            window.clearTimeout(resetTimer.current);
            resetTimer.current = window.setTimeout(() => {
                setStage("idle");
            }, readTransitionDuration());
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [pathname]);

    const value = useMemo(() => ({
        stage,
        navigate(nextHref, options = {}) {
            const href = String(nextHref || "");

            if (!href || href === pathname || isNavigating.current) return;

            isNavigating.current = true;
            setStage("exiting");

            window.clearTimeout(navigationTimer.current);
            navigationTimer.current = window.setTimeout(() => {
                if (options.replace) {
                    router.replace(href);
                    return;
                }

                router.push(href);
            }, readTransitionDuration());
        },
    }), [pathname, router, stage]);

    return (
        <RouteTransitionContext.Provider value={value}>
            {children}
        </RouteTransitionContext.Provider>
    );
}

export function useRouteTransition() {
    const context = useContext(RouteTransitionContext);

    if (!context) {
        throw new Error("useRouteTransition must be used within RouteTransitionProvider");
    }

    return context;
}

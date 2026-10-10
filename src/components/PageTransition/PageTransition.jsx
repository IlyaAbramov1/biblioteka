"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const PageTransitionContext = createContext(null);

function normalizePathname(pathname) {
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
}

export function PageTransitionProvider({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const pendingNavigation = useRef(null);
    const navigationInProgress = useRef(false);

    useEffect(() => {
        document.documentElement.classList.remove("route-transitioning");
        const pending = pendingNavigation.current;
        if (pending && normalizePathname(pathname) === normalizePathname(pending.pathname)) {
            pendingNavigation.current = null;
            navigationInProgress.current = false;
            pending.resolve();
        }
    }, [pathname]);

    const navigate = useCallback((href) => {
        const target = new URL(href, window.location.href);
        const targetPath = `${target.pathname}${target.search}${target.hash}`;
        const samePath = normalizePathname(target.pathname) === normalizePathname(window.location.pathname);
        const sameQuery = target.search === window.location.search && target.hash === window.location.hash;

        if ((samePath && sameQuery) || navigationInProgress.current) return;

        const startTransition = document.startViewTransition?.bind(document);
        if (!startTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            router.push(targetPath);
            return;
        }

        navigationInProgress.current = true;
        document.documentElement.classList.add("route-transitioning");

        // Let the exit animation reach the screen before the view transition freezes it.
        window.setTimeout(() => {
            startTransition(() => new Promise((resolve) => {
                const timeout = window.setTimeout(() => {
                    if (pendingNavigation.current?.resolve === finish) {
                        pendingNavigation.current = null;
                        navigationInProgress.current = false;
                        document.documentElement.classList.remove("route-transitioning");
                        finish();
                    }
                }, 1800);

                function finish() {
                    window.clearTimeout(timeout);
                    resolve();
                }

                pendingNavigation.current = { pathname: target.pathname, resolve: finish };
                router.push(targetPath);
            }));
        }, 140);
    }, [router]);

    return (
        <PageTransitionContext.Provider value={navigate}>
            {children}
        </PageTransitionContext.Provider>
    );
}

export function usePageTransition() {
    const navigate = useContext(PageTransitionContext);
    if (!navigate) throw new Error("usePageTransition must be used inside PageTransitionProvider");
    return navigate;
}

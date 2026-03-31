const HOME_STATE_STORAGE_PREFIX = "home-state:";

function normalizeVisibleCount(visibleCount, fallbackVisibleCount) {
    return Number.isFinite(visibleCount)
        ? Math.max(fallbackVisibleCount, visibleCount)
        : fallbackVisibleCount;
}

function normalizeScrollY(scrollY) {
    return Number.isFinite(scrollY) ? scrollY : 0;
}

export function buildHomeHref(pathname, searchParamsString) {
    if (!searchParamsString) return pathname;

    return `${pathname}?${searchParamsString}`;
}

export function getHomeStateKey(homeHref) {
    return `${HOME_STATE_STORAGE_PREFIX}${homeHref}`;
}

export function readHomeState(storageKey) {
    if (typeof window === "undefined") return null;

    try {
        const rawValue = window.sessionStorage.getItem(storageKey);

        return rawValue ? JSON.parse(rawValue) : null;
    } catch {
        return null;
    }
}

export function writeHomeState(storageKey, nextState) {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(storageKey, JSON.stringify(nextState));
}

export function getStoredHomeState(storageKey, fallbackVisibleCount) {
    const savedState = readHomeState(storageKey);

    if (!savedState) return null;

    return {
        visibleCount: normalizeVisibleCount(savedState.visibleCount, fallbackVisibleCount),
        scrollY: normalizeScrollY(savedState.scrollY),
    };
}

export function createHomeStateSnapshot(visibleCount) {
    if (typeof window === "undefined") {
        return {
            scrollY: 0,
            visibleCount,
        };
    }

    return {
        scrollY: window.scrollY,
        visibleCount,
    };
}

export function persistHomeState(storageKey, visibleCount) {
    writeHomeState(storageKey, createHomeStateSnapshot(visibleCount));
}

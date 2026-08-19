"use client";

import { useLayoutEffect, useRef, useState } from "react";

export default function AccentText({ children, className = "" }) {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [lineRects, setLineRects] = useState([]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const text = textRef.current;

        if (!container || !text) return undefined;

        let isMounted = true;

        const measure = () => {
            if (!isMounted) return;

            const containerRect = container.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(text);

            const nextRects = Array.from(range.getClientRects())
                .filter((rect) => rect.width > 0 && rect.height > 0)
                .map((rect) => ({
                    left: rect.left - containerRect.left,
                    top: rect.top - containerRect.top,
                    width: rect.width,
                    height: rect.height,
                }));

            range.detach?.();
            setLineRects(nextRects);
        };

        measure();

        const resizeObserver = typeof ResizeObserver === "undefined"
            ? null
            : new ResizeObserver(measure);

        resizeObserver?.observe(container);
        window.addEventListener("resize", measure);
        document.fonts?.ready?.then(measure);

        return () => {
            isMounted = false;
            resizeObserver?.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [children]);

    return (
        <span ref={containerRef} className={`titleAccentText ${className}`.trim()}>
            <span ref={textRef} className="titleAccentContent">{children}</span>
            {lineRects.map((rect, index) => (
                <span
                    aria-hidden="true"
                    className="titleAccentLine"
                    key={`${rect.left}-${rect.top}-${rect.width}-${index}`}
                    style={{
                        left: `${rect.left}px`,
                        top: `${rect.top}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                    }}
                />
            ))}
        </span>
    );
}

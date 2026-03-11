"use client";

import Link from "next/link";

import { useRouteTransition } from "./RouteTransitionProvider";

function isPlainLeftClick(event) {
    return (
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
    );
}

export default function TransitionLink({
    href,
    onClick,
    replace = false,
    target,
    children,
    ...props
}) {
    const { navigate } = useRouteTransition();

    const handleClick = (event) => {
        onClick?.(event);

        if (
            event.defaultPrevented ||
            !isPlainLeftClick(event) ||
            target === "_blank"
        ) {
            return;
        }

        event.preventDefault();
        navigate(href, { replace });
    };

    return (
        <Link href={href} onClick={handleClick} replace={replace} target={target} {...props}>
            {children}
        </Link>
    );
}

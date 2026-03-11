"use client";

import { useRouteTransition } from "./RouteTransitionProvider";

export default function PageTransitionSurface({
    as = "div",
    children,
    className = "",
}) {
    const { stage } = useRouteTransition();
    const Component = as;
    const classes = ["pageTransitionSurface", className].filter(Boolean).join(" ");

    return (
        <Component className={classes} data-transition-stage={stage}>
            {children}
        </Component>
    );
}

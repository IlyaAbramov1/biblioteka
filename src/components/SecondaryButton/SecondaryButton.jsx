"use client";

import { motion } from "framer-motion";

import { HOVER_SPRING } from "@/lib/motion";

import styles from "./SecondaryButton.module.css";

export default function SecondaryButton({
    href,
    icon = null,
    children,
    as = "a",
    external = true,
    disabled = false,
    ...props
}) {
    const MotionComponent = as === "button" ? motion.button : motion.a;

    return (
        <MotionComponent
            href={as === "a" && !disabled ? href : undefined}
            type={as === "button" ? "button" : undefined}
            className={`${styles.linkContainer} ${icon ? styles.withIcon : ""}`}
            target={as === "a" && external && !disabled ? "_blank" : undefined}
            rel={as === "a" && external && !disabled ? "noreferrer" : undefined}
            disabled={as === "button" ? disabled : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={as === "a" && disabled ? -1 : undefined}
            whileHover={disabled ? undefined : { y: -2 }}
            whileTap={disabled ? undefined : { scale: 0.99 }}
            transition={HOVER_SPRING}
            {...props}
        >
            {icon ? (
                <span className={styles.iconContainer} aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            {children}
        </MotionComponent>
    );
}

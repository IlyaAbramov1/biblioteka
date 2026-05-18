"use client";

import { motion } from "framer-motion";

import { HOVER_SPRING } from "@/lib/motion";

import styles from "./PrimaryButton.module.css";

export default function PrimaryButton({
    href,
    icon = null,
    children,
    external = true,
    ...props
}) {
    const className = [
        styles.linkContainer,
        icon ? styles.withIcon : styles.withoutIcon,
    ].join(" ");

    return (
        <motion.a
            href={href}
            className={className}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={HOVER_SPRING}
            {...props}
        >
            {icon ? (
                <span className={styles.iconContainer} aria-hidden="true">
                    {icon}
                </span>
            ) : null}
            {children}
        </motion.a>
    );
}

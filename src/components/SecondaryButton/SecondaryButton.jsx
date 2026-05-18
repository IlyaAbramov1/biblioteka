"use client";

import { motion } from "framer-motion";

import { HOVER_SPRING } from "@/lib/motion";

import styles from "./SecondaryButton.module.css";

export default function SecondaryButton({
    href,
    children,
    as = "a",
    external = true,
    ...props
}) {
    const MotionComponent = as === "button" ? motion.button : motion.a;

    return (
        <MotionComponent
            href={href}
            type={as === "button" ? "button" : undefined}
            className={styles.linkContainer}
            target={as === "a" && external ? "_blank" : undefined}
            rel={as === "a" && external ? "noreferrer" : undefined}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={HOVER_SPRING}
            {...props}
        >
            {children}
        </MotionComponent>
    );
}

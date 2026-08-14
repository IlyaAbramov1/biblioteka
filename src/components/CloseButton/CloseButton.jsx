"use client";

import { motion } from "framer-motion";

import { HOVER_SPRING } from "@/lib/motion";

import styles from "./CloseButton.module.css";

export default function CloseButton({ className = "", ...props }) {
    return (
        <motion.button
            type="button"
            className={`${styles.button} ${className}`.trim()}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={HOVER_SPRING}
            {...props}
        />
    );
}

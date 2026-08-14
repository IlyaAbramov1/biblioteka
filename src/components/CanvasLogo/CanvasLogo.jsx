"use client";

import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

import styles from "./CanvasLogo.module.css";

const LOGO_COLORS = [
    "hsl(212 100% 50%)",
    "hsl(276 100% 50%)",
    "hsl(171 100% 28%)",
    "hsl(325 100% 50%)",
    "hsl(359 100% 53%)",
    "hsl(221 100% 50%)",
    "hsl(20 100% 50%)",
    "hsl(200 100% 31%)",
    "hsl(303 100% 50%)",
    "hsl(250 100% 38%)",
    "hsl(172 100% 31%)",
];

function updateViewportVars() {
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const top = viewport ? viewport.offsetTop : 0;

    document.documentElement.style.setProperty("--vvh", `${height}px`);
    document.documentElement.style.setProperty("--vvt", `${top}px`);
}

export default function CanvasLogo() {
    const controls = useAnimationControls();

    useEffect(() => {
        updateViewportVars();

        window.visualViewport?.addEventListener("resize", updateViewportVars);
        window.visualViewport?.addEventListener("scroll", updateViewportVars);
        window.addEventListener("resize", updateViewportVars);
        window.addEventListener("orientationchange", updateViewportVars);

        return () => {
            window.visualViewport?.removeEventListener("resize", updateViewportVars);
            window.visualViewport?.removeEventListener("scroll", updateViewportVars);
            window.removeEventListener("resize", updateViewportVars);
            window.removeEventListener("orientationchange", updateViewportVars);
        };
    }, []);

    const handleLogoClick = () => {
        const nextColor = LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];

        controls.start({
            y: [0, 14, -4, 0],
            color: nextColor,
            transition: {
                y: {
                    duration: 0.2,
                    ease: [0.34, 1.56, 0.64, 1],
                    times: [0, 0.42, 0.72, 1],
                },
                color: {
                    duration: 0.16,
                    ease: "easeOut",
                },
            },
        });
    };

    return (
        <span className={styles.logo}>
            <motion.button
                type="button"
                className={styles.logoButton}
                initial={{ color: LOGO_COLORS[0], y: 0 }}
                animate={controls}
                onClick={handleLogoClick}
                aria-label="Сменить цвет логотипа"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="35"
                    height="55"
                    viewBox="0 0 35 55"
                    fill="none"
                >
                    <path
                        d="M0 52.6577V2C0 0.895431 0.89543 0 2 0H33C34.1046 0 35 0.895432 35 2V52.6577C35 54.5068 32.706 55.3656 31.4917 53.9711L19.0083 39.6352C18.2111 38.7197 16.7889 38.7197 15.9917 39.6352L3.5083 53.9711C2.294 55.3656 0 54.5068 0 52.6577Z"
                        fill="currentColor"
                    />
                </svg>
            </motion.button>
        </span>
    );
}

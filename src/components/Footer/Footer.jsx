"use client";

import { usePathname } from "next/navigation";

import styles from "./Footer.module.css";

import { publishedSiteCount } from "@/lib/siteData";

export default function Footer() {
    const pathname = usePathname();

    if (/(?:^|\/)site\/[^/]+\/?$/.test(pathname || "")) return null;

    return (
        <footer className={styles.footer}>
            <p>Количество сайтов: <span className={styles.siteCounter}>{publishedSiteCount}</span></p>
            <p>Designed and Developed by Ilya Abramov. August 2026</p>
        </footer>
    );
}

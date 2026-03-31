import styles from "./Footer.module.css";

import { publishedSiteCount } from "@/lib/siteData";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <p>Количество сайтов: <span className={styles.siteCounter}>{publishedSiteCount}</span></p>
            <p className={styles.footerDesc}>
                Designed and developed by{" "}
                <a href="https://abramovdesign.com/" target="_blank" className={styles.footerLink}>
                    Ilya Abramov
                </a>
                . March 2026
            </p>
        </footer>
    );
}

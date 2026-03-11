import styles from "./Footer.module.css";

import sites from "@/data/sites.json";

export default function Footer() {
    const siteCounter = sites.filter((site) => site.enabled).length;

    return (
        <footer className={styles.footer}>
            <p>Количество сайтов: <span className={styles.siteCounter}>{siteCounter}</span></p>
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

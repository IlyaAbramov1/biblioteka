import styles from "./Footer.module.css";

import { publishedSiteCount } from "@/lib/siteData";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <p>Количество сайтов: <span className={styles.siteCounter}>{publishedSiteCount}</span>. Designed and Developed by Ilya Abramov. May 2026</p>
        </footer>
    );
}

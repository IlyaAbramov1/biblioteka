import styles from "./Footer.module.css";

import { publishedSiteCount } from "@/lib/siteData";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <p>Количество сайтов: <span className={styles.siteCounter}>{publishedSiteCount}</span></p>
            <p>Designed and Developed by Ilya Abramov. June 2026</p>
        </footer>
    );
}

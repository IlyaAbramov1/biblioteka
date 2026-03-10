import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <p className={styles.footerDesc}>
                Designed and developed by{" "}
                <a href="https://abramovdesign.com/" target="_blank" className="link">
                    Ilya Abramov
                </a>
                . February 2026
            </p>
            <p>В Библиотеке вы можете разместить свой сайт. Для этого <a href="http://t.me/abramovdesiqn" target="_blank" className="link">напишите библиотекарю ↗</a>.</p>
        </footer>
    );
}

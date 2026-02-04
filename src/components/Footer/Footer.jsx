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
        </footer>
    );
}

import Image from "next/image"
import Link from "next/link";
import styles from "./NavPanel.module.css"

import sites from "@/data/sites.json";

export default function NavPanel() {
    const siteCounter = sites.length;

    return (
        <div className={styles.navPanel}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <Link href="/">
                        <Image
                            src="/main-logo.svg"
                            alt="Main logo"
                            width={120}
                            height={120}
                            className={styles.headerLogo}
                            priority
                        />
                    </Link>
                    <p className={styles.headerTitle}>Библиотека</p>
                    <p>Каталог дизайнеров и студий. Нажмите на карточку, чтобы открыть кейс.</p>
                    <p>Количество сайтов: <span className={styles.siteCounter}>{siteCounter}</span></p>
                </div>
            </header>
            <footer className={styles.footer}>
                <div className={styles.themeToogle}>
                </div>
                <p className={styles.footerDesc}>Designed and developed <br /> by <a href="https://abramovdesign.com/" target="_blank" className="link">Ilya Abramov</a>. February 2026</p>
            </footer>
        </div>
    )
}

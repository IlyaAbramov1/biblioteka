"use client";

import Image from "next/image"
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavPanel.module.css"
import Footer from "@/components/Footer/Footer";

import sites from "@/data/sites.json";

export default function NavPanel() {
    const siteCounter = sites.filter((site) => site.enabled).length;
    const pathname = usePathname();
    const isHomePage = pathname === "/";

    return (
        <div className={styles.navPanel}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <div className={styles.headerLogoAndTitle}>
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
                    </div>
                    {isHomePage ? (
                        <>
                            <p>Курируемая коллекция сайтов дизайнеров и студий. Ведь самое красивое, что делает дизайнер, он делает для себя.</p>
                            <p>Количество сайтов: <span className={styles.siteCounter}>{siteCounter}</span></p>
                            <p>В Библиотеке вы можете разместить свой сайт. Просто <a href="http://t.me/abramovdesiqn" target="_blank" className="link">напишите библиотекарю ↗</a>.</p>
                        </>
                    ) : null}
                </div>
            </header>
            <Footer />
        </div>
    )
}

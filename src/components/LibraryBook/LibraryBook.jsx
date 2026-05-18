"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
    animate,
    motion,
    useMotionValue,
    useTransform,
} from "framer-motion";

import styles from "./LibraryBook.module.css";

const PAGE_EASE = [0.22, 1, 0.36, 1];

const COVER_TRANSITION = {
    duration: 1.95,
    ease: [0.22, 1, 0.36, 1],
};

function BookPage({ item, index, isOpen, animateOnMount }) {
    const pageRotation = -(item.targetAngle ?? (158 - index * 34));
    const frontZIndex = 100 + index;
    const fillZIndex = frontZIndex - 1;
    const pageOpenProgress = useMotionValue(isOpen && !animateOnMount ? 1 : 0);

    useEffect(() => {
        const controls = animate(pageOpenProgress, isOpen ? 1 : 0, {
            duration: 1.15,
            ease: PAGE_EASE,
            delay: isOpen ? item.delay : 0,
        });

        return () => controls.stop();
    }, [isOpen, item.delay, pageOpenProgress]);

    const rotateY = useTransform(pageOpenProgress, (progress) => progress * pageRotation);

    return (
        <>
            <motion.span
                className={`${styles.pageLayer} ${styles.pageFillLayer}`}
                style={{ zIndex: fillZIndex, rotateY }}
            />
            <motion.span
                className={`${styles.pageLayer} ${styles.pageFrontLayer}`}
                style={{ zIndex: frontZIndex, rotateY }}
            >
                <span className={styles.pageContent}>
                    <span className={styles.pageMedia}>
                        <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="144px"
                            className={styles.pageImage}
                            unoptimized
                        />
                    </span>
                    <span className={styles.pageMeta}>
                        <span className={styles.pageTitle}>{item.title}</span>
                        <span className={styles.pageSubtitle}>{item.subtitle}</span>
                        <span className={styles.pageUrl}>{item.url}</span>
                    </span>
                </span>
            </motion.span>
        </>
    );
}

export default function LibraryBook({
    items,
    className = "",
    isOpen = true,
    animateOnMount = true,
}) {
    const coverProgress = useMotionValue(isOpen && !animateOnMount ? 1 : 0);
    const coverRotateY = useTransform(coverProgress, [0, 1], [0, -180]);
    const coverFillRotateY = useTransform(coverProgress, [0, 1], [0, -172]);
    const coverZIndex = useTransform(coverProgress, (value) => (value > 0.62 ? 1 : 9999));
    const coverFillZIndex = useTransform(coverProgress, (value) => (value > 0.62 ? 2 : 9998));

    useEffect(() => {
        const controls = animate(coverProgress, isOpen ? 1 : 0, {
            duration: COVER_TRANSITION.duration,
            ease: COVER_TRANSITION.ease,
        });

        return () => controls.stop();
    }, [coverProgress, isOpen]);

    const sceneClassName = [styles.bookScene, className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={sceneClassName}>
            <motion.div
                className={styles.bookShell}
                animate={{
                    // x: isOpen ? 60 : 0,
                    // y: isOpen ? -12 : 0,
                    rotateZ: isOpen ? -1 : 0,
                }}
                transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <div className={styles.book} aria-hidden="true">
                    <span className={styles.backCoverLayer} />
                    <span className={styles.backCoverPageLayer} />
                    <span className={styles.basePageLayer} />
                    <span className={styles.coverPlaceholderLayer} />
                    <span className={styles.coverPageLayer} />
                    <motion.span
                        className={styles.coverFillLayerShell}
                        initial={false}
                        style={{ rotateY: coverFillRotateY, zIndex: coverFillZIndex }}
                    >
                        <span className={styles.coverFillLayer} />
                    </motion.span>
                    <motion.span
                        className={styles.coverLayer}
                        initial={false}
                        style={{ rotateY: coverRotateY, zIndex: coverZIndex }}
                    >
                        <span className={styles.coverContent}>
                            <span className={styles.coverTitle}>Дизайн-библиотека</span>
                            <span className={styles.coverEdition}>Изд. 2026</span>
                        </span>
                    </motion.span>
                    {items.map((item, index) => (
                        <BookPage
                            key={item.id}
                            item={item}
                            index={index}
                            isOpen={isOpen}
                            animateOnMount={animateOnMount}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

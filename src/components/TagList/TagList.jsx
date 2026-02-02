import { getTagMeta, getSiteTags } from "@/lib/siteTags";

import styles from "./TagList.module.css";

function TagIcon({ name }) {
    switch (name) {
        case "layers":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="6" rx="2" />
                    <rect x="3" y="14" width="18" height="6" rx="2" />
                </svg>
            );
        case "chat":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6h16v9H7l-3 3V6z" />
                </svg>
            );
        case "target":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 4v16M4 12h16" />
                </svg>
            );
        case "code":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m8 7-4 5 4 5M16 7l4 5-4 5M14 5l-4 14" />
                </svg>
            );
        case "spark":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l2.3 5.7L20 10l-5.7 2.3L12 18l-2.3-5.7L4 10l5.7-2.3L12 2z" />
                </svg>
            );
        case "pen":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5zM13 7.5l3.5 3.5" />
                </svg>
            );
        case "cube":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4zM4 7l8 4 8-4M12 11v10" />
                </svg>
            );
        case "palette":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 0-4.6H12a2 2 0 0 1 0-4h4a5 5 0 0 0 0-10h-4z" />
                </svg>
            );
        case "gamepad":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 10h10a4 4 0 0 1 3.8 5.1l-1 3A3 3 0 0 1 17 20a3 3 0 0 1-2.1-.9L12 16.2l-2.9 2.9A3 3 0 0 1 7 20a3 3 0 0 1-2.8-1.9l-1-3A4 4 0 0 1 7 10zm-1 3h2v2h2v-2h2v-2h-2V9H8v2H6v2zm10-1h2v2h-2v-2z" />
                </svg>
            );
        case "type":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6h16M10 6v12M14 6v12M7 18h10" />
                </svg>
            );
        case "chip":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="7" y="7" width="10" height="10" rx="1.5" />
                    <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 7h14v10H5z" />
                </svg>
            );
    }
}

export default function TagList({ specialization, limit = 3, className = "" }) {
    const tags = getSiteTags(specialization, limit);

    return (
        <div className={`${styles.tagList} ${className}`}>
            {tags.map((tag) => {
                const meta = getTagMeta(tag);

                return (
                    <span
                        className={`${styles.tag} ${styles[`tagTone_${meta.tone}`] || styles.tagTone_default}`}
                        key={tag}
                    >
                        <span className={styles.icon}>
                            <TagIcon name={meta.icon} />
                        </span>
                        <span className={styles.label}>{meta.label}</span>
                    </span>
                );
            })}
        </div>
    );
}

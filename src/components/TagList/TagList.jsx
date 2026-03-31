import { getTagIconPath, getTagMeta, getSiteTags } from "@/lib/siteTags";

import styles from "./TagList.module.css";

function TagIcon({ name }) {
    const iconPath = getTagIconPath(name);

    if (iconPath) {
        return (
            <img src={iconPath} alt="" />
        );
    }

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14v10H5z" />
        </svg>
    );
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

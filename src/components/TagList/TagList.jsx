import { getTagMeta, getSiteTags } from "@/lib/siteTags";

import styles from "./TagList.module.css";

function TagIcon({ name }) {
    switch (name) {
    case "fullstack":
        return (
            <img src="/tag-icons/fullstack-design.svg" alt="" />
        );
    case "engineering":
        return (
            <img src="/tag-icons/design-engineer.svg" alt="" />
        );
    case "branding":
        return (
            <img src="/tag-icons/branding.svg" alt="" />
        );
    case "web":
        return (
            <img src="/tag-icons/web.svg" alt="" />
        );
    case "motion":
        return (
            <img src="/tag-icons/motion.svg" alt="" />
        );
    case "art":
        return (
            <img src="/tag-icons/art.svg" alt="" />
        );
    case "product":
        return (
            <img src="/tag-icons/product.svg" alt="" />
        );
    case "threeD":
        return (
            <img src="/tag-icons/3d.svg" alt="" />
        );
    case "illustration":
        return (
            <img src="/tag-icons/illustration.svg" alt="" />
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

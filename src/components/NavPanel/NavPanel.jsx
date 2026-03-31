"use client";

import Image from "next/image";
import Link from "next/link";

import { useRouteTransition } from "@/components/RouteTransition/RouteTransitionProvider";
import { getTagIconPath, getTagMeta } from "@/lib/siteTags";

import styles from "./NavPanel.module.css";

const CATEGORY_META = {
    "Дизайнер": {
        label: "Дизайнер",
        icon: CategoryDesignerIcon,
    },
    "Дизайн-студия": {
        label: "Дизайн-студия",
        icon: CategoryStudioIcon,
    },
    "Креативная студия": {
        label: "Креативная студия",
        icon: CategoryCreativeIcon,
    },
};

function CategoryDesignerIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="none" />
            <path
                d="M5 19a7 7 0 0 1 14 0"
                fill="none"
                strokeLinecap="round"
            />
            <circle cx="12" cy="8" r="4" fill="none" />
        </svg>
    );
}

function CategoryStudioIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20V6l8-2 8 2v14Z" fill="none" />
            <path d="M9 10h2m-2 4h2m4-4h2m-2 4h2" strokeLinecap="round" />
            <path d="M11 20v-3h2v3" fill="none" />
        </svg>
    );
}

function CategoryCreativeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 4 1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z" fill="none" />
            <path d="M18 4v3m1.5-1.5h-3M5 16v2m1-1H4" strokeLinecap="round" />
        </svg>
    );
}

function DefaultTagIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14v10H5Z" fill="none" />
            <path d="M8 10h8M8 14h5" strokeLinecap="round" />
        </svg>
    );
}

function TagVisual({ icon }) {
    const iconPath = getTagIconPath(icon);

    return iconPath
        ? <Image src={iconPath} alt="" width={18} height={18} />
        : <DefaultTagIcon />;
}

function CategoryOption({ category, isSelected, onSelect, index }) {
    const meta = CATEGORY_META[category] || {
        label: category,
        icon: CategoryStudioIcon,
    };
    const Icon = meta.icon;

    return (
        <button
            type="button"
            className={`${styles.filterOption} ${styles.typeOption} ${isSelected ? styles.filterOptionSelected : ""}`}
            onClick={() => onSelect(category)}
            role="radio"
            aria-checked={isSelected}
            style={{ "--filter-index": index }}
        >
            <span className={styles.optionIcon}>
                <Icon />
            </span>
            <span>{meta.label}</span>
        </button>
    );
}

function TagOption({ tag, isSelected, onToggle, index }) {
    const meta = getTagMeta(tag);
    const stateIconSrc = isSelected ? "/checkmark.svg" : "/plus.svg";
    const stateIconAlt = isSelected ? "Выбран" : "Добавить";

    return (
        <button
            type="button"
            className={`${styles.filterOption} ${styles.tagOption} ${styles[`tagTone_${meta.tone}`] || styles.tagTone_default} ${isSelected ? styles.filterOptionSelected : ""} ${isSelected ? styles.tagOptionSelected : ""}`}
            onClick={() => onToggle(tag)}
            aria-pressed={isSelected}
            style={{ "--filter-index": index }}
        >
            <span className={styles.tagStateIcon}>
                <Image src={stateIconSrc} alt={stateIconAlt} width={24} height={24}/>
            </span>
            <span>{meta.label}</span>
            <span className={styles.optionIcon}>
                <TagVisual icon={meta.icon} />
            </span>
        </button>
    );
}

export default function NavPanel({
    categories = [],
    specializations = [],
    selectedCategory = null,
    selectedSpecializations = [],
    onSelectCategory = () => {},
    onToggleSpecialization = () => {},
    homeHref = "/",
}) {
    const showFilters = categories.length > 0 || specializations.length > 0;
    const { stage } = useRouteTransition();

    return (
        <aside className={styles.navPanel} data-transition-stage={stage}>
            <div className={styles.navPanelBody}>
                <header className={styles.header}>
                    <div className={styles.headerInfo}>
                        <Link href={homeHref} className={styles.headerLogo}>
                            <Image
                                src="/main-logo-v2.svg"
                                alt="Библиотека"
                                width={120}
                                height={120}
                                className={styles.headerLogoImage}
                                priority
                            />
                        </Link>
                        <p className={styles.headerTitle}>Дизайн-библиотека</p>
                        <p className={styles.headerSubtitle}>Курируемая коллекция сайтов дизайнер и студий. Библиотекарь — <a href="https://t.me/abramovdesiqn" className={styles.authorLink} target="_blank">Илья Абрамов</a>. Ваш сайт тоже может стать частью библиотеки. Просто напишите мне :)</p>
                    </div>
                </header>

                {showFilters ? (
                    <section className={styles.filtersPanel}>
                        {categories.length ? (
                            <div className={styles.filterSection}>
                                <div className={styles.filtersTitle}>Кто?</div>
                                <div className={styles.optionGroup} role="radiogroup" aria-label="Тип сайта">
                                    {categories.map((category, index) => (
                                        <CategoryOption
                                            key={category}
                                            category={category}
                                            isSelected={selectedCategory === category}
                                            index={index}
                                            onSelect={onSelectCategory}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {specializations.length ? (
                            <div className={styles.filterSection}>
                                <div className={styles.filtersTitle}>Специализация?</div>
                                <div className={styles.optionGroup}>
                                    {specializations.map((tag, index) => (
                                        <TagOption
                                            key={tag}
                                            tag={tag}
                                            isSelected={selectedSpecializations.includes(tag)}
                                            index={index}
                                            onToggle={onToggleSpecialization}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </section>
                ) : null}
            </div>
        </aside>
    );
}

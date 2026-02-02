"use client";

import { useState } from "react";

import styles from "./SiteFilters.module.css";

export default function SiteFilters({
    categories,
    specializations,
    selectedCategories,
    selectedSpecializations,
    onToggleCategory,
    onToggleSpecialization,
    onClear,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedCount = selectedCategories.length + selectedSpecializations.length;

    return (
        <div className={styles.filterRoot}>
            <button
                className={styles.filterButton}
                onClick={() => setIsOpen((open) => !open)}
                type="button"
            >
                Фильтр{selectedCount ? ` (${selectedCount})` : ""}
            </button>

            {isOpen ? (
                <div className={styles.filterPanel}>
                    <div className={styles.filterHeader}>
                        <div className={styles.filterTitle}>Категория</div>
                        <button className={styles.clearButton} type="button" onClick={onClear}>
                            Сбросить
                        </button>
                    </div>

                    <div className={styles.group}>
                        {categories.map((category) => (
                            <label key={category} className={styles.option}>
                                <input
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => onToggleCategory(category)}
                                    type="checkbox"
                                />
                                <span>{category}</span>
                            </label>
                        ))}
                    </div>

                    <div className={styles.filterTitle}>Специализация</div>
                    <div className={styles.group}>
                        {specializations.map((specialization) => (
                            <label key={specialization} className={styles.option}>
                                <input
                                    checked={selectedSpecializations.includes(specialization)}
                                    onChange={() => onToggleSpecialization(specialization)}
                                    type="checkbox"
                                />
                                <span>{specialization}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

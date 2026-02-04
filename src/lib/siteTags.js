export const TAG_BANK = {
    "fullstack design": { tone: "fullstack", icon: "fullstack" },
    "design engineer": { tone: "engineering", icon: "engineering" },
    "branding": { tone: "branding", icon: "branding" },
    "web": { tone: "web", icon: "web" },
    motion: { tone: "motion", icon: "motion" },
    "motion design": { tone: "motion", icon: "motion" },
    "illustration": { tone: "illustration", icon: "illustration" },
    "art": { tone: "art", icon: "art" },
    product: { tone: "product", icon: "product" },
    "product design": { tone: "product", icon: "product" },
    "3d in web": { tone: "threeD", icon: "threeD" },
    "3d": { tone: "threeD", icon: "threeD" },
    "gaming": { tone: "gaming", icon: "gamepad" },
    "fonts": { tone: "fonts", icon: "type" },
    "it": { tone: "engineering", icon: "chip" },
};

export const normalizeTag = (tag) => String(tag || "").trim().toLowerCase();

export const getSiteTags = (specialization, limit = 3) => {
    const rawTags = Array.isArray(specialization)
        ? specialization
        : String(specialization || "").split(",");

    return rawTags
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, limit);
};

export const getTagMeta = (tag) => {
    const normalized = normalizeTag(tag);
    const fromBank = TAG_BANK[normalized] || {};

    return {
        label: String(tag || ""),
        tone: fromBank.tone || "default",
        icon: fromBank.icon || "default",
    };
};

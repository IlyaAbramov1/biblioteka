export const TAG_BANK = {
    "design engineer": { tone: "engineering", icon: "engineering" },
    "branding": { tone: "branding", icon: "branding" },
    "web": { tone: "web", icon: "web" },
    motion: { tone: "motion", icon: "motion" },
    "motion design": { tone: "motion", icon: "motion" },
    "illustration": { tone: "illustration", icon: "illustration" },
    "art": { tone: "art", icon: "art" },
    product: { tone: "product", icon: "product" },
    "product design": { tone: "product", icon: "product" },
    cgi: { tone: "cgi", icon: "cgi" },
    "3d in web": { tone: "threeD", icon: "threeD" },
    "3d": { tone: "cgi", icon: "cgi" },
    "gaming": { tone: "gaming", icon: "gamepad" },
    "fonts": { tone: "fonts", icon: "type" },
    "it": { tone: "engineering", icon: "chip" },
};

export const TAG_ICON_PATHS = {
    engineering: "/tag-icons/design-engineer.svg",
    branding: "/tag-icons/branding.svg",
    web: "/tag-icons/web.svg",
    motion: "/tag-icons/motion.svg",
    art: "/tag-icons/art.svg",
    product: "/tag-icons/product.svg",
    threeD: "/tag-icons/3d.svg",
    cgi: "/tag-icons/cgi.svg",
    illustration: "/tag-icons/illustration.svg",
};

export const normalizeTag = (tag) => String(tag || "").trim().toLowerCase();

export const splitSiteSpecializations = (specialization) => {
    const rawTags = Array.isArray(specialization)
        ? specialization
        : String(specialization || "").split(",");

    return rawTags
        .map((tag) => String(tag).trim())
        .filter(Boolean);
};

export const getSiteTags = (specialization, limit = 3) => {
    const tags = splitSiteSpecializations(specialization);

    return Number.isFinite(limit)
        ? tags.slice(0, limit)
        : tags;
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

export const getTagIconPath = (icon) => TAG_ICON_PATHS[icon] || null;

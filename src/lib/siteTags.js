export const TAG_BANK = {
    "fullstack design": { tone: "fullstack", icon: "layers" },
    "communication design": { tone: "communication", icon: "chat" },
    "product design": { tone: "product", icon: "target" },
    "design engineer": { tone: "engineering", icon: "code" },
    "motion design": { tone: "motion", icon: "spark" },
    "illustration": { tone: "illustration", icon: "pen" },
    "3d in web": { tone: "threeD", icon: "cube" },
    "3d": { tone: "threeD", icon: "cube" },
    "art": { tone: "art", icon: "palette" },
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

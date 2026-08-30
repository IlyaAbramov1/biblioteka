const SITE_MEDALS = {
    "alex-ezhov": { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
    chester: { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
    "esh-gruppa": { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
    reboot: { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
    oddworks: { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
    pentagram: { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
    dfy: { alt: "Медаль Tomat", src: "/tomat-medal-flat.svg" },
};

export function getSiteMedal(site) {
    return SITE_MEDALS[site.slug] || null;
}

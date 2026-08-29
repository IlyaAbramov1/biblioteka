const SITE_MEDALS = {
    "alex-ezhov": { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
    chester: { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
    "esh-gruppa": { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
    reboot: { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
    oddworks: { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
    pentagram: { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
    dfy: { alt: "Медаль Tomat", src: "/tomat-medal.svg" },
};

export function getSiteMedal(site) {
    return SITE_MEDALS[site.slug] || null;
}

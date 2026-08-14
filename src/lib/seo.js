export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://design-biblioteka.ru").replace(/\/$/, "");
export const SITE_NAME = "Дизайн-библиотека";
export const DEFAULT_TITLE = SITE_NAME;
export const DEFAULT_DESCRIPTION = "Дизайн-библиотека. Курируемая коллекция сайтов дизайнер и студий.";
export const DEFAULT_SOCIAL_IMAGE = "/og.webp?v=20260814";
export const DEFAULT_SOCIAL_IMAGE_ALT = "Дизайн-библиотека — каталог сайтов дизайнеров и дизайн-студий";
export const DEFAULT_KEYWORDS = [
    "дизайн библиотека",
    "сайты дизайнеров",
    "сайты дизайн-студий",
    "каталог сайтов дизайнеров",
    "каталог дизайн студий",
    "branding",
    "web design",
    "product design",
    "motion design",
    "design engineering",
    "креативные студии",
];
export const SITE_CLASSIFICATION = "Каталог сайтов дизайнеров и дизайн-студий";
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const SITE_STRUCTURED_DATA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            description: DEFAULT_DESCRIPTION,
            inLanguage: "ru-RU",
        },
        {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/#collection-page`,
            url: `${SITE_URL}/`,
            name: DEFAULT_TITLE,
            description: DEFAULT_DESCRIPTION,
            isPartOf: {
                "@id": `${SITE_URL}/#website`,
            },
            about: [
                "дизайн",
                "веб-дизайн",
                "брендинг",
                "product design",
                "motion design",
                "design engineering",
            ],
            inLanguage: "ru-RU",
        },
    ],
};

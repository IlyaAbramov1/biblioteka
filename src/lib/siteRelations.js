const CURATED_RELATIONS = [
    ["xchyler", "hex", "Работа Xchyler Drenth в HEX"],
    ["evil-martians", "redis-agency", "Иллюстрации Redis Agency для Evil Martians"],
    ["koji", "redis-agency", "KOJI основана экс-CEO Redis"],
    ["alex-vanderzon", "benji-taylor", "Los Feliz Engineering / Family"],
    ["axon", "benji-taylor", "Совместная работа над Aave, Family и Honk"],
    ["wojtek-witkowski", "benji-taylor", "Коллеги в Coinbase / Base"],
    ["raphael-salaja", "benji-taylor", "Совместная работа в Avara"],
    ["jake-down-smith", "benji-taylor", "Jake создавал сайт Benji Taylor"],
    ["jake-down-smith", "andrew-trousdale", "Jake создавал сайт Andrew Trousdale"],
    ["jake-down-smith", "alex-vanderzon", "Работа над сайтом Los Feliz Engineering"],
    ["alex-vanderzon", "axon", "Совместная работа над Family в Los Feliz Engineering"],
    ["martin-azambuja", "porto-rocha", "Дизайн-директор PORTO ROCHA"],
    ["martin-azambuja", "pentagram", "Работа в Pentagram"],
    ["oledzka", "porto-rocha", "Работа в Porto Rocha"],
    ["oledzka", "mouthwash", "Работа в Mouthwash"],
    ["oledzka", "martin-azambuja", "Совместные проекты в PORTO ROCHA"],
    ["aliszu", "after", "Фаундер After"],
    ["aliszu", "baked-design", "Ко-фаундер Baked Design"],
    ["abramov-ilya", "sirena", "Работа в Сирене / Спортсе"],
    ["abramov-ilya", "tomat", "Ранее работал дизайнером в Tomat и создал логотип студии"],
    ["rabbit", "rauno", "Команда Vercel"],
    ["william-le", "brain-cho", "Google и Apple"],
    ["william-le", "june-lee", "Команда Apple"],
    ["brain-cho", "june-lee", "Команда Apple"],
    ["petrick", "intuition", "Сайт Petrick сделан Интуицией"],
    ["charles-shin", "kowalski", "Использование библиотеки Vaul Эмиля"],
];

const DESCRIPTION_MENTIONS = {
    xchyler: [
        ["hex.inc", "hex"],
    ],
    "evil-martians": [
        ["Redis Agency", "redis-agency"],
    ],
    "alex-vanderzon": [
        ["Бенджи Тейлором", "benji-taylor"],
    ],
    axon: [
        ["Бенджи Тейлора", "benji-taylor"],
    ],
    "wojtek-witkowski": [
        ["Benji Taylor", "benji-taylor"],
    ],
    "raphael-salaja": [
        ["Benji Tailor", "benji-taylor"],
    ],
    "jake-down-smith": [
        ["Andrew Trousdale", "andrew-trousdale"],
        ["Benji Taylor", "benji-taylor"],
    ],
    "martin-azambuja": [
        ["PORTO ROCHA", "porto-rocha"],
        ["Pentagram", "pentagram"],
    ],
    oledzka: [
        ["Mouthwash", "mouthwash"],
        ["Porto Rocha", "porto-rocha"],
    ],
    aliszu: [
        ["after", "after"],
        ["baked design", "baked-design"],
    ],
    "charles-shin": [
        ["Emil Kowalski", "kowalski"],
    ],
    petrick: [
        ["Интуиция", "intuition"],
    ],
    intuition: [
        ["Петрик", "petrick"],
    ],
    "abramov-ilya": [
        ["Сирене", "sirena"],
        ["Tomat", "tomat"],
    ],
    after: [
        ["based design", "base-design"],
    ],
};

export function getSiteRelations(sites) {
    const availableSlugs = new Set(sites.map((site) => site.slug));

    return CURATED_RELATIONS
        .filter(([source, target]) => availableSlugs.has(source) && availableSlugs.has(target))
        .map(([source, target, label]) => ({ source, target, label }));
}

export function getDescriptionMentions(site) {
    return (DESCRIPTION_MENTIONS[site.slug] || []).map(([text, slug]) => ({ text, slug }));
}

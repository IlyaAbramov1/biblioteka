const CURATED_RELATIONS = [
    ["evil-martians", "redis-agency", "Иллюстрации Redis Agency для Evil Martians"],
    ["koji", "redis-agency", "KOJI основана экс-CEO Redis"],
    ["alex-vanderzon", "benji-taylor", "Los Feliz Engineering / Family"],
    ["axon", "benji-taylor", "Совместная работа над Aave, Family и Honk"],
    ["wojtek-witkowski", "benji-taylor", "Коллеги в Coinbase / Base"],
    ["raphael-salaja", "benji-taylor", "Совместная работа в Avara"],
    ["jake-down-smith", "benji-taylor", "Jake создавал сайт Benji Taylor"],
    ["jake-down-smith", "andrew-trousdale", "Jake создавал сайт Andrew Trousdale"],
    ["martin-azambuja", "porto-rocha", "Дизайн-директор PORTO ROCHA"],
    ["oledzka", "porto-rocha", "Работа в Porto Rocha"],
    ["oledzka", "mouthwash", "Работа в Mouthwash"],
    ["aliszu", "after", "Фаундер After"],
    ["aliszu", "baked-design", "Ко-фаундер Baked Design"],
    ["abramov-ilya", "sirena", "Работа в Сирене / Спортсе"],
    ["rabbit", "rauno", "Команда Vercel"],
    ["william-le", "brain-cho", "Google и Apple"],
    ["william-le", "june-lee", "Команда Apple"],
    ["brain-cho", "june-lee", "Команда Apple"],
];

export function getSiteRelations(sites) {
    const availableSlugs = new Set(sites.map((site) => site.slug));

    return CURATED_RELATIONS
        .filter(([source, target]) => availableSlugs.has(source) && availableSlugs.has(target))
        .map(([source, target, label]) => ({ source, target, label }));
}

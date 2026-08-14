const DEFAULT_MEDIA_BASE = "https://storage.yandexcloud.net/biblioteka-screens";
const base = process.env.NEXT_PUBLIC_MEDIA_BASE || DEFAULT_MEDIA_BASE;

export function mediaUrl(key) {
    if (!key) return "";

    if (/^https?:\/\//i.test(key)) return key;
    return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

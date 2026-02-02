const base = process.env.NEXT_PUBLIC_MEDIA_BASE || "";

export function mediaUrl(key) {
    if (!key) return "";

    if (/^https?:\/\//i.test(key)) return key;
    return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
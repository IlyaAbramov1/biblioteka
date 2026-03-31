"use client";

import { useSearchParams } from "next/navigation";

import { resolveInternalHref } from "@/lib/navigation";

import FullSiteItem from "./FullSiteItem";

export default function DetailFullSiteItem({ site }) {
    const searchParams = useSearchParams();
    const backHref = resolveInternalHref(searchParams.get("from"));

    return <FullSiteItem site={site} backHref={backHref} />;
}

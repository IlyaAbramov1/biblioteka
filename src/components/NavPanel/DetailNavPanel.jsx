"use client";

import { useSearchParams } from "next/navigation";

import { resolveInternalHref } from "@/lib/navigation";

import NavPanel from "./NavPanel";

export default function DetailNavPanel() {
    const searchParams = useSearchParams();
    const homeHref = resolveInternalHref(searchParams.get("from"));

    return <NavPanel homeHref={homeHref} />;
}

import { Suspense } from "react";

import HomePageClient from "@/components/HomePage/HomePageClient";

export default function HomePage() {
    return (
        <Suspense fallback={null}>
            <HomePageClient />
        </Suspense>
    );
}

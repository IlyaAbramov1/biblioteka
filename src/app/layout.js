import "./globals.css";
import Script from "next/script";
import { Roboto, JetBrains_Mono } from "next/font/google";

import Footer from "@/components/Footer/Footer";
import { RouteTransitionProvider } from "@/components/RouteTransition/RouteTransitionProvider";
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_KEYWORDS,
    DEFAULT_SOCIAL_IMAGE,
    DEFAULT_SOCIAL_IMAGE_ALT,
    DEFAULT_TITLE,
    SITE_CLASSIFICATION,
    SITE_NAME,
    SITE_STRUCTURED_DATA,
    SITE_TITLE_TEMPLATE,
    SITE_URL,
} from "@/lib/seo";

const roboto = Roboto({
    subsets: ['latin', 'cyrillic'],
    display: 'swap',
    variable: '--font-roboto',
})

const jetbrains = JetBrains_Mono({
    subsets: ['latin', 'cyrillic'],
    display: 'swap',
    variable: '--font-jetbrains',
})

export const metadata = {
    metadataBase: new URL(`${SITE_URL}/`),
    applicationName: SITE_NAME,
    icons: {
        icon: "/favicon-v3.png",
    },
    title: {
        default: DEFAULT_TITLE,
        template: SITE_TITLE_TEMPLATE,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    category: "design",
    classification: SITE_CLASSIFICATION,
    authors: [
        {
            name: "Ilya Abramov",
            url: `${SITE_URL}/`,
        },
    ],
    creator: "Ilya Abramov",
    publisher: SITE_NAME,
    formatDetection: {
        telephone: false,
        address: false,
        email: false,
    },
    referrer: "origin-when-cross-origin",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "ru_RU",
        url: `${SITE_URL}/`,
        siteName: SITE_NAME,
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [
            {
                url: DEFAULT_SOCIAL_IMAGE,
                width: 1200,
                height: 630,
                alt: DEFAULT_SOCIAL_IMAGE_ALT,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [DEFAULT_SOCIAL_IMAGE],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="ru" className={`${roboto.variable} ${jetbrains.variable}`}>
            <body>
                <Script id="yandex-metrika" strategy="afterInteractive">
                    {`(function(m,e,t,r,i,k,a){
                        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                        m[i].l=1*new Date();
                        for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
                        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106825853', 'ym');

                    ym(106825853, 'init', {
                        ssr: true,
                        clickmap: true,
                        ecommerce: "dataLayer",
                        referrer: document.referrer,
                        url: location.href,
                        accurateTrackBounce: true,
                        trackLinks: true
                    });`}
                </Script>
                <noscript>
                    <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://mc.yandex.ru/watch/106825853"
                            style={{ position: "absolute", left: "-9999px" }}
                            alt=""
                        />
                    </div>
                </noscript>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_STRUCTURED_DATA) }}
                />
                <RouteTransitionProvider>
                    <div className="strokeContainer">
                        {children}
                        <Footer />
                    </div>
                </RouteTransitionProvider>
            </body>
        </html>
    );
}

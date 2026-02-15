import "./globals.css";
import NavPanel from "@/components/NavPanel/NavPanel";
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://design-biblioteka.ru/";
const DEFAULT_TITLE = "Библиотека";
const DEFAULT_DESCRIPTION = "Курируемая коллекция сайтов дизайнеров и дизайн-студий.";

export const metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: DEFAULT_TITLE,
        template: "%s | Библиотека",
    },
    description: DEFAULT_DESCRIPTION,
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "ru_RU",
        url: "/",
        siteName: "Библиотека",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [
            {
                url: "/og.webp",
                width: 1200,
                height: 630,
                alt: "Библиотека - каталог сайтов дизайнеров и студий",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: ["/og.webp"],
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
        <html lang="ru">
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
                <div className="mainContainer">
                    <NavPanel />
                    {children}
                </div>
            </body>
        </html>
    );
}

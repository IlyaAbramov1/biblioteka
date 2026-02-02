import "./globals.css";
import NavPanel from "@/components/NavPanel/NavPanel";

export const metadata = {
    title: "Библиотека",
    description: "Каталог сайтов дизайнеров и студий",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ru">
            <body>
                <div className="mainContainer">
                    <NavPanel />
                    {children}
                </div>
            </body>
        </html>
    );
}

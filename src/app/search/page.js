import SearchPageClient from "./SearchPageClient";

export const metadata = {
    title: "Поиск по дизайн-библиотеке",
    description: "Поиск сайтов дизайнеров и дизайн-студий в библиотеке.",
    robots: { index: false, follow: true },
};

export default function SearchPage() {
    return <SearchPageClient />;
}

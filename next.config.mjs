/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
    output: "export",
    images: { unoptimized: true },
    basePath: isProd ? "/biblioteka" : "",
    assetPrefix: isProd ? "/biblioteka/" : "",
    trailingSlash: true,
};

export default nextConfig;

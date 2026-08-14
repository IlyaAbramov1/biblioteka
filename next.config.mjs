/** @type {import('next').NextConfig} */
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
    output: "export",
    images: { unoptimized: true },
    basePath: isGitHubPagesBuild ? "/biblioteka" : "",
    assetPrefix: isGitHubPagesBuild ? "/biblioteka/" : "",
    trailingSlash: true,
    turbopack: {
        root: process.cwd(),
    },
};

export default nextConfig;

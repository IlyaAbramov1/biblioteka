"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getSitePreviewImage } from "@/lib/siteData";
import { getSiteRelations } from "@/lib/siteRelations";
import { getSiteTags, getTagIconPath, getTagMeta } from "@/lib/siteTags";

import styles from "./SiteGraph.module.css";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const TAG_COLORS = {
    engineering: "#00c6a9",
    branding: "#ff009f",
    web: "#1900f7",
    motion: "#ff5500",
    illustration: "#ff00f2",
    art: "#ff0e12",
    product: "#0054a9",
    cgi: "#6b55ff",
    threeD: "#009e88",
    gaming: "#00c6a9",
    fonts: "#8c00ff",
    default: "#8599ad",
};

export default function SiteGraph({ sites, onOpen }) {
    const shellRef = useRef(null);
    const graphRef = useRef(null);
    const revealStartRef = useRef(0);
    const [size, setSize] = useState({ width: 960, height: 720 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [pointer, setPointer] = useState({ x: 0, y: 0 });

    const graphData = useMemo(() => {
        const nodes = sites.map((site, index) => {
            const firstTag = getSiteTags(site.specialization, 1)[0];
            const tone = firstTag ? getTagMeta(firstTag).tone : "default";

            return {
                id: site.slug,
                site,
                color: TAG_COLORS[tone] || TAG_COLORS.default,
                revealDelay: Math.min(index * 14, 900),
            };
        });
        const links = getSiteRelations(sites);

        return { nodes, links };
    }, [sites]);

    const neighbourIds = useMemo(() => {
        if (!hoveredNode) return new Set();
        const ids = new Set([hoveredNode.id]);

        graphData.links.forEach((link) => {
            const source = typeof link.source === "object" ? link.source.id : link.source;
            const target = typeof link.target === "object" ? link.target.id : link.target;
            if (source === hoveredNode.id) ids.add(target);
            if (target === hoveredNode.id) ids.add(source);
        });

        return ids;
    }, [graphData.links, hoveredNode]);

    useEffect(() => {
        revealStartRef.current = performance.now();
        const shell = shellRef.current;
        if (!shell) return undefined;

        const observer = new ResizeObserver(([entry]) => {
            setSize({
                width: Math.max(320, entry.contentRect.width),
                height: Math.max(520, entry.contentRect.height),
            });
        });
        observer.observe(shell);

        const fitTimer = window.setTimeout(() => graphRef.current?.zoomToFit(900, 70), 900);
        return () => {
            observer.disconnect();
            window.clearTimeout(fitTimer);
        };
    }, [graphData]);

    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;
        graph.d3Force("charge")?.strength(-105);
        graph.d3Force("link")?.distance(88);
        graph.d3ReheatSimulation();
    }, [graphData]);

    const drawNode = useCallback((node, context, globalScale) => {
        const elapsed = performance.now() - revealStartRef.current - node.revealDelay;
        const progress = Math.max(0, Math.min(1, elapsed / 520));
        const eased = 1 - Math.pow(1 - progress, 3);
        if (eased <= 0) return;

        const isHovered = hoveredNode?.id === node.id;
        const isRelated = !hoveredNode || neighbourIds.has(node.id);
        const name = node.site.title;
        const category = node.site.category;
        const fontSize = 10 / globalScale;
        const categorySize = 7.5 / globalScale;
        const radius = (isHovered ? 7 : 5.5) / globalScale;

        context.save();
        context.globalAlpha = eased * (isRelated ? 1 : 0.18);
        context.translate(node.x, node.y);
        context.scale(eased, eased);
        context.shadowColor = isHovered ? node.color : "rgba(20, 20, 20, 0.16)";
        context.shadowBlur = (isHovered ? 13 : 4) / globalScale;
        context.fillStyle = node.color;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowColor = "transparent";
        context.strokeStyle = "#8599ad";
        context.lineWidth = 1 / globalScale;
        context.stroke();
        context.fillStyle = "#141414";
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.font = `500 ${fontSize}px Roboto, sans-serif`;
        context.fillText(name, 0, -radius - 7 / globalScale);
        context.fillStyle = "#8fa1b2";
        context.font = `500 ${categorySize}px Roboto, sans-serif`;
        context.fillText(category, 0, -radius - 1 / globalScale);
        context.restore();

        node.__paintRadius = Math.max(radius, 10 / globalScale);
    }, [hoveredNode, neighbourIds]);

    const paintPointerArea = useCallback((node, color, context) => {
        const radius = node.__paintRadius || 10;
        context.fillStyle = color;
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fill();
    }, []);

    const hoveredSite = hoveredNode?.site;
    const preview = hoveredSite ? getSitePreviewImage(hoveredSite) : null;
    const tags = hoveredSite ? getSiteTags(hoveredSite.specialization) : [];

    return (
        <section
            ref={shellRef}
            className={styles.shell}
            aria-label="Граф связей дизайнеров и студий"
            onMouseMove={(event) => {
                const rect = shellRef.current?.getBoundingClientRect();
                if (!rect) return;
                setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
            }}
        >
            <ForceGraph2D
                ref={graphRef}
                width={size.width}
                height={size.height}
                graphData={graphData}
                backgroundColor="#fafafa"
                nodeCanvasObject={drawNode}
                nodePointerAreaPaint={paintPointerArea}
                linkColor={(link) => {
                    if (!hoveredNode) return "rgba(133, 153, 173, 0.56)";
                    const source = typeof link.source === "object" ? link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.id : link.target;
                    return source === hoveredNode.id || target === hoveredNode.id
                        ? "rgba(0, 121, 255, 0.72)"
                        : "rgba(133, 153, 173, 0.16)";
                }}
                linkWidth={(link) => {
                    if (!hoveredNode) return 1;
                    const source = typeof link.source === "object" ? link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.id : link.target;
                    return source === hoveredNode.id || target === hoveredNode.id ? 1.8 : 0.4;
                }}
                linkDirectionalParticles={(link) => {
                    if (!hoveredNode) return 0;
                    const source = typeof link.source === "object" ? link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.id : link.target;
                    return source === hoveredNode.id || target === hoveredNode.id ? 2 : 0;
                }}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.004}
                linkLabel="label"
                onNodeHover={(node) => setHoveredNode(node || null)}
                onNodeClick={(node) => onOpen(node.site)}
                onBackgroundClick={() => setHoveredNode(null)}
                enableNodeDrag
                cooldownTicks={180}
                d3VelocityDecay={0.28}
            />

            {hoveredSite ? (
                <div
                    className={styles.previewCard}
                    style={{
                        "--preview-x": `${pointer.x}px`,
                        "--preview-y": `${pointer.y}px`,
                    }}
                >
                    {preview ? (
                        <div className={styles.previewImage}>
                            <Image src={preview} alt="" fill sizes="288px" unoptimized />
                            {hoveredSite.isNew ? <span className={styles.newBadge}>Новое</span> : null}
                        </div>
                    ) : null}
                    <div className={styles.previewContent}>
                        <div className={styles.previewHeading}>
                            <strong>{hoveredSite.title}</strong>
                            <span>{hoveredSite.category}</span>
                        </div>
                        <p>{hoveredSite.subtitle}</p>
                        <div className={styles.previewTags}>
                            {tags.map((tag) => {
                                const meta = getTagMeta(tag);
                                const iconPath = getTagIconPath(meta.icon);
                                return (
                                    <span key={tag} className={styles.previewTag} data-tag-tone={meta.tone}>
                                        {iconPath ? <Image src={iconPath} alt="" width={16} height={16} unoptimized /> : null}
                                        {meta.label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}

            <div className={styles.hint}>Колёсико — масштаб · потянуть — перемещение · клик — открыть</div>
        </section>
    );
}

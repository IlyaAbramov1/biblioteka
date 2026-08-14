"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SiteItem from "@/components/SiteItem/SiteItem";
import { getSiteRelations } from "@/lib/siteRelations";

import styles from "./SiteGraph.module.css";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });
const NODE_COLOR = "#0079ff";
const LABEL_COLOR = "#141414";
const CATEGORY_LABELS = {
    "Дизайнер": "Designer",
    "Дизайн-студия": "Design Studio",
    "Креативная студия": "Creative Studio",
};

function hashString(value) {
    return [...String(value)].reduce(
        (hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0,
        0
    );
}

function seededUnit(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
}

function getCollisionRadius(node) {
    return 280 + Math.min(420, String(node.site?.title || "").length * 12);
}

function createCollisionForce() {
    let nodes = [];
    let strength = 0.11;
    let damping = 0.16;
    let maxImpulse = 54;

    const force = (alpha = 1) => {
        for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            const nodeRadius = getCollisionRadius(node);

            for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
                const other = nodes[otherIndex];
                const otherRadius = getCollisionRadius(other);
                const rawDx = (node.x + (node.vx || 0)) - (other.x + (other.vx || 0));
                const rawDy = (node.y + (node.vy || 0)) - (other.y + (other.vy || 0));
                const distance = Math.hypot(rawDx, rawDy);
                const directionX = distance ? rawDx / distance : (index % 2 ? 1 : -1);
                const directionY = distance ? rawDy / distance : 0;
                const minimumDistance = nodeRadius + otherRadius;

                if (distance >= minimumDistance) continue;

                const overlap = minimumDistance - distance;
                const relativeVelocity =
                    ((node.vx || 0) - (other.vx || 0)) * directionX
                    + ((node.vy || 0) - (other.vy || 0)) * directionY;
                const springImpulse = overlap * strength * Math.max(alpha, 0.18);
                const dampedImpulse = Math.max(0, springImpulse - relativeVelocity * damping);
                const impulse = Math.min(maxImpulse, dampedImpulse);
                const nodeWeight = node.fx == null && node.fy == null ? 0.5 : 0;
                const otherWeight = other.fx == null && other.fy == null ? 0.5 : 0;
                const totalWeight = nodeWeight + otherWeight;

                if (!totalWeight) continue;

                const nodeShare = nodeWeight / totalWeight;
                const otherShare = otherWeight / totalWeight;
                const pushX = directionX * impulse;
                const pushY = directionY * impulse;

                node.vx = (node.vx || 0) + pushX * nodeShare;
                node.vy = (node.vy || 0) + pushY * nodeShare;
                other.vx = (other.vx || 0) - pushX * otherShare;
                other.vy = (other.vy || 0) - pushY * otherShare;
            }
        }
    };

    force.initialize = (nextNodes) => {
        nodes = nextNodes;
    };
    force.strength = (nextStrength) => {
        if (nextStrength === undefined) return strength;
        strength = nextStrength;
        return force;
    };
    force.damping = (nextDamping) => {
        if (nextDamping === undefined) return damping;
        damping = nextDamping;
        return force;
    };
    force.maxImpulse = (nextMaxImpulse) => {
        if (nextMaxImpulse === undefined) return maxImpulse;
        maxImpulse = nextMaxImpulse;
        return force;
    };

    return force;
}

function getInitialPosition(site, index, total) {
    const seed = Math.abs(hashString(site.slug));
    const angle = index * 2.399963 + seededUnit(seed) * 0.9;
    const radius = 160 + Math.sqrt((index + 1) / Math.max(total, 1)) * 1300;
    const scatter = 0.72 + seededUnit(seed + 17) * 0.58;

    return {
        x: Math.cos(angle) * radius * scatter + (seededUnit(seed + 31) - 0.5) * 300,
        y: Math.sin(angle) * radius / scatter + (seededUnit(seed + 47) - 0.5) * 260,
    };
}

function getPreviewPosition(anchor, viewport) {
    const cardWidth = 312;
    const cardHeight = 233;
    const gap = 18;
    const margin = viewport.width < 340 ? 4 : 12;
    let x = anchor.x + gap;
    let y = anchor.y + gap;

    if (x + cardWidth > viewport.width - margin) x = anchor.x - cardWidth - gap;
    if (y + cardHeight > viewport.height - margin) y = anchor.y - cardHeight - gap;

    return {
        x: Math.max(margin, Math.min(x, viewport.width - cardWidth - margin)),
        y: Math.max(margin, Math.min(y, viewport.height - cardHeight - margin)),
    };
}

export default function SiteGraph({ sites, onOpen }) {
    const shellRef = useRef(null);
    const graphRef = useRef(null);
    const revealStartRef = useRef(0);
    const hoveredNodeRef = useRef(null);
    const hasAutoFittedRef = useRef(false);
    const dragMotionRef = useRef(new Map());
    const [size, setSize] = useState({ width: 960, height: 720 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [previewAnchor, setPreviewAnchor] = useState({ x: 0, y: 0 });

    const graphData = useMemo(() => {
        const nodes = sites.map((site, index) => ({
            id: site.slug,
            site,
            ...getInitialPosition(site, index, sites.length),
            revealDelay: Math.min(index * 5, 420),
        }));
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
        hoveredNodeRef.current = null;
        hasAutoFittedRef.current = false;
        setHoveredNode(null);
        const shell = shellRef.current;
        if (!shell) return undefined;

        const observer = new ResizeObserver(([entry]) => {
            setSize({
                width: Math.max(320, entry.contentRect.width),
                height: Math.max(520, entry.contentRect.height),
            });
        });
        observer.observe(shell);

        return () => {
            observer.disconnect();
        };
    }, [graphData]);

    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;

        const chargeForce = graph.d3Force("charge");
        const linkForce = graph.d3Force("link");
        const centerForce = graph.d3Force("center");
        const collisionForce = createCollisionForce()
            .strength(0.11)
            .damping(0.16)
            .maxImpulse(54);

        chargeForce?.strength?.((node) => -850 - seededUnit(Math.abs(hashString(node.id))) * 550);
        linkForce?.distance?.((link) => 2340 + seededUnit(hashString(link.label)) * 1620);
        linkForce?.strength?.(0.22);
        linkForce?.iterations?.(2);
        centerForce?.strength?.(0.025);
        graph.d3Force("collide", collisionForce);
        graph.d3ReheatSimulation();

        // Frame the complete layout immediately when the graph view appears,
        // then refine the framing after the first force ticks have spread it out.
        const initialFitTimer = window.setTimeout(() => graph.zoomToFit(0, 96), 80);
        const settledFitTimer = window.setTimeout(() => {
            graph.zoomToFit(650, 96);
            hasAutoFittedRef.current = true;
        }, 900);

        return () => {
            window.clearTimeout(initialFitTimer);
            window.clearTimeout(settledFitTimer);
        };
    }, [graphData, size.height, size.width]);

    const updatePreviewAnchor = useCallback((node = hoveredNodeRef.current) => {
        if (!node || !graphRef.current) return;
        setPreviewAnchor(graphRef.current.graph2ScreenCoords(node.x, node.y));
    }, []);

    const handleNodeDrag = useCallback((node) => {
        updatePreviewAnchor(node);

        const now = performance.now();
        const previous = dragMotionRef.current.get(node.id);
        let velocityX = previous?.velocityX || 0;
        let velocityY = previous?.velocityY || 0;

        if (previous) {
            const elapsed = Math.max(8, Math.min(64, now - previous.time));
            const frameRatio = 1000 / 60 / elapsed;
            const measuredX = (node.x - previous.x) * frameRatio;
            const measuredY = (node.y - previous.y) * frameRatio;
            const measuredSpeed = Math.hypot(measuredX, measuredY);
            const speedLimit = 72;
            const limiter = measuredSpeed > speedLimit ? speedLimit / measuredSpeed : 1;

            velocityX = velocityX * 0.58 + measuredX * limiter * 0.42;
            velocityY = velocityY * 0.58 + measuredY * limiter * 0.42;
        }

        dragMotionRef.current.set(node.id, {
            x: node.x,
            y: node.y,
            time: now,
            velocityX,
            velocityY,
        });
    }, [updatePreviewAnchor]);

    const handleNodeDragEnd = useCallback((node) => {
        const motion = dragMotionRef.current.get(node.id);
        dragMotionRef.current.delete(node.id);

        if (motion && performance.now() - motion.time < 120) {
            node.vx = motion.velocityX * 0.82;
            node.vy = motion.velocityY * 0.82;
        }

        graphRef.current?.d3ReheatSimulation();
    }, []);

    const drawNode = useCallback((node, context, globalScale) => {
        const elapsed = performance.now() - revealStartRef.current - node.revealDelay;
        const progress = Math.max(0, Math.min(1, elapsed / 300));
        const eased = 1 - Math.pow(1 - progress, 3);
        if (eased <= 0) return;

        const isHovered = hoveredNode?.id === node.id;
        const isRelated = !hoveredNode || hoveredNode.id === node.id || neighbourIds.has(node.id);
        const focusOpacity = !hoveredNode ? 1 : isHovered ? 1 : isRelated ? 0.48 : 0.12;
        const category = CATEGORY_LABELS[node.site.category] || node.site.category || "";
        // Keep a generous minimum on the overview, then let both type and nodes
        // grow with the camera instead of staying optically fixed while zooming.
        const fontSize = 14 / globalScale + 8;
        const baseRadius = isHovered ? 9.5 : 6.5;
        const radius = baseRadius / globalScale + 2;

        context.save();
        context.globalAlpha = focusOpacity;
        context.translate(node.x, node.y);
        context.scale(eased, eased);
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.fillStyle = NODE_COLOR;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowColor = "transparent";
        context.textBaseline = "bottom";
        context.font = `500 ${fontSize}px Roboto, sans-serif`;
        context.letterSpacing = "-0.32px";
        const titleWidth = context.measureText(node.site.title).width;
        const categoryWidth = category ? context.measureText(category).width : 0;
        const labelGap = category ? 4 / globalScale : 0;
        const labelWidth = titleWidth + labelGap + categoryWidth;
        const labelX = -labelWidth / 2;
        const labelY = -radius - 7 / globalScale;
        const pointerPadding = 12 / globalScale;
        node.__pointerBounds = {
            x: labelX - pointerPadding,
            y: labelY - fontSize - pointerPadding,
            width: labelWidth + pointerPadding * 2,
            height: fontSize + radius + 7 / globalScale + pointerPadding * 2,
        };
        context.textAlign = "left";
        context.strokeStyle = "#fafafa";
        context.lineWidth = 4 / globalScale;
        context.lineJoin = "round";
        context.globalAlpha = focusOpacity;
        context.strokeText(node.site.title, labelX, labelY);
        if (category) {
            context.strokeText(category, labelX + titleWidth + labelGap, labelY);
        }
        context.fillStyle = LABEL_COLOR;
        context.fillText(node.site.title, labelX, labelY);
        if (category) {
            context.globalAlpha = focusOpacity;
            context.fillStyle = "rgba(169, 184, 198, 0.52)";
            context.fillText(category, labelX + titleWidth + labelGap, labelY);
        }
        context.restore();

        node.__paintRadius = Math.max(radius, 9 / globalScale);
    }, [hoveredNode, neighbourIds]);

    const paintPointerArea = useCallback((node, color, context) => {
        const bounds = node.__pointerBounds;

        context.fillStyle = color;
        if (bounds) {
            context.fillRect(node.x + bounds.x, node.y + bounds.y, bounds.width, bounds.height);
            return;
        }

        const radius = node.__paintRadius || 10;
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fill();
    }, []);

    const hoveredSite = hoveredNode?.site;
    const previewPosition = getPreviewPosition(previewAnchor, size);

    return (
        <section
            ref={shellRef}
            className={`${styles.shell} ${hoveredNode ? styles.shellHover : ""}`}
            aria-label="Граф связей дизайнеров и студий"
            onMouseLeave={() => {
                hoveredNodeRef.current = null;
                setHoveredNode(null);
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
                    if (!hoveredNode) return "rgba(0, 121, 255, 0.72)";
                    const source = typeof link.source === "object" ? link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.id : link.target;
                    return source === hoveredNode.id || target === hoveredNode.id
                        ? "rgba(0, 121, 255, 0.98)"
                        : "rgba(0, 121, 255, 0.2)";
                }}
                linkWidth={(link) => {
                    if (!hoveredNode) return 2.2;
                    const source = typeof link.source === "object" ? link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.id : link.target;
                    return source === hoveredNode.id || target === hoveredNode.id ? 4 : 1.1;
                }}
                linkCurvature={0.035}
                linkLabel="label"
                onNodeHover={(node) => {
                    hoveredNodeRef.current = node || null;
                    setHoveredNode(node || null);
                    if (node) updatePreviewAnchor(node);
                }}
                onNodeClick={(node) => onOpen(node.site)}
                onBackgroundClick={() => {
                    hoveredNodeRef.current = null;
                    setHoveredNode(null);
                }}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                onEngineStop={() => {
                    if (hasAutoFittedRef.current) return;
                    hasAutoFittedRef.current = true;
                    graphRef.current?.zoomToFit(700, 96);
                }}
                onZoom={() => updatePreviewAnchor()}
                enableNodeDrag
                warmupTicks={100}
                cooldownTicks={480}
                cooldownTime={20000}
                d3AlphaDecay={0.012}
                d3VelocityDecay={0.09}
                minZoom={0.02}
                maxZoom={4}
            />

            {hoveredSite ? (
                <div
                    key={hoveredSite.slug}
                    className={styles.previewCard}
                    style={{
                        "--preview-x": `${previewPosition.x}px`,
                        "--preview-y": `${previewPosition.y}px`,
                    }}
                >
                    <SiteItem site={hoveredSite} onOpen={onOpen} active previewOnly />
                </div>
            ) : null}

        </section>
    );
}

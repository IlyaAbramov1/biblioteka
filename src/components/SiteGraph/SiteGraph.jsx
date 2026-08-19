"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import SiteItem from "@/components/SiteItem/SiteItem";
import { getSiteRelations } from "@/lib/siteRelations";

import styles from "./SiteGraph.module.css";

const forceGraph2DModulePromise = typeof window === "undefined"
    ? null
    : import("react-force-graph-2d");
const ForceGraph2D = dynamic(
    () => forceGraph2DModulePromise || import("react-force-graph-2d"),
    { ssr: false }
);
const NODE_COLOR = "#0079ff";
const LABEL_COLOR = "#141414";
const GRAPH_SPACING_MULTIPLIER = 8;
const LINK_SPACING_MULTIPLIER = 2.4;
const CONNECTED_COLLISION_MULTIPLIER = 6.0;
const SOLO_COLLISION_MULTIPLIER = 2.8;
const SOLO_COLLISION_FORCE_MULTIPLIER = 2.2;
const SOLO_COLLISION_DAMPING_MULTIPLIER = 3;
const NODE_SIZE_MULTIPLIER = 1.2;
const MIN_ZOOM = 0.00125;
const INITIAL_LAYOUT_RADIUS = 280000;
const MOBILE_LAYOUT_SCALE = 2;
const CATEGORY_LABELS = {
    "Дизайнер": "Designer",
    "Дизайн-студия": "Design Studio",
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

function getViewportSize() {
    if (typeof window === "undefined") {
        return { width: 960, height: 720 };
    }

    return {
        width: Math.max(320, window.innerWidth),
        height: Math.max(520, window.innerHeight),
    };
}

function hasHoverCapability() {
    if (typeof window === "undefined") return true;

    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function getCollisionRadius(node, layoutScale = 1) {
    const collisionMultiplier = node.relationDegree > 0
        ? CONNECTED_COLLISION_MULTIPLIER
        : SOLO_COLLISION_MULTIPLIER;

    return (
        (280 + Math.min(420, String(node.site?.title || "").length * 12))
        * GRAPH_SPACING_MULTIPLIER
        * collisionMultiplier
        * layoutScale
    );
}

function createCollisionForce(layoutScale = 1) {
    let nodes = [];
    let collisionRadii = [];
    let collisionCellSize = 1;
    let strength = 0.11;
    let damping = 0.16;
    let maxImpulse = 54;

    const force = (alpha = 1) => {
        const spatialGrid = new Map();
        const predictedPositions = nodes.map((node, index) => {
            const x = node.x + (node.vx || 0);
            const y = node.y + (node.vy || 0);
            const cellX = Math.floor(x / collisionCellSize);
            const cellY = Math.floor(y / collisionCellSize);
            const cellKey = `${cellX}:${cellY}`;
            const cell = spatialGrid.get(cellKey);

            if (cell) {
                cell.push(index);
            } else {
                spatialGrid.set(cellKey, [index]);
            }

            return { x, y, cellX, cellY };
        });

        for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            const nodeRadius = collisionRadii[index];
            const nodePosition = predictedPositions[index];
            const nearbyIndices = [];

            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                    const cell = spatialGrid.get(
                        `${nodePosition.cellX + offsetX}:${nodePosition.cellY + offsetY}`
                    );

                    if (!cell) continue;
                    cell.forEach((otherIndex) => {
                        if (otherIndex > index) nearbyIndices.push(otherIndex);
                    });
                }
            }

            nearbyIndices.sort((firstIndex, secondIndex) => firstIndex - secondIndex);

            for (const otherIndex of nearbyIndices) {
                const other = nodes[otherIndex];
                const otherRadius = collisionRadii[otherIndex];
                const rawDx = (node.x + (node.vx || 0)) - (other.x + (other.vx || 0));
                const rawDy = (node.y + (node.vy || 0)) - (other.y + (other.vy || 0));
                const distance = Math.hypot(rawDx, rawDy);
                const directionX = distance ? rawDx / distance : (index % 2 ? 1 : -1);
                const directionY = distance ? rawDy / distance : 0;
                const minimumDistance = nodeRadius + otherRadius;

                if (distance >= minimumDistance) continue;

                const overlap = minimumDistance - distance;
                const includesSoloNode = node.relationDegree === 0 || other.relationDegree === 0;
                const pairStrength = includesSoloNode
                    ? strength * SOLO_COLLISION_FORCE_MULTIPLIER
                    : strength;
                const pairDamping = includesSoloNode
                    ? damping * SOLO_COLLISION_DAMPING_MULTIPLIER
                    : damping;
                const relativeVelocity =
                    ((node.vx || 0) - (other.vx || 0)) * directionX
                    + ((node.vy || 0) - (other.vy || 0)) * directionY;
                const springImpulse = overlap * pairStrength * Math.max(alpha, 0.18);
                const dampedImpulse = Math.max(
                    0,
                    springImpulse - relativeVelocity * pairDamping
                );
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
        collisionRadii = nodes.map((node) => getCollisionRadius(node, layoutScale));
        collisionCellSize = Math.max(1, Math.max(...collisionRadii) * 2);
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

function getInitialPosition(site, index, total, layoutSeed = 0, layoutScale = 1) {
    const seed = Math.abs(hashString(site.slug) ^ layoutSeed);
    const angle = index * 2.399963 + seededUnit(seed) * 0.9;
    const radius = 12000 + Math.sqrt((index + 1) / Math.max(total, 1)) * INITIAL_LAYOUT_RADIUS;
    const jitter = 0.72 + seededUnit(seed + 17) * 0.58;

    return {
        x: (
            Math.cos(angle) * radius * jitter
            + (seededUnit(seed + 31) - 0.5) * 9000
        ) * layoutScale,
        y: (
            Math.sin(angle) * radius / jitter
            + (seededUnit(seed + 47) - 0.5) * 7800
        ) * layoutScale,
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
    const randomizedGraphDataRef = useRef(null);
    const revealStartRef = useRef(0);
    const hoveredNodeRef = useRef(null);
    const dragMotionRef = useRef(new Map());
    const cameraRef = useRef({ k: MIN_ZOOM, x: 0, y: 0 });
    const viewportSizeRef = useRef(getViewportSize());
    const fontsReadyRef = useRef(
        typeof document === "undefined" || !document.fonts || document.fonts.status === "loaded"
    );
    const [size, setSize] = useState(getViewportSize);
    const [hasHoverInput, setHasHoverInput] = useState(hasHoverCapability);
    const [graphInstance, setGraphInstance] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [previewAnchor, setPreviewAnchor] = useState({ x: 0, y: 0 });

    const layoutScale = hasHoverInput ? 1 : MOBILE_LAYOUT_SCALE;
    viewportSizeRef.current = size;

    const graphData = useMemo(() => {
        const links = getSiteRelations(sites);
        const relationDegrees = links.reduce((degrees, link) => {
            degrees.set(link.source, (degrees.get(link.source) || 0) + 1);
            degrees.set(link.target, (degrees.get(link.target) || 0) + 1);
            return degrees;
        }, new Map());
        const nodes = sites.map((site, index) => ({
            id: site.slug,
            site,
            ...getInitialPosition(site, index, sites.length, 0, layoutScale),
            relationDegree: relationDegrees.get(site.slug) || 0,
            revealDelay: Math.min(index * 5, 420),
        }));

        return { nodes, links };
    }, [layoutScale, sites]);

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

    useLayoutEffect(() => {
        const shell = shellRef.current;
        if (!shell) return undefined;

        const syncSize = (width, height) => {
            const nextSize = {
                width: Math.max(320, Math.round(width)),
                height: Math.max(520, Math.round(height)),
            };

            setSize((currentSize) => {
                if (
                    currentSize.width === nextSize.width
                    && currentSize.height === nextSize.height
                ) {
                    return currentSize;
                }

                return nextSize;
            });
        };

        const rect = shell.getBoundingClientRect();
        if (rect.width && rect.height) {
            syncSize(rect.width, rect.height);
        }

        const observer = new ResizeObserver(([entry]) => {
            syncSize(entry.contentRect.width, entry.contentRect.height);
        });

        observer.observe(shell);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
        const syncHoverCapability = () => {
            setHasHoverInput(hoverQuery.matches);
            if (!hoverQuery.matches) {
                hoveredNodeRef.current = null;
                setHoveredNode(null);
            }
        };

        syncHoverCapability();
        hoverQuery.addEventListener("change", syncHoverCapability);

        return () => hoverQuery.removeEventListener("change", syncHoverCapability);
    }, []);

    useEffect(() => {
        revealStartRef.current = performance.now();
        hoveredNodeRef.current = null;
        setHoveredNode(null);
    }, [graphData]);

    useEffect(() => {
        if (!document.fonts || fontsReadyRef.current) return undefined;

        let isActive = true;
        document.fonts.ready.then(() => {
            if (!isActive) return;

            fontsReadyRef.current = true;
            graphData.nodes.forEach((node) => {
                delete node.__labelMetrics;
            });
            graphRef.current?.refresh();
        });

        return () => {
            isActive = false;
        };
    }, [graphData]);

    useEffect(() => {
        const graph = graphInstance;
        if (!graph) return undefined;

        if (randomizedGraphDataRef.current !== graphData) {
            const layoutSeed = Math.floor(Math.random() * 0x7fffffff);

            graphData.nodes.forEach((node, index) => {
                Object.assign(
                    node,
                    getInitialPosition(
                        node.site,
                        index,
                        graphData.nodes.length,
                        layoutSeed,
                        layoutScale
                    ),
                    { vx: 0, vy: 0 }
                );
            });
            randomizedGraphDataRef.current = graphData;
        }

        const chargeForce = graph.d3Force("charge");
        const linkForce = graph.d3Force("link");
        const centerForce = graph.d3Force("center");
        const collisionForce = createCollisionForce(layoutScale)
            .strength(0.11)
            .damping(0.16)
            .maxImpulse(54 * GRAPH_SPACING_MULTIPLIER * layoutScale);

        chargeForce?.strength?.((node) => (
            (-850 - seededUnit(Math.abs(hashString(node.id))) * 550) * GRAPH_SPACING_MULTIPLIER
            * layoutScale
            * layoutScale
        ));
        linkForce?.distance?.((link) => (
            (2340 + seededUnit(hashString(link.label)) * 1620)
            * GRAPH_SPACING_MULTIPLIER
            * LINK_SPACING_MULTIPLIER
            * layoutScale
        ));
        linkForce?.strength?.(0.12);
        linkForce?.iterations?.(1);
        centerForce?.strength?.(0.025 / GRAPH_SPACING_MULTIPLIER);
        graph.d3Force("collide", collisionForce);
        graph.d3ReheatSimulation();

        const setOverviewCamera = () => {
            graph.centerAt(0, 0, 0);
            graph.zoom(MIN_ZOOM, 0);
        };

        setOverviewCamera();
        const overviewFrame = window.requestAnimationFrame(setOverviewCamera);
        const overviewTimer = window.setTimeout(setOverviewCamera, 120);

        // Keep viewport resizing separate from camera initialization. On mobile,
        // visualViewport changes during pinch gestures and must not reset the zoom.
        return () => {
            window.cancelAnimationFrame(overviewFrame);
            window.clearTimeout(overviewTimer);
        };
    }, [graphData, graphInstance, layoutScale]);

    const handleGraphRef = useCallback((node) => {
        graphRef.current = node;
        setGraphInstance((currentNode) => (currentNode === node ? currentNode : node));
    }, []);

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

    const handleNodeClick = useCallback((node, event) => {
        if (!node?.site) return;

        event?.stopPropagation?.();
        hoveredNodeRef.current = null;
        setHoveredNode(null);
        onOpen(node.site);
    }, [onOpen]);

    const isNodeVisible = useCallback((node) => {
        const camera = cameraRef.current;
        const viewport = viewportSizeRef.current;
        const screenX = (node.x - camera.x) * camera.k + viewport.width / 2;
        const screenY = (node.y - camera.y) * camera.k + viewport.height / 2;
        const category = CATEGORY_LABELS[node.site.category] || node.site.category || "";
        const fallbackHorizontalMargin =
            (String(node.site.title).length + String(category).length) * 18 + 32;
        const horizontalMargin = node.__visibilityMarginX || fallbackHorizontalMargin;
        const verticalMargin = 96;

        return (
            screenX >= -horizontalMargin
            && screenX <= viewport.width + horizontalMargin
            && screenY >= -verticalMargin
            && screenY <= viewport.height + verticalMargin
        );
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
        const normalizedScale = Math.max(globalScale, MIN_ZOOM);
        const zoomRatio = normalizedScale / MIN_ZOOM;
        const nodeZoomFactor = Math.max(0.72, Math.min(2.55, 0.72 * Math.pow(zoomRatio, 0.3)));
        const labelZoomFactor = Math.max(0.78, Math.min(2.15, 0.78 * Math.pow(zoomRatio, 0.28)));
        const fontSize = 14 * labelZoomFactor / normalizedScale;
        const baseRadius = isHovered ? 9.5 : 6.5;
        const radius = baseRadius * NODE_SIZE_MULTIPLIER * nodeZoomFactor / normalizedScale;

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
        context.letterSpacing = "0px";
        const font = context.font;
        const cachedMetrics = node.__labelMetrics;
        let titleWidth;
        let categoryWidth;

        if (
            fontsReadyRef.current
            && cachedMetrics?.font === font
            && cachedMetrics.category === category
        ) {
            titleWidth = cachedMetrics.titleWidth;
            categoryWidth = cachedMetrics.categoryWidth;
        } else {
            titleWidth = context.measureText(node.site.title).width;
            categoryWidth = category ? context.measureText(category).width : 0;

            if (fontsReadyRef.current) {
                node.__labelMetrics = { font, category, titleWidth, categoryWidth };
            }
        }
        const labelGap = category ? 4 * labelZoomFactor / normalizedScale : 0;
        const labelWidth = titleWidth + labelGap + categoryWidth;
        const labelX = -labelWidth / 2;
        const labelY = -radius - 7 * labelZoomFactor / normalizedScale;
        const pointerPadding = 12 * labelZoomFactor / normalizedScale;
        node.__pointerBounds = {
            x: labelX - pointerPadding,
            y: labelY - fontSize - pointerPadding,
            width: labelWidth + pointerPadding * 2,
            height: fontSize + radius + 7 * labelZoomFactor / normalizedScale + pointerPadding * 2,
        };
        context.textAlign = "left";
        context.strokeStyle = "#fafafa";
        context.lineWidth = 4 * labelZoomFactor / normalizedScale;
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

        node.__paintRadius = Math.max(radius, 9 * nodeZoomFactor / normalizedScale);
        node.__visibilityMarginX = Math.max(
            96,
            labelWidth * normalizedScale / labelZoomFactor * 2.15 / 2 + 24
        );
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
            className={`${styles.shell} ${hasHoverInput && hoveredNode ? styles.shellHover : ""}`}
            aria-label="Граф связей дизайнеров и студий"
            onMouseLeave={() => {
                hoveredNodeRef.current = null;
                setHoveredNode(null);
            }}
        >
            <ForceGraph2D
                ref={handleGraphRef}
                width={size.width}
                height={size.height}
                graphData={graphData}
                backgroundColor="#fafafa"
                nodeVisibility={isNodeVisible}
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
                onNodeHover={hasHoverInput ? (node) => {
                    hoveredNodeRef.current = node || null;
                    setHoveredNode(node || null);
                    if (node) updatePreviewAnchor(node);
                } : undefined}
                onNodeClick={handleNodeClick}
                onBackgroundClick={hasHoverInput ? () => {
                    hoveredNodeRef.current = null;
                    setHoveredNode(null);
                } : undefined}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                onZoom={(camera) => {
                    cameraRef.current = camera;
                    updatePreviewAnchor();
                }}
                enableNodeDrag={hasHoverInput}
                showPointerCursor={hasHoverInput}
                warmupTicks={0}
                cooldownTicks={hasHoverInput ? 900 : 180}
                cooldownTime={hasHoverInput ? 30000 : 6000}
                d3AlphaDecay={hasHoverInput ? 0.006 : 0.028}
                d3VelocityDecay={hasHoverInput ? 0.09 : 0.22}
                minZoom={0}
                maxZoom={Number.POSITIVE_INFINITY}
            />

            {hasHoverInput && hoveredSite ? (
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

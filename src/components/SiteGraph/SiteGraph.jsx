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
const CATEGORY_COLOR = "rgba(140, 156, 172, 0.72)";
const BACKGROUND_COLOR = "#fafafa";
const GRAPH_SPACING_MULTIPLIER = 8;
const LINK_SPACING_MULTIPLIER = 3.1;
const CONNECTED_COLLISION_MULTIPLIER = 6.8;
const SOLO_COLLISION_MULTIPLIER = 2.8;
const SOLO_COLLISION_FORCE_MULTIPLIER = 2.2;
const SOLO_COLLISION_DAMPING_MULTIPLIER = 3;
const NODE_SIZE_MULTIPLIER = 1.2;
const MIN_ZOOM = 0.00125;
const INITIAL_LAYOUT_RADIUS = 280000;
const CONNECTED_COMPONENT_RADIUS = 190000;
const CONNECTED_NODE_RADIUS = 88000;
const MOBILE_LAYOUT_SCALE = 0.72;
// Labels are drawn in screen pixels, so their size never depends on zoom.
const LABEL_FONT_SIZE = 13;
const LABEL_FONT = `500 ${LABEL_FONT_SIZE}px Roboto, sans-serif`;
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 4;
const LABEL_OFFSET = 6;
const LABEL_CATEGORY_GAP = 5;
const LABEL_COLLISION_MARGIN = 4;
const LABEL_HIT_ALPHA = 0.35;
const LABEL_FADE_MS = 160;
// Zoom relative to the zoom-to-fit camera at which labels become eligible.
// Eligible labels are then decluttered: a label shows only if it fits.
const CONNECTED_LABEL_ZOOM = 1.15;
const SOLO_LABEL_ZOOM = 1.45;
const HUB_DEGREE = 3;
const DIMMED_NODE_OPACITY = 0.2;
const FOCUS_FADE_MS = 110;
const MAX_FRAME_DELTA_MS = 48;
const HOVER_SPRING_STIFFNESS = 420;
const HOVER_SPRING_DAMPING = 26;
// After the first layout settles every node is held by a soft spring to a
// moving home: clusters orbit their hub, every node sways, the cursor stirs
// the graph like wind and hover pulls a cluster together. Modeled after the
// Shopify Editions graph (orbit, cursor repel with carry/shield, hover constrict).
const TICK_SECONDS = 1 / 60;
const SOFT_ALPHA_CAP = 0.04;
const DRAG_ALPHA_CAP = 0.18;
// Low friction + a stiffer home spring: displaced nodes swing back past
// their home and settle with a little inertia (damping ratio ≈ 0.35).
const SETTLED_VELOCITY_DECAY = 0.04;
const HOME_SPRING = 0.0035;
const DRAG_HOME_SPRING_FACTOR = 0.12;
const ORBIT_SPEED = 0.02;
const WOBBLE_PX = 4;
const HOVER_SLOW = 0.2;
const HOVER_PULL = 0.25;
const HOVER_SPRING_BOOST = 0.006;
const HOVER_PUSH_RADIUS_PX = 160;
const HOVER_PUSH_PX = 28;
const HOVERED_NODE_DAMPING = 0.35;
const CURSOR_REPEL = 1.35;
const CURSOR_REPEL_RADIUS_PX = 260;
const CURSOR_REPEL_INNER_PX = 24;
const CURSOR_REPEL_CARRY = 1.45;
const CURSOR_REPEL_SHIELD = 1;
const CURSOR_REPEL_GATE = 24;
const CURSOR_REPEL_MAX_SPEED = 1800;
const CURSOR_REPEL_FADE_MS = 40;
// The layout is relaxed invisibly on the first frame, then nodes are launched
// from the centre with a swirling velocity and pulled home by a spring, so
// they spiral out, overshoot and settle. Staggered from the inside out.
const RELAX_TICKS = 300;
const RELAX_TICKS_PER_FRAME = 75;
const RELAX_ALPHA_DECAY = 0.02;
const RELAX_VELOCITY_DECAY = 0.4;
const REVEAL_STAGGER_MS = 900;
const REVEAL_SPRING = 0.018;
const REVEAL_DAMPING = 0.07;
const REVEAL_SWIRL = 0.1;
const REVEAL_OUTWARD = 0.05;
const REVEAL_BLEND_MS = 1300;
const REVEAL_SCALE_MS = 260;
// Occasional faint pulses travelling along links.
const PULSE_TRAIL = 0.22;
const PULSE_ALPHA = 0.85;
const PULSE_STEPS = 10;
const CATEGORY_LABELS = {
    "Дизайнер": "Designer",
    "Дизайн-студия": "Design Studio",
};

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}

function smoothstep01(value) {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
}

// Runs the layout forces headlessly, exactly like a d3 tick, to find the
// settled layout before anything is shown. Spread over a few frames;
// returns true once all ticks are done.
function relaxLayout(nodes, forces, state) {
    const lastTick = Math.min(RELAX_TICKS, state.tick + RELAX_TICKS_PER_FRAME);

    for (; state.tick < lastTick; state.tick += 1) {
        state.alpha -= state.alpha * RELAX_ALPHA_DECAY;
        forces.forEach((force) => force?.(state.alpha));
        nodes.forEach((node) => {
            node.vx = (node.vx || 0) * (1 - RELAX_VELOCITY_DECAY);
            node.vy = (node.vy || 0) * (1 - RELAX_VELOCITY_DECAY);
            node.x += node.vx;
            node.y += node.vy;
        });
    }

    if (state.tick < RELAX_TICKS) return false;

    nodes.forEach((node) => {
        node.vx = 0;
        node.vy = 0;
    });

    return true;
}

function approach(value, target, amount) {
    const next = value + (target - value) * amount;
    return Math.abs(target - next) < 0.001 ? target : next;
}

function prefersReducedMotion() {
    if (typeof window === "undefined") return false;

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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

    const viewport = window.visualViewport;

    return {
        width: Math.max(320, Math.round(viewport?.width || window.innerWidth)),
        height: Math.max(320, Math.round(viewport?.height || window.innerHeight)),
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
                // Nodes spiralling in pass through each other freely.
                if (node.__inFlight || other.__inFlight) continue;
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

const softenedForces = new WeakSet();
const gatedForces = new WeakSet();

// Runs a force only while isActive() holds.
function gateForce(force, isActive) {
    if (!force || gatedForces.has(force)) return force;

    const gated = new Proxy(force, {
        apply: (target, thisArg, args) => (
            isActive() ? target.apply(thisArg, args) : undefined
        ),
    });
    gatedForces.add(gated);

    return gated;
}

// Caps the alpha a d3 force receives, so reheating a settled graph (on hover
// or after a drag) produces gentle motion instead of a full-energy jolt.
function softenForce(force, getAlphaCap) {
    if (!force || softenedForces.has(force)) return force;

    const softened = new Proxy(force, {
        apply: (target, thisArg, [alpha]) => target.call(
            thisArg,
            Math.min(alpha, getAlphaCap())
        ),
    });
    softenedForces.add(softened);

    return softened;
}

// The cursor acts like wind: only its motion pushes nodes, radially and along
// the direction of travel, fading quickly once the pointer stops.
function getCursorRepel(pointer, camera, now) {
    if (!pointer || !camera) return null;

    const fade = Math.exp(-(now - pointer.time) / CURSOR_REPEL_FADE_MS);
    const velocityX = pointer.vx * fade;
    const velocityY = pointer.vy * fade;
    const speed = Math.hypot(velocityX, velocityY);
    if (speed <= CURSOR_REPEL_GATE) return null;

    return {
        x: (pointer.x - camera.tx) / camera.k,
        y: (pointer.y - camera.ty) / camera.k,
        directionX: velocityX / speed,
        directionY: velocityY / speed,
        speed: Math.min(speed, CURSOR_REPEL_MAX_SPEED),
    };
}

function applyCursorRepel(node, repel, scale, pace) {
    const dx = node.x - repel.x;
    const dy = node.y - repel.y;
    const distance = Math.hypot(dx, dy) || 1;
    const screenDistance = distance * scale;
    if (screenDistance <= CURSOR_REPEL_INNER_PX || screenDistance >= CURSOR_REPEL_RADIUS_PX) return;

    const falloff = 1 - (screenDistance - CURSOR_REPEL_INNER_PX)
        / (CURSOR_REPEL_RADIUS_PX - CURSOR_REPEL_INNER_PX);
    const facing = (dx * repel.directionX + dy * repel.directionY) / distance;
    const shield = 1 - CURSOR_REPEL_SHIELD * Math.max(0, facing);
    // Acceleration in px/s², converted to world units per tick.
    const acceleration = falloff * falloff * CURSOR_REPEL * shield * repel.speed * pace;
    const impulse = acceleration * TICK_SECONDS * TICK_SECONDS / scale;

    node.vx = (node.vx || 0) + (dx / distance + repel.directionX * CURSOR_REPEL_CARRY) * impulse;
    node.vy = (node.vy || 0) + (dy / distance + repel.directionY * CURSOR_REPEL_CARRY) * impulse;
}

function createSoftForce(physicsRef) {
    let nodes = [];

    const force = () => {
        const physics = physicsRef.current;
        const { settled, dragging, adjacency, reducedMotion, camera, pace } = physics;
        if (!camera || !settled) return;

        const hasMotion = !reducedMotion;
        if (hasMotion) physics.time += pace * TICK_SECONDS;

        const scale = camera.k;
        const orbitAngle = hasMotion ? physics.time * ORBIT_SPEED : 0;
        const orbitCos = Math.cos(orbitAngle);
        const orbitSin = Math.sin(orbitAngle);
        const wobble = hasMotion ? WOBBLE_PX / scale : 0;
        const sources = hasMotion ? nodes.filter((node) => node.__hoverMix > 0.002) : [];
        const pushRadius = HOVER_PUSH_RADIUS_PX / scale;
        const pushDistance = HOVER_PUSH_PX / scale;
        const repel = hasMotion && !dragging && !physics.hovered
            ? getCursorRepel(physics.pointer, camera, performance.now())
            : null;
        const springStrength = HOME_SPRING * (dragging ? DRAG_HOME_SPRING_FACTOR : 1);

        nodes.forEach((node) => {
            if (node.__homeX == null || node.fx != null) return;

            const hub = node.__orbitHub;
            const revealBlend = node.__revealBlend ?? 1;
            let targetX = node.__homeX;
            let targetY = node.__homeY;

            // Children follow their hub's live position, rotated around it.
            // While the hub is still flying in, its home stands in for it.
            if (hub && hub !== node) {
                const hubBlend = hub.fx != null ? 0 : hub.__revealBlend ?? 1;
                const hubX = hub.__homeX + (hub.x - hub.__homeX) * hubBlend;
                const hubY = hub.__homeY + (hub.y - hub.__homeY) * hubBlend;
                const sin = orbitSin * node.__orbitDirection;
                targetX = hubX + node.__orbitOffsetX * orbitCos - node.__orbitOffsetY * sin;
                targetY = hubY + node.__orbitOffsetX * sin + node.__orbitOffsetY * orbitCos;
            }

            if (wobble) {
                const [frequencyA, frequencyB, phaseA, phaseB, phaseC, phaseD] = node.__wobble;
                const time = physics.time;
                targetX += wobble * (
                    0.65 * Math.sin(time * frequencyA + phaseA)
                    + 0.35 * Math.sin(time * frequencyB + phaseB)
                );
                targetY += wobble * (
                    0.65 * Math.sin(time * frequencyA * 0.87 + phaseC)
                    + 0.35 * Math.sin(time * frequencyB * 1.13 + phaseD)
                );
            }

            // Freshly launched nodes ride a stiffer, more damped spring that
            // eases into the regular home spring as they land.
            let spring = REVEAL_SPRING + (springStrength - REVEAL_SPRING) * revealBlend;
            let damping = REVEAL_DAMPING * (1 - revealBlend);

            sources.forEach((source) => {
                const mix = source.__hoverMix;

                if (source === node) {
                    damping = Math.max(damping, HOVERED_NODE_DAMPING * mix);
                    return;
                }

                if (adjacency.get(source.id)?.has(node.id)) {
                    targetX += (source.x - targetX) * HOVER_PULL * mix;
                    targetY += (source.y - targetY) * HOVER_PULL * mix;
                    spring += HOVER_SPRING_BOOST * mix;
                    return;
                }

                const dx = node.x - source.x;
                const dy = node.y - source.y;
                const distance = Math.hypot(dx, dy) || 1;
                if (distance >= pushRadius) return;

                const push = Math.pow(1 - distance / pushRadius, 2) * pushDistance * mix;
                targetX += dx / distance * push;
                targetY += dy / distance * push;
            });

            node.vx = ((node.vx || 0) + (targetX - node.x) * spring) * (1 - damping);
            node.vy = ((node.vy || 0) + (targetY - node.y) * spring) * (1 - damping);

            if (repel) applyCursorRepel(node, repel, scale, pace);
        });
    };

    force.initialize = (nextNodes) => {
        nodes = nextNodes;
    };

    return force;
}

// Captures the settled layout as homes and assigns every connected node to
// the hub of its component, which it will slowly orbit.
function captureHomes(nodes, adjacency) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const visited = new Set();
    let componentIndex = 0;

    nodes.forEach((node) => {
        const seed = Math.abs(hashString(node.id));
        node.__homeX = node.x;
        node.__homeY = node.y;
        node.__orbitHub = null;
        node.__wobble = [
            0.6 + seededUnit(seed + 1) * 0.4,
            1.1 + seededUnit(seed + 2) * 0.5,
            seededUnit(seed + 3) * Math.PI * 2,
            seededUnit(seed + 4) * Math.PI * 2,
            seededUnit(seed + 5) * Math.PI * 2,
            seededUnit(seed + 6) * Math.PI * 2,
        ];
    });

    nodes.forEach((startNode) => {
        if (visited.has(startNode.id) || !adjacency.get(startNode.id)?.size) return;

        const component = [];
        const queue = [startNode.id];
        visited.add(startNode.id);

        while (queue.length) {
            const nodeId = queue.shift();
            component.push(nodeById.get(nodeId));
            adjacency.get(nodeId).forEach((neighbourId) => {
                if (visited.has(neighbourId) || !nodeById.has(neighbourId)) return;
                visited.add(neighbourId);
                queue.push(neighbourId);
            });
        }

        const hub = component.reduce((best, node) => (
            node.relationDegree > best.relationDegree
            || (node.relationDegree === best.relationDegree && node.id < best.id)
                ? node
                : best
        ));
        const direction = componentIndex % 2 ? -1 : 1;
        componentIndex += 1;

        component.forEach((node) => {
            node.__orbitHub = hub;
            node.__orbitDirection = direction;
            node.__orbitOffsetX = node.__homeX - hub.__homeX;
            node.__orbitOffsetY = node.__homeY - hub.__homeY;
        });
    });
}

function getCategoryLabel(node) {
    return CATEGORY_LABELS[node.site.category] || node.site.category || "";
}

function measureLabel(node, context, fontsReady) {
    const category = getCategoryLabel(node);
    const cached = node.__labelMetrics;
    if (cached && cached.category === category) return cached;

    context.save();
    context.font = LABEL_FONT;
    context.letterSpacing = "0px";
    const titleWidth = context.measureText(node.site.title).width;
    const categoryWidth = category ? context.measureText(category).width : 0;
    context.restore();

    const metrics = {
        category,
        titleWidth,
        categoryWidth,
        width: titleWidth + (category ? LABEL_CATEGORY_GAP + categoryWidth : 0),
    };
    if (fontsReady) node.__labelMetrics = metrics;

    return metrics;
}

function getDotRadiusPx(node, globalScale) {
    const normalizedScale = Math.max(globalScale, MIN_ZOOM);
    const zoomRatio = normalizedScale / MIN_ZOOM;
    const nodeZoomFactor = Math.max(0.72, Math.min(2.55, 0.72 * Math.pow(zoomRatio, 0.3)));
    const degreeBoost = 1 + Math.min(node.relationDegree, 6) * 0.07;

    return 6.5
        * degreeBoost
        * (1 + (node.__hoverScale || 0) * 0.46 + (node.__emphasisMix || 0) * 0.1)
        * NODE_SIZE_MULTIPLIER
        * nodeZoomFactor
        * globalScale
        / normalizedScale;
}

// Label box in screen pixels, relative to the node centre.
function getLabelBox(labelWidth, dotRadius) {
    const width = labelWidth + LABEL_PADDING_X * 2;
    const height = LABEL_FONT_SIZE + LABEL_PADDING_Y * 2;

    return { x: -width / 2, y: -dotRadius - LABEL_OFFSET - height, width, height };
}

// Greedy screen-space declutter: higher-priority labels claim space first,
// anything that would overlap an already placed label stays hidden.
function placeLabels(nodes, context, camera, viewport, zoomLevel, fontsReady) {
    const candidates = [];

    nodes.forEach((node, index) => {
        node.__labelTarget = 0;

        const minimumZoom = node.relationDegree >= HUB_DEGREE
            ? 0
            : node.relationDegree > 0 ? CONNECTED_LABEL_ZOOM : SOLO_LABEL_ZOOM;
        if (!node.__isEmphasized && zoomLevel < minimumZoom) return;

        const x = node.x * camera.k + camera.tx;
        const y = node.y * camera.k + camera.ty;
        if (x < -200 || x > viewport.width + 200 || y < -80 || y > viewport.height + 80) return;

        const priority = (node.__isHovered ? 2000 : 0)
            + (node.__isEmphasized ? 1000 : 0)
            + Math.min(node.relationDegree, 50) * 10;
        candidates.push({ node, index, x, y, priority });
    });

    candidates.sort((first, second) => (
        second.priority - first.priority || first.index - second.index
    ));

    const cellSize = 96;
    const grid = new Map();

    candidates.forEach(({ node, x, y }) => {
        const metrics = measureLabel(node, context, fontsReady);
        const box = getLabelBox(metrics.width, getDotRadiusPx(node, camera.k));
        const left = x + box.x - LABEL_COLLISION_MARGIN;
        const top = y + box.y - LABEL_COLLISION_MARGIN;
        const right = left + box.width + LABEL_COLLISION_MARGIN * 2;
        const bottom = top + box.height + LABEL_COLLISION_MARGIN * 2;
        const cells = [];

        for (let cellX = Math.floor(left / cellSize); cellX <= Math.floor(right / cellSize); cellX += 1) {
            for (let cellY = Math.floor(top / cellSize); cellY <= Math.floor(bottom / cellSize); cellY += 1) {
                cells.push(`${cellX}:${cellY}`);
            }
        }

        const overlaps = cells.some((key) => grid.get(key)?.some((other) => (
            left < other.right && right > other.left && top < other.bottom && bottom > other.top
        )));
        if (overlaps) return;

        const rect = { left, top, right, bottom };
        cells.forEach((key) => {
            const cell = grid.get(key);
            if (cell) {
                cell.push(rect);
            } else {
                grid.set(key, [rect]);
            }
        });
        node.__labelTarget = 1;
    });
}

// Draws a label in screen pixels so typography is zoom-independent. Hovered
// node gets a filled chip, its neighbours an outlined one.
function drawLabel(node, context, camera, fontsReady) {
    const focusOpacity = DIMMED_NODE_OPACITY + (1 - DIMMED_NODE_OPACITY) * (node.__focusMix ?? 1);
    const labelMix = node.__labelMix || 0;
    const labelAlpha = labelMix * focusOpacity;
    const hoverMix = node.__hoverMix || 0;
    const outlineMix = (node.__emphasisMix || 0) * (1 - hoverMix);
    const haloAlpha = labelAlpha * (1 - Math.max(hoverMix, outlineMix));
    const metrics = measureLabel(node, context, fontsReady);
    const box = getLabelBox(metrics.width, getDotRadiusPx(node, camera.k));
    const textX = box.x + LABEL_PADDING_X;
    const textY = box.y + box.height / 2 + 0.5;
    const categoryX = textX + metrics.titleWidth + LABEL_CATEGORY_GAP;
    // Labels rise slightly into place as they fade in.
    const rise = (1 - labelMix) * 4;
    const reveal = node.__reveal ?? 1;

    context.save();
    context.setTransform(camera.pixelRatio, 0, 0, camera.pixelRatio, 0, 0);
    context.translate(node.x * camera.k + camera.tx, node.y * camera.k + camera.ty + rise);
    context.scale(reveal, reveal);
    context.font = LABEL_FONT;
    context.letterSpacing = "0px";
    context.textAlign = "left";
    context.textBaseline = "middle";

    if (hoverMix > 0.01) {
        context.globalAlpha = labelAlpha * hoverMix;
        context.fillStyle = NODE_COLOR;
        context.beginPath();
        context.roundRect(box.x, box.y, box.width, box.height, 3);
        context.fill();
    }

    if (outlineMix > 0.01) {
        context.globalAlpha = labelAlpha * outlineMix;
        context.fillStyle = "rgba(255, 255, 255, 0.94)";
        context.strokeStyle = "rgba(0, 121, 255, 0.32)";
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(box.x + 0.5, box.y + 0.5, box.width - 1, box.height - 1, 3);
        context.fill();
        context.stroke();
    }

    if (haloAlpha > 0.01) {
        context.globalAlpha = haloAlpha;
        context.strokeStyle = BACKGROUND_COLOR;
        context.lineWidth = 4;
        context.lineJoin = "round";
        context.strokeText(node.site.title, textX, textY);
        if (metrics.category) context.strokeText(metrics.category, categoryX, textY);
    }

    context.globalAlpha = labelAlpha * (1 - hoverMix);
    context.fillStyle = LABEL_COLOR;
    context.fillText(node.site.title, textX, textY);
    if (metrics.category) {
        context.fillStyle = CATEGORY_COLOR;
        context.fillText(metrics.category, categoryX, textY);
    }

    if (hoverMix > 0.01) {
        context.globalAlpha = labelAlpha * hoverMix;
        context.fillStyle = "#ffffff";
        context.fillText(node.site.title, textX, textY);
        if (metrics.category) {
            context.fillStyle = "rgba(255, 255, 255, 0.66)";
            context.fillText(metrics.category, categoryX, textY);
        }
    }

    context.restore();
}

function getLinkPulse(link) {
    if (link.__pulse) return link.__pulse;

    const seed = Math.abs(hashString(
        `${getLinkNodeId(link.source)}:${getLinkNodeId(link.target)}`
    ));
    link.__pulse = {
        period: 5 + seededUnit(seed + 1) * 6,
        duration: 1.6 + seededUnit(seed + 2) * 1,
        offset: seededUnit(seed + 3) * 11,
        reverse: seed % 2 === 1,
    };

    return link.__pulse;
}

function getLinkPoint(link, progress) {
    const start = link.source;
    const end = link.target;
    const controlPoints = link.__controlPoints;

    if (controlPoints?.length === 2) {
        const inverse = 1 - progress;
        return {
            x: inverse * inverse * start.x
                + 2 * inverse * progress * controlPoints[0]
                + progress * progress * end.x,
            y: inverse * inverse * start.y
                + 2 * inverse * progress * controlPoints[1]
                + progress * progress * end.y,
        };
    }

    return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
    };
}

function getLinkNodeId(endpoint) {
    return typeof endpoint === "object" ? endpoint.id : endpoint;
}

function getGraphLayoutPositions(nodes, links, layoutSeed = 0, layoutScale = 1) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const adjacency = new Map(nodes.map((node) => [node.id, new Set()]));

    links.forEach((link) => {
        const source = getLinkNodeId(link.source);
        const target = getLinkNodeId(link.target);

        if (!nodeById.has(source) || !nodeById.has(target)) return;
        adjacency.get(source).add(target);
        adjacency.get(target).add(source);
    });

    const connectedIds = nodes
        .filter((node) => adjacency.get(node.id).size > 0)
        .map((node) => node.id);
    const visited = new Set();
    const components = [];

    connectedIds.forEach((startId) => {
        if (visited.has(startId)) return;

        const component = [];
        const queue = [startId];
        visited.add(startId);

        while (queue.length) {
            const nodeId = queue.shift();
            component.push(nodeId);
            adjacency.get(nodeId).forEach((neighbourId) => {
                if (visited.has(neighbourId)) return;
                visited.add(neighbourId);
                queue.push(neighbourId);
            });
        }

        components.push(component);
    });

    components.sort((first, second) => second.length - first.length);
    const positions = new Map();
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const seedAngle = seededUnit(layoutSeed + 97) * Math.PI * 2;

    components.forEach((component, componentIndex) => {
        const componentAngle = seedAngle + componentIndex * goldenAngle;
        const componentRadius = componentIndex === 0
            ? 0
            : (
                CONNECTED_COMPONENT_RADIUS
                + Math.sqrt(componentIndex / Math.max(1, components.length - 1)) * 150000
            ) * layoutScale;
        const centerX = Math.cos(componentAngle) * componentRadius;
        const centerY = Math.sin(componentAngle) * componentRadius;
        const orderedIds = [...component].sort((firstId, secondId) => {
            const degreeDifference = adjacency.get(secondId).size - adjacency.get(firstId).size;
            return degreeDifference || firstId.localeCompare(secondId);
        });

        if (orderedIds.length === 2) {
            const pairAngle = componentAngle + Math.PI / 2;
            const pairOffset = CONNECTED_NODE_RADIUS * 0.58 * layoutScale;
            positions.set(orderedIds[0], {
                x: centerX - Math.cos(pairAngle) * pairOffset,
                y: centerY - Math.sin(pairAngle) * pairOffset,
            });
            positions.set(orderedIds[1], {
                x: centerX + Math.cos(pairAngle) * pairOffset,
                y: centerY + Math.sin(pairAngle) * pairOffset,
            });
            return;
        }

        const hubId = orderedIds[0];
        positions.set(hubId, { x: centerX, y: centerY });
        const spokeIds = orderedIds.slice(1);
        const spokeOffset = seededUnit(hashString(hubId) ^ layoutSeed) * Math.PI * 2;

        spokeIds.forEach((nodeId, spokeIndex) => {
            const angle = spokeOffset + spokeIndex * Math.PI * 2 / spokeIds.length;
            const isDirectNeighbour = adjacency.get(hubId).has(nodeId);
            const radius = CONNECTED_NODE_RADIUS
                * (isDirectNeighbour ? 1 : 1.55)
                * (1 + (spokeIndex % 2) * 0.08)
                * layoutScale;

            positions.set(nodeId, {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            });
        });
    });

    const soloNodes = nodes.filter((node) => adjacency.get(node.id).size === 0);
    soloNodes.forEach((node, soloIndex) => {
        const seed = Math.abs(hashString(node.id) ^ layoutSeed);
        const angle = seedAngle + soloIndex * goldenAngle + seededUnit(seed) * 0.18;
        const distribution = Math.sqrt((soloIndex + 1) / Math.max(1, soloNodes.length));
        const radius = (90000 + distribution * INITIAL_LAYOUT_RADIUS * 1.48) * layoutScale;

        positions.set(node.id, {
            x: Math.cos(angle) * radius + (seededUnit(seed + 31) - 0.5) * 18000 * layoutScale,
            y: Math.sin(angle) * radius + (seededUnit(seed + 47) - 0.5) * 18000 * layoutScale,
        });
    });

    return positions;
}

// A link fades in once both of its nodes are well into their flight.
function getLinkReveal(link) {
    return Math.min(link.source?.__linkReveal ?? 1, link.target?.__linkReveal ?? 1);
}

function isLinkRevealed(link) {
    return getLinkReveal(link) > 0;
}

function getLinkCurvature(link) {
    const curvatureIndex = Math.abs(hashString(link.label || "")) % 3;
    return [0, 0.045, -0.045][curvatureIndex];
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
    const overviewZoomRef = useRef(null);
    const fitCameraRef = useRef(null);
    const labelQueueRef = useRef([]);
    const focusClockRef = useRef(0);
    const hoverPresenceRef = useRef(0);
    const physicsRef = useRef({
        phase: "idle",
        settled: false,
        dragging: false,
        hovered: null,
        pointer: null,
        camera: null,
        time: 0,
        pace: 1,
        adjacency: new Map(),
        reducedMotion: prefersReducedMotion(),
    });
    const viewportSizeRef = useRef(getViewportSize());
    const fontsReadyRef = useRef(
        typeof document === "undefined" || !document.fonts || document.fonts.status === "loaded"
    );
    const [size, setSize] = useState(getViewportSize);
    const [hasHoverInput, setHasHoverInput] = useState(hasHoverCapability);
    const [graphInstance, setGraphInstance] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [previewAnchor, setPreviewAnchor] = useState({ x: 0, y: 0 });
    const [isSettled, setIsSettled] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

    const layoutScale = hasHoverInput ? 1 : MOBILE_LAYOUT_SCALE;
    viewportSizeRef.current = size;

    const graphData = useMemo(() => {
        const links = getSiteRelations(sites);
        const relationDegrees = links.reduce((degrees, link) => {
            degrees.set(link.source, (degrees.get(link.source) || 0) + 1);
            degrees.set(link.target, (degrees.get(link.target) || 0) + 1);
            return degrees;
        }, new Map());
        const nodes = sites.map((site) => ({
            id: site.slug,
            site,
            relationDegree: relationDegrees.get(site.slug) || 0,
        }));
        const initialPositions = getGraphLayoutPositions(nodes, links, 0, layoutScale);
        nodes.forEach((node) => Object.assign(node, initialPositions.get(node.id)));

        return { nodes, links };
    }, [layoutScale, sites]);

    const adjacency = useMemo(() => {
        const nextAdjacency = new Map(graphData.nodes.map((node) => [node.id, new Set()]));

        graphData.links.forEach((link) => {
            const source = getLinkNodeId(link.source);
            const target = getLinkNodeId(link.target);
            nextAdjacency.get(source)?.add(target);
            nextAdjacency.get(target)?.add(source);
        });

        return nextAdjacency;
    }, [graphData]);

    physicsRef.current.adjacency = adjacency;
    // Once settled the engine keeps ticking so the graph stays alive.
    const isPerpetual = isSettled && !reducedMotion;

    useLayoutEffect(() => {
        const shell = shellRef.current;
        if (!shell) return undefined;

        const syncSize = (width, height) => {
            const nextSize = {
                width: Math.max(320, Math.round(width)),
                height: Math.max(320, Math.round(height)),
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

        const syncViewportSize = () => {
            const nextRect = shell.getBoundingClientRect();
            if (nextRect.width && nextRect.height) {
                syncSize(nextRect.width, nextRect.height);
            }
        };

        window.visualViewport?.addEventListener("resize", syncViewportSize);
        window.visualViewport?.addEventListener("scroll", syncViewportSize);
        window.addEventListener("resize", syncViewportSize);
        window.addEventListener("orientationchange", syncViewportSize);

        return () => {
            observer.disconnect();
            window.visualViewport?.removeEventListener("resize", syncViewportSize);
            window.visualViewport?.removeEventListener("scroll", syncViewportSize);
            window.removeEventListener("resize", syncViewportSize);
            window.removeEventListener("orientationchange", syncViewportSize);
        };
    }, []);

    useEffect(() => {
        const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
        const syncHoverCapability = () => {
            setHasHoverInput(hoverQuery.matches);
            if (!hoverQuery.matches) {
                hoveredNodeRef.current = null;
                physicsRef.current.hovered = null;
                physicsRef.current.pointer = null;
                setHoveredNode(null);
            }
        };

        syncHoverCapability();
        hoverQuery.addEventListener("change", syncHoverCapability);

        return () => hoverQuery.removeEventListener("change", syncHoverCapability);
    }, []);

    useEffect(() => {
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const syncReducedMotion = () => {
            physicsRef.current.reducedMotion = motionQuery.matches;
            setReducedMotion(motionQuery.matches);
        };

        syncReducedMotion();
        motionQuery.addEventListener("change", syncReducedMotion);

        return () => motionQuery.removeEventListener("change", syncReducedMotion);
    }, []);

    useEffect(() => {
        revealStartRef.current = performance.now();
        hoveredNodeRef.current = null;
        hoverPresenceRef.current = 0;
        physicsRef.current.settled = false;
        physicsRef.current.dragging = false;
        physicsRef.current.hovered = null;
        setHoveredNode(null);
        setIsSettled(false);
    }, [graphData]);

    useEffect(() => {
        if (!document.fonts || fontsReadyRef.current) return undefined;

        let isActive = true;
        document.fonts.ready.then(() => {
            if (!isActive) return;

            fontsReadyRef.current = true;
            // Cached metrics are re-measured on the next painted frame.
            graphData.nodes.forEach((node) => {
                delete node.__labelMetrics;
            });
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
            const positions = getGraphLayoutPositions(
                graphData.nodes,
                graphData.links,
                layoutSeed,
                layoutScale
            );

            graphData.nodes.forEach((node) => {
                Object.assign(node, positions.get(node.id), { vx: 0, vy: 0 });
            });
            randomizedGraphDataRef.current = graphData;

            // Hidden until the first frames relax the layout (prepareFrame).
            physicsRef.current.phase = "relax";
            physicsRef.current.relax = null;
            graphData.nodes.forEach((node) => {
                node.__homeX = null;
                node.__reveal = 0;
                node.__linkReveal = 0;
            });
        }

        const getAlphaCap = () => {
            const physics = physicsRef.current;
            if (!physics.settled) return Number.POSITIVE_INFINITY;
            // Layout forces stay out of the way while nodes spiral in.
            if (physics.phase === "reveal") return 0;

            return physics.dragging ? DRAG_ALPHA_CAP : SOFT_ALPHA_CAP;
        };
        const chargeForce = softenForce(graph.d3Force("charge"), getAlphaCap);
        const linkForce = softenForce(graph.d3Force("link"), getAlphaCap);
        // Once homes exist they anchor the graph; recentring would fight them.
        const centerForce = gateForce(
            graph.d3Force("center"),
            () => !physicsRef.current.settled
        );
        graph.d3Force("center", centerForce);
        const collisionForce = createCollisionForce(layoutScale)
            .strength(0.11)
            .damping(0.16)
            .maxImpulse(54 * GRAPH_SPACING_MULTIPLIER * layoutScale);

        graph.d3Force("charge", chargeForce);
        graph.d3Force("link", linkForce);

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
        graph.d3Force("collide", softenForce(collisionForce, getAlphaCap));
        graph.d3Force("soft", createSoftForce(physicsRef));
        graph.d3ReheatSimulation();

        // Fit to the homes, not to the nodes still spiralling in.
        const setOverviewCamera = () => {
            const padding = hasHoverInput ? 72 : 28;
            const viewport = viewportSizeRef.current;
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            graphData.nodes.forEach((node) => {
                const x = node.__homeX ?? node.x;
                const y = node.__homeY ?? node.y;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            });
            if (!Number.isFinite(minX)) return;

            const zoom = Math.min(
                (viewport.width - padding * 2) / Math.max(1, maxX - minX),
                (viewport.height - padding * 2) / Math.max(1, maxY - minY)
            );
            graph.zoom(zoom, 0);
            graph.centerAt((minX + maxX) / 2, (minY + maxY) / 2, 0);
            overviewZoomRef.current = zoom;
        };

        fitCameraRef.current = setOverviewCamera;
        setOverviewCamera();
        const overviewFrame = window.requestAnimationFrame(setOverviewCamera);
        const overviewTimer = window.setTimeout(setOverviewCamera, 120);

        // Keep viewport resizing separate from camera initialization. On mobile,
        // visualViewport changes during pinch gestures and must not reset the zoom.
        return () => {
            window.cancelAnimationFrame(overviewFrame);
            window.clearTimeout(overviewTimer);
        };
    }, [graphData, graphInstance, hasHoverInput, layoutScale]);

    const handleGraphRef = useCallback((node) => {
        graphRef.current = node;
        setGraphInstance((currentNode) => (currentNode === node ? currentNode : node));
    }, []);

    const updatePreviewAnchor = useCallback((node = hoveredNodeRef.current) => {
        if (!node || !graphRef.current) return;
        setPreviewAnchor(graphRef.current.graph2ScreenCoords(node.x, node.y));
    }, []);

    const setHover = useCallback((node) => {
        const nextNode = node || null;
        if (hoveredNodeRef.current === nextNode) return;

        hoveredNodeRef.current = nextNode;
        physicsRef.current.hovered = nextNode;
        setHoveredNode(nextNode);
        if (nextNode) updatePreviewAnchor(nextNode);
        // The perpetual engine is already ticking; with reduced motion it
        // stops after settling and needs a nudge to animate the hover.
        const physics = physicsRef.current;
        if (physics.settled && physics.reducedMotion) graphRef.current?.d3ReheatSimulation();
    }, [updatePreviewAnchor]);

    const handlePointerMove = useCallback((event) => {
        if (event.pointerType !== "mouse" || !shellRef.current) return;

        const rect = shellRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const now = performance.now();
        const previous = physicsRef.current.pointer;
        let vx = 0;
        let vy = 0;

        if (previous) {
            const elapsed = Math.max(4, now - previous.time) / 1000;
            vx = previous.vx * 0.4 + (x - previous.x) / elapsed * 0.6;
            vy = previous.vy * 0.4 + (y - previous.y) / elapsed * 0.6;
        }

        physicsRef.current.pointer = { x, y, vx, vy, time: now };
    }, []);

    const handlePointerLeave = useCallback(() => {
        physicsRef.current.pointer = null;
        setHover(null);
    }, [setHover]);

    // Relaxes the layout headlessly, captures homes and launches the reveal.
    // Waits until force-graph has fed nodes and links into the forces.
    const relaxAndLaunch = useCallback(() => {
        const graph = graphRef.current;
        const linksReady = graphData.links.every((link) => typeof link.source === "object");
        if (!graph || !linksReady) return;

        const physics = physicsRef.current;
        physics.relax ??= { tick: 0, alpha: 1 };
        const isRelaxed = relaxLayout(
            graphData.nodes,
            ["charge", "link", "collide", "center"].map((name) => graph.d3Force(name)),
            physics.relax
        );
        if (!isRelaxed) return;

        physics.relax = null;
        captureHomes(graphData.nodes, adjacency);
        physics.settled = true;
        physics.time = 0;
        setIsSettled(true);
        fitCameraRef.current?.();

        if (physics.reducedMotion) {
            physics.phase = "live";
            graphData.nodes.forEach((node) => {
                node.__reveal = 1;
                node.__linkReveal = 1;
            });
            return;
        }

        // Inner nodes launch first, so the graph unrolls outwards.
        physics.phase = "reveal";
        revealStartRef.current = performance.now();
        const byRadius = [...graphData.nodes].sort((first, second) => (
            Math.hypot(first.__homeX, first.__homeY) - Math.hypot(second.__homeX, second.__homeY)
        ));
        byRadius.forEach((node, rank) => {
            node.__revealDelay = rank / Math.max(1, byRadius.length - 1) * REVEAL_STAGGER_MS;
            node.__launched = false;
            node.__revealBlend = 0;
            node.__inFlight = true;
            node.fx = node.x = 0;
            node.fy = node.y = 0;
        });
        graph.d3ReheatSimulation();
    }, [adjacency, graphData]);

    // Launches each node with a swirling velocity; from then on the reveal
    // spring in the soft force carries it home with real inertia.
    const advanceReveal = useCallback((now) => {
        const physics = physicsRef.current;
        const elapsed = now - revealStartRef.current;
        let isComplete = true;

        graphData.nodes.forEach((node) => {
            const age = elapsed - node.__revealDelay;

            if (age < 0) {
                isComplete = false;
                node.__reveal = 0;
                node.__linkReveal = 0;
                return;
            }

            if (!node.__launched) {
                node.__launched = true;
                node.fx = undefined;
                node.fy = undefined;
                node.vx = -node.__homeY * REVEAL_SWIRL + node.__homeX * REVEAL_OUTWARD;
                node.vy = node.__homeX * REVEAL_SWIRL + node.__homeY * REVEAL_OUTWARD;
            }

            node.__reveal = easeOutCubic(clamp01(age / REVEAL_SCALE_MS));
            node.__linkReveal = clamp01((age - 250) / 450);
            node.__revealBlend = smoothstep01(age / REVEAL_BLEND_MS);
            node.__inFlight = node.__revealBlend < 1;
            if (node.__inFlight) isComplete = false;
        });

        if (isComplete) physics.phase = "live";
    }, [graphData]);

    const prepareFrame = useCallback((context, globalScale) => {
        const physics = physicsRef.current;
        const matrix = context.getTransform();
        const pixelRatio = matrix.a / globalScale || window.devicePixelRatio || 1;
        physics.camera = {
            k: globalScale,
            tx: matrix.e / pixelRatio,
            ty: matrix.f / pixelRatio,
            pixelRatio,
        };

        const now = performance.now();
        if (physics.phase === "relax") relaxAndLaunch();
        if (physics.phase === "reveal") advanceReveal(now);

        const delta = focusClockRef.current
            ? Math.min(MAX_FRAME_DELTA_MS, now - focusClockRef.current)
            : 16;
        focusClockRef.current = now;

        const reducedMotion = physics.reducedMotion;
        const fade = reducedMotion ? 1 : 1 - Math.exp(-delta / FOCUS_FADE_MS);
        const labelFade = reducedMotion ? 1 : 1 - Math.exp(-delta / LABEL_FADE_MS);
        const step = delta / 1000;
        const hovered = hoveredNodeRef.current;
        const related = hovered ? adjacency.get(hovered.id) : null;

        hoverPresenceRef.current = approach(hoverPresenceRef.current, hovered ? 1 : 0, fade);
        physics.pace = 1 - (1 - HOVER_SLOW) * hoverPresenceRef.current;

        graphData.nodes.forEach((node) => {
            const isHovered = hovered?.id === node.id;
            const isEmphasized = isHovered || Boolean(related?.has(node.id));
            node.__isHovered = isHovered;
            node.__isEmphasized = isEmphasized;
        });

        placeLabels(
            graphData.nodes,
            context,
            physics.camera,
            viewportSizeRef.current,
            globalScale / (overviewZoomRef.current || globalScale),
            fontsReadyRef.current
        );

        graphData.nodes.forEach((node) => {
            const isHovered = node.__isHovered;
            const isEmphasized = node.__isEmphasized;
            const scaleTarget = isHovered ? 1 : 0;

            node.__labelMix = approach(node.__labelMix || 0, node.__labelTarget, labelFade);
            node.__hoverMix = approach(node.__hoverMix || 0, scaleTarget, fade);
            node.__emphasisMix = approach(node.__emphasisMix || 0, isEmphasized ? 1 : 0, fade);
            node.__focusMix = approach(node.__focusMix ?? 1, !hovered || isEmphasized ? 1 : 0, fade);

            if (reducedMotion) {
                node.__hoverScale = scaleTarget;
                node.__hoverScaleVelocity = 0;
                return;
            }

            const value = node.__hoverScale || 0;
            const velocity = node.__hoverScaleVelocity || 0;
            const acceleration =
                HOVER_SPRING_STIFFNESS * (scaleTarget - value)
                - HOVER_SPRING_DAMPING * velocity;
            const nextVelocity = velocity + acceleration * step;
            const nextValue = value + nextVelocity * step;
            const isAtRest = Math.abs(scaleTarget - nextValue) < 0.001 && Math.abs(nextVelocity) < 0.01;

            node.__hoverScale = isAtRest ? scaleTarget : nextValue;
            node.__hoverScaleVelocity = isAtRest ? 0 : nextVelocity;
        });
    }, [adjacency, advanceReveal, graphData, relaxAndLaunch]);

    const getLinkFocus = useCallback((link) => {
        const highlight = Math.max(link.source?.__hoverMix || 0, link.target?.__hoverMix || 0);
        const dim = hoverPresenceRef.current * (1 - highlight);

        return { highlight, dim };
    }, []);

    const getLinkColor = useCallback((link) => {
        const { highlight, dim } = getLinkFocus(link);
        const alpha = (0.72 + 0.23 * highlight) * (1 - 0.8 * dim) * getLinkReveal(link);

        return `rgba(0, 121, 255, ${alpha.toFixed(3)})`;
    }, [getLinkFocus]);

    const getLinkWidth = useCallback((link) => {
        const { highlight, dim } = getLinkFocus(link);

        return 2.2 + 1.6 * highlight - 1.1 * dim;
    }, [getLinkFocus]);

    const drawLinkPulse = useCallback((link, context, globalScale) => {
        if (physicsRef.current.reducedMotion || getLinkReveal(link) < 1) return;
        if (link.source?.x == null || link.target?.x == null) return;

        const pulse = getLinkPulse(link);
        const elapsed = (performance.now() / 1000 + pulse.offset) % pulse.period;
        if (elapsed > pulse.duration) return;

        const head = elapsed / pulse.duration * (1 + PULSE_TRAIL);
        const tail = head - PULSE_TRAIL;
        const { highlight, dim } = getLinkFocus(link);
        const strength = PULSE_ALPHA * (1 - 0.85 * dim) * (0.8 + 0.2 * highlight);

        context.lineCap = "round";
        context.strokeStyle = NODE_COLOR;
        context.lineWidth = (getLinkWidth(link) + 1.4) / globalScale;

        for (let index = 0; index < PULSE_STEPS; index += 1) {
            const from = Math.max(0, tail + (head - tail) * index / PULSE_STEPS);
            const to = Math.min(1, tail + (head - tail) * (index + 1) / PULSE_STEPS);
            if (to <= from) continue;

            const start = getLinkPoint(link, pulse.reverse ? 1 - from : from);
            const end = getLinkPoint(link, pulse.reverse ? 1 - to : to);
            context.globalAlpha = strength * Math.pow((index + 1) / PULSE_STEPS, 2);
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();
        }
    }, [getLinkFocus, getLinkWidth]);

    const handleNodeDrag = useCallback((node) => {
        physicsRef.current.dragging = true;
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
        physicsRef.current.dragging = false;

        if (motion && performance.now() - motion.time < 120) {
            node.vx = motion.velocityX * 0.82;
            node.vy = motion.velocityY * 0.82;
        }

        graphRef.current?.d3ReheatSimulation();
    }, []);

    const handleNodeClick = useCallback((node, event) => {
        if (!node?.site) return;

        event?.stopPropagation?.();
        setHover(null);
        onOpen(node.site);
    }, [onOpen, setHover]);

    const isNodeVisible = useCallback((node) => {
        const camera = physicsRef.current.camera;
        if (!camera) return true;

        const viewport = viewportSizeRef.current;
        const screenX = node.x * camera.k + camera.tx;
        const screenY = node.y * camera.k + camera.ty;
        const horizontalMargin = (node.__labelMetrics?.width || 280) / 2 + 40;
        const verticalMargin = 96;

        return (
            screenX >= -horizontalMargin
            && screenX <= viewport.width + horizontalMargin
            && screenY >= -verticalMargin
            && screenY <= viewport.height + verticalMargin
        );
    }, []);

    const drawNode = useCallback((node, context, globalScale) => {
        const eased = node.__reveal ?? 1;
        if (eased <= 0) return;

        const focusMix = node.__focusMix ?? 1;
        const hoverScale = node.__hoverScale || 0;
        const labelMix = node.__labelMix || 0;
        const focusOpacity = DIMMED_NODE_OPACITY + (1 - DIMMED_NODE_OPACITY) * focusMix;
        const labelAlpha = labelMix * focusOpacity;
        const dotRadius = getDotRadiusPx(node, globalScale);
        const radius = dotRadius / globalScale;

        context.save();
        context.translate(node.x, node.y);
        context.scale(eased, eased);
        context.shadowColor = "transparent";
        context.shadowBlur = 0;

        const haloMix = clamp01(hoverScale);
        if (haloMix > 0.01) {
            context.globalAlpha = 0.14 * haloMix;
            context.fillStyle = NODE_COLOR;
            context.beginPath();
            context.arc(0, 0, radius * (1.4 + haloMix * 0.9), 0, Math.PI * 2);
            context.fill();
        }

        context.globalAlpha = focusOpacity;
        context.fillStyle = NODE_COLOR;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fill();
        node.__paintRadius = Math.max(radius * 1.6, 10 / globalScale);

        context.restore();

        if (labelAlpha < 0.01) {
            node.__pointerBounds = null;
            return;
        }

        const metrics = measureLabel(node, context, fontsReadyRef.current);
        const box = getLabelBox(metrics.width, dotRadius);
        node.__pointerBounds = labelMix >= LABEL_HIT_ALPHA
            ? {
                x: box.x / globalScale,
                y: box.y / globalScale,
                width: box.width / globalScale,
                height: (box.height + LABEL_OFFSET) / globalScale + radius,
            }
            : null;
        // Labels are painted after all dots, see drawLabels.
        labelQueueRef.current.push(node);
    }, []);

    const drawLabels = useCallback((context) => {
        const camera = physicsRef.current.camera;
        const queue = labelQueueRef.current;
        labelQueueRef.current = [];
        if (!camera) return;

        queue
            .sort((first, second) => (
                (first.__hoverMix || 0) - (second.__hoverMix || 0)
                || (first.__emphasisMix || 0) - (second.__emphasisMix || 0)
            ))
            .forEach((node) => drawLabel(node, context, camera, fontsReadyRef.current));
    }, []);

    const paintPointerArea = useCallback((node, color, context) => {
        const bounds = node.__pointerBounds;

        context.fillStyle = color;
        if (bounds) {
            context.fillRect(node.x + bounds.x, node.y + bounds.y, bounds.width, bounds.height);
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
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
        >
            <ForceGraph2D
                ref={handleGraphRef}
                width={size.width}
                height={size.height}
                graphData={graphData}
                backgroundColor={BACKGROUND_COLOR}
                nodeVisibility={isNodeVisible}
                nodeCanvasObject={drawNode}
                nodePointerAreaPaint={paintPointerArea}
                linkColor={getLinkColor}
                linkWidth={getLinkWidth}
                linkCurvature={getLinkCurvature}
                linkVisibility={isLinkRevealed}
                linkCanvasObject={drawLinkPulse}
                linkCanvasObjectMode="after"
                linkLabel="label"
                onRenderFramePre={prepareFrame}
                onRenderFramePost={drawLabels}
                onNodeHover={hasHoverInput ? setHover : undefined}
                onNodeClick={handleNodeClick}
                onBackgroundClick={hasHoverInput ? () => setHover(null) : undefined}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                onZoom={() => updatePreviewAnchor()}
                enableNodeDrag={hasHoverInput}
                showPointerCursor={hasHoverInput}
                warmupTicks={0}
                cooldownTicks={isPerpetual ? Number.POSITIVE_INFINITY : hasHoverInput ? 420 : 180}
                cooldownTime={isPerpetual ? Number.POSITIVE_INFINITY : hasHoverInput ? 30000 : 6000}
                d3AlphaDecay={hasHoverInput ? 0.006 : 0.028}
                d3VelocityDecay={
                    isPerpetual ? SETTLED_VELOCITY_DECAY : hasHoverInput ? 0.2 : 0.22
                }
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ExploreMap from "@/components/ExploreMap";

// ==================================================
// RECOMMENDATION DATA
// ==================================================

type Recommendation = {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    rating: number;
    priceLevel: number;
    score: number;
    displayScore?: number;
    reasons: string[];
    matchedInterests: string[];
    visitors: string[];
    recommenders: string[];
    nearbyVisitors?: string[];
    nearbyAreas?: string[];
};

// ==================================================
// AVAILABLE AREAS
//
// Coordinates are used only for the lightweight initial
// map overview. Recommendation data still comes from
// the real graph/API after an area is selected.
// ==================================================

const areas = [
    {
        id: "area1",
        name: "HSR Layout",
        latitude: 12.9116,
        longitude: 77.6389,
    },
    {
        id: "area2",
        name: "Koramangala",
        latitude: 12.9352,
        longitude: 77.6245,
    },
];

// ==================================================
// PLACE ACTION TYPES
// ==================================================

type PlaceAction =
    | "save"
    | "visit"
    | "recommend";

type PlaceActionState = {
    save: boolean;
    visit: boolean;
    recommend: boolean;
};

type GraphNode = {
    id: string;
    label: string;
    type: "you" | "person" | "place" | "interest" | "verdict";
    relation?: string;
    x: number;
    y: number;
};

type GraphEdge = {
    from: string;
    to: string;
    label: string;
    tone?: "green" | "slate";
};

function NetworkGraph({
    place,
    userName,
    avatarUrl,
    mode,
    areaName,
}: {
    place: Recommendation;
    userName: string;
    avatarUrl: (name: string) => string;
    mode: "for-you" | "friends" | "discover";
    areaName?: string;
}) {
    const visitors = place.visitors ?? [];
    const recommenders = place.recommenders ?? [];

    const people = Array.from(
        new Set([...visitors, ...recommenders])
    );

    const nearby = (
        place.nearbyVisitors ?? []
    ).filter(
        (name) => !people.includes(name)
    );

    const interest =
        place.matchedInterests[0] ?? null;

    const verdict = (() => {
        if (mode === "discover") {
            return people.length || nearby.length
                ? "Worth discovering"
                : "New place to explore";
        }

        if (mode === "friends") {
            return people.length
                ? "Strong social signal"
                : nearby.length
                    ? "Friends are active nearby"
                    : "No friend signal yet";
        }

        if (
            interest &&
            (people.length || nearby.length)
        ) {
            return "Top recommendation for you";
        }

        if (interest) {
            return "Personal match";
        }

        if (people.length) {
            return "Top recommendation for you";
        }

        if (nearby.length) {
            return "Worth exploring";
        }

        return "New place to discover";
    })();

    // Keep the graph intentionally small:
    // only relationships that help explain
    // why this place is being shown.
    const visiblePeople = [
        ...people,
        ...nearby,
    ];

    const columns = Math.min(
        5,
        Math.max(1, visiblePeople.length)
    );

    const rows = Math.max(
        1,
        Math.ceil(
            visiblePeople.length / columns
        )
    );

    const xFor = (index: number) =>
        columns === 1
            ? 500
            : 140 +
            (index % columns) *
            (720 / (columns - 1));

    const yFor = (index: number) =>
        150 +
        Math.floor(index / columns) * 115;

    const nodes: GraphNode[] = [
        // ==============================================
        // FOR YOU:
        // YOU → INTEREST → PLACE
        // ==============================================

        ...(mode === "for-you"
            ? [
                {
                    id: "you",
                    label: userName,
                    type: "you" as const,
                    x: 500,
                    y: 65,
                },
            ]
            : []),

        ...(mode === "for-you" && interest
            ? [
                {
                    id: "interest",
                    label: interest,
                    type: "interest" as const,
                    x: 500,
                    y: 185,
                },
            ]
            : []),

        // ==============================================
        // DISCOVER:
        // AREA → PLACE
        // ==============================================

        ...(mode === "discover"
            ? [
                {
                    id: "area",
                    label:
                        areaName ??
                        "This area",
                    type: "interest" as const,
                    x: 500,
                    y: 90,
                },
            ]
            : []),

        // ==============================================
        // FRIEND / SOCIAL SIGNALS
        //
        // These sit around the main path and connect
        // into the recommended place.
        // ==============================================

        ...visiblePeople.map(
            (name, index) => ({
                id: `person-${name}`,
                label: name,
                type: "person" as const,

                relation: recommenders.includes(
                    name
                )
                    ? visitors.includes(name)
                        ? "VISITED + RECOMMENDED"
                        : "RECOMMENDED"
                    : nearby.includes(name)
                        ? "NEARBY"
                        : "VISITED",

                x: xFor(index),
                y: 315,
            })
        ),

        // ==============================================
        // PLACE
        // ==============================================

        {
            id: "place",
            label: place.name,
            type: "place",
            x: 500,
            y: 430,
        },

        // ==============================================
        // CONCLUSION
        // ==============================================

        {
            id: "verdict",
            label: verdict,
            type: "verdict" as const,
            x: 500,
            y: 585,
        },
    ];

    const edges: GraphEdge[] = [
        // ==============================================
        // FOR YOU:
        // YOU → INTEREST → PLACE
        // ==============================================

        ...(mode === "for-you" &&
            interest
            ? [
                {
                    from: "you",
                    to: "interest",
                    label: "likes",
                    tone: "green" as const,
                },
                {
                    from: "interest",
                    to: "place",
                    label: "matches",
                    tone: "green" as const,
                },
            ]
            : []),

        // ==============================================
        // DISCOVER:
        // AREA → PLACE
        // ==============================================

        ...(mode === "discover"
            ? [
                {
                    from: "area",
                    to: "place",
                    label: "in this area",
                    tone: "slate" as const,
                },
            ]
            : []),

        // ==============================================
        // SOCIAL SIGNALS → PLACE
        // ==============================================

        ...visiblePeople.map(
            (name) => ({
                from: `person-${name}`,
                to: "place",

                label: recommenders.includes(
                    name
                )
                    ? visitors.includes(name)
                        ? "visited + recommended"
                        : "recommended"
                    : nearby.includes(name)
                        ? "nearby"
                        : "visited",

                tone:
                    recommenders.includes(name)
                        ? "green" as const
                        : "slate" as const,
            })
        ),

        // ==============================================
        // PLACE → CONCLUSION
        // ==============================================

        {
            from: "place",
            to: "verdict",
            label: "so",
            tone: "green" as const,
        },
    ];

    const [
        positions,
        setPositions,
    ] = useState<
        Record<
            string,
            { x: number; y: number }
        >
    >(
        Object.fromEntries(
            nodes.map((node) => [
                node.id,
                {
                    x: node.x,
                    y: node.y,
                },
            ])
        )
    );

    const [zoom, setZoom] =
        useState(1);

    const [pan, setPan] =
        useState({
            x: 0,
            y: 0,
        });

    const [dragging, setDragging] =
        useState<string | null>(null);

    const [dragOffset, setDragOffset] =
        useState({
            x: 0,
            y: 0,
        });

    const [panning, setPanning] =
        useState(false);

    const panStart = useRef({
        x: 0,
        y: 0,
        px: 0,
        py: 0,
    });

    useEffect(() => {
        setPositions(
            Object.fromEntries(
                nodes.map((node) => [
                    node.id,
                    {
                        x: node.x,
                        y: node.y,
                    },
                ])
            )
        );

        setZoom(1);

        setPan({
            x: 0,
            y: 0,
        });
    }, [place.id, mode]);

    const fitView = () => {
        setZoom(0.9);

        setPan({
            x: 0,
            y: 0,
        });
    };

    const nodeById =
        Object.fromEntries(
            nodes.map((node) => [
                node.id,
                node,
            ])
        );

    return (
        <div
            className="relative mt-5 h-[min(64vh,620px)] min-h-[460px] overflow-hidden rounded-3xl border border-slate-100 bg-slate-50"
            onWheel={(e) => {
                e.preventDefault();

                setZoom((value) =>
                    Math.min(
                        1.7,
                        Math.max(
                            0.55,
                            value +
                            (e.deltaY > 0
                                ? -0.08
                                : 0.08)
                        )
                    )
                );
            }}
            onPointerDown={(e) => {
                const target =
                    e.target as HTMLElement;

                if (
                    target.closest?.(
                        ".graph-node"
                    )
                ) {
                    return;
                }

                setPanning(true);

                panStart.current = {
                    x: e.clientX,
                    y: e.clientY,
                    px: pan.x,
                    py: pan.y,
                };
            }}
            onPointerMove={(e) => {
                if (!panning) return;

                setPan({
                    x:
                        panStart.current.px +
                        e.clientX -
                        panStart.current.x,

                    y:
                        panStart.current.py +
                        e.clientY -
                        panStart.current.y,
                });
            }}
            onPointerUp={() =>
                setPanning(false)
            }
            onPointerLeave={() =>
                setPanning(false)
            }
        >
            <div className="absolute right-3 top-3 z-20 flex gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm">
                <button
                    onClick={() =>
                        setZoom((z) =>
                            Math.min(
                                1.7,
                                z + 0.12
                            )
                        )
                    }
                    className="h-8 w-8 rounded-lg text-sm font-semibold hover:bg-slate-100"
                >
                    +
                </button>

                <button
                    onClick={() =>
                        setZoom((z) =>
                            Math.max(
                                0.55,
                                z - 0.12
                            )
                        )
                    }
                    className="h-8 w-8 rounded-lg text-sm font-semibold hover:bg-slate-100"
                >
                    −
                </button>

                <button
                    onClick={fitView}
                    className="rounded-lg px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                >
                    Fit
                </button>
            </div>

            <div
                className="absolute left-1/2 top-1/2 h-[820px] w-[1100px]"
                style={{
                    transform:
                        `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                    transformOrigin:
                        "center",
                }}
            >
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 1100 820"
                    fill="none"
                >
                    {edges.map(
                        (
                            edge,
                            index
                        ) => {
                            const from =
                                positions[
                                edge.from
                                ] ??
                                nodeById[
                                edge.from
                                ];

                            const to =
                                positions[
                                edge.to
                                ] ??
                                nodeById[
                                edge.to
                                ];

                            if (
                                !from ||
                                !to
                            ) {
                                return null;
                            }

                            const mx =
                                (from.x +
                                    to.x) /
                                2;

                            const my =
                                (from.y +
                                    to.y) /
                                2;

                            return (
                                <g
                                    key={`${edge.from}-${edge.to}-${index}`}
                                >
                                    <line
                                        x1={from.x}
                                        y1={from.y}
                                        x2={to.x}
                                        y2={to.y}
                                        stroke={
                                            edge.tone ===
                                                "green"
                                                ? "#10b981"
                                                : "#94a3b8"
                                        }
                                        strokeWidth={
                                            edge.tone ===
                                                "green"
                                                ? 3
                                                : 2
                                        }
                                    />

                                    <rect
                                        x={
                                            mx -
                                            48
                                        }
                                        y={
                                            my -
                                            10
                                        }
                                        width="96"
                                        height="20"
                                        rx="10"
                                        fill="white"
                                        opacity="0.94"
                                    />

                                    <text
                                        x={mx}
                                        y={
                                            my +
                                            3.5
                                        }
                                        textAnchor="middle"
                                        fontSize="8.5"
                                        fontWeight="700"
                                        fill={
                                            edge.tone ===
                                                "green"
                                                ? "#047857"
                                                : "#64748b"
                                        }
                                    >
                                        {
                                            edge.label
                                        }
                                    </text>
                                </g>
                            );
                        }
                    )}
                </svg>

                {nodes.map((node) => {
                    const pos =
                        positions[
                        node.id
                        ] ?? {
                            x: node.x,
                            y: node.y,
                        };

                    const isPlace =
                        node.type ===
                        "place";

                    const isYou =
                        node.type ===
                        "you";

                    return (
                        <div
                            key={node.id}
                            className="graph-node absolute -translate-x-1/2 -translate-y-1/2 cursor-grab select-none active:cursor-grabbing"
                            style={{
                                left: pos.x,
                                top: pos.y,
                            }}
                            onPointerDown={(
                                e
                            ) => {
                                e.stopPropagation();

                                setDragging(
                                    node.id
                                );

                                setDragOffset(
                                    {
                                        x:
                                            e.clientX -
                                            pos.x *
                                            zoom -
                                            pan.x,

                                        y:
                                            e.clientY -
                                            pos.y *
                                            zoom -
                                            pan.y,
                                    }
                                );

                                (
                                    e.currentTarget as HTMLElement
                                ).setPointerCapture(
                                    e.pointerId
                                );
                            }}
                            onPointerMove={(
                                e
                            ) => {
                                if (
                                    dragging !==
                                    node.id
                                ) {
                                    return;
                                }

                                setPositions(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        [node.id]:
                                        {
                                            x:
                                                (e.clientX -
                                                    dragOffset.x -
                                                    pan.x) /
                                                zoom,

                                            y:
                                                (e.clientY -
                                                    dragOffset.y -
                                                    pan.y) /
                                                zoom,
                                        },
                                    })
                                );
                            }}
                            onPointerUp={() =>
                                setDragging(
                                    null
                                )
                            }
                        >
                            {node.type ===
                                "interest" ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center shadow-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                        {mode ===
                                            "discover"
                                            ? "AREA"
                                            : "YOUR INTEREST"}
                                    </p>

                                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                                        {mode ===
                                            "discover"
                                            ? "📍"
                                            : "☕"}{" "}
                                        {
                                            node.label
                                        }
                                    </p>
                                </div>
                            ) : node.type ===
                                "verdict" ? (
                                <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-6 py-3 text-center shadow-lg">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                        WHY THIS SHOWS UP
                                    </p>

                                    <p className="mt-1 max-w-[220px] text-sm font-bold text-emerald-900">
                                        {
                                            node.label
                                        }
                                    </p>
                                </div>
                            ) : isPlace ? (
                                <div className="rounded-2xl border-2 border-emerald-400 bg-white px-6 py-4 text-center shadow-xl">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                        PLACE
                                    </p>

                                    <p className="mt-1 max-w-[190px] text-sm font-bold text-slate-900">
                                        {
                                            node.label
                                        }
                                    </p>
                                </div>
                            ) : isYou ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-base font-bold text-white shadow-lg">
                                        {node.label
                                            .charAt(
                                                0
                                            )
                                            .toUpperCase()}
                                    </div>

                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                        {
                                            node.label
                                        }
                                    </p>

                                    <p className="text-[10px] font-semibold text-emerald-600">
                                        YOU
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <img
                                        src={avatarUrl(
                                            node.label
                                        )}
                                        alt={
                                            node.label
                                        }
                                        className="h-14 w-14 rounded-full border-2 border-white bg-white object-cover shadow-lg"
                                    />

                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                        {
                                            node.label
                                        }
                                    </p>

                                    <p className="max-w-[120px] text-center text-[9px] font-semibold text-slate-400">
                                        {
                                            node.relation
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="absolute bottom-3 left-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-500 shadow-sm">
                Drag nodes • drag empty space to pan • scroll to zoom
            </div>
        </div>
    );
}

// ==================================================
// PAGE
// ==================================================

export default function ExplorePage() {
    const router = useRouter();

    // ==================================================
    // USER
    // ==================================================

    const [userId, setUserId] =
        useState<string | null>(
            null
        );

    const [userName, setUserName] =
        useState("");

    // ==================================================
    // DEMO USERS
    //
    // We keep 10 users in the graph, but expose 4 here
    // for easy demonstration of different graph contexts.
    // ==================================================

    const demoUsers = [
        {
            id: "u1",
            name: "Arjun",
        },
        {
            id: "u2",
            name: "Rahul",
        },
        {
            id: "u3",
            name: "Priya",
        },
        {
            id: "u4",
            name: "Aisha",
        },
    ];

    // ==================================================
    // AREA
    //
    // We intentionally don't select an area until the
    // user chooses one from the initial map overview.
    // ==================================================

    const [areaId, setAreaId] =
        useState("area1");

    const [
        areaSelected,
        setAreaSelected,
    ] = useState(false);

    // ==================================================
    // DISCOVERY MODE
    // ==================================================

    const [mode, setMode] =
        useState<
            | "for-you"
            | "friends"
            | "discover"
        >("for-you");

    // ==================================================
    // RECOMMENDATIONS
    // ==================================================

    const [
        recommendations,
        setRecommendations,
    ] = useState<
        Recommendation[]
    >([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==================================================
    // PROGRESSIVE LOADING
    //
    // First 5 places are shown on both the list/map.
    // ==================================================

    const [
        visibleCount,
        setVisibleCount,
    ] = useState(5);

    // ==================================================
    // MAP / CARD SELECTION
    // ==================================================

    const [
        selectedPlaceId,
        setSelectedPlaceId,
    ] = useState<string | null>(
        null
    );

    const [
        selectedPosition,
        setSelectedPosition,
    ] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const [
        showNetwork,
        setShowNetwork,
    ] = useState(false);

    // ==================================================
    // PLACE ACTION STATE
    //
    // Each place has independent Save / Visit /
    // Recommend state.
    //
    // All three can be active together.
    // ==================================================

    const [
        actionLoading,
        setActionLoading,
    ] = useState<{
        placeId: string;
        action: PlaceAction;
    } | null>(null);

    const [
        actionStates,
        setActionStates,
    ] = useState<
        Record<
            string,
            PlaceActionState
        >
    >({});

    // ==================================================
    // INITIAL MAP OVERVIEW
    // ==================================================

    const initialOverview =
        !areaSelected;

    // ==================================================
    // VISIBLE RECOMMENDATIONS
    // ==================================================

    const visibleRecommendations =
        useMemo(
            () =>
                recommendations.slice(
                    0,
                    visibleCount
                ),
            [
                recommendations,
                visibleCount,
            ]
        );

    // ==================================================
    // SELECTED PLACE
    // ==================================================

    const selectedPlace =
        recommendations.find(
            (place) =>
                place.id ===
                selectedPlaceId
        ) ?? null;

    // ==================================================
    // GET LOGGED-IN USER
    // ==================================================

    useEffect(() => {
        const storedUserId =
            localStorage.getItem(
                "userId"
            );

        if (!storedUserId) {
            router.push("/login");
            return;
        }

        setUserId(
            storedUserId
        );

        setUserId(
            storedUserId
        );

        const currentUser =
            demoUsers.find(
                (user) =>
                    user.id ===
                    storedUserId
            );

        setUserName(
            currentUser?.name ??
            "Explorer"
        );
    }, [router]);

    // ==================================================
    // LOAD RECOMMENDATIONS
    //
    // IMPORTANT:
    // Don't call the API while the initial area overview
    // is being shown.
    // ==================================================

    useEffect(() => {
        if (
            !userId ||
            !areaSelected
        ) {
            return;
        }

        async function loadRecommendations() {
            setLoading(true);
            setError("");

            // Clear stale results immediately.
            setRecommendations(
                []
            );

            setVisibleCount(
                5
            );

            setSelectedPlaceId(
                null
            );

            try {
                const response =
                    await fetch(
                        `/api/recommendations?userId=${userId}&areaId=${areaId}&mode=${mode}`
                    );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load recommendations"
                    );
                }

                const data =
                    await response.json();

                setRecommendations(
                    data
                );
            } catch (
            error
            ) {
                console.error(
                    error
                );

                setError(
                    "Could not load recommendations."
                );
            } finally {
                setLoading(
                    false
                );
            }
        }

        loadRecommendations();
    }, [
        userId,
        areaId,
        mode,
        areaSelected,
    ]);

    // ==================================================
    // SAVE / VISIT / RECOMMEND
    // ==================================================

    async function handlePlaceAction(
        placeId: string,
        action: PlaceAction
    ) {
        if (!userId) {
            return;
        }

        setActionLoading({
            placeId,
            action,
        });

        try {
            const response =
                await fetch(
                    "/api/places/action",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                userId,
                                placeId,
                                action,
                            }
                        ),
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Action failed"
                );
            }

            // Keep previous actions.
            // Only activate the clicked action.
            setActionStates(
                (
                    previous
                ) => {
                    const current =
                        previous[
                        placeId
                        ] ??
                        {
                            save: false,
                            visit: false,
                            recommend: false,
                        };

                    return {
                        ...previous,

                        [placeId]: {
                            ...current,
                            [action]:
                                true,
                        },
                    };
                }
            );
        } catch (
        error
        ) {
            console.error(
                "Place action failed:",
                error
            );
        } finally {
            setActionLoading(
                null
            );
        }
    }

    // ==================================================
    // INITIAL AREA SELECTION
    //
    // Clicking an area on the map starts the normal
    // recommendation flow.
    // ==================================================

    function handleAreaSelect(
        nextAreaId: string
    ) {
        setLoading(true);
        setError("");

        setRecommendations(
            []
        );

        setVisibleCount(
            5
        );

        setSelectedPlaceId(
            null
        );

        setAreaId(
            nextAreaId
        );

        setAreaSelected(
            true
        );
    }

    // ==================================================
    // AREA CHANGE
    // ==================================================

    function handleAreaChange(
        nextAreaId: string
    ) {
        setLoading(true);

        setRecommendations(
            []
        );

        setVisibleCount(
            5
        );

        setSelectedPlaceId(
            null
        );

        setSelectedPosition(
            null
        );

        setShowNetwork(
            false
        );

        setError("");

        setAreaId(
            nextAreaId
        );

        setAreaSelected(
            true
        );
    }

    // ==================================================
    // MODE CHANGE
    // ==================================================

    function handleModeChange(
        nextMode:
            | "for-you"
            | "friends"
            | "discover"
    ) {
        setLoading(true);

        setRecommendations(
            []
        );

        setVisibleCount(
            5
        );

        setSelectedPlaceId(
            null
        );

        setSelectedPosition(
            null
        );

        setShowNetwork(
            false
        );

        setError("");

        setMode(
            nextMode
        );
    }

    // ==================================================
    // LOGOUT
    // ==================================================

    function logout() {
        localStorage.removeItem(
            "userId"
        );

        router.push(
            "/login"
        );
    }

    // ==================================================
    // WAIT FOR USER
    // ==================================================

    if (!userId) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                Loading...
            </main>
        );
    }

    // ==================================================
    // PAGE
    // ==================================================

    const currentArea =
        areas.find(
            (area) =>
                area.id ===
                areaId
        );

    const modeLabel = {
        "for-you":
            "Recommended for you",

        friends:
            "Your friends are into these",

        discover:
            "Worth discovering",
    }[mode];

    const avatarUrl =
        (name: string) =>
            `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(name)}`;

    const selectedVisitors =
        selectedPlace?.visitors ??
        [];

    const getStory = (
        place: Recommendation
    ) => {
        const interest =
            place.matchedInterests?.[0] ??
            null;

        const visitors =
            place.visitors ??
            [];

        const recommenders =
            place.recommenders ??
            [];

        const nearby =
            place.nearbyVisitors ??
            [];

        const socialPeople =
            Array.from(
                new Set([
                    ...visitors,
                    ...recommenders,
                ])
            );

        const onlyVisited =
            visitors.filter(
                (name) =>
                    !recommenders.includes(
                        name
                    )
            );

        const onlyRecommended =
            recommenders.filter(
                (name) =>
                    !visitors.includes(
                        name
                    )
            );

        const both =
            recommenders.filter(
                (name) =>
                    visitors.includes(
                        name
                    )
            );

        const joinNames = (
            names: string[]
        ) => {
            if (
                names.length ===
                0
            ) {
                return "";
            }

            if (
                names.length ===
                1
            ) {
                return names[0];
            }

            if (
                names.length ===
                2
            ) {
                return `${names[0]} and ${names[1]}`;
            }

            return `${names
                .slice(
                    0,
                    -1
                )
                .join(
                    ", "
                )}, and ${names[
                names.length -
                1
                ]
                }`;
        };

        if (
            mode ===
            "discover"
        ) {
            return {
                kind:
                    "discover" as const,

                interest,

                socialPeople,

                nearby,

                conclusion:
                    nearby.length
                        ? `${nearby.length} friend${nearby.length ===
                            1
                            ? " is"
                            : "s are"
                        } active nearby`
                        : "A new place to explore",

                detail:
                    nearby.length
                        ? `${joinNames(
                            nearby.slice(
                                0,
                                3
                            )
                        )} ${nearby.length ===
                            1
                            ? "is"
                            : "are"
                        } active nearby.`
                        : `New place in ${currentArea?.name ??
                        "this area"
                        }.`,
            };
        }

        if (
            mode ===
            "friends"
        ) {
            return {
                kind:
                    "friends" as const,

                interest,

                socialPeople,

                nearby,

                conclusion:
                    socialPeople.length
                        ? "Your friends are into this"
                        : nearby.length
                            ? "Friends are active nearby"
                            : "No friend activity yet",

                detail:
                    both.length ||
                        onlyRecommended.length ||
                        onlyVisited.length
                        ? [
                            both.length
                                ? `${joinNames(
                                    both
                                )} visited + recommended`
                                : "",

                            onlyRecommended.length
                                ? `${joinNames(
                                    onlyRecommended
                                )} recommended`
                                : "",

                            onlyVisited.length
                                ? `${joinNames(
                                    onlyVisited
                                )} visited`
                                : "",
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " · "
                            )
                        : nearby.length
                            ? `${joinNames(
                                nearby.slice(
                                    0,
                                    3
                                )
                            )} active nearby.`
                            : "",
            };
        }

        return {
            kind:
                "for-you" as const,

            interest,

            socialPeople,

            nearby,

            conclusion:
                interest &&
                    socialPeople.length
                    ? "Strong match for you"
                    : interest
                        ? "Matches what you like"
                        : socialPeople.length
                            ? "Your network is into this"
                            : nearby.length
                                ? "Worth exploring"
                                : "A new place to discover",

            detail: [
                interest
                    ? `You like ${interest}`
                    : "",

                both.length
                    ? `${joinNames(
                        both
                    )} visited + recommended`
                    : "",

                onlyRecommended.length
                    ? `${joinNames(
                        onlyRecommended
                    )} recommended`
                    : "",

                onlyVisited.length
                    ? `${joinNames(
                        onlyVisited
                    )} visited`
                    : "",

                !interest &&
                    !socialPeople.length &&
                    nearby.length
                    ? `${joinNames(
                        nearby.slice(
                            0,
                            3
                        )
                    )} active nearby`
                    : "",
            ]
                .filter(
                    Boolean
                )
                .join(
                    " · "
                ),
        };
    };

    return (
        <main className="relative h-screen overflow-hidden bg-[#eef1ed] text-slate-900">

            {/* ==================================================
                FULL-SCREEN MAP
            ================================================== */}

            <div className="absolute inset-0">
                <ExploreMap
                    recommendations={
                        visibleRecommendations
                    }
                    selectedPlaceId={
                        selectedPlaceId
                    }
                    onSelectPlace={(
                        placeId
                    ) =>
                        setSelectedPlaceId(
                            placeId
                        )
                    }
                    onSelectedPositionChange={
                        setSelectedPosition
                    }
                    loading={
                        loading
                    }
                    areaId={
                        areaId
                    }
                    initialOverview={
                        initialOverview
                    }
                    areas={
                        areas
                    }
                    onSelectArea={
                        handleAreaSelect
                    }
                />
            </div>

            {/* ==================================================
                TOP NAVIGATION
            ================================================== */}

            <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-5">

                <div className="pointer-events-auto flex items-center gap-2">

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-lg font-bold shadow-lg shadow-slate-900/10 backdrop-blur">
                        ✦
                    </div>

                    <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 shadow-lg shadow-slate-900/10 backdrop-blur">

                        <span className="font-semibold tracking-tight">
                            Explore
                        </span>

                        <span className="h-5 w-px bg-slate-200" />

                        <span className="text-sm text-slate-500">
                            Discover places around you
                        </span>

                    </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">

                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white/95 px-1.5 py-1.5 shadow-lg shadow-slate-900/10 backdrop-blur">

                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white">
                            {userName
                                .charAt(
                                    0
                                )
                                .toUpperCase()}
                        </span>

                        <select
                            value={
                                userId ??
                                ""
                            }
                            disabled={
                                loading
                            }
                            onChange={(
                                e
                            ) => {
                                const nextUserId =
                                    e.target.value;

                                const nextUser =
                                    demoUsers.find(
                                        (
                                            user
                                        ) =>
                                            user.id ===
                                            nextUserId
                                    );

                                if (
                                    !nextUser
                                ) {
                                    return;
                                }

                                localStorage.setItem(
                                    "userId",
                                    nextUser.id
                                );

                                setLoading(
                                    true
                                );

                                setRecommendations(
                                    []
                                );

                                setVisibleCount(
                                    5
                                );

                                setSelectedPlaceId(
                                    null
                                );

                                setActionStates(
                                    {}
                                );

                                setError(
                                    ""
                                );

                                setUserId(
                                    nextUser.id
                                );

                                setUserName(
                                    nextUser.name
                                );
                            }}
                            className="cursor-pointer bg-transparent px-2 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {demoUsers.map(
                                (
                                    user
                                ) => (
                                    <option
                                        key={
                                            user.id
                                        }
                                        value={
                                            user.id
                                        }
                                    >
                                        {
                                            user.name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        <button
                            onClick={
                                logout
                            }
                            className="mr-1 rounded-xl px-2 py-1.5 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Log out"
                        >
                            ↗
                        </button>

                    </div>
                </div>
            </header>

            {/* ==================================================
                AREA CONTEXT
            ================================================== */}

            {!initialOverview &&
                currentArea && (
                    <div className="pointer-events-none absolute left-4 top-[76px] z-20 sm:left-5">

                        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur">

                            <span className="text-sm">
                                📍
                            </span>

                            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Exploring
                            </span>

                            <select
                                value={
                                    areaId
                                }
                                disabled={
                                    loading
                                }
                                onChange={(
                                    e
                                ) =>
                                    handleAreaChange(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                className="cursor-pointer bg-transparent text-sm font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {areas.map(
                                    (
                                        area
                                    ) => (
                                        <option
                                            key={
                                                area.id
                                            }
                                            value={
                                                area.id
                                            }
                                        >
                                            {
                                                area.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>

                        </div>
                    </div>
                )}

            {/* ==================================================
                INITIAL OVERVIEW PROMPT
            ================================================== */}

            {initialOverview && (
                <div className="pointer-events-none absolute bottom-5 left-4 z-20 sm:left-5">

                    <div className="pointer-events-auto w-[min(390px,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur">

                        <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                📍
                            </div>

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                                    Start exploring
                                </p>

                                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                                    Choose an area
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Pick a neighborhood and Explore will
                                    build recommendations around you.
                                </p>

                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">

                            {areas.map(
                                (
                                    area
                                ) => (
                                    <button
                                        key={
                                            area.id
                                        }
                                        onClick={() =>
                                            handleAreaSelect(
                                                area.id
                                            )
                                        }
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                    >

                                        <p className="text-sm font-semibold">
                                            {
                                                area.name
                                            }
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Explore area
                                        </p>

                                    </button>
                                )
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================
                SELECTED PLACE CARD
            ================================================== */}

            {!initialOverview &&
                selectedPlace &&
                selectedPosition && (
                    <aside
                        className="pointer-events-auto absolute z-40 w-[420px] max-w-[calc(100vw-32px)] rounded-3xl border border-slate-200 bg-white/98 p-5 shadow-2xl shadow-slate-900/20 backdrop-blur"
                        style={{
                            left:
                                selectedPosition.x >
                                    680
                                    ? selectedPosition.x -
                                    444
                                    : selectedPosition.x +
                                    28,

                            top:
                                Math.max(
                                    92,
                                    Math.min(
                                        selectedPosition.y -
                                        190,
                                        window.innerHeight -
                                        560
                                    )
                                ),
                        }}
                    >

                        <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                                    Selected place
                                </p>

                                <h2 className="mt-1 truncate text-xl font-semibold tracking-tight">
                                    {
                                        selectedPlace.name
                                    }
                                </h2>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedPlaceId(
                                        null
                                    )
                                }
                                className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                ×
                            </button>

                        </div>

                        {/* Match score */}

                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2.5">

                            <span className="text-sm font-medium text-slate-600">
                                Match
                            </span>

                            <span className="text-base font-bold text-emerald-700">
                                {
                                    selectedPlace.displayScore ??
                                    Math.min(
                                        selectedPlace.score,
                                        100
                                    )
                                }
                                %
                            </span>

                        </div>

                        {/* ==================================================
                            EXPLANATION
                        ================================================== */}

                        {(() => {
                            const story =
                                getStory(
                                    selectedPlace
                                );

                            const storyPeople =
                                story.socialPeople.slice(
                                    0,
                                    5
                                );

                            return (
                                <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">

                                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-800">

                                        {story.interest &&
                                            story.kind ===
                                            "for-you" && (
                                                <span className="rounded-xl bg-emerald-50 px-2.5 py-1.5">
                                                    ☕{" "}
                                                    {
                                                        story.interest
                                                    }
                                                </span>
                                            )}

                                        {story.interest &&
                                            story.kind ===
                                            "for-you" &&
                                            storyPeople.length >
                                            0 && (
                                                <span className="text-slate-300">
                                                    +
                                                </span>
                                            )}

                                        {storyPeople.length >
                                            0 && (
                                                <div className="flex -space-x-2">

                                                    {storyPeople.map(
                                                        (
                                                            name
                                                        ) => (
                                                            <img
                                                                key={
                                                                    name
                                                                }
                                                                src={avatarUrl(
                                                                    name
                                                                )}
                                                                alt={
                                                                    name
                                                                }
                                                                title={
                                                                    name
                                                                }
                                                                className="h-9 w-9 rounded-full border-2 border-white bg-emerald-50 object-cover shadow-sm"
                                                            />
                                                        )
                                                    )}

                                                </div>
                                            )}

                                        {story.kind ===
                                            "discover" &&
                                            !storyPeople.length && (
                                                <span className="rounded-xl bg-slate-50 px-3 py-1.5">
                                                    📍{" "}
                                                    {
                                                        currentArea?.name ??
                                                        "This area"
                                                    }
                                                </span>
                                            )}

                                    </div>

                                    {story.detail && (
                                        <p className="mt-2 text-center text-xs leading-5 text-slate-500">
                                            {
                                                story.detail
                                            }
                                        </p>
                                    )}

                                    <div className="my-2 flex justify-center text-emerald-500">
                                        ↓
                                    </div>

                                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">

                                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                            So...
                                        </p>

                                        <p className="mt-0.5 text-sm font-bold text-emerald-900">
                                            {
                                                story.conclusion
                                            }
                                        </p>

                                    </div>

                                </div>
                            );
                        })()}

                        {/* Friends visited */}

                        {selectedVisitors.length >
                            0 && (
                                <div className="mt-3 flex items-center justify-center gap-2">

                                    <div className="flex -space-x-2">

                                        {selectedVisitors
                                            .slice(
                                                0,
                                                4
                                            )
                                            .map(
                                                (
                                                    name
                                                ) => (
                                                    <img
                                                        key={
                                                            name
                                                        }
                                                        src={avatarUrl(
                                                            name
                                                        )}
                                                        alt={
                                                            name
                                                        }
                                                        title={
                                                            name
                                                        }
                                                        className="h-7 w-7 rounded-full border-2 border-white bg-emerald-50 object-cover"
                                                    />
                                                )
                                            )}

                                    </div>

                                    <span className="text-[11px] text-slate-500">
                                        {
                                            selectedVisitors.length
                                        }{" "}
                                        friend
                                        {
                                            selectedVisitors.length ===
                                                1
                                                ? ""
                                                : "s"
                                        }{" "}
                                        visited
                                    </span>

                                </div>
                            )}

                        {/* Graph button */}

                        <div className="mt-4">

                            <button
                                onClick={() =>
                                    setShowNetwork(
                                        true
                                    )
                                }
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                                View connections →
                            </button>

                        </div>

                        {/* Actions */}

                        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">

                            {(
                                [
                                    [
                                        "save",
                                        "Save",
                                    ],
                                    [
                                        "visit",
                                        "Visited",
                                    ],
                                    [
                                        "recommend",
                                        "Recommend",
                                    ],
                                ] as const
                            ).map(
                                ([
                                    action,
                                    label,
                                ]) => {
                                    const active =
                                        actionStates[
                                        selectedPlace
                                            .id
                                        ]?.[
                                        action
                                        ];

                                    return (
                                        <button
                                            key={
                                                action
                                            }
                                            onClick={() =>
                                                handlePlaceAction(
                                                    selectedPlace.id,
                                                    action
                                                )
                                            }
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            title={
                                                action ===
                                                    "save"
                                                    ? "Save this place for your own future discovery."
                                                    : action ===
                                                        "visit"
                                                        ? "Record a visit. This can become a social recommendation signal."
                                                        : "Recommend this place to friends and create a recommendation relationship."
                                            }
                                            className={`rounded-xl border px-2 py-2 text-xs font-medium transition ${active
                                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                } disabled:opacity-50`}
                                        >
                                            {actionLoading?.placeId ===
                                                selectedPlace.id &&
                                                actionLoading.action ===
                                                action
                                                ? "Saving..."
                                                : active
                                                    ? `✓ ${label}`
                                                    : label}
                                        </button>
                                    );
                                }
                            )}

                        </div>
                    </aside>
                )}

            {/* ==================================================
                RECOMMENDATION TRAY
            ================================================== */}

            {!initialOverview && (
                <section className="absolute bottom-5 right-4 top-[76px] z-20 w-[min(360px,calc(100vw-2rem))] sm:right-5">

                    <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white/96 shadow-2xl shadow-slate-900/15 backdrop-blur">

                        <div className="flex items-center justify-between px-4 pb-2 pt-4">

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">

                                    {mode ===
                                        "for-you"
                                        ? "✨"
                                        : mode ===
                                            "friends"
                                            ? "👥"
                                            : "✦"}{" "}

                                    {
                                        modeLabel
                                    }

                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                    {
                                        recommendations.length
                                    }{" "}
                                    places
                                </p>

                            </div>

                            {visibleCount <
                                recommendations.length && (
                                    <button
                                        onClick={() =>
                                            setVisibleCount(
                                                (
                                                    count
                                                ) =>
                                                    Math.min(
                                                        count +
                                                        5,
                                                        recommendations.length
                                                    )
                                            )
                                        }
                                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                        More
                                    </button>
                                )}

                        </div>

                        {loading ? (
                            <div className="px-4 pb-4">

                                <div className="rounded-2xl bg-slate-50 px-4 py-5">

                                    <div className="flex items-center gap-3">

                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />

                                        <div>

                                            <p className="text-sm font-medium text-slate-700">
                                                Finding places...
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-400">
                                                Analyzing your graph
                                            </p>

                                        </div>

                                    </div>

                                </div>
                            </div>
                        ) : error ? (
                            <div className="px-4 pb-4">

                                <div className="rounded-2xl bg-red-50 px-4 py-4 text-sm text-red-600">
                                    {
                                        error
                                    }
                                </div>

                            </div>
                        ) : recommendations.length ===
                            0 ? (
                            <div className="px-4 pb-4">

                                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                                    No recommendations found.
                                </div>

                            </div>
                        ) : (
                            <div className="h-[calc(100%-72px)] space-y-2 overflow-y-auto px-3 pb-3">

                                {visibleRecommendations.map(
                                    (
                                        item
                                    ) => {
                                        const score =
                                            item.displayScore ??
                                            Math.min(
                                                item.score,
                                                100
                                            );

                                        const story =
                                            getStory(
                                                item
                                            );

                                        const storyPeople =
                                            story.socialPeople.slice(
                                                0,
                                                4
                                            );

                                        return (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                onClick={() =>
                                                    setSelectedPlaceId(
                                                        item.id
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div className="min-w-0">

                                                        <p className="truncate text-sm font-semibold text-slate-900">
                                                            {
                                                                item.name
                                                            }
                                                        </p>

                                                    </div>

                                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        {
                                                            score
                                                        }%
                                                        match
                                                    </span>

                                                </div>

                                                {/* Explanation */}

                                                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">

                                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">

                                                        {story.interest &&
                                                            story.kind ===
                                                            "for-you" && (
                                                                <span className="rounded-full bg-white px-2 py-1">
                                                                    ☕{" "}
                                                                    {
                                                                        story.interest
                                                                    }
                                                                </span>
                                                            )}

                                                        {storyPeople.length >
                                                            0 && (
                                                                <div className="flex -space-x-2">

                                                                    {storyPeople.map(
                                                                        (
                                                                            name
                                                                        ) => (
                                                                            <img
                                                                                key={
                                                                                    name
                                                                                }
                                                                                src={avatarUrl(
                                                                                    name
                                                                                )}
                                                                                alt={
                                                                                    name
                                                                                }
                                                                                title={
                                                                                    name
                                                                                }
                                                                                className="h-7 w-7 rounded-full border-2 border-white bg-emerald-50 object-cover"
                                                                            />
                                                                        )
                                                                    )}

                                                                </div>
                                                            )}

                                                        {story.nearby.length >
                                                            0 &&
                                                            !storyPeople.length && (
                                                                <span className="rounded-full bg-white px-2 py-1">
                                                                    📍{" "}
                                                                    {
                                                                        story
                                                                            .nearby
                                                                            .length
                                                                    }{" "}
                                                                    nearby
                                                                </span>
                                                            )}

                                                    </div>

                                                    {story.detail && (
                                                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
                                                            {
                                                                story.detail
                                                            }
                                                        </p>
                                                    )}

                                                </div>

                                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700">

                                                    <span>
                                                        →
                                                    </span>

                                                    <span>
                                                        {
                                                            story.conclusion
                                                        }
                                                    </span>

                                                </div>

                                            </button>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </div>
                </section>
            )}

            {/* ==================================================
                DISCOVERY MODE SELECTOR
            ================================================== */}

            {!initialOverview && (
                <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2">

                    <div className="flex rounded-2xl border border-slate-200 bg-white/96 p-1 shadow-xl shadow-slate-900/10 backdrop-blur">

                        {(
                            [
                                [
                                    "for-you",
                                    "For You",
                                ],
                                [
                                    "friends",
                                    "Friends",
                                ],
                                [
                                    "discover",
                                    "Discover",
                                ],
                            ] as const
                        ).map(
                            ([
                                value,
                                label,
                            ]) => (
                                <button
                                    key={
                                        value
                                    }
                                    onClick={() =>
                                        handleModeChange(
                                            value
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${mode ===
                                            value
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                        } disabled:opacity-50`}
                                >
                                    {
                                        label
                                    }
                                </button>
                            )
                        )}

                    </div>
                </div>
            )}

            {/* ==================================================
                INTERACTIVE GRAPH STORY
            ================================================== */}

            {showNetwork &&
                selectedPlace && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[3px]">

                        <div className="w-[min(980px,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                                        Graph connections
                                    </p>

                                    <h3 className="mt-1 text-xl font-semibold">
                                        Why{" "}
                                        {
                                            userName
                                        }{" "}
                                        sees{" "}
                                        {
                                            selectedPlace.name
                                        }
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Only the relationships that help explain this recommendation are shown.
                                    </p>

                                </div>

                                <button
                                    onClick={() =>
                                        setShowNetwork(
                                            false
                                        )
                                    }
                                    className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-slate-400 hover:bg-slate-50"
                                >
                                    ×
                                </button>

                            </div>

                            <NetworkGraph
                                place={
                                    selectedPlace
                                }
                                userName={
                                    userName
                                }
                                avatarUrl={
                                    avatarUrl
                                }
                                mode={
                                    mode
                                }
                                areaName={
                                    currentArea?.name
                                }
                            />

                            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-center text-sm font-medium text-emerald-900">

                                {mode ===
                                    "for-you"
                                    ? "Your interests + what your friends do around places → a recommendation for you."
                                    : mode ===
                                        "friends"
                                        ? "What your friends visited or recommended → social recommendations."
                                        : "Places in the area → discover new places, with social context when available."}

                            </div>

                        </div>
                    </div>
                )}

        </main>
    );
}
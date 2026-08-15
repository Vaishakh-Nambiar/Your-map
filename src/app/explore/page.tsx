"use client";

import { useEffect, useState } from "react";
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

// ==================================================
// PAGE
// ==================================================

export default function ExplorePage() {
    const router = useRouter();

    // ==================================================
    // USER
    // ==================================================

    const [userId, setUserId] =
        useState<string | null>(null);

    const [userName, setUserName] =
        useState("");

    // ==================================================
    // DEMO USERS
    //
    // We keep 10 users in the graph, but expose 4 here
    // for easy demonstration of different graph contexts.
    // ==================================================

    const demoUsers = [
        { id: "u1", name: "Arjun" },
        { id: "u2", name: "Rahul" },
        { id: "u3", name: "Priya" },
        { id: "u4", name: "Aisha" },
    ];

    // ==================================================
    // AREA
    //
    // We intentionally don't select an area until the
    // user chooses one from the initial map overview.
    // ==================================================

    const [areaId, setAreaId] =
        useState("area1");

    const [areaSelected, setAreaSelected] =
        useState(false);

    // ==================================================
    // DISCOVERY MODE
    // ==================================================

    const [mode, setMode] = useState<
        "for-you" | "friends" | "discover"
    >("for-you");

    // ==================================================
    // RECOMMENDATIONS
    // ==================================================

    const [
        recommendations,
        setRecommendations,
    ] = useState<Recommendation[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==================================================
    // PROGRESSIVE LOADING
    //
    // First 5 places are shown on both the list/map.
    // ==================================================

    const [visibleCount, setVisibleCount] =
        useState(5);

    // ==================================================
    // MAP / CARD SELECTION
    // ==================================================

    const [
        selectedPlaceId,
        setSelectedPlaceId,
    ] = useState<string | null>(null);

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
        Record<string, PlaceActionState>
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
        recommendations.slice(
            0,
            visibleCount
        );

    // ==================================================
    // SELECTED PLACE
    // ==================================================

    const selectedPlace =
        recommendations.find(
            (place) =>
                place.id === selectedPlaceId
        ) ?? null;

    // ==================================================
    // GET LOGGED-IN USER
    // ==================================================

    useEffect(() => {
        const storedUserId =
            localStorage.getItem("userId");

        if (!storedUserId) {
            router.push("/login");
            return;
        }

        setUserId(storedUserId);

        setUserId(storedUserId);

        const currentUser = demoUsers.find(
            (user) => user.id === storedUserId
        );

        setUserName(
            currentUser?.name ?? "Explorer"
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
        if (!userId || !areaSelected) {
            return;
        }

        async function loadRecommendations() {
            setLoading(true);
            setError("");

            // Clear stale results immediately.
            setRecommendations([]);
            setVisibleCount(5);
            setSelectedPlaceId(null);

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

                setRecommendations(data);
            } catch (error) {
                console.error(error);

                setError(
                    "Could not load recommendations."
                );
            } finally {
                setLoading(false);
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
        if (!userId) return;

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
                        body: JSON.stringify({
                            userId,
                            placeId,
                            action,
                        }),
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
                (previous) => {
                    const current =
                        previous[placeId] ??
                        {
                            save: false,
                            visit: false,
                            recommend: false,
                        };

                    return {
                        ...previous,
                        [placeId]: {
                            ...current,
                            [action]: true,
                        },
                    };
                }
            );
        } catch (error) {
            console.error(
                "Place action failed:",
                error
            );
        } finally {
            setActionLoading(null);
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

        setRecommendations([]);
        setVisibleCount(5);
        setSelectedPlaceId(null);

        setAreaId(nextAreaId);
        setAreaSelected(true);
    }

    // ==================================================
    // AREA CHANGE
    // ==================================================

    function handleAreaChange(
        nextAreaId: string
    ) {
        setLoading(true);
        setRecommendations([]);
        setVisibleCount(5);
        setSelectedPlaceId(null);
        setError("");

        setAreaId(nextAreaId);
        setAreaSelected(true);
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
        setRecommendations([]);
        setVisibleCount(5);
        setSelectedPlaceId(null);
        setError("");

        setMode(nextMode);
    }

    // ==================================================
    // LOGOUT
    // ==================================================

    function logout() {
        localStorage.removeItem(
            "userId"
        );

        router.push("/login");
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

    return (
        <main className="min-h-screen bg-slate-950 text-white">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="border-b border-slate-800">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                    <div>
                        <p className="text-sm font-semibold tracking-[0.2em] text-emerald-400">
                            EXPLORE
                        </p>

                        <p className="text-xs text-slate-500">
                            Discover through people and
                            preferences
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        {/* ==================================================
        DEMO USER SWITCHER

        This lets the interviewer quickly demonstrate
        that different users have different graph
        contexts and therefore different recommendations.
    ================================================== */}

                        <select
                            value={userId ?? ""}
                            disabled={loading}
                            onChange={(e) => {
                                const nextUserId =
                                    e.target.value;

                                const nextUser =
                                    demoUsers.find(
                                        (user) =>
                                            user.id ===
                                            nextUserId
                                    );

                                if (!nextUser) return;

                                // Persist the selected demo user.
                                localStorage.setItem(
                                    "userId",
                                    nextUser.id
                                );

                                // Clear stale recommendation state.
                                setLoading(true);
                                setRecommendations([]);
                                setVisibleCount(5);
                                setSelectedPlaceId(null);
                                setActionStates({});
                                setError("");

                                // Update current user.
                                setUserId(nextUser.id);
                                setUserName(nextUser.name);
                            }}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 disabled:opacity-60"
                        >
                            {demoUsers.map((user) => (
                                <option
                                    key={user.id}
                                    value={user.id}
                                >
                                    {user.name}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={logout}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800"
                        >
                            Logout
                        </button>

                    </div>

                </div>
            </header>

            <div className="mx-auto max-w-7xl p-6">

                {/* ==================================================
                    INTRO
                ================================================== */}

                <div className="mb-6">

                    <h1 className="text-3xl font-bold">

                        {initialOverview
                            ? "Explore nearby"
                            : `Explore ${areas.find(
                                (a) =>
                                    a.id ===
                                    areaId
                            )?.name
                            }`}

                    </h1>

                    <p className="mt-1 text-slate-400">

                        {initialOverview
                            ? "Choose an area to discover places recommended for you."
                            : "Places recommended based on your interests and your network."}

                    </p>

                </div>

                {/* ==================================================
                    AREA SELECTOR
                    Hidden until an area has been selected.
                ================================================== */}

                {!initialOverview && (
                    <div className="mb-6">

                        <select
                            value={areaId}
                            onChange={(e) =>
                                handleAreaChange(
                                    e.target.value
                                )
                            }
                            disabled={loading}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {areas.map(
                                (area) => (
                                    <option
                                        key={area.id}
                                        value={
                                            area.id
                                        }
                                    >
                                        {area.name}
                                    </option>
                                )
                            )}

                        </select>

                    </div>
                )}

                {/* ==================================================
                    DISCOVERY MODES
                    Only available after choosing an area.
                ================================================== */}

                {!initialOverview && (
                    <div className="mb-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1">

                        <button
                            onClick={() =>
                                handleModeChange(
                                    "for-you"
                                )
                            }
                            disabled={loading}
                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${mode === "for-you"
                                ? "bg-emerald-500 text-black"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            For You
                        </button>

                        <button
                            onClick={() =>
                                handleModeChange(
                                    "friends"
                                )
                            }
                            disabled={loading}
                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${mode === "friends"
                                ? "bg-emerald-500 text-black"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            Friends
                        </button>

                        <button
                            onClick={() =>
                                handleModeChange(
                                    "discover"
                                )
                            }
                            disabled={loading}
                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${mode === "discover"
                                ? "bg-emerald-500 text-black"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            Discover
                        </button>

                    </div>
                )}

                {/* ==================================================
                    MAP + RECOMMENDATIONS
                ================================================== */}

                <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">

                    {/* ==================================================
                        MAP
                    ================================================== */}

                    <div className="relative h-[600px] overflow-hidden rounded-3xl border border-slate-800">

                        <ExploreMap
                            recommendations={
                                visibleRecommendations
                            }
                            selectedPlaceId={
                                selectedPlaceId
                            }
                            onSelectPlace={
                                (placeId) => {
                                    setSelectedPlaceId(
                                        placeId
                                    );
                                }
                            }
                            loading={loading}
                            areaId={areaId}
                            initialOverview={
                                initialOverview
                            }
                            areas={areas}
                            onSelectArea={
                                handleAreaSelect
                            }
                        />

                    </div>

                    {/* ==================================================
                        RIGHT PANEL
                    ================================================== */}

                    {initialOverview ? (
                        <section className="flex h-[600px] items-center">

                            <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-8">

                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                                    Start exploring
                                </p>

                                <h2 className="mt-3 text-2xl font-bold">
                                    Pick an area
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Choose HSR Layout or
                                    Koramangala from the
                                    map to see graph-powered
                                    recommendations.
                                </p>

                                <div className="mt-6 space-y-3">

                                    {areas.map(
                                        (area) => (
                                            <button
                                                key={
                                                    area.id
                                                }
                                                onClick={() =>
                                                    handleAreaSelect(
                                                        area.id
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-left transition hover:border-emerald-400 hover:bg-slate-750"
                                            >

                                                <p className="font-semibold">
                                                    {
                                                        area.name
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Explore
                                                    personalized
                                                    places
                                                </p>

                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </section>
                    ) : (
                        <section className="h-[600px] overflow-y-auto pr-2">

                            {/* ==================================================
                                SELECTED PLACE DETAIL
                            ================================================== */}

                            {selectedPlace ? (
                                <div className="mb-6 rounded-2xl border border-amber-400/40 bg-slate-900 p-6">

                                    <div className="flex items-start justify-between gap-4">

                                        <div>

                                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                                                Selected place
                                            </p>

                                            <h2 className="mt-1 text-2xl font-bold">
                                                {
                                                    selectedPlace.name
                                                }
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-400">
                                                ⭐{" "}
                                                {
                                                    selectedPlace.rating
                                                }
                                            </p>

                                        </div>

                                        <button
                                            onClick={() =>
                                                setSelectedPlaceId(
                                                    null
                                                )
                                            }
                                            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                                        >
                                            ✕
                                        </button>

                                    </div>

                                    {/* SCORE */}

                                    <div className="mt-4 flex items-center justify-between">

                                        <span className="text-sm text-slate-400">
                                            Recommendation match
                                        </span>

                                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">

                                            {selectedPlace.displayScore ??
                                                Math.min(
                                                    selectedPlace.score,
                                                    100
                                                )}{" "}
                                            match

                                        </span>

                                    </div>

                                    {/* DESCRIPTION */}

                                    <p className="mt-4 text-sm leading-6 text-slate-400">
                                        {
                                            selectedPlace.description
                                        }
                                    </p>

                                    {/* WHY THIS PLACE */}

                                    <div className="mt-5">

                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                            Why this place?
                                        </p>

                                        <div className="space-y-2">

                                            {selectedPlace.reasons.map(
                                                (
                                                    reason
                                                ) => (
                                                    <p
                                                        key={
                                                            reason
                                                        }
                                                        className="text-sm text-slate-300"
                                                    >
                                                        <span className="mr-2 text-emerald-400">
                                                            ✓
                                                        </span>

                                                        {
                                                            reason
                                                        }
                                                    </p>
                                                )
                                            )}

                                        </div>

                                    </div>

                                    {/* FRIEND VISITS */}

                                    {selectedPlace
                                        .visitors
                                        .length >
                                        0 && (
                                            <div className="mt-5">

                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                                    Friends who visited
                                                </p>

                                                <p className="text-sm text-slate-300">
                                                    {selectedPlace.visitors.join(
                                                        ", "
                                                    )}
                                                </p>

                                            </div>
                                        )}

                                    {/* RECOMMENDERS */}

                                    {selectedPlace
                                        .recommenders
                                        .length >
                                        0 && (
                                            <div className="mt-4">

                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                                    Recommended by
                                                </p>

                                                <p className="text-sm text-slate-300">
                                                    {selectedPlace.recommenders.join(
                                                        ", "
                                                    )}
                                                </p>

                                            </div>
                                        )}

                                    {/* ==================================================
                                        ACTIONS
                                    ================================================== */}

                                    <div className="mt-6 grid grid-cols-3 gap-2">

                                        {/* SAVE */}

                                        <button
                                            onClick={() =>
                                                handlePlaceAction(
                                                    selectedPlace.id,
                                                    "save"
                                                )
                                            }
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm transition ${actionStates[
                                                selectedPlace.id
                                            ]?.save
                                                ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                                                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                }`}
                                        >
                                            {actionLoading?.placeId ===
                                                selectedPlace.id &&
                                                actionLoading.action ===
                                                "save"
                                                ? "Saving..."
                                                : actionStates[
                                                    selectedPlace.id
                                                ]?.save
                                                    ? "✓ Saved"
                                                    : "Save"}
                                        </button>

                                        {/* VISITED */}

                                        <button
                                            onClick={() =>
                                                handlePlaceAction(
                                                    selectedPlace.id,
                                                    "visit"
                                                )
                                            }
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm transition ${actionStates[
                                                selectedPlace.id
                                            ]?.visit
                                                ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                                                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                }`}
                                        >
                                            {actionLoading?.placeId ===
                                                selectedPlace.id &&
                                                actionLoading.action ===
                                                "visit"
                                                ? "Saving..."
                                                : actionStates[
                                                    selectedPlace.id
                                                ]?.visit
                                                    ? "✓ Visited"
                                                    : "Visited"}
                                        </button>

                                        {/* RECOMMEND */}

                                        <button
                                            onClick={() =>
                                                handlePlaceAction(
                                                    selectedPlace.id,
                                                    "recommend"
                                                )
                                            }
                                            disabled={
                                                actionLoading !==
                                                null
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm transition ${actionStates[
                                                selectedPlace.id
                                            ]?.recommend
                                                ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                                                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                }`}
                                        >
                                            {actionLoading?.placeId ===
                                                selectedPlace.id &&
                                                actionLoading.action ===
                                                "recommend"
                                                ? "Sending..."
                                                : actionStates[
                                                    selectedPlace.id
                                                ]?.recommend
                                                    ? "✓ Recommended"
                                                    : "Recommend"}
                                        </button>

                                    </div>

                                </div>
                            ) : (
                                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">

                                    <p className="text-sm text-slate-400">
                                        Select a place on the
                                        map or from the
                                        recommendations.
                                    </p>

                                </div>
                            )}

                            {/* ==================================================
                                RECOMMENDATION LIST HEADER
                            ================================================== */}

                            <div className="mb-4 flex items-center justify-between">

                                <h2 className="text-xl font-semibold">
                                    Recommended for you
                                </h2>

                                {!loading && (
                                    <span className="text-sm text-slate-500">
                                        {
                                            recommendations.length
                                        }{" "}
                                        places
                                    </span>
                                )}

                            </div>

                            {/* ==================================================
                                LOADING
                            ================================================== */}

                            {loading && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

                                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />

                                    <p className="text-sm text-slate-300">
                                        Finding
                                        recommendations...
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Analyzing your graph
                                        connections and
                                        preferences
                                    </p>

                                </div>
                            )}

                            {/* ==================================================
                                ERROR
                            ================================================== */}

                            {error && (
                                <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* ==================================================
                                EMPTY
                            ================================================== */}

                            {!loading &&
                                !error &&
                                recommendations.length ===
                                0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
                                        No recommendations
                                        found.
                                    </div>
                                )}

                            {/* ==================================================
                                RECOMMENDATION CARDS
                            ================================================== */}

                            {!loading && (
                                <div className="space-y-4">

                                    {visibleRecommendations.map(
                                        (item) => {
                                            const isSelected =
                                                selectedPlaceId ===
                                                item.id;

                                            return (
                                                <article
                                                    key={
                                                        item.id
                                                    }
                                                    onClick={() =>
                                                        setSelectedPlaceId(
                                                            item.id
                                                        )
                                                    }
                                                    className={`cursor-pointer rounded-2xl border p-5 transition ${isSelected
                                                        ? "border-amber-400 bg-slate-800"
                                                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                                                        }`}
                                                >

                                                    {/* CARD HEADER */}

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div>

                                                            <h3 className="text-lg font-semibold">
                                                                {
                                                                    item.name
                                                                }
                                                            </h3>

                                                            <p className="mt-1 text-sm text-slate-400">
                                                                ⭐{" "}
                                                                {
                                                                    item.rating
                                                                }
                                                            </p>

                                                        </div>

                                                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">

                                                            {item.displayScore ??
                                                                Math.min(
                                                                    item.score,
                                                                    100
                                                                )}{" "}
                                                            match

                                                        </span>

                                                    </div>

                                                    {/* DESCRIPTION */}

                                                    <p className="mt-3 text-sm leading-6 text-slate-400">
                                                        {
                                                            item.description
                                                        }
                                                    </p>

                                                    {/* REASONS */}

                                                    <div className="mt-4">

                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                                            Why this
                                                            place?
                                                        </p>

                                                        <div className="space-y-1.5">

                                                            {item.reasons.map(
                                                                (
                                                                    reason
                                                                ) => (
                                                                    <p
                                                                        key={
                                                                            reason
                                                                        }
                                                                        className="text-sm text-slate-300"
                                                                    >
                                                                        <span className="mr-2 text-emerald-400">
                                                                            ✓
                                                                        </span>

                                                                        {
                                                                            reason
                                                                        }
                                                                    </p>
                                                                )
                                                            )}

                                                        </div>

                                                    </div>

                                                </article>
                                            );
                                        }
                                    )}

                                    {/* ==================================================
                                        LOAD 5 MORE
                                    ================================================== */}

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
                                                className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-black hover:bg-emerald-400"
                                            >
                                                Load 5 more
                                            </button>
                                        )}

                                </div>
                            )}

                        </section>
                    )}

                </div>

            </div>
        </main>
    );
}
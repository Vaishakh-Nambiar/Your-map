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
// ==================================================

const areas = [
    {
        id: "area1",
        name: "HSR Layout",
    },
    {
        id: "area2",
        name: "Koramangala",
    },
];

// ==================================================
// PLACE ACTION TYPES
// ==================================================

type PlaceAction = "save" | "visit" | "recommend";

type PlaceActionState = {
    save: boolean;
    visit: boolean;
    recommend: boolean;
};

export default function ExplorePage() {
    const router = useRouter();

    // ==================================================
    // USER
    // ==================================================

    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState("");

    // ==================================================
    // AREA
    // ==================================================

    const [areaId, setAreaId] = useState("area1");

    // ==================================================
    // DISCOVERY MODE
    // ==================================================

    const [mode, setMode] = useState<
        "for-you" | "friends" | "discover"
    >("for-you");

    // ==================================================
    // RECOMMENDATIONS
    // ==================================================

    const [recommendations, setRecommendations] = useState<
        Recommendation[]
    >([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==================================================
    // PROGRESSIVE LOADING
    // First 5 places are shown on both the list and map.
    // ==================================================

    const [visibleCount, setVisibleCount] = useState(5);

    // ==================================================
    // MAP / CARD SELECTION
    // ==================================================

    const [selectedPlaceId, setSelectedPlaceId] = useState<
        string | null
    >(null);

    // ==================================================
    // PLACE ACTION STATE
    //
    // Each place has independent Save / Visit /
    // Recommend state. All three can be active together.
    // ==================================================

    const [actionLoading, setActionLoading] = useState<{
        placeId: string;
        action: PlaceAction;
    } | null>(null);

    const [actionStates, setActionStates] = useState<
        Record<string, PlaceActionState>
    >({});

    // ==================================================
    // VISIBLE RECOMMENDATIONS
    // These are rendered on both the map and list.
    // ==================================================

    const visibleRecommendations =
        recommendations.slice(0, visibleCount);

    // ==================================================
    // SELECTED PLACE
    // ==================================================

    const selectedPlace =
        recommendations.find(
            (place) => place.id === selectedPlaceId
        ) ?? null;

    // ==================================================
    // GET LOGGED-IN USER
    // ==================================================

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");

        if (!storedUserId) {
            router.push("/login");
            return;
        }

        setUserId(storedUserId);

        // Temporary user-name mapping for the assessment.
        if (storedUserId === "u1") {
            setUserName("Arjun");
        } else if (storedUserId === "u2") {
            setUserName("Rahul");
        }
    }, [router]);

    // ==================================================
    // LOAD RECOMMENDATIONS
    //
    // Important:
    // We clear the previous results BEFORE starting the
    // request so stale recommendations are never shown
    // while changing area or discovery mode.
    // ==================================================

    useEffect(() => {
        if (!userId) return;

        async function loadRecommendations() {
            // Clear stale UI immediately.
            setLoading(true);
            setError("");
            setRecommendations([]);
            setVisibleCount(5);
            setSelectedPlaceId(null);

            try {
                const response = await fetch(
                    `/api/recommendations?userId=${userId}&areaId=${areaId}&mode=${mode}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load recommendations"
                    );
                }

                const data = await response.json();

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
    }, [userId, areaId, mode]);

    // ==================================================
    // SAVE / VISIT / RECOMMEND
    //
    // Creates an independent graph relationship.
    //
    // A place can have:
    // SAVED + VISITED + RECOMMENDED
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
            const response = await fetch(
                "/api/places/action",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId,
                        placeId,
                        action,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Action failed");
            }

            // Keep all previous actions for this place.
            // Only turn the clicked action ON.
            setActionStates((previous) => {
                const current =
                    previous[placeId] ?? {
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
            });
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
    // AREA CHANGE
    //
    // Clear the old results immediately instead of
    // waiting for the recommendation request effect.
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
    }

    // ==================================================
    // MODE CHANGE
    //
    // Same behavior as area switching.
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
        localStorage.removeItem("userId");
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
                            Discover through people and preferences
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-300">
                            👋 {userName}
                        </span>

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
                        Explore{" "}
                        {
                            areas.find(
                                (a) => a.id === areaId
                            )?.name
                        }
                    </h1>

                    <p className="mt-1 text-slate-400">
                        Places recommended based on your
                        interests and your network.
                    </p>
                </div>

                {/* ==================================================
                    AREA SELECTOR
                ================================================== */}

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
                        {areas.map((area) => (
                            <option
                                key={area.id}
                                value={area.id}
                            >
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ==================================================
                    DISCOVERY MODES
                ================================================== */}

                <div className="mb-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1">

                    <button
                        onClick={() =>
                            handleModeChange("for-you")
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
                            handleModeChange("friends")
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
                            handleModeChange("discover")
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
                        />

                    </div>

                    {/* ==================================================
                        RECOMMENDATIONS PANEL
                    ================================================== */}

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
                                            {selectedPlace.name}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-400">
                                            ⭐ {selectedPlace.rating}
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

                                {/* Recommendation score */}

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

                                {/* Description */}

                                <p className="mt-4 text-sm leading-6 text-slate-400">
                                    {selectedPlace.description}
                                </p>

                                {/* Why this place? */}

                                <div className="mt-5">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                        Why this place?
                                    </p>

                                    <div className="space-y-2">
                                        {selectedPlace.reasons.map(
                                            (reason) => (
                                                <p
                                                    key={reason}
                                                    className="text-sm text-slate-300"
                                                >
                                                    <span className="mr-2 text-emerald-400">
                                                        ✓
                                                    </span>
                                                    {reason}
                                                </p>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Friends who visited */}

                                {selectedPlace.visitors.length >
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

                                {/* Recommended by */}

                                {selectedPlace.recommenders.length >
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
                                    SELECTED PLACE ACTIONS
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
                                            actionLoading !== null
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
                                            actionLoading !== null
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
                                            actionLoading !== null
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
                                    Select a place on the map
                                    or from the recommendations.
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
                                    {recommendations.length} places
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
                                    Finding recommendations...
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Analyzing your graph connections and preferences
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
                            EMPTY STATE
                        ================================================== */}

                        {!loading &&
                            !error &&
                            recommendations.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
                                    No recommendations found.
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
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedPlaceId(
                                                        item.id
                                                    );
                                                }}
                                                className={`cursor-pointer rounded-2xl border p-5 transition ${isSelected
                                                    ? "border-amber-400 bg-slate-800"
                                                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                                                    }`}
                                            >

                                                {/* Card header */}

                                                <div className="flex items-start justify-between gap-4">

                                                    <div>
                                                        <h3 className="text-lg font-semibold">
                                                            {item.name}
                                                        </h3>

                                                        <p className="mt-1 text-sm text-slate-400">
                                                            ⭐ {item.rating}
                                                        </p>
                                                    </div>

                                                    {/* Recommendation score */}

                                                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                                                        {item.displayScore ??
                                                            Math.min(
                                                                item.score,
                                                                100
                                                            )}{" "}
                                                        match
                                                    </span>

                                                </div>

                                                {/* Description */}

                                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                                    {item.description}
                                                </p>

                                                {/* Why this place? */}

                                                <div className="mt-4">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                                        Why this place?
                                                    </p>

                                                    <div className="space-y-1.5">
                                                        {item.reasons.map(
                                                            (reason) => (
                                                                <p
                                                                    key={
                                                                        reason
                                                                    }
                                                                    className="text-sm text-slate-300"
                                                                >
                                                                    <span className="mr-2 text-emerald-400">
                                                                        ✓
                                                                    </span>

                                                                    {reason}
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
                                                    (count) =>
                                                        Math.min(
                                                            count + 5,
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
                </div>
            </div>
        </main>
    );
}
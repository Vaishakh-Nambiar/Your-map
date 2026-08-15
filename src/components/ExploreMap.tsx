"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ==================================================
// RECOMMENDATION DATA
// ==================================================

type Recommendation = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    score: number;
    displayScore?: number;
};

// ==================================================
// AREA DATA
// ==================================================

type Area = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
};

// ==================================================
// MAP PROPS
// ==================================================

type ExploreMapProps = {
    recommendations: Recommendation[];
    selectedPlaceId: string | null;
    onSelectPlace: (id: string) => void;
    loading: boolean;
    areaId: string;

    // Initial area-selection mode
    initialOverview: boolean;
    areas: Area[];
    onSelectArea: (areaId: string) => void;
};

// ==================================================
// COMPONENT
// ==================================================

export default function ExploreMap({
    recommendations,
    selectedPlaceId,
    onSelectPlace,
    loading,
    areaId,
    initialOverview,
    areas,
    onSelectArea,
}: ExploreMapProps) {
    const mapContainer =
        useRef<HTMLDivElement>(null);

    const mapRef =
        useRef<maplibregl.Map | null>(null);

    const markersRef =
        useRef<maplibregl.Marker[]>([]);

    const areaMarkersRef =
        useRef<maplibregl.Marker[]>([]);

    // ==================================================
    // CREATE MAP
    // ==================================================

    useEffect(() => {
        if (!mapContainer.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,

            style:
                "https://tiles.openfreemap.org/styles/liberty",

            // Start with a wider view showing both areas.
            center: [77.632, 12.925],
            zoom: 12.8,
        });

        map.addControl(
            new maplibregl.NavigationControl(),
            "top-right"
        );

        map.on("error", (e) => {
            console.error("MAP ERROR:", e);
        });

        mapRef.current = map;

        return () => {
            markersRef.current.forEach(
                (marker) => marker.remove()
            );

            areaMarkersRef.current.forEach(
                (marker) => marker.remove()
            );

            map.remove();

            mapRef.current = null;
        };
    }, []);

    // ==================================================
    // INITIAL AREA OVERVIEW
    //
    // Shows available areas before the user chooses one.
    //
    // This intentionally uses lightweight area markers
    // instead of pretending we have exact administrative
    // boundary data.
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        if (!map || !initialOverview) {
            // Remove area markers when leaving overview.
            areaMarkersRef.current.forEach(
                (marker) => marker.remove()
            );

            areaMarkersRef.current = [];

            return;
        }

        function renderAreaOverview(
            map: maplibregl.Map
        ) {
            // Remove previous area markers.
            areaMarkersRef.current.forEach(
                (marker) => marker.remove()
            );

            areaMarkersRef.current = [];

            areas.forEach((area) => {
                // ==================================================
                // AREA VISUAL
                //
                // Large translucent circle gives the user a
                // visual indication of the area without requiring
                // another boundary dataset.
                // ==================================================

                const element =
                    document.createElement("div");

                element.style.width = "120px";
                element.style.height = "120px";
                element.style.borderRadius = "50%";

                element.style.background =
                    "rgba(16, 185, 129, 0.16)";

                element.style.border =
                    "2px solid rgba(16, 185, 129, 0.65)";

                element.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.18)";

                element.style.cursor = "pointer";

                element.style.display = "flex";
                element.style.alignItems = "center";
                element.style.justifyContent =
                    "center";

                element.style.transition =
                    "all 150ms ease";

                // ==================================================
                // AREA LABEL
                // ==================================================

                const label =
                    document.createElement("div");

                label.innerText = area.name;

                label.style.background =
                    "rgba(15, 23, 42, 0.92)";

                label.style.color = "white";

                label.style.padding =
                    "8px 12px";

                label.style.borderRadius =
                    "999px";

                label.style.fontSize = "13px";

                label.style.fontWeight = "600";

                label.style.whiteSpace =
                    "nowrap";

                label.style.border =
                    "1px solid rgba(148,163,184,0.25)";

                label.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.25)";

                element.appendChild(label);

                // ==================================================
                // HOVER
                // ==================================================

                element.onmouseenter = () => {
                    element.style.background =
                        "rgba(16, 185, 129, 0.28)";

                    element.style.boxShadow =
                        "0 0 0 6px rgba(16, 185, 129, 0.15), 0 4px 20px rgba(0,0,0,0.25)";
                };

                element.onmouseleave = () => {
                    element.style.background =
                        "rgba(16, 185, 129, 0.16)";

                    element.style.boxShadow =
                        "0 4px 20px rgba(0,0,0,0.18)";
                };

                // ==================================================
                // SELECT AREA
                // ==================================================

                element.onclick = () => {
                    onSelectArea(area.id);
                };

                const marker =
                    new maplibregl.Marker({
                        element,
                        anchor: "center",
                    })
                        .setLngLat([
                            area.longitude,
                            area.latitude,
                        ])
                        .addTo(map);

                areaMarkersRef.current.push(
                    marker
                );
            });

            // ==================================================
            // FIT BOTH AREAS
            // ==================================================

            if (areas.length > 1) {
                const bounds =
                    new maplibregl.LngLatBounds();

                areas.forEach((area) => {
                    bounds.extend([
                        area.longitude,
                        area.latitude,
                    ]);
                });

                map.fitBounds(bounds, {
                    padding: 120,
                    maxZoom: 13.5,
                    duration: 700,
                });
            }
        }

        if (map.loaded()) {
            renderAreaOverview(map);
        } else {
            map.once("load", () =>
                renderAreaOverview(map)
            );
        }

        return () => {
            areaMarkersRef.current.forEach(
                (marker) => marker.remove()
            );

            areaMarkersRef.current = [];
        };
    }, [
        initialOverview,
        areas,
        onSelectArea,
    ]);

    // ==================================================
    // UPDATE PLACE MARKERS
    //
    // recommendations becomes [] while loading,
    // so old place markers disappear immediately.
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        if (!map || initialOverview) {
            markersRef.current.forEach(
                (marker) => marker.remove()
            );

            markersRef.current = [];

            return;
        }

        function renderMarkers(
            map: maplibregl.Map
        ) {
            // Remove previous markers.
            markersRef.current.forEach(
                (marker) => marker.remove()
            );

            markersRef.current = [];

            recommendations.forEach((place) => {
                const element =
                    document.createElement("div");

                const isSelected =
                    place.id === selectedPlaceId;

                // ==================================================
                // MARKER APPEARANCE
                // ==================================================

                element.style.width = isSelected
                    ? "34px"
                    : "24px";

                element.style.height = isSelected
                    ? "34px"
                    : "24px";

                element.style.borderRadius =
                    "50%";

                element.style.backgroundColor =
                    isSelected
                        ? "#f59e0b"
                        : "#10b981";

                element.style.border =
                    "3px solid white";

                element.style.boxShadow =
                    isSelected
                        ? "0 0 0 5px rgba(245,158,11,0.25)"
                        : "0 2px 8px rgba(0,0,0,0.4)";

                element.style.cursor = "pointer";

                // ==================================================
                // MARKER CLICK
                // ==================================================

                element.onclick = () => {
                    onSelectPlace(place.id);
                };

                const marker =
                    new maplibregl.Marker(element)
                        .setLngLat([
                            place.longitude,
                            place.latitude,
                        ])
                        .setPopup(
                            new maplibregl.Popup({
                                offset: 15,
                            }).setText(
                                `${place.name} — ${place.displayScore ??
                                Math.min(
                                    place.score,
                                    100
                                )
                                } match`
                            )
                        )
                        .addTo(map);

                markersRef.current.push(marker);
            });

            console.log(
                "Markers rendered:",
                recommendations.length
            );
        }

        if (map.loaded()) {
            renderMarkers(map);
        } else {
            map.once("load", () =>
                renderMarkers(map)
            );
        }

        return () => {
            markersRef.current.forEach(
                (marker) => marker.remove()
            );

            markersRef.current = [];
        };
    }, [
        recommendations,
        selectedPlaceId,
        onSelectPlace,
        initialOverview,
    ]);

    // ==================================================
    // FLY TO SELECTED PLACE
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        if (
            !map ||
            initialOverview ||
            !selectedPlaceId
        ) {
            return;
        }

        const place = recommendations.find(
            (p) => p.id === selectedPlaceId
        );

        if (!place) return;

        map.flyTo({
            center: [
                place.longitude,
                place.latitude,
            ],
            zoom: 16,
            duration: 800,
        });
    }, [
        selectedPlaceId,
        recommendations,
        initialOverview,
    ]);

    // ==================================================
    // FIT MAP TO CURRENT AREA
    //
    // HSR Layout → Koramangala
    //
    // The new recommendation coordinates are used to
    // automatically reposition the viewport.
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        if (
            !map ||
            initialOverview ||
            loading ||
            recommendations.length === 0
        ) {
            return;
        }

        const bounds =
            new maplibregl.LngLatBounds();

        recommendations.forEach((place) => {
            bounds.extend([
                place.longitude,
                place.latitude,
            ]);
        });

        // One place.
        if (recommendations.length === 1) {
            const place = recommendations[0];

            map.flyTo({
                center: [
                    place.longitude,
                    place.latitude,
                ],
                zoom: 15,
                duration: 1000,
            });

            return;
        }

        // Multiple places.
        map.fitBounds(bounds, {
            padding: {
                top: 100,
                bottom: 100,
                left: 100,
                right: 100,
            },
            maxZoom: 15,
            duration: 1000,
        });

        console.log(
            "Map fitted to area:",
            areaId
        );
    }, [
        areaId,
        recommendations,
        loading,
        initialOverview,
    ]);

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="relative h-full w-full">

            {/* MAP */}

            <div
                ref={mapContainer}
                className="h-full w-full"
            />

            {/* ==================================================
                INITIAL AREA OVERVIEW
            ================================================== */}

            {initialOverview && (
                <div className="pointer-events-none absolute left-6 top-6 z-10">
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-4 shadow-xl backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                            Explore
                        </p>

                        <p className="mt-1 text-lg font-semibold text-white">
                            Choose an area
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Select an area on the map to
                            discover places.
                        </p>
                    </div>
                </div>
            )}

            {/* ==================================================
                LOADING OVERLAY
            ================================================== */}

            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px]">

                    <div className="rounded-2xl border border-slate-700 bg-slate-900/95 px-8 py-7 text-center shadow-2xl">

                        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />

                        <p className="text-sm font-medium text-slate-200">
                            Updating map
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Finding the best places...
                        </p>

                    </div>

                </div>
            )}

        </div>
    );
}
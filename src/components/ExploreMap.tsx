"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ==================================================
// RECOMMENDATION DATA USED BY THE MAP
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
// MAP PROPS
// ==================================================

type ExploreMapProps = {
    recommendations: Recommendation[];
    selectedPlaceId: string | null;
    onSelectPlace: (id: string) => void;
    loading: boolean;
    areaId: string;
};

export default function ExploreMap({
    recommendations,
    selectedPlaceId,
    onSelectPlace,
    loading,
    areaId,
}: ExploreMapProps) {
    const mapContainer =
        useRef<HTMLDivElement>(null);

    const mapRef =
        useRef<maplibregl.Map | null>(null);

    const markersRef =
        useRef<maplibregl.Marker[]>([]);

    // ==================================================
    // CREATE MAP
    // ==================================================

    useEffect(() => {
        if (!mapContainer.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://tiles.openfreemap.org/styles/liberty",
            center: [77.6389, 12.9116],
            zoom: 14,
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

            map.remove();
            mapRef.current = null;
        };
    }, []);

    // ==================================================
    // UPDATE MARKERS
    //
    // recommendations becomes [] while loading,
    // so old markers are immediately removed.
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        if (!map) return;

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

                element.style.borderRadius = "50%";

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
    ]);

    // ==================================================
    // FLY TO SELECTED PLACE
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        if (!map || !selectedPlaceId) return;

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
    ]);

    // ==================================================
    // FIT MAP TO CURRENT AREA
    //
    // When the user switches:
    //
    // HSR Layout → Koramangala
    //
    // the new recommendations contain coordinates
    // from the new area.
    //
    // We fit the map to those points so the new
    // markers are immediately visible.
    // ==================================================

    useEffect(() => {
        const map = mapRef.current;

        // Don't move the map while the new area is loading.
        // Wait until the new recommendations arrive.
        if (
            !map ||
            loading ||
            recommendations.length === 0
        ) {
            return;
        }

        // Calculate bounds around the new area's
        // currently visible recommendations.
        const bounds =
            new maplibregl.LngLatBounds();

        recommendations.forEach((place) => {
            bounds.extend([
                place.longitude,
                place.latitude,
            ]);
        });

        // If there is only one valid point,
        // fly directly to it.
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

        // ==================================================
        // FIT ALL CURRENT RECOMMENDATION MARKERS
        // ==================================================

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
    ]);

    return (
        <div className="relative h-full w-full">

            {/* ==================================================
                MAP
            ================================================== */}

            <div
                ref={mapContainer}
                className="h-full w-full"
            />

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
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
    visitors?: string[];
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
    onSelectedPositionChange?: (position: { x: number; y: number } | null) => void;
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
    onSelectedPositionChange,
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
                "https://tiles.openfreemap.org/styles/positron",

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

                // MapLibre owns the outer element's transform.
                // Keep the visual UI inside it.
                element.style.width = isSelected ? "30px" : "190px";
                element.style.height = isSelected ? "30px" : "78px";
                element.style.display = "flex";
                element.style.flexDirection = "column";
                element.style.alignItems = "center";
                element.style.cursor = "pointer";

                const label = document.createElement("div");
                label.innerText = place.name;
                label.style.maxWidth = "190px";
                label.style.overflow = "hidden";
                label.style.textOverflow = "ellipsis";
                label.style.whiteSpace = "nowrap";
                label.style.padding = "7px 11px";
                label.style.borderRadius = "10px";
                label.style.background = "rgba(255,255,255,0.96)";
                label.style.border = isSelected ? "1.5px solid #10b981" : "1px solid rgba(148,163,184,.35)";
                label.style.boxShadow = "0 3px 10px rgba(15,23,42,.14)";
                label.style.fontSize = isSelected ? "12px" : "13px";
                label.style.fontWeight = "600";
                label.style.color = "#0f172a";
                label.style.marginBottom = "4px";

                const avatars = document.createElement("div");
                avatars.style.display = "flex";
                avatars.style.alignItems = "center";
                avatars.style.justifyContent = "center";
                avatars.style.marginBottom = "2px";

                const names = (place.visitors ?? []).slice(0, 3);
                names.forEach((name, index) => {
                    const img = document.createElement("img");
                    img.src = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(name)}`;
                    img.alt = name;
                    img.title = name;
                    img.style.width = "27px";
                    img.style.height = "27px";
                    img.style.borderRadius = "50%";
                    img.style.objectFit = "cover";
                    img.style.background = "#ecfdf5";
                    img.style.border = "2px solid white";
                    img.style.marginLeft = index === 0 ? "0" : "-8px";
                    avatars.appendChild(img);
                });

                const dot = document.createElement("div");
                dot.style.width = isSelected ? "22px" : "18px";
                dot.style.height = isSelected ? "22px" : "18px";
                dot.style.borderRadius = "50%";
                dot.style.background = isSelected ? "#0f172a" : "#059669";
                dot.style.border = "3px solid white";
                dot.style.boxShadow = isSelected
                    ? "0 0 0 5px rgba(15,23,42,.12), 0 3px 10px rgba(15,23,42,.28)"
                    : "0 0 0 4px rgba(5,150,105,.18), 0 3px 9px rgba(15,23,42,.20)";

                if (!isSelected) {
                    element.appendChild(label);
                    if (names.length > 0) element.appendChild(avatars);
                }
                element.appendChild(dot);

                // ==================================================
                // MARKER CLICK
                // ==================================================

                element.onclick = () => {
                    onSelectPlace(place.id);
                };

                const marker =
                    new maplibregl.Marker({
                        element,
                        anchor: "center",
                    })
                        .setLngLat([
                            place.longitude,
                            place.latitude,
                        ])
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
            zoom: 14.8,
            duration: 900,
            essential: true,
        });

        const updateSelectedPosition = () => {
            if (!onSelectedPositionChange) return;
            const point = map.project([
                place.longitude,
                place.latitude,
            ]);
            onSelectedPositionChange({ x: point.x, y: point.y });
        };

        map.once("moveend", updateSelectedPosition);
        map.on("move", updateSelectedPosition);
        map.on("resize", updateSelectedPosition);

        return () => {
            map.off("move", updateSelectedPosition);
            map.off("resize", updateSelectedPosition);
            map.off("moveend", updateSelectedPosition);
        };
    }, [
        selectedPlaceId,
        recommendations,
        initialOverview,
        onSelectedPositionChange,
    ]);

    // Clear the floating card position when selection closes.
    useEffect(() => {
        if (!selectedPlaceId) {
            onSelectedPositionChange?.(null);
        }
    }, [selectedPlaceId, onSelectedPositionChange]);

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

        </div>
    );
}
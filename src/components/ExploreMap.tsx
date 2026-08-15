"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Recommendation = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    score: number;
    displayScore?: number;
};

type ExploreMapProps = {
    recommendations: Recommendation[];
    selectedPlaceId: string | null;
    onSelectPlace: (id: string) => void;
};

export default function ExploreMap({
    recommendations,
    selectedPlaceId,
    onSelectPlace,
}: ExploreMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);

    // Create map
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
            markersRef.current.forEach((marker) =>
                marker.remove()
            );

            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers whenever recommendations or selection changes
    useEffect(() => {
        const map = mapRef.current;

        if (!map) return;

        function renderMarkers(map: maplibregl.Map) {
            // Remove previous markers
            markersRef.current.forEach((marker) =>
                marker.remove()
            );

            markersRef.current = [];

            recommendations.forEach((place) => {
                const element = document.createElement("div");

                const isSelected =
                    place.id === selectedPlaceId;

                // Marker appearance
                element.style.width = isSelected
                    ? "34px"
                    : "24px";

                element.style.height = isSelected
                    ? "34px"
                    : "24px";

                element.style.borderRadius = "50%";

                element.style.backgroundColor = isSelected
                    ? "#f59e0b"
                    : "#10b981";

                element.style.border =
                    "3px solid white";

                element.style.boxShadow = isSelected
                    ? "0 0 0 5px rgba(245,158,11,0.25)"
                    : "0 2px 8px rgba(0,0,0,0.4)";

                element.style.cursor = "pointer";

                // Marker click → select place
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
            markersRef.current.forEach((marker) =>
                marker.remove()
            );

            markersRef.current = [];
        };
    }, [
        recommendations,
        selectedPlaceId,
        onSelectPlace,
    ]);

    // Fly to selected place
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
    }, [selectedPlaceId, recommendations]);

    return (
        <div
            ref={mapContainer}
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    );
}
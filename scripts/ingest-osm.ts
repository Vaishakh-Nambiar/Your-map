import "dotenv/config";
import fs from "node:fs/promises";

const OVERPASS_URL =
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter";

const area = {
    id: "area1",
    name: "HSR Layout",
    bbox: [12.895, 77.625, 12.925, 77.655],
};

// const area = {
//     id: "area2",
//     name: "Koramangala",
//     bbox: [12.915, 77.605, 12.945, 77.645],
// };

type OSMElement = {
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    center?: {
        lat: number;
        lon: number;
    };
    tags?: Record<string, string>;
};

type Place = {
    id: string;
    osmId: string;
    name: string;
    latitude: number;
    longitude: number;
    category: string;
    areaId: string;
    areaName: string;
    tags: Record<string, string>;
};

function getCategory(tags: Record<string, string>) {
    if (tags.amenity === "cafe") return "cafe";
    if (tags.amenity === "restaurant") return "restaurant";
    if (tags.amenity === "fast_food") return "fast_food";
    if (tags.amenity === "bar") return "bar";
    if (tags.amenity === "pub") return "pub";
    if (tags.leisure === "park") return "park";
    if (tags.tourism === "attraction") return "attraction";
    if (tags.shop === "bakery") return "bakery";

    return "place";
}

async function main() {
    const [south, west, north, east] = area.bbox;

    const query = `
[out:json][timeout:90];

(
  nwr["amenity"="cafe"](${south},${west},${north},${east});
  nwr["amenity"="restaurant"](${south},${west},${north},${east});
  nwr["amenity"="fast_food"](${south},${west},${north},${east});
  nwr["amenity"="bar"](${south},${west},${north},${east});
  nwr["amenity"="pub"](${south},${west},${north},${east});
  nwr["leisure"="park"](${south},${west},${north},${east});
  nwr["tourism"="attraction"](${south},${west},${north},${east});
  nwr["shop"="bakery"](${south},${west},${north},${east});
);

out center tags;
`;

    console.log(`Fetching real ${area.name} places...`);

    const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "map-graph-assessment/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
        throw new Error(
            `Overpass failed: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    const places: Place[] = [];

    for (const element of data.elements as OSMElement[]) {
        const tags = element.tags ?? {};

        if (!tags.name) continue;

        const latitude = element.lat ?? element.center?.lat;
        const longitude = element.lon ?? element.center?.lon;

        if (latitude == null || longitude == null) continue;

        places.push({
            id: `osm_${element.type}_${element.id}`,
            osmId: `${element.type}/${element.id}`,
            name: tags.name,
            latitude,
            longitude,
            category: getCategory(tags),
            areaId: area.id,
            areaName: area.name,
            tags,
        });
    }

    const uniquePlaces = Array.from(
        new Map(places.map((p) => [p.osmId, p])).values()
    );

    let existingPlaces: Place[] = [];

    try {
        const existing = await fs.readFile(
            "scripts/osm-places.json",
            "utf8"
        );

        existingPlaces = JSON.parse(existing);
    } catch {
        existingPlaces = [];
    }

    const mergedPlaces = Array.from(
        new Map(
            [...existingPlaces, ...uniquePlaces].map((place) => [
                place.osmId,
                place,
            ])
        ).values()
    );

    await fs.writeFile(
        "scripts/osm-places.json",
        JSON.stringify(mergedPlaces, null, 2),
        "utf8"
    );

    console.log("\n✅ HSR ingestion complete");
    console.log(`OSM elements: ${data.elements.length}`);
    console.log(`Valid named places: ${uniquePlaces.length}`);
    console.log("Saved: scripts/osm-places.json");

    const counts = uniquePlaces.reduce<Record<string, number>>(
        (acc, place) => {
            acc[place.category] = (acc[place.category] ?? 0) + 1;
            return acc;
        },
        {}
    );

    console.log("\nBy category:");

    for (const [category, count] of Object.entries(counts)) {
        console.log(`  ${category}: ${count}`);
    }
}

main().catch((error) => {
    console.error("\n❌ HSR ingestion failed");
    console.error(error);
    process.exit(1);
});
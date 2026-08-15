import { User, Place, Interest, Attribute, Category, Area } from "./types";

export const users: User[] = [
    { id: "u1", name: "Arjun" },
    { id: "u2", name: "Rahul" },
    { id: "u3", name: "Priya" },
];

export const interests: Interest[] = [
    { id: "i1", name: "Coffee" },
    { id: "i2", name: "Quiet" },
    { id: "i3", name: "Aesthetic" },
    { id: "i4", name: "Japanese" },
];

export const attributes: Attribute[] = [
    { id: "a1", name: "Coffee" },
    { id: "a2", name: "Quiet" },
    { id: "a3", name: "Aesthetic" },
    { id: "a4", name: "Work Friendly" },
    { id: "a5", name: "Outdoor" },
];

export const categories: Category[] = [
    { id: "c1", name: "Cafe" },
    { id: "c2", name: "Restaurant" },
    { id: "c3", name: "Park" },
];

export const areas: Area[] = [
    { id: "area1", name: "HSR Layout", city: "Bangalore" },
    { id: "area2", name: "Koramangala", city: "Bangalore" },
];

export const places: Place[] = [
    {
        id: "p1",
        name: "Cafe One",
        description: "A quiet coffee spot with a relaxed atmosphere.",
        latitude: 12.9116,
        longitude: 77.6389,
        rating: 4.5,
        priceLevel: 2,
    },
    {
        id: "p2",
        name: "Cafe Two",
        description: "Aesthetic cafe with outdoor seating.",
        latitude: 12.914,
        longitude: 77.64,
        rating: 4.3,
        priceLevel: 2,
    },
    {
        id: "p3",
        name: "Japanese House",
        description: "Japanese restaurant with a cozy atmosphere.",
        latitude: 12.91,
        longitude: 77.635,
        rating: 4.6,
        priceLevel: 3,
    },
];
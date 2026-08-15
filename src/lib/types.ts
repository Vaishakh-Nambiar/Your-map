export type User = {
    id: string;
    name: string;
};

export type Place = {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    rating: number;
    priceLevel: number;
};

export type Interest = {
    id: string;
    name: string;
};

export type Attribute = {
    id: string;
    name: string;
};

export type Category = {
    id: string;
    name: string;
};

export type Area = {
    id: string;
    name: string;
    city: string;
};

export type Recommendation = {
    place: Place;
    score: number;
    reasons: string[];
};
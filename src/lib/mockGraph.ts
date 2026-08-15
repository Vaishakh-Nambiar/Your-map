export const userInterests: Record<string, string[]> = {
    u1: ["i1", "i2", "i3"],
    u2: ["i1", "i4"],
    u3: ["i2", "i3"],
};

export const placeAttributes: Record<string, string[]> = {
    p1: ["a1", "a2", "a4"],
    p2: ["a1", "a3", "a5"],
    p3: ["a4"],
};

export const placeCategories: Record<string, string> = {
    p1: "c1",
    p2: "c1",
    p3: "c2",
};

export const placeAreas: Record<string, string> = {
    p1: "area1",
    p2: "area1",
    p3: "area1",
};

export const connections: Record<string, string[]> = {
    u1: ["u2", "u3"],
    u2: ["u1"],
    u3: ["u1"],
};

export const visits: Record<string, string[]> = {
    u1: ["p2"],
    u2: ["p1", "p3"],
    u3: ["p2"],
};

export const recommendations: Record<string, string[]> = {
    u1: ["p2"],
    u2: ["p1"],
    u3: ["p2"],
};
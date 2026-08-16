"use client";

import { useRouter } from "next/navigation";

// ==================================================
// DEMO USERS
//
// These match the 4 users exposed in the graph for
// demo purposes. Interests drawn from the actual
// seed-social data so the labels are honest.
// ==================================================

const users = [
    {
        id: "u1",
        name: "Arjun",
        interests: ["Coffee", "Aesthetic", "Quiet"],
        bio: "Prefers hidden cafes and calm spaces",
        initial: "A",
    },
    {
        id: "u2",
        name: "Rahul",
        interests: ["Coffee", "Outdoors", "Food"],
        bio: "Follows friends' picks and active spots",
        initial: "R",
    },
    {
        id: "u3",
        name: "Priya",
        interests: ["Brunch", "Shopping", "Aesthetic"],
        bio: "Curates places worth saving and sharing",
        initial: "P",
    },
    {
        id: "u4",
        name: "Aisha",
        interests: ["Food", "Coffee", "Culture"],
        bio: "Explores neighbourhood gems and eats",
        initial: "A",
    },
];

export default function LoginPage() {
    const router = useRouter();

    function login(userId: string) {
        localStorage.setItem("userId", userId);
        router.push("/explore");
    }

    return (
        <main className="flex min-h-screen bg-[#eef1ed]">

            {/* ==============================
                LEFT PANEL — BRAND
            ============================== */}

            <div className="hidden flex-col justify-between p-10 lg:flex lg:w-[400px]">

                {/* LOGO */}

                <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-lg font-bold shadow-lg shadow-slate-900/10">
                        ✦
                    </div>
                    <span className="font-semibold tracking-tight text-slate-900">Explore</span>
                </div>

                {/* HEADLINE */}

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                        Graph-based local discovery
                    </p>

                    <h1 className="mt-3 text-4xl font-bold leading-[1.15] tracking-tight text-slate-900">
                        Discover places
                        <br />
                        <span className="text-emerald-600">built for you.</span>
                    </h1>

                    <p className="mt-4 text-sm leading-relaxed text-slate-500">
                        Recommendations driven by your social graph —
                        your interests, your friends&apos; visits, and your neighbourhood, all connected.
                    </p>
                </div>

                {/* HOW IT WORKS */}

                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">

                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                        How to explore the demo
                    </p>

                    <div className="mt-4 space-y-4">
                        {[
                            ["🗺️", "Pick an area", "HSR Layout or Koramangala — 834 real OSM places."],
                            ["👤", "Switch users", "Same area, different social graph → different results."],
                            ["🔗", "View connections", "See which graph relationships drove each recommendation."],
                        ].map(([icon, title, desc]) => (
                            <div key={title as string} className="flex gap-3">
                                <span className="mt-0.5 shrink-0 text-base leading-none">{icon}</span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

            </div>

            {/* ==============================
                DIVIDER
            ============================== */}

            <div className="hidden w-px bg-slate-200 lg:block" />

            {/* ==============================
                RIGHT PANEL — USER PICKER
            ============================== */}

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">

                {/* Mobile logo — shown only on small screens */}

                <div className="mb-8 w-full max-w-sm lg:hidden">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-base font-bold shadow">
                            ✦
                        </div>
                        <span className="font-semibold text-slate-900">Explore</span>
                    </div>

                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                        Discover places built for you.
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Pick a user to see their graph-based recommendations.
                    </p>
                </div>

                {/* USER CARDS */}

                <div className="w-full max-w-sm">

                    <p className="mb-1 hidden text-sm font-semibold text-slate-800 lg:block">
                        Choose who you are
                    </p>

                    <p className="mb-5 hidden text-xs text-slate-500 lg:block">
                        Each user has a different social graph and different interests.
                        Pick different users to see how recommendations change.
                    </p>

                    <div className="space-y-2.5">

                        {users.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => login(user.id)}
                                className="group flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-white hover:shadow-md"
                            >

                                {/* AVATAR */}

                                <img
                                    src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 object-cover border border-slate-100 shadow-sm"
                                />

                                {/* INFO */}

                                <div className="min-w-0 flex-1">

                                    <p className="text-sm font-semibold text-slate-900">
                                        {user.name}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {user.bio}
                                    </p>

                                    {/* INTERESTS */}

                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {user.interests.map((interest) => (
                                            <span
                                                key={interest}
                                                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>

                                </div>

                                {/* ARROW */}

                                <span className="shrink-0 text-sm text-slate-300 transition group-hover:text-emerald-500">
                                    →
                                </span>

                            </button>
                        ))}

                    </div>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Demo — no real authentication
                    </p>

                </div>

            </div>

        </main>
    );
}
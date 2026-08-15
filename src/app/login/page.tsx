"use client";

import { useRouter } from "next/navigation";

const users = [
    {
        id: "u1",
        name: "Arjun",
        description: "Coffee • Quiet • Aesthetic",
        avatar: "A",
    },
    {
        id: "u2",
        name: "Rahul",
        description: "Coffee • Outdoor",
        avatar: "R",
    },
];

export default function LoginPage() {
    const router = useRouter();

    function login(userId: string) {
        localStorage.setItem("userId", userId);
        router.push("/explore");
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="w-full max-w-md">

                <div className="mb-10 text-center">
                    <p className="text-sm font-semibold tracking-[0.3em] text-emerald-400">
                        EXPLORE
                    </p>

                    <h1 className="mt-4 text-4xl font-bold">
                        Discover places
                        <br />
                        you'll love.
                    </h1>

                    <p className="mt-4 text-slate-400">
                        Discover places through your interests
                        and people you trust.
                    </p>
                </div>

                <div className="space-y-4">

                    {users.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => login(user.id)}
                            className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-emerald-500 hover:bg-slate-800"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-slate-950">
                                {user.avatar}
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    Continue as {user.name}
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    {user.description}
                                </p>
                            </div>

                            <span className="ml-auto text-slate-500">
                                →
                            </span>
                        </button>
                    ))}

                </div>

                <p className="mt-8 text-center text-xs text-slate-600">
                    Demo authentication
                </p>

            </div>
        </main>
    );
}
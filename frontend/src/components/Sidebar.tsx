"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Send,
    History,
    Clock,
    Filter,
    BarChart3,
    LogOut
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Simulator", href: "/simulator", icon: Send },
    { name: "Audit Log", href: "/audit", icon: History },
    { name: "Later Queue", href: "/queue", icon: Clock },
    { name: "Rules Engine", href: "/rules", icon: Filter },
    { name: "Metrics", href: "/metrics", icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 border-r border-gray-800 text-white shadow-xl">
            <div className="flex h-16 shrink-0 items-center px-6 bg-gray-950">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    CyePro AI Engine
                </h1>
            </div>
            <nav className="flex flex-1 flex-col px-4 py-6">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                                                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                                                "group flex gap-x-3 rounded-md p-3 text-sm font-medium leading-6 transition-all duration-200"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                                                    "h-5 w-5 shrink-0"
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <Link
                            href="/login"
                            className="group -mx-2 flex gap-x-3 rounded-md p-3 text-sm font-medium leading-6 text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                            Sign out
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

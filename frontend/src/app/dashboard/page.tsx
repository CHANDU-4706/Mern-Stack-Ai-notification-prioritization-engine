"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, ShieldAlert, Cpu, CheckCircle } from "lucide-react";
import api from "@/lib/api";

export default function DashboardPage() {
    const [healthStatus, setHealthStatus] = useState<any>(null);

    useEffect(() => {
        // Poll the honest health endpoint every 5 seconds
        const checkHealth = async () => {
            try {
                const res = await api.get("/api/health");
                setHealthStatus(res.data);
            } catch (err) {
                setHealthStatus({ status: "down" });
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Live Operations</h1>
                    <p className="text-gray-400">Real-time status of the Notification Prioritization Engine.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gray-900 border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-medium text-gray-300">Engine API Status</CardTitle>
                        <Activity className={`h-4 w-4 ${healthStatus?.status === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-2xl font-bold text-white uppercase tracking-wider">
                            {healthStatus?.status || "UNKNOWN"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Database (MongoDB)</CardTitle>
                        <CheckCircle className={`h-4 w-4 ${healthStatus?.database === 'connected' ? 'text-blue-400' : 'text-orange-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white capitalize">{healthStatus?.database || "Offline"}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">AI Circuit Breaker</CardTitle>
                        <Cpu className={`h-4 w-4 ${healthStatus?.ai_circuit?.status?.includes('CLOSED') ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white uppercase">
                            {healthStatus?.ai_circuit?.status?.split(' ')[0] || "UNKNOWN"}
                        </div>
                        <p className="text-xs text-amber-500 font-medium mt-1">
                            {healthStatus?.ai_circuit?.status?.includes('OPEN') ? 'Fallback active' : 'AI Routing active'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">AI Fallbacks Forced</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {healthStatus?.ai_circuit?.fallbacks_triggered || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-[400px]">
                <Card className="col-span-4 bg-gray-900 border-gray-800 flex flex-col items-center justify-center p-6 text-center shadow-xl">
                    <Activity className="h-16 w-16 text-indigo-500/50 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Live Throughput Monitor</h3>
                    <p className="text-gray-400 max-w-sm">Event processing charts will appear here. Simulate events to see the pipeline act in real-time.</p>
                </Card>

                <Card className="col-span-3 bg-gray-900 border-gray-800 p-6 shadow-xl">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold">Recent Decisions</CardTitle>
                        <CardDescription>Latest classifications made by the engine.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 flex-1 overflow-y-auto">
                        <div className="flex flex-col gap-4 text-sm text-gray-400 text-center py-10">
                            <p>No recent decisions.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

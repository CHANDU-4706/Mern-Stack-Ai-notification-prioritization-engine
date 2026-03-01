"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get("/api/metrics");
                setMetrics(res.data.metrics);
            } catch (err) {
                console.error("Failed to fetch metrics", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000); // Live update
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !metrics) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    const engineData = [
        { name: 'AI LLaMA 3', value: metrics?.aiProcessed || 0 },
        { name: 'Custom Rules', value: metrics?.ruleProcessed || 0 },
        { name: 'Fallback Failsafe', value: metrics?.fallbackProcessed || 0 },
    ];

    const droppedData = [
        { name: 'Duplicate Events', count: metrics?.duplicatesDropped || 0 },
        { name: 'Alert Fatigue', count: metrics?.fatugueDropped || 0 },
    ];
    const displayDroppedData = [
        { name: 'Duplicate Events', count: droppedData[0].count },
        { name: 'Alert Fatigue', count: droppedData[1].count },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Metrics</h1>
                <p className="text-gray-400">Throughput, classification sources, and overall engine health.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Processed Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{metrics?.totalProcessed || 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Events in LATER Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-500">{metrics?.laterQueueSize || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader>
                        <CardTitle>Decision Engine Source</CardTitle>
                        <CardDescription>AI vs Custom Rules vs Fallback usage</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip cursor={{ fill: '#1f2937' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader>
                        <CardTitle>Filtered / Dropped Events</CardTitle>
                        <CardDescription>Events dropped before classification</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={droppedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip cursor={{ fill: '#1f2937' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

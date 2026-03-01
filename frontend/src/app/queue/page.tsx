"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function QueuePage() {
    const [queue, setQueue] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQueue = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/api/queue");
            setQueue(res.data);
        } catch (err) {
            console.error("Failed to fetch queue", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async (id: string) => {
        try {
            await api.post(`/api/queue/${id}/process`);
            fetchQueue();
        } catch (err) {
            console.error("Failed to process event", err);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Deferred Delivery Queue</h1>
                    <p className="text-gray-400">Events designated 'LATER' awaiting background scheduled processing via Agenda.</p>
                </div>
                <Button variant="outline" className="border-indigo-500/30 hover:bg-indigo-900/20 text-indigo-400" onClick={fetchQueue}>
                    <Clock className="w-4 h-4 mr-2" /> Refresh Queue
                </Button>
            </div>

            <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardHeader>
                    <CardTitle>Queue Status</CardTitle>
                    <CardDescription>{queue.length} events pending delivery.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-800 overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-300 uppercase bg-gray-950 border-b border-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Event ID</th>
                                        <th scope="col" className="px-6 py-4">Original Time</th>
                                        <th scope="col" className="px-6 py-4">Scheduled Release</th>
                                        <th scope="col" className="px-6 py-4">Status</th>
                                        <th scope="col" className="px-6 py-4">Priority Rule Hit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 font-medium text-gray-500">
                                                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                LATER Queue is currently empty.
                                            </td>
                                        </tr>
                                    ) : queue.map((event: any) => (
                                        <tr key={event._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                                                {event._id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(event.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-amber-500">
                                                {event.expires_at ? new Date(event.expires_at).toLocaleString() : 'Next Batch'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-semibold uppercase">
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono bg-gray-950 rounded">
                                                {event.classification_reason || 'AI Judgment'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

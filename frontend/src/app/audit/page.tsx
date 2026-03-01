"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import axios from "axios";

export default function AuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/audit-logs");
            setLogs(res.data.data);
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Audit Logs</h1>
                <p className="text-gray-400">Immutable, append-only record of all classification decisions made by the engine.</p>
            </div>

            <Card className="bg-gray-900 border-gray-800 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-4">
                    <div>
                        <CardTitle>Decision History</CardTitle>
                        <CardDescription>Review automated decisions and API payloads.</CardDescription>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                                className="pl-9 bg-gray-950 border-gray-800"
                                placeholder="Search events or rules..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="border-gray-700 hover:bg-gray-800" onClick={fetchLogs}>
                            Refresh
                        </Button>
                    </div>
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
                                        <th scope="col" className="px-6 py-4">Timestamp</th>
                                        <th scope="col" className="px-6 py-4">Event ID</th>
                                        <th scope="col" className="px-6 py-4">Decision</th>
                                        <th scope="col" className="px-6 py-4">Engine Used</th>
                                        <th scope="col" className="px-6 py-4 hidden md:table-cell">Reasoning</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 font-medium">No audit logs found.</td>
                                        </tr>
                                    ) : logs.map((log: any) => (
                                        <tr key={log._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                                                {log.event_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                            ${log.decision === 'NOW' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                        log.decision === 'LATER' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                            'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}
                                                >
                                                    {log.decision}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs whitespace-nowrap">
                                                    {log.engine_used}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell w-full max-w-xs truncate" title={log.reason}>
                                                {log.reason}
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

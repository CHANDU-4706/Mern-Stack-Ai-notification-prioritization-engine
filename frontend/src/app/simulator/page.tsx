"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, PlusCircle, History, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

export default function SimulatorPage() {
    const [formData, setFormData] = useState({
        user_id: "user_123",
        event_type: "LOGIN_ATTEMPT",
        message: "New login from unknown IP address in Moscow",
        source: "SECURITY",
        priority_hint: "high",
        channel: "email"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);
        try {
            const response = await axios.post("http://localhost:5000/api/events", formData);
            setResult(response.data);
        } catch (error: any) {
            setResult({ error: error.response?.data?.error || error.response?.data?.message || error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadPreset = (type: string) => {
        switch (type) {
            case "SECURITY_NOW":
                setFormData({ ...formData, event_type: "SECURITY_ALERT", message: "Multiple failed login attempts detected", source: "SECURITY", priority_hint: "critical" });
                break;
            case "MARKETING_NEVER":
                setFormData({ ...formData, event_type: "PROMO", message: "Get 20% off your next purchase using code SAVE20", source: "MARKETING", priority_hint: "low" });
                break;
            case "UPDATE_LATER":
                setFormData({ ...formData, event_type: "SYSTEM_UPDATE", message: "Your weekly analytics report is ready to view", source: "SYSTEM", priority_hint: "normal" });
                break;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Event Simulator</h1>
                <p className="text-gray-400">Inject raw notification events directly into the CyePro Pipeline to test the AI classifications.</p>
            </div>

            <div className="flex gap-4 mb-4">
                <Button variant="outline" className="border-indigo-500/30 hover:bg-indigo-900/20 text-indigo-400" onClick={() => loadPreset("SECURITY_NOW")}>
                    <ShieldAlert className="w-4 h-4 mr-2" /> Critical Security
                </Button>
                <Button variant="outline" className="border-blue-500/30 hover:bg-blue-900/20 text-blue-400" onClick={() => loadPreset("UPDATE_LATER")}>
                    <Clock className="w-4 h-4 mr-2" /> Weekly Update
                </Button>
                <Button variant="outline" className="border-gray-500/30 hover:bg-gray-800 text-gray-400" onClick={() => loadPreset("MARKETING_NEVER")}>
                    <Trash className="w-4 h-4 mr-2" /> Promo Spam
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Payload Form */}
                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Event Payload</CardTitle>
                        <CardDescription>Configure the JSON data sent to the engine API</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="simulator-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">User ID</label>
                                    <Input className="bg-gray-950 border-gray-800" value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">Event Type</label>
                                    <Input className="bg-gray-950 border-gray-800" value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Message / Content</label>
                                <textarea
                                    className="w-full flex min-h-[80px] rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">Source</label>
                                    <Input className="bg-gray-950 border-gray-800" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">Priority Hint</label>
                                    <Input className="bg-gray-950 border-gray-800" value={formData.priority_hint} onChange={(e) => setFormData({ ...formData, priority_hint: e.target.value })} />
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-gray-900/50 border-t border-gray-800 p-6 flex justify-between">
                        <Button form="simulator-form" type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? "Dispatching..." : "Dispatch to Engine"}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Results Viewer */}
                <div className="space-y-6">
                    <Card className="bg-gray-900 border-gray-800 shadow-xl h-full flex flex-col">
                        <CardHeader className="bg-gray-950 border-b border-gray-800">
                            <CardTitle className="text-xl flex items-center justify-between">
                                API Response
                                {result && !result.error && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative overflow-hidden bg-[#0d1117]">
                            {!result && !isSubmitting && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                    <Cpu className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Awaiting payload dispatch...</p>
                                </div>
                            )}
                            {isSubmitting && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                    <p className="animate-pulse">Engine classifying...</p>
                                </div>
                            )}
                            {result && (
                                <pre className="p-6 text-sm text-green-400 overflow-x-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// Missing imports handled here for speed
import { ShieldAlert, Clock, Trash, Cpu, Send, Loader2 } from "lucide-react";

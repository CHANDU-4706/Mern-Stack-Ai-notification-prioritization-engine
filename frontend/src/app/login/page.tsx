"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("admin@cyepro.com");
    const [password, setPassword] = useState("cyepro2026");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate auth delay
        setTimeout(() => {
            setIsLoading(false);
            router.push("/dashboard");
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 p-4 absolute inset-0 z-50">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>

            <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl relative z-10">
                <CardHeader className="space-y-1 items-center pb-8 pt-8">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
                        <Shield className="w-8 h-8 text-indigo-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">CyePro Admin</CardTitle>
                    <CardDescription className="text-gray-400">
                        Notification Prioritization Engine Let-In
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Mock Credentials Display Requirement */}
                    <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4 mb-6 flex flex-col gap-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <p className="text-sm text-blue-300 font-medium mb-1">Reviewer Credentials (Auto-filled)</p>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-gray-500 w-16">Email:</span>
                            <code className="bg-gray-950 px-2 py-0.5 rounded text-blue-200">admin@cyepro.com</code>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-gray-500 w-16">Pass:</span>
                            <code className="bg-gray-950 px-2 py-0.5 rounded text-blue-200">cyepro2026</code>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 bg-gray-950 border-gray-800 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 bg-gray-950 border-gray-800 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-900/40"
                            disabled={isLoading}
                        >
                            {isLoading ? "Authenticating..." : "Sign in to Dashboard"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-gray-800/50 pt-6 pb-6">
                    <p className="text-xs text-gray-500">
                        Secure connection to CyePro Engine
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

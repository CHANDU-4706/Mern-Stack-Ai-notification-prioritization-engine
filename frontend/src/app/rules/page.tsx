"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Loader2 } from "lucide-react";
import axios from "axios";

export default function RulesPage() {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // New Rule Form State
    const [isAdding, setIsAdding] = useState(false);
    const [ruleName, setRuleName] = useState("");
    const [condition, setCondition] = useState("");
    const [action, setAction] = useState("LATER");

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/rules");
            setRules(res.data.data);
        } catch (err) {
            console.error("Failed to fetch rules", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/rules", {
                rule_name: ruleName,
                condition: condition,
                action: action
            });
            setIsAdding(false);
            setRuleName("");
            setCondition("");
            fetchRules();
        } catch (err) {
            console.error("Failed to create rule", err);
            alert("Failed to create rule. Check syntax.");
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await axios.patch(`http://localhost:5000/api/rules/${id}/toggle`, {
                is_active: !currentStatus
            });
            fetchRules();
        } catch (err) {
            console.error("Failed to toggle rule", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/rules/${id}`);
            fetchRules();
        } catch (err) {
            console.error("Failed to delete rule", err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Rules Manager</h1>
                    <p className="text-gray-400">Define custom classification bypass rules to filter events before they reach the AI.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> {isAdding ? 'Cancel' : 'New Rule'}
                </Button>
            </div>

            {isAdding && (
                <Card className="bg-gray-900 border-indigo-500/30 shadow-xl shadow-indigo-900/10">
                    <CardHeader>
                        <CardTitle>Create Custom Rule</CardTitle>
                        <CardDescription>Rules use JavaScript evaluation syntax against the `event` object.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleCreateRule}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Rule Name</label>
                                <Input required placeholder="e.g., Marketing Emails to LATER" className="bg-gray-950 border-gray-800" value={ruleName} onChange={e => setRuleName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Condition (JS Expression)</label>
                                <Input required placeholder="e.g., event.source === 'MARKETING'" className="bg-gray-950 border-gray-800 font-mono text-indigo-300" value={condition} onChange={e => setCondition(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Action (NOW, LATER, DROPPED)</label>
                                <select
                                    className="w-full flex h-10 items-center justify-between rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={action}
                                    onChange={e => setAction(e.target.value)}
                                >
                                    <option value="NOW">Deliver NOW (Bypass AI)</option>
                                    <option value="LATER">Defer for LATER</option>
                                    <option value="DROPPED">DROP Event (Silently discard)</option>
                                </select>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t border-gray-800 bg-gray-950/50 pt-4 pb-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Rule</Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : rules.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-900 border border-gray-800 rounded-xl rounded-md">
                        <p className="text-gray-400 font-medium">No custom rules configured.</p>
                        <p className="text-sm text-gray-500 mt-1">All events will default to AI classification.</p>
                    </div>
                ) : rules.map((rule: any) => (
                    <Card key={rule._id} className={`bg-gray-900 border-gray-800 shadow-xl transition-opacity ${!rule.is_active ? 'opacity-50' : ''}`}>
                        <CardHeader className="pb-3 border-b border-gray-800/50">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-bold text-white leading-tight pr-4">
                                    {rule.rule_name}
                                </CardTitle>
                                <Switch
                                    checked={rule.is_active}
                                    onCheckedChange={() => handleToggle(rule._id, rule.is_active)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">If condition matches:</p>
                                <code className="text-xs block bg-gray-950 p-2 rounded border border-gray-800 text-indigo-300 break-all">
                                    {rule.condition}
                                </code>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Then Action:</p>
                                <span className={`px-2 py-1 bg-gray-950 border border-gray-800 rounded text-xs font-bold
                             ${rule.action === 'NOW' ? 'text-red-400' : rule.action === 'LATER' ? 'text-amber-400' : 'text-gray-400'}
                        `}>
                                    {rule.action}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 justify-end">
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(rule._id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

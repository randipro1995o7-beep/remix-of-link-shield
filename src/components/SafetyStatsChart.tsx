import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { SafetyHistoryService, SafetyHistoryEntry } from '@/lib/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';

export function SafetyStatsChart() {
    const { t } = useApp();

    const { data: history, isLoading } = useQuery<SafetyHistoryEntry[]>({
        queryKey: ['safety-history'],
        queryFn: async () => {
            const allHistory = await SafetyHistoryService.getHistory();
            return allHistory;
        },
    });

    const chartData = useMemo(() => {
        try {
            // Generate last 7 days including today
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = subDays(new Date(), 6 - i);
                return {
                    date: startOfDay(date),
                    displayDate: format(date, 'EEE'), // Mon, Tue, etc.
                    safe: 0,
                    risky: 0,
                    fullDate: format(date, 'MMM d, yyyy')
                };
            });

            if (history && Array.isArray(history)) {
                history.forEach(entry => {
                    try {
                        if (!entry.timestamp) return;

                        const entryDate = new Date(entry.timestamp);
                        // Validate date
                        if (isNaN(entryDate.getTime())) return;

                        // Find the matching day in our last7Days array
                        const dayStat = last7Days.find(d => isSameDay(d.date, entryDate));

                        if (dayStat) {
                            if (entry.riskLevel === 'low') {
                                dayStat.safe++;
                            } else {
                                // high, medium
                                dayStat.risky++;
                            }
                        }
                    } catch (e) {
                        // Skip invalid entries instead of crashing
                        console.warn('Skipping invalid history entry', e);
                    }
                });
            }

            return last7Days;
        } catch (error) {
            console.error('Error generating chart data', error);
            return [];
        }
    }, [history]);

    if (isLoading) {
        return (
            <Card className="p-8 flex justify-center items-center card-elevated h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    return (
        <Card className="p-4 card-elevated">
            <div className="mb-4">
                <h3 className="font-medium text-foreground">
                    {t.home?.activity || 'Weekly Activity'}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t.home?.last7Days || 'Links scanned in last 7 days'}
                </p>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            allowDecimals={false}
                            allowDataOverflow={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--accent)', opacity: 0.1 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="rounded-lg border bg-popover p-2 shadow-sm">
                                            <div className="text-xs font-medium text-muted-foreground mb-1">{data.fullDate}</div>
                                            <div className="flex gap-2 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                    <span className="font-medium">{data.safe}</span>
                                                    <span className="text-muted-foreground">Safe</span>
                                                </div>
                                                {data.risky > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-destructive" />
                                                        <span className="font-medium">{data.risky}</span>
                                                        <span className="text-muted-foreground">Risky</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="safe"
                            stackId="a"
                            fill="hsl(var(--primary))"
                            radius={[0, 0, 4, 4]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="risky"
                            stackId="a"
                            fill="hsl(var(--destructive))"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

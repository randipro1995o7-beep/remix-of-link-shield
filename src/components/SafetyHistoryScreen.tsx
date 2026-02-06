import { useState, useEffect } from 'react';
import { ArrowLeft, History, Shield, ShieldAlert, ShieldX, ExternalLink, XCircle, Trash2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { SafetyHistoryService } from '@/lib/storage';
import type { SafetyHistoryEntry } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface SafetyHistoryScreenProps {
  onBack: () => void;
}

const riskIcons = {
  low: Shield,
  medium: ShieldAlert,
  high: ShieldX,
};

const riskColors = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-destructive',
};

const actionIcons = {
  cancelled: XCircle,
  opened: ExternalLink,
  blocked: ShieldX,
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function SafetyHistoryScreen({ onBack }: SafetyHistoryScreenProps) {
  const { t } = useApp();
  const [history, setHistory] = useState<SafetyHistoryEntry[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [historyData, insightsData] = await Promise.all([
        SafetyHistoryService.getHistory(50),
        SafetyHistoryService.getHumanInsights(),
      ]);
      setHistory(historyData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    await SafetyHistoryService.clearHistory();
    setHistory([]);
    setInsights([]);
    setShowClearConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top border-b border-border">
        <button
          onClick={onBack}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground">{t.history.title}</h1>
        {history.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Clear history"
          >
            <Trash2 className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        {history.length === 0 && <div className="w-12" />}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <History className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg text-foreground mb-2">{t.history.empty}</p>
            <p className="text-sm text-muted-foreground">{t.history.emptyDesc}</p>
          </div>
        ) : (
          <>
            {/* Insights Section */}
            {insights.length > 0 && (
              <section className="py-4">
                <h2 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  {t.history.insights}
                </h2>
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <ul className="space-y-2">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}

            {/* History List */}
            <section className="py-4">
              <h2 className="font-medium text-foreground mb-3">{t.history.recentLinks}</h2>
              <div className="space-y-2">
                {history.map((entry) => {
                  const RiskIcon = riskIcons[entry.riskLevel];
                  const ActionIcon = actionIcons[entry.action];

                  return (
                    <Card key={entry.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          entry.riskLevel === 'low' && "bg-success/10",
                          entry.riskLevel === 'medium' && "bg-warning/10",
                          entry.riskLevel === 'high' && "bg-destructive/10",
                        )}>
                          <RiskIcon className={cn("w-5 h-5", riskColors[entry.riskLevel])} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{entry.domain}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <ActionIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground capitalize">
                              {t.history.actions[entry.action]}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.source && (
                            <span className="text-xs text-primary mt-1 inline-block">
                              {t.history.from} {entry.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Data Notice */}
            <p className="text-xs text-center text-muted-foreground mt-4 px-4">
              {t.history.dataNotice}
            </p>
          </>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-background rounded-2xl w-full max-w-sm p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-2">{t.history.clearTitle}</h3>
            <p className="text-muted-foreground mb-6">{t.history.clearDesc}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setShowClearConfirm(false)} variant="outline" className="w-full">
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleClearHistory}
                variant="destructive"
                className="w-full"
              >
                {t.history.clearConfirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

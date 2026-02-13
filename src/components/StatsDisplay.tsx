import { Link2, ShieldCheck, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

/**
 * Stats Display Component
 * 
 * Uses assistive language:
 * - "Links reviewed" instead of "Links checked"
 * - "Links cancelled" instead of "Threats blocked"
 */
export function StatsDisplay() {
  const { state, t } = useApp();
  const { linksChecked, threatsBlocked, protectedSince } = state.protectionStats;

  const stats = [
    {
      icon: Link2,
      value: linksChecked.toLocaleString(),
      label: t.home.linksChecked,
    },
    {
      icon: ShieldCheck,
      value: threatsBlocked.toLocaleString(),
      label: t.home.threatsBlocked,
    },
    {
      icon: Calendar,
      value: protectedSince ? format(protectedSince, 'MMM d, yyyy') : '—',
      label: t.home.safetyActiveSince,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="list" aria-label="Safety statistics">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`p-3 flex flex-col items-center text-center gap-2 card-elevated bg-card ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`}
          role="listitem"
          aria-label={`${stat.label}: ${stat.value}`}
        >
          <div
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-1"
            aria-hidden="true"
          >
            <stat.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <p className="text-xl font-bold text-foreground leading-tight">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground truncate w-full px-1">
              {stat.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

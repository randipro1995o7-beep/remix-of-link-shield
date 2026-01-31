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
    <div className="grid grid-cols-1 gap-3" role="list" aria-label="Safety statistics">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="p-4 flex items-center gap-4 card-elevated bg-card"
          role="listitem"
          aria-label={`${stat.label}: ${stat.value}`}
        >
          <div 
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <stat.icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-semibold text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {stat.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

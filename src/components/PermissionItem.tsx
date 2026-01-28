import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PermissionItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isGranted: boolean;
  isRequired?: boolean;
  onGrant: () => void;
  grantLabel: string;
  grantedLabel: string;
}

export function PermissionItem({
  icon: Icon,
  title,
  description,
  isGranted,
  isRequired = true,
  onGrant,
  grantLabel,
  grantedLabel,
}: PermissionItemProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-colors",
        isGranted
          ? "bg-success/5 border-success/20"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            isGranted ? "bg-success/10" : "bg-primary/10"
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6",
              isGranted ? "text-success" : "text-primary"
            )}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">
              {title}
            </h3>
            {isRequired && !isGranted && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {description}
          </p>
          
          {/* Action Button */}
          {isGranted ? (
            <div className="flex items-center gap-2 text-success">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">{grantedLabel}</span>
            </div>
          ) : (
            <Button
              onClick={onGrant}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {grantLabel}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

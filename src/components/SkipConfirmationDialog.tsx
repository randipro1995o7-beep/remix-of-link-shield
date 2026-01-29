import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldOff } from 'lucide-react';

interface SkipConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSkip: () => void;
}

export function SkipConfirmationDialog({
  open,
  onOpenChange,
  onConfirmSkip,
}: SkipConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-4">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <ShieldOff className="w-8 h-8 text-warning" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl">
            Skip Safety Check?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-relaxed">
            You're about to open this link without checking if it's safe.
            <br /><br />
            <strong className="text-foreground">This means:</strong>
            <ul className="text-left mt-2 space-y-1">
              <li>• We won't check if the website is trustworthy</li>
              <li>• You may be at risk of scams or harmful content</li>
              <li>• Your personal information could be exposed</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="w-full h-12 text-base">
            Go Back to Safety Check
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmSkip}
            className="w-full h-12 text-base bg-warning hover:bg-warning/90 text-warning-foreground"
          >
            Skip Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

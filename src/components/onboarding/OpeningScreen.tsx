import { useEffect, useState } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpeningScreenProps {
    onComplete: () => void;
}

export function OpeningScreen({ onComplete }: OpeningScreenProps) {
    const [phase, setPhase] = useState<'initial' | 'expand' | 'fade-out'>('initial');

    useEffect(() => {
        // Timeline of animations
        const timer1 = setTimeout(() => setPhase('expand'), 800);
        const timer2 = setTimeout(() => setPhase('fade-out'), 2500);
        const timer3 = setTimeout(onComplete, 3000); // Trigger complete after fade out

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <div className={cn(
            "fixed inset-0 z-[100] bg-[#1a1b26] flex flex-col items-center justify-center transition-opacity duration-500",
            phase === 'fade-out' ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
            <div className="relative">
                {/* Pulse Ring */}
                <div className={cn(
                    "absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all duration-1000",
                    phase === 'initial' ? "scale-50 opacity-0" : "scale-150 opacity-100"
                )} />

                {/* Main Logo Container */}
                <div className={cn(
                    "relative w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)",
                    phase === 'initial' ? "scale-50 rotate-12 opacity-0" : "scale-100 rotate-0 opacity-100"
                )}>
                    <ShieldCheck className="w-12 h-12 text-[#1a1b26] stroke-[2.5]" />
                </div>
            </div>

            {/* Branding Text */}
            <div className={cn(
                "mt-8 text-center transition-all duration-700 delay-300",
                phase === 'expand' ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
                <h1 className="text-3xl font-bold tracking-tight text-[#a9b1d6]">
                    Safety <span className="text-primary">SHIELD</span>
                </h1>
                <p className="text-sm text-[#a9b1d6]/70 mt-2 font-medium tracking-wide uppercase">
                    Secure &middot; Private &middot; Safe
                </p>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 text-xs text-muted-foreground/50 font-mono">
                v1.0.0
            </div>
        </div>
    );
}

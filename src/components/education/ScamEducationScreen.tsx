import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ShieldAlert, X, DollarSign, Mail, Gift, Smartphone, UserX, AlertTriangle, QrCode, Gavel as Handcuffs } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ScamType {
    id: string;
    title: string;
    icon: any;
    description: string;
    signs: string[];
    solution: string;
}

export function ScamEducationScreen() {
    const navigate = useNavigate();
    const { t } = useApp();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Icon mapping
    const scamIcons: Record<string, any> = {
        phishing: Mail,
        jobs: DollarSign,
        apk: Smartphone,
        giveaway: Gift,
        love_scam: UserX,
        quishing: QrCode,
        digital_arrest: Handcuffs
    };

    // Dynamic scams data from translations
    // We define the order explicitly to match the UI requirements
    const scamOrder = ['phishing', 'quishing', 'digital_arrest', 'jobs', 'apk', 'giveaway', 'love_scam'];

    const scams: ScamType[] = scamOrder.map(id => {
        // @ts-ignore - Accessing dynamic keys from translation
        const data = t.scamEducation.scams[id as keyof typeof t.scamEducation.scams];
        return {
            id,
            title: data.title,
            icon: scamIcons[id] || AlertTriangle,
            description: data.desc, // Note: types.ts uses 'desc', file used 'description'
            signs: data.signs,
            solution: data.solution
        };
    });

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 safe-area-top border-b">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">{t.scamEducation.title}</h1>
                <div className="w-10" />
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="max-w-2xl mx-auto space-y-4 pb-20">
                    <Card className="p-4 bg-primary/5 border-primary/20 mb-6">
                        <div className="flex gap-3">
                            <ShieldAlert className="w-10 h-10 text-primary flex-shrink-0" />
                            <div>
                                <h2 className="font-bold text-lg text-primary mb-1">{t.scamEducation.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t.scamEducation.subtitle}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {scams.map((scam) => (
                        <Card
                            key={scam.id}
                            className={cn(
                                "overflow-hidden transition-all duration-300 cursor-pointer border-l-4",
                                expandedId === scam.id ? "border-l-primary shadow-md" : "border-l-transparent hover:border-l-primary/50"
                            )}
                            onClick={() => setExpandedId(expandedId === scam.id ? null : scam.id)}
                        >
                            <div className="p-4 flex items-center gap-4">
                                <div className={cn(
                                    "p-2 rounded-full flex-shrink-0 transition-colors",
                                    expandedId === scam.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    <scam.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground">{scam.title}</h3>
                                    {!expandedId && (
                                        <p className="text-xs text-muted-foreground truncate opacity-80 mt-1">
                                            {t.scamEducation.readMore}
                                        </p>
                                    )}
                                </div>
                                {expandedId === scam.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                            </div>

                            {expandedId === scam.id && (
                                <div className="px-4 pb-4 animate-slide-down">
                                    <p className="text-sm text-foreground mb-4 leading-relaxed">
                                        {scam.description}
                                    </p>

                                    <div className="bg-destructive/5 rounded-lg p-3 mb-3 border border-destructive/10">
                                        <h4 className="text-xs font-bold text-destructive uppercase mb-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> {t.scamEducation.signs}
                                        </h4>
                                        <ul className="text-sm space-y-1 text-foreground/80 list-disc list-inside">
                                            {scam.signs.map((sign, idx) => (
                                                <li key={idx} className="text-xs">{sign}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                                        <h4 className="text-xs font-bold text-green-600 uppercase mb-1">{t.scamEducation.solution}</h4>
                                        <p className="text-sm text-foreground/90 italic">
                                            "{scam.solution}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

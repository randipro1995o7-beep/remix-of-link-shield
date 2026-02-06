
import { useState } from 'react';
import { ArrowLeft, CheckCircle, Trash2, ShieldCheck, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';

interface WhitelistScreenProps {
    onBack: () => void;
}

export function WhitelistScreen({ onBack }: WhitelistScreenProps) {
    const { t } = useApp();
    const { whitelist, removeFromWhitelist, addToWhitelist } = useLinkInterception();
    const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
    const [newSite, setNewSite] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRemove = (domain: string) => {
        removeFromWhitelist(domain);
        setShowRemoveConfirm(null);
    };

    const handleAdd = () => {
        if (!newSite.trim()) return;

        // Basic clean up
        let domainToAdd = newSite.trim().toLowerCase();

        // Try to extract hostname if it's a URL
        try {
            if (domainToAdd.startsWith('http')) {
                const url = new URL(domainToAdd);
                domainToAdd = url.hostname;
            } else if (domainToAdd.includes('/')) {
                // simple case: google.com/something -> google.com
                domainToAdd = domainToAdd.split('/')[0];
            }
        } catch (e) {
            // failed to parse as URL, treat as domain string
        }

        // Remove www. prefix if present for consistency
        domainToAdd = domainToAdd.replace(/^www\./, '');

        if (!domainToAdd.includes('.') || domainToAdd.length < 3) {
            setError(t.whitelist?.invalidUrl || 'Invalid URL');
            return;
        }

        addToWhitelist(domainToAdd);
        setNewSite('');
        setError(null);
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
                <h1 className="font-semibold text-foreground">{t.whitelist?.title || 'Trusted Sites'}</h1>
                <div className="w-12" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">

                {/* Description */}
                <div className="py-4">
                    <Card className="p-4 bg-primary/5 border-primary/20 flex gap-3 text-sm">
                        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                        <p className="text-muted-foreground">
                            {t.whitelist?.description || 'These websites will skip safety checks and open immediately.'}
                        </p>
                    </Card>
                </div>

                {/* Add New Site Section */}
                <Card className="p-4 mb-6">
                    <h3 className="text-sm font-medium mb-3">{t.whitelist?.addSite || 'Add new site'}</h3>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newSite}
                                onChange={(e) => {
                                    setNewSite(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder={t.whitelist?.enterUrl || 'example.com'}
                                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <Button onClick={handleAdd} disabled={!newSite.trim()}>
                            {t.whitelist?.add || 'Add'}
                        </Button>
                    </div>
                    {error && <p className="text-xs text-destructive mt-2 ml-1">{error}</p>}
                </Card>

                {whitelist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center opacity-70">
                        <ShieldCheck className="w-12 h-12 text-muted-foreground mb-3" />
                        <p className="text-base text-foreground mb-1">{t.whitelist?.empty || 'No trusted sites yet'}</p>
                        <p className="text-sm text-muted-foreground">{t.whitelist?.emptyDesc || 'Sites you mark as "Always Trust" will appear here'}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {whitelist.map((domain) => (
                            <Card key={domain} className="p-3 flex items-center gap-3 animate-fade-in">
                                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-success" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{domain}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Globe className="w-3 h-3" />
                                        {t.whitelist?.domain || 'Trusted Domain'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowRemoveConfirm(domain)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Remove Confirmation Dialog */}
            {showRemoveConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-background rounded-2xl w-full max-w-sm p-6 shadow-lg animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {t.whitelist?.removeConfirmTitle || 'Remove from Trusted?'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {t.whitelist?.removeConfirmDesc || 'This site will be checked again next time you visit.'}
                            <br />
                            <span className="font-medium text-foreground mt-2 block">{showRemoveConfirm}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={() => setShowRemoveConfirm(null)} variant="outline" className="w-full">
                                {t.common.cancel}
                            </Button>
                            <Button
                                onClick={() => handleRemove(showRemoveConfirm)}
                                variant="destructive"
                                className="w-full"
                            >
                                {t.whitelist?.remove || 'Remove'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldAlert, MessageCircle, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

interface InteractiveTutorialProps {
    onComplete: () => void;
    onSkip: () => void;
}

export function InteractiveTutorial({ onComplete, onSkip }: InteractiveTutorialProps) {
    const { state } = useApp();
    const [step, setStep] = useState<'chat' | 'intercept' | 'success'>('chat');
    const [showHand, setShowHand] = useState(false);

    // Animation delay for the "hand" pointer
    useEffect(() => {
        if (step === 'chat') {
            const timer = setTimeout(() => setShowHand(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleLinkClick = () => {
        setStep('intercept');
    };

    const handleBackToSafety = () => {
        setStep('success');
    };

    const isIndonesian = state.language === 'id';

    return (
        <div className="flex flex-col h-full min-h-screen bg-background relative overflow-hidden animate-fade-in">

            {/* Background decoration */}
            <div className="absolute top-0 inset-x-0 h-64 bg-primary/5 rounded-b-[3rem] -z-10" />

            {/* Header */}
            <div className="px-6 pt-12 pb-4 text-center">
                <h1 className="text-2xl font-bold mb-2">
                    {isIndonesian ? 'Cara Kerja Safety SHIELD' : 'How Safety SHIELD Works'}
                </h1>
                <p className="text-muted-foreground">
                    {isIndonesian
                        ? 'Simulasi singkat perlindungan link'
                        : 'A quick simulation of link protection'}
                </p>
            </div>

            {/* Main Interactive Area */}
            <div className="flex-1 px-6 flex items-center justify-center py-6">

                {/* SCENE 1: CHAT */}
                {step === 'chat' && (
                    <div className="w-full max-w-sm space-y-4 animate-scale-in">
                        <div className="bg-card rounded-2xl shadow-lg border p-4">
                            <div className="flex items-center gap-3 border-b pb-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Unknown Sender</p>
                                    <p className="text-xs text-muted-foreground">+62 812-XXXX-XXXX</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-muted/50 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl text-sm">
                                    {isIndonesian
                                        ? 'Selamat! Anda memenangkan hadiah iPhone 16 Pro. Klik disini untuk klaim:'
                                        : 'Congrats! You won an iPhone 16 Pro. Click to claim:'}
                                </div>

                                {/* The Trap Link */}
                                <button
                                    onClick={handleLinkClick}
                                    className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-xl border border-blue-100 transition-colors relative group"
                                >
                                    <p className="text-blue-600 font-medium text-sm truncate">
                                        http://claim-hadiah-resmi.com/prize
                                    </p>
                                    <p className="text-[10px] text-blue-400 mt-1">
                                        {isIndonesian ? 'Ketuk untuk buka' : 'Tap to open'}
                                    </p>

                                    {/* Animated Hand Pointer */}
                                    {showHand && (
                                        <div className="absolute -bottom-8 -right-4 animate-bounce">
                                            <span className="text-4xl filter drop-shadow-md">👆</span>
                                        </div>
                                    )}
                                </button>

                                <div className="text-[10px] text-muted-foreground text-right">
                                    10:42 AM
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-sm text-primary animate-pulse">
                            {isIndonesian
                                ? 'Coba klik link mencurigakan di atas'
                                : 'Try clicking the suspicious link above'}
                        </p>
                    </div>
                )}

                {/* SCENE 2: INTERCEPT */}
                {step === 'intercept' && (
                    <Card className="w-full max-w-sm border-destructive/50 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-500">
                        <div className="bg-destructive p-6 text-center text-destructive-foreground">
                            <ShieldAlert className="w-16 h-16 mx-auto mb-2" />
                            <h2 className="text-xl font-bold">
                                {isIndonesian ? 'Link Diblokir!' : 'Link Blocked!'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-center text-muted-foreground text-sm">
                                {isIndonesian
                                    ? 'Safety SHIELD mendeteksi link ini berbahaya dan mencegah Anda membukanya.'
                                    : 'Safety SHIELD detected this link is dangerous and prevented you from opening it.'}
                            </p>

                            <div className="bg-muted p-3 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground font-mono">claim-hadiah-resmi.com</p>
                                <p className="text-xs text-destructive font-bold mt-1">
                                    {isIndonesian ? 'Terdeteksi Phishing' : 'Phishing Detected'}
                                </p>
                            </div>

                            <Button
                                onClick={handleBackToSafety}
                                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12 text-lg"
                            >
                                <X className="w-5 h-5 mr-2" />
                                {isIndonesian ? 'Kembali Aman' : 'Go Back to Safety'}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* SCENE 3: SUCCESS */}
                {step === 'success' && (
                    <div className="text-center space-y-6 animate-scale-in max-w-xs">
                        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-success" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                {isIndonesian ? 'Luar Biasa!' : 'Excellent!'}
                            </h2>
                            <p className="text-muted-foreground">
                                {isIndonesian
                                    ? 'Anda baru saja menghindari serangan cyber. Safety SHIELD akan selalu melindungi Anda seperti ini.'
                                    : 'You just avoided a cyber attack. Safety SHIELD will always protect you like this.'}
                            </p>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer / Navigation */}
            <div className="px-6 pb-8 pt-4">
                {step === 'success' ? (
                    <Button
                        onClick={onComplete}
                        className="w-full h-12 text-lg shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        {isIndonesian ? 'Lanjut Setup PIN' : 'Continue to PIN Setup'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                ) : (
                    <div className="flex justify-center">
                        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
                            {isIndonesian ? 'Lewati Tutorial' : 'Skip Tutorial'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

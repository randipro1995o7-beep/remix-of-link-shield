import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldAlert, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface InteractiveTutorialProps {
    onComplete: () => void;
    onSkip: () => void;
}

type TutorialStep = 'welcome' | 'chat' | 'intercept' | 'success';

export function InteractiveTutorial({ onComplete, onSkip }: InteractiveTutorialProps) {
    const { state } = useApp();
    const [step, setStep] = useState<TutorialStep>('welcome');
    const [showHand, setShowHand] = useState(false);
    const [typing, setTyping] = useState(false);
    const [messages, setMessages] = useState<Array<{ id: number, text: string, sender: 'other' }>>([]);

    const isIndonesian = state.language === 'id';

    // Animation sequences
    useEffect(() => {
        if (step === 'chat') {
            // Reset state
            setMessages([]);
            setShowHand(false);

            // Start typing animation
            setTyping(true);
            const typeTimer = setTimeout(() => {
                setTyping(false);
                setMessages([{
                    id: 1,
                    text: isIndonesian
                        ? 'Selamat! Anda memenangkan hadiah iPhone 16 Pro. Klik disini untuk klaim: http://claim-hadiah-resmi.com/prize'
                        : 'Congrats! You won an iPhone 16 Pro. Click to claim: http://claim-hadiah-resmi.com/prize',
                    sender: 'other'
                }]);

                // Show hand after message appears
                setTimeout(() => setShowHand(true), 1500);
            }, 2000);

            return () => clearTimeout(typeTimer);
        }
    }, [step, isIndonesian]);

    const handleStart = () => {
        setStep('chat');
    };

    const handleLinkClick = () => {
        setStep('intercept');
    };

    const handleBackToSafety = () => {
        setStep('success');
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-background relative overflow-hidden animate-in fade-in duration-700">

            {/* Ambient Background */}
            <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-primary/10 to-transparent -z-10 rounded-b-[3rem] opacity-70" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] -z-20" />

            {/* Header Content based on Step */}
            <div className="px-6 pt-12 pb-2 text-center transition-all duration-500">
                {step === 'welcome' && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-700">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold mb-3 tracking-tight">
                            {isIndonesian ? 'Selamat Datang di' : 'Welcome to'} <br />
                            <span className="text-primary">Safety SHIELD</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
                            {isIndonesian
                                ? 'Perlindungan cerdas dari link berbahaya dan penipuan online.'
                                : 'Smart protection against dangerous links and online scams.'}
                        </p>
                    </div>
                )}

                {step === 'chat' && (
                    <div className="animate-in slide-in-from-top-4 fade-in">
                        <h2 className="text-xl font-semibold mb-1">
                            {isIndonesian ? 'Simulasi Serangan' : 'Attack Simulation'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isIndonesian
                                ? 'Lihat apa yang terjadi saat ada link berbahaya'
                                : 'See what happens when a dangerous link appears'}
                        </p>
                    </div>
                )}
            </div>

            {/* Main Interactive Stage */}
            <div className="flex-1 px-6 flex items-center justify-center relative perspective-1000">

                {/* STEP 1: WELCOME ACTION */}
                {step === 'welcome' && (
                    <div className="w-full absolute bottom-12 px-6 safe-area-bottom animate-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Button
                            onClick={handleStart}
                            size="lg"
                            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                        >
                            {isIndonesian ? 'Mulai Simulasi' : 'Start Simulation'}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <button
                            onClick={onSkip}
                            className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isIndonesian ? 'Lewati tutorial' : 'Skip tutorial'}
                        </button>
                    </div>
                )}

                {/* STEP 2: CHAT SIMULATION */}
                {step === 'chat' && (
                    <div className="w-full max-w-sm bg-card rounded-[2rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Fake Chat Header */}
                        <div className="bg-muted/50 p-4 border-b flex items-center gap-3 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                                ?
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Unknown Number</p>
                                <p className="text-[10px] text-muted-foreground">Online</p>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div className="p-4 h-64 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3 relative">
                            {/* Timestamp */}
                            <div className="text-center">
                                <span className="text-[10px] bg-muted/50 px-2 py-1 rounded-full text-muted-foreground">Today 10:42 AM</span>
                            </div>

                            {/* Typing Indicator */}
                            {typing && (
                                <div className="self-start bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border shadow-sm w-16">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            {messages.map(msg => (
                                <div key={msg.id} className="self-start max-w-[90%] animate-in slide-in-from-left-2 fade-in">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border shadow-sm text-sm dark:text-slate-200">
                                        <p className="mb-2">{msg.text.split('http')[0]}</p>

                                        {/* The Trap Link */}
                                        <button
                                            onClick={handleLinkClick}
                                            className="block w-full text-left bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30 group relative"
                                        >
                                            <p className="text-blue-600 dark:text-blue-400 font-medium text-xs truncate">
                                                http://claim-hadiah-resmi.com/prize
                                            </p>

                                            {/* Finger Pointer Animation */}
                                            {showHand && (
                                                <div className="absolute -right-4 top-8 animate-bounce z-10 drop-shadow-lg">
                                                    <span className="text-4xl filter drop-shadow-sm">👆</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: INTERCEPT SCREEN */}
                {step === 'intercept' && (
                    <Card className="w-full max-w-sm border-0 shadow-2xl overflow-hidden animate-in zoom-in-90 duration-300 ring-4 ring-destructive/20">
                        <div className="bg-destructive p-8 text-center text-destructive-foreground relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay" />
                            <ShieldAlert className="w-20 h-20 mx-auto mb-4 animate-[pulse_2s_ease-in-out_infinite]" />
                            <h2 className="text-2xl font-bold tracking-tight">
                                {isIndonesian ? 'ANCAMAN TERDETEKSI' : 'THREAT DETECTED'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-6 bg-card">
                            <div className="text-center space-y-2">
                                <p className="text-muted-foreground">
                                    {isIndonesian
                                        ? 'Safety SHIELD memblokir link ini karena terindikasi penipuan.'
                                        : 'Safety SHIELD blocked this link because it acts like a scam.'}
                                </p>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-xl flex items-center gap-3 border border-border/50">
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                    <X className="w-5 h-5 text-destructive" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground font-mono truncate">claim-hadiah-resmi.com</p>
                                    <p className="text-xs font-bold text-destructive mt-0.5">Phishing / Scam</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleBackToSafety}
                                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12 text-lg font-semibold rounded-xl shadow-lg shadow-destructive/20"
                            >
                                {isIndonesian ? 'Tutup Halaman Ini' : 'Close This Page'}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 'success' && (
                    <div className="text-center space-y-8 animate-in zoom-in-50 duration-500 max-w-xs">
                        <div className="relative">
                            <div className="w-32 h-32 bg-success/10 rounded-full flex items-center justify-center mx-auto animate-[bounce_1s_infinite]">
                                <CheckCircle className="w-16 h-16 text-success" />
                            </div>
                            <div className="absolute inset-0 bg-success/20 rounded-full animate-ping opacity-20" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">
                                {isIndonesian ? 'Anda Aman!' : 'You are Safe!'}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {isIndonesian
                                    ? 'Aplikasi ini akan bekerja di latar belakang untuk melindungi Anda.'
                                    : 'The app will work in the background to keep you protected.'}
                            </p>
                        </div>

                        <Button
                            onClick={onComplete}
                            size="lg"
                            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/20"
                        >
                            {isIndonesian ? 'Lanjut Setup PIN' : 'Continue to PIN Setup'}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}

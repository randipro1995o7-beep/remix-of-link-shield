import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, AlertTriangle, CheckCircle, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OCRDetectionService, OCRResult } from '@/lib/services/OCRDetectionService';
import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';

export function OCRScannerScreen() {
    const { t } = useApp();
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<OCRResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
            scanImage(file);
        }
    };

    const scanImage = async (file: File) => {
        setIsScanning(true);
        setResult(null);
        try {
            const scanResult = await OCRDetectionService.scanImage(file);
            setResult(scanResult);
        } catch (error) {
            console.error('Scan failed', error);
            // Handle error (maybe show toast)
        } finally {
            setIsScanning(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <Link to="/" className="p-2 hover:bg-muted rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="font-semibold text-lg">Screenshot Scanner</h1>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
                {/* Intro / Instructions */}
                {!image && (
                    <div className="text-center py-8">
                        <Smartphone className="w-16 h-16 text-primary mx-auto mb-4 opacity-80" />
                        <h2 className="text-xl font-bold mb-2">Check Screenshots for Scams</h2>
                        <p className="text-muted-foreground">
                            Upload a screenshot of a text message, email, or chat. We'll scan it for scam keywords and patterns.
                        </p>
                    </div>
                )}

                {/* Image Preview & Upload Area */}
                <Card className="overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 relative"
                    onClick={triggerFileInput}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    {image ? (
                        <div className="relative">
                            <img src={image} alt="Uploaded screenshot" className="w-full h-auto max-h-[400px] object-contain bg-black/5" />
                            {isScanning && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                                    <p className="font-medium animate-pulse">Analyzing text...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>Tap to upload screenshot</p>
                        </div>
                    )}
                </Card>

                {/* Analysis Results */}
                {result && !isScanning && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className={`p-4 border-l-4 ${result.hasScamKeywords ? 'border-l-destructive bg-destructive/5' : 'border-l-success bg-success/5'}`}>
                            <div className="flex items-start gap-4">
                                {result.hasScamKeywords ? (
                                    <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                                ) : (
                                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                                )}
                                <div>
                                    <h3 className={`font-bold text-lg ${result.hasScamKeywords ? 'text-destructive' : 'text-success'}`}>
                                        {result.hasScamKeywords ? 'Potential Scam Detected' : 'No Scam Keywords Found'}
                                    </h3>
                                    <p className="text-sm text-foreground/80 mt-1">
                                        {result.hasScamKeywords
                                            ? `This screenshot contains keywords often used in ${result.scamType || 'scams'}.`
                                            : "We didn't find any obvious scam keywords, but always stay vigilant."}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Detected Keywords */}
                        {result.detectedKeywords.length > 0 && (
                            <Card className="p-4">
                                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Detected Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.detectedKeywords.map(word => (
                                        <span key={word} className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Extracted Text (Collapsible usually, but showing brief for now) */}
                        <Card className="p-4 bg-muted/30">
                            <h4 className="font-medium mb-2 text-sm text-muted-foreground">Extracted Text</h4>
                            <p className="text-xs text-muted-foreground font-mono line-clamp-6">
                                {result.text}
                            </p>
                        </Card>

                        <div className="flex gap-3">
                            <Button onClick={triggerFileInput} variant="outline" className="flex-1">
                                Scan Another
                            </Button>
                            {result.hasScamKeywords && (
                                <Button className="flex-1 bg-destructive hover:bg-destructive/90">
                                    Report as Scam
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OCRScannerScreen;

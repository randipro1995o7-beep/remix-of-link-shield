import { useState, useEffect, useCallback } from 'react';
import { BarcodeScanner, ScanResult } from '@capacitor-community/barcode-scanner';
import { X, QrCode, AlertTriangle, Camera, Shield, Wallet, Banknote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';
import { toast } from 'sonner';
import { UrlResolver } from '@/lib/services/UrlResolver';

interface QRScannerScreenProps {
    onClose: () => void;
}

type ScanState = 'ready' | 'scanning' | 'resolving' | 'reviewing' | 'error' | 'qris_detected';

export function QRScannerScreen({ onClose }: QRScannerScreenProps) {
    const { state } = useApp();
    const { interceptLink } = useLinkInterception();
    const [scanState, setScanState] = useState<ScanState>('ready');
    const [scannedUrl, setScannedUrl] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const isIndonesian = state.language === 'id';

    const lang = {
        title: isIndonesian ? 'Scan QR Code' : 'Scan QR Code',
        subtitle: isIndonesian ? 'Arahkan kamera ke QR Code' : 'Point camera at QR Code',
        startScan: isIndonesian ? 'Mulai Scan' : 'Start Scan',
        scanning: isIndonesian ? 'Scanning...' : 'Scanning...',
        resolving: isIndonesian ? 'Memuat URL asli...' : 'Resolving URL...',
        cancel: isIndonesian ? 'Batal' : 'Cancel',
        permissionDenied: isIndonesian
            ? 'Izin kamera diperlukan untuk scan QR'
            : 'Camera permission is required to scan QR',
        grantPermission: isIndonesian ? 'Izinkan Kamera' : 'Grant Camera Access',
        notUrl: isIndonesian
            ? 'QR Code tidak berisi URL'
            : 'QR Code does not contain a URL',
        foundUrl: isIndonesian ? 'URL Ditemukan' : 'URL Found',
        reviewingUrl: isIndonesian ? 'Memeriksa keamanan...' : 'Checking safety...',
        openSafe: isIndonesian ? 'Buka Link' : 'Open Link',
        scanAnother: isIndonesian ? 'Scan Lagi' : 'Scan Another',
        qrisDetected: isIndonesian ? 'QRIS Ditemukan' : 'QRIS Detected',
        qrisMessage: isIndonesian
            ? 'Ini adalah kode pembayaran QRIS. Silakan scan menggunakan aplikasi pembayaran atau m-banking Anda.'
            : 'This is a QRIS payment code. Please scan using your payment or banking app.',
        openPaymentApp: isIndonesian ? 'Buka E-Wallet / Bank' : 'Open Payment App',
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            BarcodeScanner.stopScan().catch(() => { });
            document.body.classList.remove('scanner-active');
            document.documentElement.classList.remove('scanner-active');
        };
    }, []);

    const checkPermission = async (): Promise<boolean> => {
        try {
            const status = await BarcodeScanner.checkPermission({ force: true });

            if (status.granted) {
                return true;
            }

            if (status.denied) {
                setPermissionDenied(true);
                return false;
            }

            if (status.neverAsked || status.asked) {
                const newStatus = await BarcodeScanner.checkPermission({ force: true });
                if (newStatus.granted) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Permission check failed:', error);
            return false;
        }
    };

    const startScan = useCallback(async () => {
        const hasPermission = await checkPermission();
        if (!hasPermission) {
            setPermissionDenied(true);
            return;
        }

        setPermissionDenied(false);
        setScanState('scanning');
        setScannedUrl(null);

        // Make background transparent for camera
        document.body.classList.add('scanner-active');
        document.documentElement.classList.add('scanner-active');

        try {
            await BarcodeScanner.hideBackground();

            const result: ScanResult = await BarcodeScanner.startScan();

            document.body.classList.remove('scanner-active');
            document.documentElement.classList.remove('scanner-active');
            await BarcodeScanner.showBackground();

            if (result.hasContent && result.content) {
                handleScanResult(result.content);
            } else {
                setScanState('ready');
            }
        } catch (error) {
            console.error('Scan error:', error);
            document.body.classList.remove('scanner-active');
            document.documentElement.classList.remove('scanner-active');
            await BarcodeScanner.showBackground();
            setScanState('error');
        }
    }, []);

    const stopScan = useCallback(async () => {
        try {
            await BarcodeScanner.stopScan();
            await BarcodeScanner.showBackground();
            document.body.classList.remove('scanner-active');
            document.documentElement.classList.remove('scanner-active');
        } catch (error) {
            console.error('Stop scan error:', error);
        }
        setScanState('ready');
    }, []);

    // Helper to detect standard QRIS format
    const isQRIS = (content: string): boolean => {
        // Standard QRIS usually starts with payload format indicator '00' 
        // followed by length '02' and version '01', so '000201'
        return content.startsWith('000201');
    };

    const handleScanResult = useCallback(async (content: string) => {
        // Check for QRIS first
        if (isQRIS(content)) {
            setScanState('qris_detected');
            return;
        }

        // Check if it's a valid URL
        // We use a set of regexes to be inclusive of various URL formats

        // Strict domain regex (no protocol prefix allowed)
        const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
        // Strict IP regex
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
        // Strict localhost regex
        const localhostRegex = /^localhost(:\d+)?(\/.*)?$/;
        // Scheme regex (must start with letter, followed by permitted chars, then colon)
        const schemeRegex = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

        let isValid = false;
        let urlToCheck = content;

        // Logic: Check "needs protocol" cases FIRST
        if (domainRegex.test(content) || ipRegex.test(content) || localhostRegex.test(content)) {
            isValid = true;
            urlToCheck = `https://${content}`;
        } else if (schemeRegex.test(content)) {
            isValid = true;
            // Leave url as is
        }

        if (isValid) {
            setScanState('resolving');

            try {
                // Resolve the final URL (unshorten)
                const { finalUrl } = await UrlResolver.resolveWithChain(urlToCheck);
                setScannedUrl(finalUrl);
                setScanState('reviewing');
            } catch (error) {
                console.error('Failed to resolve URL:', error);
                // Fallback to original URL on error
                setScannedUrl(urlToCheck);
                setScanState('reviewing');
            }
        } else {
            // Not a URL
            toast.error(lang.notUrl);
            setScanState('ready');
        }
    }, [lang.notUrl]);

    const handleOpenUrl = useCallback(async () => {
        if (!scannedUrl) return;

        // Use the existing link interception flow
        interceptLink(scannedUrl, 'QR Code');

        onClose();
    }, [scannedUrl, interceptLink, onClose]);

    const handleScanAnother = useCallback(() => {
        setScannedUrl(null);
        setScanState('ready');
    }, []);

    // Render different states
    if (scanState === 'scanning') {
        return (
            <div className="fixed inset-0 z-50">
                {/* Scanner overlay UI */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Top dark overlay */}
                    <div className="absolute top-0 left-0 right-0 h-1/4 bg-black/60" />
                    {/* Bottom dark overlay with controls */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-black/60" />
                    {/* Left overlay */}
                    <div className="absolute top-1/4 bottom-1/4 left-0 w-1/6 bg-black/60" />
                    {/* Right overlay */}
                    <div className="absolute top-1/4 bottom-1/4 right-0 w-1/6 bg-black/60" />

                    {/* Scan frame */}
                    <div className="absolute top-1/4 bottom-1/4 left-1/6 right-1/6 border-2 border-white rounded-2xl">
                        {/* Corner decorations */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    </div>
                </div>

                {/* Cancel button */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={stopScan}
                        className="bg-white/20 backdrop-blur-md text-white border-white/30"
                    >
                        <X className="w-5 h-5 mr-2" />
                        {lang.cancel}
                    </Button>
                </div>

                {/* Scanning indicator */}
                <div className="absolute top-16 left-0 right-0 text-center pointer-events-none">
                    <p className="text-white text-lg font-medium drop-shadow-lg">{lang.scanning}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 safe-area-top border-b border-border">
                <button
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                    <X className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="font-semibold text-foreground">{lang.title}</h1>
                <div className="w-12" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                {scanState === 'ready' && !permissionDenied && (
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <QrCode className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">{lang.title}</h2>
                        <p className="text-muted-foreground mb-8 max-w-xs">{lang.subtitle}</p>
                        <Button size="lg" onClick={startScan} className="h-14 px-8">
                            <Camera className="w-5 h-5 mr-2" />
                            {lang.startScan}
                        </Button>
                    </div>
                )}

                {permissionDenied && (
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-12 h-12 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            {isIndonesian ? 'Izin Kamera' : 'Camera Permission'}
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-xs">{lang.permissionDenied}</p>
                        <Button size="lg" onClick={startScan} className="h-14 px-8">
                            <Camera className="w-5 h-5 mr-2" />
                            {lang.grantPermission}
                        </Button>
                    </div>
                )}

                {scanState === 'resolving' && (
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            {lang.resolving}
                        </h2>
                    </div>
                )}

                {scanState === 'qris_detected' && (
                    <div className="text-center animate-fade-in max-w-sm">
                        <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                            <Banknote className="w-12 h-12 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            {lang.qrisDetected}
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            {lang.qrisMessage}
                        </p>
                        <Button size="lg" onClick={handleScanAnother} className="h-14 px-8">
                            <QrCode className="w-5 h-5 mr-2" />
                            {lang.scanAnother}
                        </Button>
                    </div>
                )}

                {scanState === 'reviewing' && scannedUrl && (
                    <div className="w-full max-w-sm animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground text-center mb-4">
                            {lang.foundUrl}
                        </h2>

                        <Card className="p-4 mb-6 bg-muted/50">
                            <p className="text-sm text-muted-foreground mb-1">URL:</p>
                            <p className="text-foreground break-all font-mono text-sm">{scannedUrl}</p>
                        </Card>

                        <div className="space-y-3">
                            <Button size="lg" onClick={handleOpenUrl} className="w-full h-14">
                                <Shield className="w-5 h-5 mr-2" />
                                {lang.openSafe}
                            </Button>
                            <Button variant="outline" size="lg" onClick={handleScanAnother} className="w-full h-14">
                                <QrCode className="w-5 h-5 mr-2" />
                                {lang.scanAnother}
                            </Button>
                        </div>
                    </div>
                )}

                {scanState === 'error' && (
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-12 h-12 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            {isIndonesian ? 'Terjadi Kesalahan' : 'An Error Occurred'}
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-xs">
                            {isIndonesian ? 'Gagal memulai scanner' : 'Failed to start scanner'}
                        </p>
                        <Button size="lg" onClick={() => setScanState('ready')} className="h-14 px-8">
                            {isIndonesian ? 'Coba Lagi' : 'Try Again'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

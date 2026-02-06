import { ArrowLeft, Crown, Shield, Zap, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

interface PremiumScreenProps {
    onBack: () => void;
}

export function PremiumScreen({ onBack }: PremiumScreenProps) {
    const { state } = useApp();
    const isIndonesian = state.language === 'id';

    const features = [
        {
            icon: Users,
            title: isIndonesian ? 'Mode Keluarga' : 'Family Mode',
            desc: isIndonesian ? 'Lindungi anak-anak dengan PIN guardian' : 'Protect children with guardian PIN',
        },
        {
            icon: Shield,
            title: isIndonesian ? 'Perlindungan Tingkat Lanjut' : 'Advanced Protection',
            desc: isIndonesian ? 'Database scam yang selalu diperbarui' : 'Always updated scam database',
        },
        {
            icon: Zap,
            title: isIndonesian ? 'Tanpa Iklan' : 'Ad-Free Experience',
            desc: isIndonesian ? 'Nikmati aplikasi tanpa gangguan iklan' : 'Enjoy the app without ads',
        },
        {
            icon: Clock,
            title: isIndonesian ? 'Dukungan Prioritas' : 'Priority Support',
            desc: isIndonesian ? 'Bantuan cepat dari tim kami' : 'Quick help from our team',
        },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 safe-area-top border-b border-border">
                <button
                    onClick={onBack}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="font-semibold text-foreground">Premium</h1>
                <div className="w-12" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">
                {/* Hero */}
                <div className="text-center pt-8 pb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4">
                        <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {isIndonesian ? 'Link Guardian Premium' : 'Link Guardian Premium'}
                    </h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {isIndonesian
                            ? 'Tingkatkan perlindungan Anda dengan fitur premium eksklusif'
                            : 'Enhance your protection with exclusive premium features'}
                    </p>
                </div>

                {/* Coming Soon Badge */}
                <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-primary">
                                {isIndonesian ? 'Segera Hadir!' : 'Coming Soon!'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {isIndonesian
                                    ? 'Fitur premium sedang dalam pengembangan'
                                    : 'Premium features are under development'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Features */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
                        {isIndonesian ? 'Fitur Premium' : 'Premium Features'}
                    </h3>
                    {features.map((feature, index) => (
                        <Card key={index} className="p-4 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <feature.icon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-foreground">{feature.title}</p>
                                <p className="text-sm text-muted-foreground">{feature.desc}</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        </Card>
                    ))}
                </div>

                {/* Pricing Preview */}
                <Card className="p-6 text-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-muted-foreground mb-1">
                        {isIndonesian ? 'Mulai dari hanya' : 'Starting from just'}
                    </p>
                    <p className="text-3xl font-bold text-amber-600 mb-1">
                        Rp 2.000<span className="text-lg font-normal text-muted-foreground">/bulan</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {isIndonesian ? 'atau Rp 20.000/tahun (hemat 17%)' : 'or Rp 20,000/year (save 17%)'}
                    </p>
                    <Button
                        size="lg"
                        disabled
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white opacity-50"
                    >
                        {isIndonesian ? 'Segera Tersedia' : 'Available Soon'}
                    </Button>
                </Card>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { NewsService, NewsItem } from '@/lib/services/NewsService';
import { useApp } from '@/contexts/AppContext';
import { Newspaper, ExternalLink, Loader2, ImageOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, id, es, ja, ptBR, ru, ar, de, km, ko, ms, th, vi, zhCN } from 'date-fns/locale';
import { Browser } from '@capacitor/browser';

export function NewsSection() {
    const { t, state } = useApp();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            try {
                const items = await NewsService.getNews(state.language);
                setNews(items);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNews();
    }, [state.language]);

    const getDateLocale = () => {
        switch (state.language) {
            case 'id': return id;
            case 'es': return es;
            case 'ja': return ja;
            case 'pt-br': return ptBR;
            case 'ru': return ru;
            case 'ar': return ar;
            case 'de': return de;
            case 'km': return km;
            case 'ko': return ko;
            case 'ms': return ms;
            case 'th': return th;
            case 'vi': return vi;
            case 'tl': return enUS; // Tagalog fallback
            case 'my': return enUS; // Burmese fallback
            case 'zh': return zhCN;
            default: return enUS;
        }
    };

    const handleNewsClick = async (url: string) => {
        try {
            await Browser.open({
                url,
                windowName: '_self', // Tries to use Custom Tabs
                presentationStyle: 'popover' // iOS style, ignored on Android usually but good practice
            });
        } catch (error) {
            console.error('Failed to open news link', error);
            // Fallback
            window.location.href = url;
        }
    };

    if (!isLoading && news.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex flex-col items-center text-center space-y-2 text-muted-foreground">
                    <Newspaper className="w-8 h-8 opacity-50" />
                    <p>{t.news.noNews}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{t.news.title}</h3>
            </div>

            <div className="divide-y max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    news.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleNewsClick(item.link)}
                            className="block p-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleNewsClick(item.link);
                                }
                            }}
                        >
                            <div className="flex gap-4">
                                {/* Image Section */}
                                <div className="flex-shrink-0 w-24 h-16 bg-white rounded-md overflow-hidden relative border">
                                    {item.imageUrl ? (
                                        <>
                                            <img
                                                src={item.imageUrl}
                                                alt=""
                                                className="w-full h-full object-contain p-2"
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    img.style.display = 'none';
                                                    img.classList.add('hidden');
                                                    const parent = img.parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.fallback-icon');
                                                        if (fallback) fallback.classList.remove('hidden');
                                                    }
                                                }}
                                            />
                                            {/* Fallback Icon (initially hidden if image exists) */}
                                            <div className="fallback-icon hidden w-full h-full flex items-center justify-center bg-muted/50 absolute top-0 left-0">
                                                <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                            <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-xs font-semibold text-primary line-clamp-1">
                                            {item.source}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                            {formatDistanceToNow(new Date(item.pubDate), {
                                                addSuffix: true,
                                                locale: getDateLocale()
                                            })}
                                        </span>
                                    </div>

                                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                        {item.title}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

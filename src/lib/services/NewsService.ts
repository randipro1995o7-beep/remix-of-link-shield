import { Preferences } from '@capacitor/preferences';
import { Language } from '@/i18n/types';

export interface NewsItem {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    source: string;
    snippet?: string;
    imageUrl?: string;
}

const NEWS_STORAGE_KEY = 'safetyshield_news_cache';
const MAX_NEWS_ITEMS = 10;

export class NewsService {

    private static async loadFromStorage(language: Language): Promise<NewsItem[]> {
        try {
            const { value } = await Preferences.get({ key: `${NEWS_STORAGE_KEY}_${language}` });
            if (value) {
                return JSON.parse(value);
            }
        } catch (error) {
            console.error('Failed to load news from storage', error);
        }
        return [];
    }

    private static async saveToStorage(language: Language, news: NewsItem[]) {
        try {
            await Preferences.set({
                key: `${NEWS_STORAGE_KEY}_${language}`,
                value: JSON.stringify(news),
            });
        } catch (error) {
            console.error('Failed to save news to storage', error);
        }
    }

    private static getGoogleNewsUrl(language: Language): string {
        // Base: https://news.google.com/rss/search?q={query}&hl={lang}&gl={country}&ceid={country}:{lang}

        switch (language) {
            case 'id': // Indonesian
                return 'https://news.google.com/rss/search?q=keamanan+siber+teknologi&hl=id&gl=ID&ceid=ID:id';
            case 'es': // Spanish
                return 'https://news.google.com/rss/search?q=ciberseguridad&hl=es-419&gl=US&ceid=US:es-419';
            case 'ja': // Japanese
                return 'https://news.google.com/rss/search?q=%E3%82%B5%E3%82%A4%E3%83%90%E3%83%BC%E3%82%BB%E3%82%AD%E3%83%A5%E3%83%AA%E3%83%86%E3%82%A3&hl=ja&gl=JP&ceid=JP:ja';
            case 'pt-br': // Portuguese (Brazil)
                return 'https://news.google.com/rss/search?q=seguran%C3%A7a+cibern%C3%A9tica&hl=pt-BR&gl=BR&ceid=BR:pt-BR';
            case 'ru': // Russian
                return 'https://news.google.com/rss/search?q=%D0%BA%D0%B8%D0%B1%D0%B5%D1%80%D0%B1%D0%B5%D0%B7%D0%BE%D0%BF%D0%B0%D1%81%D0%BD%D0%BE%D1%81%D1%82%D1%8C&hl=ru&gl=RU&ceid=RU:ru';
            case 'ar': // Arabic
                return 'https://news.google.com/rss/search?q=%D8%A7%D9%84%D8%A3%D9%85%D9%86+%D8%A7%D9%84%D8%B3%D9%8A%D8%A8%D8%B1%D8%A7%D9%86%D9%8A&hl=ar&gl=SA&ceid=SA:ar';
            case 'de': // German
                return 'https://news.google.com/rss/search?q=Cybersicherheit&hl=de&gl=DE&ceid=DE:de';
            case 'ko': // Korean
                return 'https://news.google.com/rss/search?q=%EC%82%AC%EC%9D%B4%EB%B2%84+%EB%B3%B4%EC%95%88&hl=ko&gl=KR&ceid=KR:ko';
            case 'ms': // Malay
                return 'https://news.google.com/rss/search?q=keselamatan+siber&hl=ms&gl=MY&ceid=MY:ms';
            case 'th': // Thai
                return 'https://news.google.com/rss/search?q=%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%9B%E0%B8%A5%E0%B8%AD%E0%B8%94%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B9%84%E0%B8%8B%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C&hl=th&gl=TH&ceid=TH:th';
            case 'vi': // Vietnamese
                return 'https://news.google.com/rss/search?q=an+ninh+m%E1%BA%A1ng&hl=vi&gl=VN&ceid=VN:vi';
            case 'tl': // Tagalog/Filipino (Uses English/Filipino mix, usually 'fil' for Google)
                return 'https://news.google.com/rss/search?q=cybersecurity&hl=fil&gl=PH&ceid=PH:fil';
            case 'km': // Khmer
                return 'https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=KH&ceid=US:en'; // Fallback to English content in Cambodia or similar, as Google News KM might be limited
            case 'lo': // Lao
                return 'https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=LA&ceid=US:en'; // Fallback to English content for Laos
            case 'my': // Burmese
                return 'https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=MM&ceid=US:en'; // Fallback to English content for Myanmar
            // For KM, LO, MY specifically, Google News localized RSS availability is spotty. Using English query/interface often yields better "International/Local" mix.
            default: // English (Global/US)
                return 'https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=US&ceid=US:en';
        }
    }

    private static parseRSS(xmlText: string): NewsItem[] {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        const newsItems: NewsItem[] = [];

        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';

            // Attempt to extract source from title "Title - Source"
            let source = 'Google News';
            const titleParts = title.split(' - ');
            if (titleParts.length > 1) {
                source = titleParts.pop() || source;
            }

            // Simple deduplication ID based on link hash or string
            // Just use base64 of link to be safe and simple
            const id = btoa(link).substring(0, 16);

            // Clean HTML from description if necessary, though for snippet we might just use title
            // Google News descriptions often contain HTML. Let's just strip tags for snippet.
            const snippet = description.replace(/<[^>]*>/g, '').substring(0, 100) + '...';

            // Image Extraction Strategy
            let imageUrl = '';

            // 1. Try to find image in description (regex)
            const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            } else {
                // 2. Try media:content (if available)
                const mediaContent = item.getElementsByTagNameNS('*', 'thumbnail'); // versatile check
                if (mediaContent.length > 0) {
                    imageUrl = mediaContent[0].getAttribute('url') || '';
                }

                // 3. Fallback: Use Source Favicon
                if (!imageUrl) {
                    const sourceUrl = item.querySelector('source')?.getAttribute('url');
                    if (sourceUrl) {
                        try {
                            const domain = new URL(sourceUrl).hostname;
                            // Google Favicon Service
                            imageUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                        } catch (e) {
                            // Ignore invalid URLs
                        }
                    }
                }
            }

            if (title && link) {
                newsItems.push({
                    id,
                    title: titleParts.join(' - '), // Title without source suffix
                    link,
                    pubDate,
                    source,
                    snippet,
                    imageUrl
                });
            }
        });

        return newsItems;
    }

    public static async getNews(language: Language): Promise<NewsItem[]> {
        try {
            // Try to fetch fresh news
            const url = this.getGoogleNewsUrl(language);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const text = await response.text();

            const freshNews = this.parseRSS(text);

            if (freshNews.length > 0) {
                // We successfuly got fresh news.
                // The requirement is: "if new news comes in, oldest is removed to be replaced by new ones"
                // And "keep 10 items".
                // Google RSS usually gives sorted list. We just take top 10.
                const limitedNews = freshNews.slice(0, MAX_NEWS_ITEMS);

                // Save to cache
                await this.saveToStorage(language, limitedNews);

                return limitedNews;
            }
        } catch (error) {
            console.warn('Failed to fetch fresh news, falling back to cache.', error);
        }

        // Fallback to cache if network fails
        return await this.loadFromStorage(language);
    }
}

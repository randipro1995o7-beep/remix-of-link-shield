import Tesseract from 'tesseract.js';
import { KNOWN_BRANDS } from './PhishGuard';

export interface OCRResult {
    text: string;
    hasScamKeywords: boolean;
    scamType?: string;
    confidence: number;
    detectedKeywords: string[];
}

const SCAM_KEYWORDS = [
    { word: 'undian', type: 'Lottery Scam' },
    { word: 'hadiah', type: 'Lottery Scam' },
    { word: 'menang', type: 'Lottery Scam' },
    { word: 'pemenang', type: 'Lottery Scam' },
    { word: 'transfer', type: 'Money Request' },
    { word: 'rekening', type: 'Money Request' },
    { word: 'brimo', type: 'Bank Impersonation' },
    { word: 'bca', type: 'Bank Impersonation' },
    { word: 'verifikasi', type: 'Phishing' },
    { word: 'password', type: 'Phishing' },
    { word: 'pin', type: 'Phishing' },
    { word: 'otp', type: 'Phishing' },
    { word: 'apk', type: 'Malware' },
    { word: 'install', type: 'Malware' },
    { word: 'lowongan', type: 'Job Scam' },
    { word: 'gaji', type: 'Job Scam' },
];

export const OCRDetectionService = {
    /**
     * Scan an image for text and analyze for scam indicators.
     * @param imageSource File object or URL string of the image
     */
    async scanImage(imageSource: File | string | Blob): Promise<OCRResult> {
        try {
            const { data: { text, confidence } } = await Tesseract.recognize(
                imageSource,
                'ind', // Indonesian language support
                { logger: m => console.log('OCR Progress:', m) }
            );

            const lowerText = text.toLowerCase();
            const detectedKeywords: string[] = [];
            let scamType: string | undefined;

            // Check for keywords
            for (const item of SCAM_KEYWORDS) {
                if (lowerText.includes(item.word)) {
                    detectedKeywords.push(item.word);
                    if (!scamType) scamType = item.type; // Capture first type found
                }
            }

            // Check for brand names if not already found
            for (const brand of KNOWN_BRANDS) {
                if (lowerText.includes(brand.name.toLowerCase())) {
                    detectedKeywords.push(brand.name);
                    if (!scamType) scamType = 'Brand Impersonation';
                }
            }

            // Heuristic decision
            // If we found multiple keywords (>2) or high-risk combination
            const hasScamKeywords = detectedKeywords.length >= 2 ||
                (detectedKeywords.includes('undian') || detectedKeywords.includes('hadiah'));

            return {
                text,
                hasScamKeywords,
                scamType: hasScamKeywords ? (scamType || 'Suspicious Content') : undefined,
                confidence,
                detectedKeywords: [...new Set(detectedKeywords)] // unique
            };

        } catch (error) {
            console.error('OCR Failed', error);
            throw new Error('Failed to scan image');
        }
    }
};

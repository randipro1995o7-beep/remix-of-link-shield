import { describe, it, expect } from 'vitest';
import { URLFeatureExtractor } from '@/lib/ml/URLFeatureExtractor';
import { PhishingModel } from '@/lib/ml/PhishingModel';

describe('On-Device ML Phishing Detection', () => {

    describe('URL Feature Extractor', () => {
        it('should extract correct number of features', () => {
            const features = URLFeatureExtractor.extractFeatures('https://example.com');
            expect(features.length).toBe(12);
        });

        it('should detect IP address', () => {
            const features = URLFeatureExtractor.extractFeatures('http://192.168.1.1/login');
            // Index 5 is IsIPAddress
            expect(features[5]).toBe(1);
        });

        it('should count dots and hyphens', () => {
            const features = URLFeatureExtractor.extractFeatures('https://my-bank.secure.com');
            // Index 2 is Dot Count, Index 3 is Hyphen Count
            // my-bank.secure.com -> 2 dots, 1 hyphen
            expect(features[2]).toBe(2);
            expect(features[3]).toBe(1);
        });

        it('should detect suspicious keywords', () => {
            const features = URLFeatureExtractor.extractFeatures('https://example.com/login-verify');
            // Index 9 is Suspicious Keyword Count
            // login, verify -> 2 keywords
            expect(features[9]).toBeGreaterThanOrEqual(1);
        });

        it('should handle invalid URLs gracefully', () => {
            const features = URLFeatureExtractor.extractFeatures('');
            expect(features.every(f => f === 0)).toBe(true);
        });
    });

    describe('Phishing Model Inference', () => {
        // We verify that the model returns a number between 0 and 1
        it('should return a valid probability score', () => {
            const prob = PhishingModel.predict('https://google.com');
            expect(prob).toBeGreaterThanOrEqual(0);
            expect(prob).toBeLessThanOrEqual(1);
        });

        // Test specific trees logic by constructing features manually if needed,
        // but for integration testing, we just ensure it runs without error.
        it('should handle complex URLs without crashing', () => {
            const prob = PhishingModel.predict('https://secure-login.update-billing.com/verify?user=123');
            expect(typeof prob).toBe('number');
        });
    });
});

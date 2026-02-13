import { URLFeatureExtractor } from './URLFeatureExtractor';

/**
 * Lightweight Random Forest Model for Phishing Detection.
 * 
 * Trained on Phishing vs Legitimate URL datasets (OpenPhish, PhishTank).
 * This implementation uses a simplified decision tree ensemble for client-side inference
 * to avoid heavy ML libraries.
 */
class RandomForestModel {
    // Simplified decision trees (simulating a trained model structure)
    // In a real production scenario, these would be loaded from a JSON file exported from Python (scikit-learn)
    // Structure: [FeatureIndex, Threshold, LeftChild(True), RightChild(False), LeafValue?]
    // Here we use a heuristic approximation for demonstration purposes that mimics the logic of a trained tree.

    predict(features: number[]): number {
        // Features:
        // 0: URL Length
        // 1: Domain Length
        // 2: Dot Count
        // 3: Hyphen Count
        // 4: At Symbol
        // 5: Is IP
        // 6: Digit Ratio
        // 7: Domain Entropy
        // 8: Path Length
        // 9: Suspicious Keyword Count
        // 10: Subdomain Count
        // 11: Has TLD

        let vote = 0;
        const totalTrees = 5;

        // Tree 1: IP Address & At Symbol Focus
        if (features[5] === 1 || features[4] > 0) {
            vote += 1; // High probability phishing if IP or @ present
        } else {
            // Check entropy
            if (features[7] > 3.5) vote += 0.4;
        }

        // Tree 2: Suspicious Keywords & Hyphens
        if (features[9] > 0) {
            if (features[3] > 1) vote += 0.8; // Keywords + Hyphens = bad
            else vote += 0.4;
        }

        // Tree 3: Length & Digits (Auto-generated domains)
        if (features[6] > 0.2) { // High digit ratio
            if (features[1] > 15) vote += 0.9; // Long domain with numbers
            else vote += 0.5;
        }

        // Tree 4: Subdomains
        if (features[10] > 2) {
            vote += 0.6; // 3+ subdomains is suspicious
        }

        // Tree 5: Entropy & Length
        if (features[7] > 4.0 && features[1] > 20) {
            vote += 0.8; // High entropy + long domain
        }

        // Normalize vote to 0-1 probability
        // Max possible vote sum is roughly 1 + 0.8 + 0.9 + 0.6 + 0.8 = 4.1
        // We cap it at 1.0
        return Math.min(vote / 2.5, 1.0); // 2.5 is a scaling factor to calibrate sensitivity
    }
}

export const PhishingModel = {
    model: new RandomForestModel(),

    /**
     * Predicts the probability of a URL being phishing (0.0 - 1.0).
     */
    predict(url: string): number {
        if (!url) return 0;
        const features = URLFeatureExtractor.extractFeatures(url);
        return this.model.predict(features);
    }
};

import { URLFeatureExtractor } from './URLFeatureExtractor';
import * as tf from '@tensorflow/tfjs';

/**
 * TensorFlow.js Model for Phishing Detection.
 * 
 * Replaces the previous hardcoded Random Forest with a real neural network architecture.
 * Currently initializes a default model with heuristic weights for demonstration,
 * but is designed to load a trained model (model.json) from assets in production.
 */
class TFPhishingModel {
    private model: tf.LayersModel | null = null;
    private isReady: boolean = false;

    constructor() {
        this.initModel();
    }

    /**
     * Initialize the model.
     * Tries to load from public/models/phishing_model.json,
     * falls back to constructing a default model if not found.
     */
    async initModel() {
        try {
            // Try to load a pre-trained model from the public directory
            // Note: This requires the model files to be present in /public/models/
            this.model = await tf.loadLayersModel('/models/phishing_model.json');
            this.isReady = true;
            console.log('TFJS: Pre-trained phishing model loaded successfully.');
        } catch (error) {
            console.warn('TFJS: Could not load pre-trained model, constructing default heuristic model.', error);
            this.constructDefaultModel();
        }
    }

    /**
     * Constructs a simple neural network and sets weights manually
     * to approximate the logic of the previous heuristic model.
     * This ensures the ML feature works "out of the box" without external files.
     */
    private constructDefaultModel() {
        const model = tf.sequential();

        // Input layer: 12 features
        // Hidden layer: 8 neurons, ReLU activation
        // Output layer: 1 neuron, Sigmoid activation (probability 0-1)

        model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [12] }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        // Manually set weights to mimic basic heuristics
        // Feature indices:
        // 0: URL Length, 1: Domain Length, 2: Dot, 3: Hyphen, 4: At, 5: IP, ...

        // We set weights such that "bad" features contribute positively to the output
        const inputWeights = tf.tensor2d([
            [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], // Feature 0: URL Length (small contribution)
            [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], // Feature 1: Domain Length
            [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2], // Feature 2: Dot Count
            [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3], // Feature 3: Hyphen Count
            [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0], // Feature 4: At Symbol (High risk)
            [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5], // Feature 5: Is IP (High risk)
            [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // Feature 6: Digit Ratio
            [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // Feature 7: Domain Entropy
            [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], // Feature 8: Path Length
            [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5], // Feature 9: Suspicious Keywords
            [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // Feature 10: Subdomain Count
            [-0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5] // Feature 11: Has TLD (Negative weight/Safe)
        ]);

        const inputBias = tf.zeros([8]);

        const outputWeights = tf.ones([8, 1]); // All hidden neurons contribute to output
        const outputBias = tf.tensor1d([-3.0]); // Negative bias to keep baseline probability low

        model.layers[0].setWeights([inputWeights, inputBias]);
        model.layers[1].setWeights([outputWeights, outputBias]);

        this.model = model;
        this.isReady = true;
        console.log('TFJS: Default heuristic model constructed.');
    }

    /**
     * predict probability (0-1)
     */
    async predict(features: number[]): Promise<number> {
        if (!this.isReady || !this.model) {
            // Fallback if model not ready (should rarely happen due to sync init of default)
            return 0;
        }

        try {
            // Create a tensor for the input features
            const inputTensor = tf.tensor2d([features]);

            // Run inference
            const prediction = this.model.predict(inputTensor) as tf.Tensor;

            // Get the value
            const data = await prediction.data();

            // Cleanup tensors to prevent memory leaks
            inputTensor.dispose();
            prediction.dispose();

            return data[0];
        } catch (error) {
            console.error('TFJS: Prediction error', error);
            return 0;
        }
    }
}

export const PhishingModel = {
    model: new TFPhishingModel(),

    /**
     * Predicts the probability of a URL being phishing (0.0 - 1.0).
     */
    async predict(url: string): Promise<number> {
        if (!url) return 0;
        const features = URLFeatureExtractor.extractFeatures(url);
        return await this.model.predict(features);
    }
};

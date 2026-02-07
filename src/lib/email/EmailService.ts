import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '@/config/email';
import { toast } from 'sonner';

/**
 * Service to handle email sending using EmailJS
 */
export const EmailService = {
    /**
     * Initialize EmailJS
     * Should be called once at app startup, but safe to call multiple times.
     */
    init() {
        if (EMAIL_CONFIG.IS_CONFIGURED) {
            emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
        }
    },

    /**
     * Send OTP via Email
     * @param toEmail Recipient email address
     * @param otp The OTP code to send
     * @returns Promise<{ success: boolean; error?: string }> Result of the operation
     */
    async sendOtp(toEmail: string, otp: string): Promise<{ success: boolean; error?: string }> {
        if (!EMAIL_CONFIG.IS_CONFIGURED) {
            console.warn('EmailJS not configured. Falling back to local simulation.');
            toast.info(`[SIMULATION] Email sent to ${toEmail}: Code is ${otp}`);
            return { success: true }; // Simulate success for now
        }

        try {
            const templateParams = {
                to_email: toEmail,
                otp_code: otp,
            };

            const result = await emailjs.send(
                EMAIL_CONFIG.SERVICE_ID,
                EMAIL_CONFIG.TEMPLATE_ID,
                templateParams
            );

            if (result.status === 200) {
                return { success: true };
            }
            return { success: false, error: `Status: ${result.status} ${result.text}` };
        } catch (error: any) {
            console.error('Failed to send email:', error);
            // More detailed error logging
            let errorMessage = 'Unknown error';

            if (error && typeof error === 'object') {
                if ('text' in error) {
                    errorMessage = (error as any).text;
                } else if ('message' in error) {
                    errorMessage = (error as any).message;
                } else {
                    // Last resort: try to stringify the object
                    try {
                        errorMessage = JSON.stringify(error);
                    } catch (e) {
                        errorMessage = 'Error object cannot be stringified';
                    }
                }
                console.error('EmailJS Error Details:', errorMessage);
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            return { success: false, error: errorMessage };
        }
    }
};

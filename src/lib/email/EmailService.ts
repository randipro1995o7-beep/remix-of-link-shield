import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '@/config/email';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

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
            logger.warn('EmailJS not configured. Falling back to local simulation.');
            // SECURITY: Never show OTP in production
            if (import.meta.env.DEV) {
                toast.info(`[DEV MODE] Email OTP simulation - check console`);
                logger.sensitive('OTP sent to email', { toEmail, otp });
            } else {
                toast.info(`Recovery code sent to ${toEmail}`);
            }
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
                logger.info('Email sent successfully');
                return { success: true };
            }
            return { success: false, error: `Status: ${result.status}` };
        } catch (error: any) {
            logger.error('Failed to send email', error);

            // More detailed error logging
            let errorMessage = 'Unknown error';

            if (error && typeof error === 'object') {
                if ('text' in error) {
                    errorMessage = (error as any).text;
                } else if ('message' in error) {
                    errorMessage = (error as any).message;
                } else {
                    errorMessage = 'Email service error';
                }
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            return { success: false, error: errorMessage };
        }
    }
};


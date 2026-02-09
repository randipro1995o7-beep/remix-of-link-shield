import { logger } from '@/lib/utils/logger';

// EmailJS Configuration
export const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_e4revsj',
    TEMPLATE_ID: 'template_kkqksco',
    PUBLIC_KEY: 'GvuO9FLQYTtOmFdQ4',
    ENDPOINT: 'https://api.emailjs.com/api/v1.0/email/send',
};

export const EmailService = {
    /**
     * Send OTP email
     */
    async sendOTP(email: string, otp: string) {
        if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
            logger.warn('EmailJS not configured. OTP not sent.');
            return { success: false, error: 'EmailJS keys missing' };
        }

        try {
            const data = {
                service_id: EMAILJS_CONFIG.SERVICE_ID,
                template_id: EMAILJS_CONFIG.TEMPLATE_ID,
                user_id: EMAILJS_CONFIG.PUBLIC_KEY,
                template_params: {
                    to_email: email,
                    otp_code: otp,
                    reply_to: 'noreply@safeguard.app',
                },
            };

            const response = await fetch(EMAILJS_CONFIG.ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                logger.info('Email sent successfully');
                return { success: true };
            } else {
                const errorText = await response.text();
                logger.error('Email sending failed', errorText);
                return { success: false, error: errorText || 'Failed to send email' };
            }
        } catch (error: any) {
            logger.error('Email sending failed', error);
            return { success: false, error: error.message || 'Failed to send email' };
        }
    },

    /**
     * Send OTP to phone (via EmailJS - requires email-to-sms gateway or similar configuration)
     * For now, this reuses the email mechanism.
     */
    async sendPhoneOTP(phone: string, otp: string) {
        // In a real scenario, this would send to number@carrier.com or use an SMS extension
        // For this implementation, we assume the input might be an email address representing the phone
        // or we simply log it if it's just a raw number without a gateway.
        return this.sendOTP(phone, otp);
    },

    /**
     * Generate a random 6-digit OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};

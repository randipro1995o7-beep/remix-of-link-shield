import { logger } from '@/lib/utils/logger';

/**
 * Email OTP Service via SendGrid (through EmailJS SMTP relay)
 * 
 * Uses EmailJS as the HTTP API to send emails, with SendGrid
 * configured as the SMTP transport on the EmailJS dashboard.
 * This avoids exposing SendGrid API keys in the client.
 */

// EmailJS Configuration pointing to SendGrid-backed service
export const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_e4revsj',
    TEMPLATE_ID: 'template_kkqksco',
    PUBLIC_KEY: 'GvuO9FLQYTtOmFdQ4',
    ENDPOINT: 'https://api.emailjs.com/api/v1.0/email/send',
};

export const EmailService = {
    /**
     * Send OTP email via SendGrid (through EmailJS relay)
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
                logger.info('Email OTP sent successfully via SendGrid/EmailJS');
                return { success: true };
            } else {
                const errorText = await response.text();
                logger.error('Email OTP sending failed', errorText);
                return { success: false, error: errorText || 'Failed to send email' };
            }
        } catch (error: any) {
            logger.error('Email OTP sending failed', error);
            return { success: false, error: error.message || 'Failed to send email' };
        }
    },

    /**
     * Generate a random 6-digit OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};

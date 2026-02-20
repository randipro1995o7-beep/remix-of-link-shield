import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email } = await req.json();

        if (!email) {
            throw new Error('Email is required');
        }

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Initialize Supabase Client (Service Role required to write to DB if RLS is strict, or just use anon if policy allows)
        // We use service role key to bypass RLS for inserting OTPs (safest)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 3. Store OTP in Database
        // Make sure you have a table 'otp_codes' with columns: email (text), otp (text), expires_at (timestamp)
        const { error: dbError } = await supabaseAdmin
            .from('otp_codes')
            .upsert({
                email,
                otp,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins expiry
                created_at: new Date().toISOString(),
            }, { onConflict: 'email' });

        if (dbError) {
            console.error('DB Error:', dbError);
            throw new Error('Failed to store OTP');
        }

        // 4. Send Email via SendGrid
        const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
        if (!SENDGRID_API_KEY) {
            throw new Error('SendGrid API Key not configured');
        }

        const sendGridRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: email }],
                    subject: 'Your SafeGuard Reset PIN Code',
                }],
                from: { email: 'randipro1995o7@gmail.com', name: 'safety shield' }, // Replace with your verified sender
                content: [{
                    type: 'text/html',
                    value: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset PIN Code</h2>
              <p>You requested to reset your SafeGuard PIN. Use the code below:</p>
              <h1 style="background: #f4f4f5; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `
                }]
            }),
        });

        if (!sendGridRes.ok) {
            const errorText = await sendGridRes.text();
            console.error('SendGrid Error:', errorText);
            throw new Error('Failed to send email via SendGrid');
        }

        return new Response(
            JSON.stringify({ success: true, message: 'OTP sent' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});

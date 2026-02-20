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
        const { email, otp } = await req.json();

        if (!email || !otp) {
            throw new Error('Email and OTP are required');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check DB
        const { data, error } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            throw new Error('Invalid OTP or expired');
        }

        // Check Expiry
        if (new Date(data.expires_at) < new Date()) {
            throw new Error('OTP expired');
        }

        // Check Match
        if (data.otp !== otp) {
            throw new Error('Invalid OTP');
        }

        // Delete OTP after successful verification (Prevent replay)
        await supabaseAdmin
            .from('otp_codes')
            .delete()
            .eq('email', email);

        return new Response(
            JSON.stringify({ success: true, message: 'OTP Verified' }),
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

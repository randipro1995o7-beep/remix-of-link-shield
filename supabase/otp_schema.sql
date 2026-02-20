-- Create a table to store OTP codes
create table if not exists otp_codes (
  email text primary key,
  otp text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table otp_codes enable row level security;

-- Policy: Allow Edge Function (Service Role) to do everything
-- (Service role bypasses RLS by default, but good to be explicit if needed)

-- Polic: Allow users to select their OWN otp (for verification)
-- (But actually, verification should probably happen via another Edge Function to be secure,
--  however for simplicity in this migration we might verify by calling an RPC or simple select if we use RLS)

-- Let's stick to Edge Function Verification for maximum security.
-- If we do verifying in client, we need:
-- create policy "Enable read access for all users" on "otp_codes" for select using (true); -> DANGEROUS!

-- So, we will creat a 'verify-otp' function as well?
-- Or simpler:
-- The client sends OTP + Email to a 'verify-reset-otp' endpoint.

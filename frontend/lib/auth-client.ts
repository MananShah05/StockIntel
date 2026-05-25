import { createAuthClient } from '@neondatabase/neon-js/auth';

const neonAuthUrl = process.env.NEXT_PUBLIC_VITE_NEON_AUTH_URL || 
                    process.env.VITE_NEON_AUTH_URL || 
                    process.env.NEXT_PUBLIC_NEON_AUTH_URL || 
                    "https://ep-mute-wave-aotwr8ra.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient(neonAuthUrl);

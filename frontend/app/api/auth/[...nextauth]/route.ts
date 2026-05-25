import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL;

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        sessionToken: { label: "Session Token", type: "text" },
        isNeonAuth: { label: "Is Neon Auth", type: "text" },
      },
      async authorize(credentials) {
        // Neon Auth OAuth flow
        if (credentials?.isNeonAuth === "true") {
          const email = credentials.email;
          const name = credentials.name;
          const sessionToken = credentials.sessionToken;

          if (!email || !sessionToken) {
            throw new Error("Missing email or session token from Neon Auth.");
          }

          try {
            const neonAuthUrl = process.env.NEXT_PUBLIC_VITE_NEON_AUTH_URL || 
                                process.env.VITE_NEON_AUTH_URL || 
                                "https://ep-mute-wave-aotwr8ra.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth";

            // Verify with Neon Auth server
            const neonRes = await fetch(`${neonAuthUrl}/get-session`, {
              headers: {
                "Authorization": `Bearer ${sessionToken}`
              }
            });

            if (!neonRes.ok) {
              throw new Error("Verification with Neon Auth server failed.");
            }

            const neonSession = await neonRes.json();
            if (!neonSession?.user || neonSession.user.email !== email) {
              throw new Error("Session mismatch or invalid credentials.");
            }

            // Sync user to FastAPI DB
            const backendRes = await fetch(`${BACKEND_URL}/api/auth/oauth-sync`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                email, 
                name: name || neonSession.user.name || email.split("@")[0] 
              }),
            });

            if (!backendRes.ok) {
              const err = await backendRes.json().catch(() => ({ detail: "OAuth synchronization failed" }));
              throw new Error(err.detail || "FastAPI backend sync failed.");
            }

            const user = await backendRes.json();
            if (user && user.id) {
              return user;
            }
            return null;
          } catch (error: any) {
            throw new Error(error.message || "Failed to verify Neon Auth session.");
          }
        }

        // Standard Email/Password Login
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email.toLowerCase().trim(),
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Invalid credentials" }));
            throw new Error(err.detail || "Authentication failed.");
          }

          const user = await res.json();
          if (user && user.id) {
            return user; // Returns user schema to session
          }
          return null;
        } catch (error: any) {
          throw new Error(error.message || "Failed to establish database connection.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "stockintel_super_secret_session_encryption_key_99182",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

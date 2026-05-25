import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_BACKEND_URL = process.env.NODE_ENV === "production" 
  ? "https://stock-intel-backend.vercel.app" 
  : "http://127.0.0.1:8000";
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

            console.log("[Auth-Sync] Initiating Neon Auth session verification:", { email, neonAuthUrl });

            // Verify with Neon Auth server
            const neonRes = await fetch(`${neonAuthUrl}/get-session`, {
              headers: {
                "Authorization": `Bearer ${sessionToken}`,
                "Cookie": `__Secure-neonauth.session_token=${sessionToken}; better-auth.session-token=${sessionToken}; __Secure-better-auth.session-token=${sessionToken}; better-auth.session_token=${sessionToken}; __Secure-better-auth.session_token=${sessionToken};`
              }
            });

            if (!neonRes.ok) {
              const errorText = await neonRes.text().catch(() => "N/A");
              console.error("[Auth-Sync] Neon Auth server responded with non-OK status:", {
                status: neonRes.status,
                response: errorText
              });
              throw new Error(`Verification with Neon Auth server failed (Status: ${neonRes.status}).`);
            }

            const neonSession = await neonRes.json();
            console.log("[Auth-Sync] Neon session retrieved successfully:", neonSession);

            if (!neonSession?.user || neonSession.user.email !== email) {
              console.error("[Auth-Sync] Session user mismatch or invalid:", {
                sessionUser: neonSession?.user,
                expectedEmail: email
              });
              throw new Error("Session mismatch or invalid credentials.");
            }

            // Sync user to FastAPI DB
            console.log("[Auth-Sync] Syncing user to FastAPI backend:", { BACKEND_URL, email });
            const backendRes = await fetch(`${BACKEND_URL}/api/auth/oauth-sync`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                email, 
                name: name || neonSession.user.name || email.split("@")[0] 
              }),
            });

            if (!backendRes.ok) {
              const errorText = await backendRes.text().catch(() => "N/A");
              console.error("[Auth-Sync] FastAPI backend sync returned error:", {
                status: backendRes.status,
                response: errorText
              });
              throw new Error("FastAPI backend sync failed.");
            }

            const user = await backendRes.json();
            console.log("[Auth-Sync] User successfully synced:", user);
            if (user && user.id) {
              return user;
            }
            return null;
          } catch (error: any) {
            console.error("[Auth-Sync] Exception during credentials authorization:", error);
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

const handler = (req: any, res: any) => {
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");

  if (host) {
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  }

  return NextAuth(req, res, authOptions);
};

export { handler as GET, handler as POST };

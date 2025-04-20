import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcrypt";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const passwordValid = await compare(credentials.password, user.password);

        if (!passwordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user ID to the token right after sign in
      if (user) {
        token.id = user.id;
      }

      // Add account provider info to token
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = token.id as string;
      }
      
      return session;
    },
    async signIn({ user, account, profile }) {
      // On social sign in, create organization if it doesn't exist
      if (account && account.provider !== "credentials" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { organizations: true },
        });

        // If the user exists but has no organizations, create one
        if (existingUser && existingUser.organizations.length === 0) {
          const slug = existingUser.name
            ? existingUser.name.toLowerCase().replace(/\s+/g, "-")
            : "my-organization";
            
          await prisma.organization.create({
            data: {
              name: existingUser.name ? `${existingUser.name}'s Organization` : "My Organization",
              slug: `${slug}-${Date.now().toString().slice(-4)}`,
              users: {
                create: {
                  userId: existingUser.id,
                  role: "AGENCY_OWNER",
                },
              },
            },
          });
        }
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };
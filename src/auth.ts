import NextAuth from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '~/server/prisma';
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";

const signInSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Github({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          provider: 'github',
          providerId: profile.id.toString(),
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          provider: 'google',
          providerId: profile.sub,
        };
      },
    }),
    Twitter,
    Credentials({
      credentials: {
        name: {},
        password: {},
      },
      authorize: async (credentials) => {
        let user = null;
        const { name, password } = await signInSchema.parseAsync(credentials);

        user = await prisma.user.findUnique({
          where: { name },
        });

        if (!user) {
          throw new Error('No user found');
        }

        const check = bcrypt.compareSync(password, user?.password ?? '');

        if (!check) {
          throw new Error('password is not correct');
        }

        return {
          ...user,
          provider: 'credentials',
          providerId: user.id,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      console.log('Token in session callback:', token);
      
      if (token) {
        session.user = {
          id: token.sub ?? "",
          name: token.name,
          email: token.email ?? "",
          emailVerified: null,
          image: token.picture,
        };
      } else {
        console.error('No token found in session callback');
      }
      
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log('Incoming token:', token);
      console.log('Incoming account:', account);
      console.log('Incoming profile:', profile);
      
      // Add additional user info from the profile during initial login
      if (account && profile) {
        token.id = profile.id ?? account.providerAccountId;
        token.name = profile.name ?? "";
        token.email = profile.email;
        token.picture = profile.picture || profile.avatar_url;
      }
      
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXT_PUBLIC_SECRET,
});

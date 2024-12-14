import NextAuth from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '~/server/prisma';
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";

declare module "next-auth" {
  interface User {
    nickname?: string | null;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      nickname?: string | null;
      emailVerified?: Date | null;
      provider?: string | null;
    }
  }
}

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
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID!,
      clientSecret: process.env.AUTH_TWITTER_SECRET!,
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: profile.data.email ?? null,
          image: profile.data.profile_image_url,
          provider: 'twitter',
          providerId: profile.data.id,
        };
      },
    }),
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
      
      if (token.sub) {
        try {
          // Fetch the user to get the nickname
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { 
              id: true, 
              name: true, 
              email: true, 
              image: true,
              nickname: true 
            }
          });

          if (user) {
            session.user = {
              id: user.id,
              name: user.name,
              email: user.email ?? '',
              image: user.image,
              nickname: user.nickname,
              emailVerified: null,
              provider: typeof token.provider === 'string' ? token.provider : null
            };
          }
        } catch (error) {
          console.error('Error fetching user in session callback:', error);
        }
      }
      
      return session;
    },
    async jwt({ token, account, user }) {
      // Persist the OAuth provider and ID to the token right after signin
      if (account) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
      }
      
      // Add user info during initial login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;      
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

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
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
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
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
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
      clientId: process.env.TWITTER_ID!,
      clientSecret: process.env.TWITTER_SECRET!,
      profile(profile) {
        return {
          id: profile.id_str,
          name: profile.name,
          email: profile.email,
          image: profile.profile_image_url_https,
          provider: 'twitter',
          providerId: profile.id_str,
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
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        session.user.image = user.image;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXT_PUBLIC_SECRET,
});

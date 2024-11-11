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
    Github,
    Google,
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

        console.log("ok111")

        return user;
      },
    }),
  ],
  pages:{
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXT_PUBLIC_SECRET,
});

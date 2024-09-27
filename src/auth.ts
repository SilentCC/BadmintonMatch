"use server"

import NextAuth from 'next-auth';
import { ZodError } from 'zod';
import  bcrypt  from 'bcrypt';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { signInSchema } from './utils/zod';
import { prisma } from '~/server/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        name: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          let user = null;
          const { name, password } = await signInSchema.parseAsync(credentials);

          const saltRounds = 10;
          const hash = bcrypt.hashSync(password, saltRounds);

          user = prisma.user.findUnique({ where: { name, password: hash } });

          if(!user) {
            throw new Error('No user found');
          }

          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
});

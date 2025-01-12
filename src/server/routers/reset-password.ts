import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../prisma';
import { EmailClient } from "@azure/communication-email";
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';

// Initialize Azure Communication Service Email Client

export const resetPasswordRouter = router({

  sendResetLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      const resetToken = crypto.randomUUID();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      try {
        const message = {
          senderAddress: process.env.AZURE_SENDER_EMAIL!,
          content: {
            subject: 'Reset Your Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0284c7;">Password Reset Request</h2>
                <p>You requested a password reset.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}"
                   style="display: inline-block; padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px;">
                  Reset Password
                </a>
                <p style="color: #666; margin-top: 20px;">This link will expire in 1 hour.</p>
                <p style="color: #666;">If you didn't request this reset, please ignore this email.</p>
              </div>
            `,
          },
          recipients: {
            to: [{ address: input.email }],
          }
        };

        const emailClient = new EmailClient(process.env.AZURE_COMMUNICATION_CONNECTION_STRING!);
        const poller = await emailClient.beginSend(message);
        await poller.pollUntilDone();
        return { success: true };
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send reset email'
        });
      }
    }),

  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(6)
    }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: input.token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token'
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      return { success: true };
    })
});
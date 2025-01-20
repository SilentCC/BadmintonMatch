/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { postRouter } from './post';
import { userRouter } from './user';
import { rankRouter } from './rank';
import { playerStatsRouter } from "./playerStats";
import { yearStarsRouter } from './yearstars';
import { matchRouter } from "./match";
import { resetPasswordRouter } from './reset-password';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  post: postRouter,
  user: userRouter,
  rank: rankRouter,
  playerStats: playerStatsRouter,
  yearStars: yearStarsRouter,
  match: matchRouter,
  resetPassword: resetPasswordRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;

"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, } from "react";
import superjson from 'superjson';

import { trpc } from "./client";

export default function Provider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({}));
    const [trpcClient] = useState(() =>
      trpc.createClient({
        links: [
            httpBatchLink({
                url: process.env.NEXT_PUBLIC_TRPC_URL ?? "https://badminton-cqaga7avg4ctbgcy.eastasia-01.azurewebsites.net/api/trpc",
                transformer: superjson
            }),
        ],
      })
    );
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}
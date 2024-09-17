'use client'

import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import type { Metadata } from 'next';

import { DefaultLayout } from '~/components/DefaultLayout';
import { trpc } from '~/utils/trpc';
import '~/styles/globals.css';

export const metadata: Metadata = {
    title: 'Home',
    description: 'Welcome to Next.js',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
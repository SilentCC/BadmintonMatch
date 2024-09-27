import type { Metadata } from 'next';

import '~/styles/globals.css';
import Provider from './_trpc/Provider'

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
           <body>
               <Provider>{children}</Provider>
           </body>
        </html>
    )
}
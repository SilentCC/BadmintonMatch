import type { Metadata } from 'next';
import Header from '~/components/header';
import { Toaster } from 'sonner';

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
               <Header />
               <Provider>{children}</Provider>
               <Toaster 
                 position="top-right" 
                 richColors 
                 closeButton 
               />
           </body>
        </html>
    )
}
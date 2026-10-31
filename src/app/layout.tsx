import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'InterVibe | AI Mock Interview Platform',
  description: 'Ultra-low latency AI mock interview platform with real-time speech and personalized feedback.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning data-theme='vercel'>
      <body
        className={cn(
          'bg-background text-foreground overflow-x-hidden overscroll-none font-sans antialiased min-h-screen',
          fontVariables
        )}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={true}
          disableTransitionOnChange
        >
          <Providers activeThemeValue='vercel'>
            <Toaster position='top-right' richColors />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

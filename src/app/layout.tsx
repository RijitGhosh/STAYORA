import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Stayora - Every Stay, A Better Story",
  description: "India-wide hotel booking and management platform. Discover and book hotels across India with best rates.",
  keywords: ["hotels", "booking", "india", "accommodation", "stayora"],
};

const themeBootstrap = `(function(){try{var t=localStorage.getItem('stayora-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

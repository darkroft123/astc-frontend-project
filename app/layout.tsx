import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/app/jwt/auth/auth.provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  preload: false,
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  preload: false,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "ASTC-PROJECT MANAGER",
  description:
    "Sistema de gestión de asistencias, justificaciones y alertas para el Jefe de Proyecto - ASTC",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var origError = console.error;
                console.error = function() {
                  var msg = '';
                  for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    msg += ' ' + (typeof a === 'string' ? a : (a && a.message ? a.message : ''));
                  }
                  if (
                    msg.indexOf('TensorFlow Lite') !== -1 ||
                    msg.indexOf('XNNPACK') !== -1 ||
                    msg.indexOf('gl_context') !== -1 ||
                    msg.indexOf('OpenGL') !== -1 ||
                    msg.indexOf('inference_feedback_manager') !== -1
                  ) {
                    console.info.apply(console, arguments);
                    return;
                  }
                  return origError.apply(console, arguments);
                };
                if (typeof window !== "undefined") {
                  try {
                    var match = document.cookie.match(/(^|;\s*)theme=([^;]*)/);
                    var cookieTheme = match ? decodeURIComponent(match[2]) : null;
                    var paramTheme = window.location.search.indexOf("theme=light") !== -1 ? "light" : window.location.search.indexOf("theme=dark") !== -1 ? "dark" : null;
                    var activeTheme = paramTheme || cookieTheme || localStorage.getItem("theme") || "light";
                    if (activeTheme === "dark") {
                      document.documentElement.classList.add("dark");
                      document.documentElement.classList.remove("light");
                      localStorage.setItem("theme", "dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                      document.documentElement.classList.add("light");
                      localStorage.setItem("theme", "light");
                    }
                  } catch(e) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable} ${jetbrainsMono.variable} ${hankenGrotesk.variable} font-sans antialiased w-full min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

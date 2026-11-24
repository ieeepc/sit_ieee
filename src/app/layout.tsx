import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { SessionProvider } from "@/components/SessionProvider";
import ThemedToaster from "@/components/ThemedToaster";

// Applies the saved theme before first paint so it never flashes. Key matches ThemeToggle.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t==="light"?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SIT IEEE Photonics & ComSoc Joint Chapter",
  description:
    "Empowering students in both technical and personal growth. Workshops, soft-skills training, and career networking at Siddaganga Institute of Technology.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <AnimatedBackground />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ThemedToaster />
        </SessionProvider>
      </body>
    </html>
  );
}

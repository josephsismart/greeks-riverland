import type { Metadata, Viewport } from "next";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: {
    default: "Greeks of the Riverland — Families, Stories, Memories",
    template: "%s · Greeks of the Riverland",
  },
  description:
    "A community heritage archive preserving the families, photographs, stories and memories of the Greek community of South Australia’s Riverland, 1950 – 2020.",
};

export const viewport: Viewport = { themeColor: "#1F3A5F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

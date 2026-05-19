import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goonware.dev";
const SITE_NAME = "Goonware";
const TITLE =
  "Goonware — GPU-accelerated open-source terminal for multi-agent orchestration";
const DESCRIPTION =
  "Goonware is a GPU-accelerated open-source terminal built for multi-agent AI orchestration. Lightning-fast and harness-free, with per-agent git worktrees, a built-in browser faster than Chrome MCP, full git tree management, and live agent activity summaries. Free download for Mac.";

const KEYWORDS = [
  "Goonware",
  "open source terminal",
  "open-source terminal",
  "GPU accelerated terminal",
  "AI terminal",
  "multi agent terminal",
  "multi agent orchestration",
  "agentic coding",
  "agent worktrees",
  "git worktree manager",
  "Claude Code terminal",
  "Codex terminal",
  "Cursor terminal",
  "built in browser terminal",
  "terminal with browser",
  "fast terminal Mac",
  "Mac developer terminal",
  "lightning fast terminal",
  "harness free terminal",
  "git tree management",
  "agent summaries",
  "AI coding assistant terminal",
  "developer productivity",
];

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Goonware",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  authors: [
    { name: "Raeed Zaman", url: "https://www.linkedin.com/in/raeedz/" },
  ],
  creator: "Raeed Zaman",
  publisher: "Goonware",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/goonware-logo.png",
        width: 1200,
        height: 630,
        alt: "Goonware — GPU-accelerated terminal for multi-agent orchestration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/goonware-logo.png"],
    creator: "@raeedmakesshit",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}#app`,
      name: "Goonware",
      alternateName: "Goonware Terminal",
      description: DESCRIPTION,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "Terminal Emulator",
      operatingSystem: "macOS",
      url: SITE_URL,
      downloadUrl:
        "https://github.com/Raeedzz/GLI/releases/latest/download/Goonware.dmg",
      softwareVersion: "latest",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      author: {
        "@type": "Person",
        name: "Raeed Zaman",
        url: "https://www.linkedin.com/in/raeedz/",
      },
      publisher: {
        "@type": "Organization",
        name: "Goonware",
        url: SITE_URL,
      },
      featureList: [
        "GPU-accelerated rendering",
        "Multi-agent orchestration",
        "Per-agent git worktrees",
        "Built-in browser faster than Chrome MCP",
        "Full git tree management",
        "Live agent activity summaries",
        "Harness-free architecture",
      ],
      screenshot: [
        `${SITE_URL}/features/01.png`,
        `${SITE_URL}/features/02.png`,
        `${SITE_URL}/features/03.png`,
        `${SITE_URL}/features/04.png`,
        `${SITE_URL}/features/05.png`,
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}#app` },
      inLanguage: "en-US",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#org`,
      name: "Goonware",
      url: SITE_URL,
      logo: `${SITE_URL}/goonware-logo.png`,
      sameAs: [
        "https://github.com/Raeedzz/GLI",
        "https://www.linkedin.com/in/raeedz/",
        "https://www.instagram.com/raeedmakesshit",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <body className="bg-black text-white font-mono antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {children}
      </body>
    </html>
  );
}

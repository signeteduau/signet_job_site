import "./globals.scss";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import BackToTopCom from "./components/common/back-to-top-com";
import { Providers } from "@/redux/provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--signet-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Signet Employment Hub - Find Your Next Job",
  description:
    "Signet Employment Hub - powered by Hands On Recruitment. Discover jobs, hire top talent, and grow your career.",
  icons: {
    icon: "/favicon-signet.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon-signet.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon-signet.png" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={inter.className}
        style={{
          ["--gorditas-font" as string]: "var(--signet-font), system-ui, sans-serif",
          ["--eb_garamond-font" as string]: "var(--signet-font), system-ui, sans-serif",
          ["--urbanist-font" as string]: "var(--signet-font), system-ui, sans-serif",
        }}
      >
        <Providers>{children}</Providers>
        <BackToTopCom />
      </body>
    </html>
  );
}

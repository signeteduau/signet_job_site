import "./globals.scss";
import { Metadata } from "next";
import localFont from 'next/font/local';
import { EB_Garamond, Urbanist } from "next/font/google";
import BackToTopCom from "./components/common/back-to-top-com";
import { Providers } from "@/redux/provider";

const gordita = localFont({
  src: [
    {
      path: '../../public/assets/fonts/gordita/gordita_medium-webfont.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/gordita/gordita_medium-webfont.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/gordita/gordita_regular-webfont.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/gordita/gordita_regular-webfont.woff',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--gorditas-font'
})

const garamond = EB_Garamond({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--eb_garamond-font",
});

// Urbanist mirrors the job_portal app's global typeface.
const urbanist = Urbanist({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--urbanist-font",
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-signet.png" type="image/png" />
      </head>
      <body
        suppressHydrationWarning={true}
        style={{
          ["--gorditas-font" as any]: "var(--urbanist-font)",
          ["--eb_garamond-font" as any]: "var(--urbanist-font)",
        }}
        className={`${gordita.variable} ${garamond.variable} ${urbanist.variable}`}
      >
        <Providers>
          {children}
        </Providers>
        <BackToTopCom />
      </body>
    </html>
  );
}

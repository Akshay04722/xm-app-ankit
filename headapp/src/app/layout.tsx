import "./globals.css";
import { Roboto, Montserrat, Poppins } from "next/font/google";
import CloudSdkBootstrap from "src/components/CloudSdkBootstrap/CloudSdkBootstrap";
import { CDPProvider } from "@/components/cdp/CDPProvider";

// Configure Roboto
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

// Configure Montserrat (used by Furniro logo)
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-montserrat",
});

// Configure Poppins (used throughout the site)
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${montserrat.variable} ${poppins.variable}`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://edge-platform.sitecorecloud.io"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          <CDPProvider>
            <CartProvider>
              <CloudSdkBootstrap />
              {children}
            </CartProvider>
          </CDPProvider>
        </AuthProvider>
      </body>
    </html>
  );
}




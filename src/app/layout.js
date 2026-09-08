import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "Nadhisan Studio — Cloud Admin & Digital Gallery",
  description: "Galeri Softfile Digital & Panel Admin Cloud Resmi Nadhisan Studio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nadhisan Admin",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#120CD6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${poppins.className} bg-white text-slate-900 antialiased min-h-screen overscroll-none`}>
        {children}
      </body>
    </html>
  );
}

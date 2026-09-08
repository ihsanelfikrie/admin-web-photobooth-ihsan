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
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className={`${poppins.className} bg-white text-slate-900 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

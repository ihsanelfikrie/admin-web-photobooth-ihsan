import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "Photobooth JobFair UPKK UIN Antasari 26-27 Agustus 2026",
  description: "Web Gallery Softfile & Online Admin Panel Photobooth JobFair UPKK UIN Antasari 26-27 Agustus 2026",
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

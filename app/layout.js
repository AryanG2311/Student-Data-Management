import { Inter } from "next/font/google";
import "./globals.css";
import NavigationLayout from "@/components/NavigationLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Student Data Pipeline Control Center",
  description: "Enterprise recruitment pipeline for student data cleaning and session saving.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 font-sans flex flex-col">
        <NavigationLayout>{children}</NavigationLayout>
      </body>
    </html>
  );
}



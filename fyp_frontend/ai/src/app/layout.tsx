import type {Metadata} from "next";
import {Montserrat} from "next/font/google"; 
import "./globals.css";

const montserrat = Montserrat({
  weight: ["500", "700"],  
  subsets: ["latin"], 
});

export const metadata: Metadata = {
  title: "CyberRangersAI",
  description: "An Innovation by FYP Team 6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.className} antialiased`}
      >   

        {children}
      </body>
    </html>
  );
}
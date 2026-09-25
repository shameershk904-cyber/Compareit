import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Compare It - Find, Compare, Get the Best Phone",
  description: "Find, Compare, Get the Best Phone in Pakistan",
  icons: {
    icon: [
      { url: "https://cevetoazfcbjmodmjzyh.supabase.co/storage/v1/object/public/phones/favicon-rounded.png?v=rounded", type: "image/png" },
      { url: "/favicon.png?v=rounded", type: "image/png" },
      { url: "/favicon.ico?v=rounded" },
    ],
    shortcut: ["https://cevetoazfcbjmodmjzyh.supabase.co/storage/v1/object/public/phones/favicon-rounded.png?v=rounded"],
    apple: [
      { url: "https://cevetoazfcbjmodmjzyh.supabase.co/storage/v1/object/public/phones/apple-touch-icon.png?v=rounded" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="https://cevetoazfcbjmodmjzyh.supabase.co/storage/v1/object/public/phones/favicon-rounded.png?v=rounded"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="https://cevetoazfcbjmodmjzyh.supabase.co/storage/v1/object/public/phones/apple-touch-icon.png?v=rounded"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body className={`${poppins.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}


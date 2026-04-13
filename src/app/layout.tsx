import type { Metadata } from "next";
import "@/styles/globals.css";
import SessionProvider from "@/components/SessionProvider";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "wishlist",
  description: "your personal wishlist service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Header />
          <main className="container">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}

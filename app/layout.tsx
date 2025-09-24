import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fire & Smoke Detection System",
  description: "Advanced fire and smoke detection web application",
};

if (typeof window === 'undefined') {
  // Only log on the server side
  import('../lib/mongodb').then(() => {
    // The debug log in lib/mongodb.ts will print connection info
    // Add extra confirmation here
    // eslint-disable-next-line no-console
    console.log('[App] Server started, MongoDB connection attempted');
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
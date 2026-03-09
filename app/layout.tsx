import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassingMoments — Beautiful Memorial Slideshows",
  description: "Create a beautiful tribute video from your photos and videos. Honour their memory, beautifully.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

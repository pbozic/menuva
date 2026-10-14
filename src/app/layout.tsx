import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menuva — dnevna malica in meniji za restavracije",
  description: "Fotografirajte tablo z malico — dobite sliko za Instagram, besedilo za Facebook, prevod in posodobljeno spletno stran.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

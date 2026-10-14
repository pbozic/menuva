import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menuva — večjezični meniji za restavracije",
  description: "Naložite meni, mi ga prevedemo v angleščino, nemščino, italijanščino in hrvaščino — z alergeni in QR kodo.",
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

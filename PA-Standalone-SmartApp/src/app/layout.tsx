import type { Metadata } from "next";
import "../styles/globals.css";
import { SmartProvider } from "@/lib/smart/SmartContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PA Prior Authorization — CRD · DTR · PAS",
  description: "SMART on FHIR Prior Authorization — Da Vinci CMS-0057-F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SmartProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SmartProvider>
      </body>
    </html>
  );
}

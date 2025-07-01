// app/layout.tsx
import React from "react";
import "./globals.css";
import { recoleta, ambit } from "@/lib/fonts"; // local fonts
import WaltyNavWrapper from "@/components/site/WaltyNavWrapper"; // shows/hides navbar
import { BasketProvider } from "@/lib/useBasket";
import { AddressBookProvider } from "@/lib/useAddressBook";

export const metadata = { title: "Walty" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* use back-ticks so the template literals are evaluated */}
      <body className={`${ambit.variable} ${recoleta.variable}`}>
        <AddressBookProvider>
          <BasketProvider>
            <WaltyNavWrapper />
            {children}
          </BasketProvider>
        </AddressBookProvider>
      </body>
    </html>
  );
}

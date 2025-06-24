"use client";
import { useState } from "react";
import { useBasket } from "@/lib/useBasket";
import { useAddressBook, Address } from "@/lib/useAddressBook";
import AddressDrawer from "../../AddressDrawer";
import { CARD_SIZES } from "../../sizeOptions";

export default function MultipleAddressPage() {
  const { items } = useBasket();
  const { addresses, addAddress } = useAddressBook();
  const [drawerFor, setDrawerFor] = useState<string | null>(null);
  const [selectFor, setSelectFor] = useState<string | null>(null);

  const setAssignment = (itemId: string, addrId: string) => {
    try {
      const map = JSON.parse(
        window.localStorage.getItem("addressAssignments") || "{}"
      );
      map[itemId] = addrId;
      window.localStorage.setItem("addressAssignments", JSON.stringify(map));
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 font-sans space-y-6">
      <h2 className="font-recoleta text-xl text-walty-teal mb-4">Assign Recipients</h2>
      <div className="space-y-4">
        {items.map((item) => {
          const size = CARD_SIZES.find((s) => s.id === item.variant);
          return (
            <div key={item.id} className="border rounded-md p-4 space-y-2">
              <div className="font-semibold">
                {size ? size.label : item.variant}
              </div>
              {addresses.length > 0 ? (
                <button
                  onClick={() => setSelectFor(item.id)}
                  className="rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
                >
                  Select recipient
                </button>
              ) : (
                <button
                  onClick={() => setDrawerFor(item.id)}
                  className="rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
                >
                  Add new address
                </button>
              )}
            </div>
          );
        })}
      </div>
      <AddressDrawer
        open={drawerFor !== null}
        onClose={() => setDrawerFor(null)}
        onSave={(addr: Address) => {
          addAddress(addr);
          setDrawerFor(null);
        }}
      />
      {selectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectFor(null)}
          />
          <div className="relative z-10 bg-white rounded-md p-6 space-y-2 w-[min(90vw,420px)]">
            <h3 className="font-recoleta text-lg text-walty-teal">Select recipient</h3>
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => {
                  setAssignment(selectFor, addr.id);
                  setSelectFor(null);
                }}
                className="w-full text-left border rounded-md p-3 hover:bg-walty-cream"
              >
                <div className="font-semibold">{addr.name}</div>
                <div className="text-sm">
                  {addr.line1}, {addr.city}, {addr.postcode}, {addr.country}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

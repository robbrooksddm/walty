"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBasket } from "@/lib/useBasket";
import { useAddressBook, Address } from "@/lib/useAddressBook";
import { useAddressAssignments } from "@/lib/useAddressAssignments";
import AddressDrawer from "../../AddressDrawer";
import Summary from "../../Summary";
import { CARD_SIZES } from "../../sizeOptions";

export default function MultipleAddressPage() {
  const { items } = useBasket();
  const { addresses, addAddress } = useAddressBook();
  const [drawerFor, setDrawerFor] = useState<string | null>(null);
  const [selectFor, setSelectFor] = useState<string | null>(null);
  const { assignments, assign } = useAddressAssignments();
  const router = useRouter();

  const subtotal = items.reduce(
    (sum, it) =>
      sum +
      it.qty * (CARD_SIZES.find((s) => s.id === it.variant)?.price ?? 0),
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <div className="flex items-center mb-6">
        {["Basket", "Payment", "Review"].map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i === 0 ? "bg-walty-orange text-walty-cream" : "bg-gray-300 text-gray-600"
              }`}
            >
              {i + 1}
            </div>
            <span className="ml-2 text-sm">{step}</span>
            {i < 2 && <div className="flex-1 h-px bg-gray-300 mx-2" />}
          </div>
        ))}
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="lg:w-2/3 space-y-6">
          <h2 className="font-recoleta text-xl text-walty-teal">Assign Recipients</h2>
          {items.map((item) => {
            const size = CARD_SIZES.find((s) => s.id === item.variant);
            const assigned = assignments[item.id];
            const addr = addresses.find((a) => a.id === assigned);
            return (
              <div key={item.id} className="relative flex gap-4 items-start bg-white p-4 rounded-md shadow-card">
                <div className="flex-shrink-0">
                  <div className="w-[140px] h-[196px] overflow-hidden rounded-md bg-gray-100">
                    <Image src={item.image} alt="" width={140} height={196} className="object-cover w-full h-full" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="font-semibold">{size ? size.label : item.variant}</div>
                  {addr && (
                    <p className="text-sm text-walty-teal">Delivering to: {addr.name}</p>
                  )}
                  {addresses.length > 0 ? (
                    <button
                      onClick={() => setSelectFor(item.id)}
                      className="rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
                    >
                      {addr ? 'Change recipient' : 'Select recipient'}
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
              </div>
            );
          })}
        </div>
        <div className="lg:w-1/3 lg:sticky lg:top-4 mt-8 lg:mt-0">
          <Summary subtotal={subtotal} shipping={shipping} total={total} hideVoucher />
          <button
            onClick={() => router.push('/checkout/payment')}
            className="block w-full mt-4 rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
          >
            Continue to checkout
          </button>
          <div className="mt-2 text-center">
            <Link href="/checkout" className="text-sm underline">
              Return to basket
            </Link>
          </div>
        </div>
      </div>

      <AddressDrawer
        open={drawerFor !== null}
        onClose={() => setDrawerFor(null)}
        onSave={(addr: Address) => {
          addAddress(addr);
          if (drawerFor) assign(drawerFor, addr.id);
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
                  assign(selectFor!, addr.id);
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

"use client";
import { useState, useRef } from "react";
import { useBasket } from "@/lib/useBasket";
import Summary from "../Summary";
import { CARD_SIZES } from "../sizeOptions";

export default function PaymentPage() {
  const { items } = useBasket();
  const subtotal = items.reduce(
    (sum, it) => sum + it.qty * (CARD_SIZES.find((s) => s.id === it.variant)?.price ?? 0),
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;

  const [openStep, setOpenStep] = useState(0);
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const handleComplete = (idx: number) => {
    if (idx < refs.length - 1) {
      setOpenStep(idx + 1);
      requestAnimationFrame(() => {
        refs[idx + 1].current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <div className="flex items-center mb-6">
        {["Basket", "Payment", "Review"].map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i === 1 ? "bg-walty-orange text-walty-cream" : "bg-gray-300 text-gray-600"
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
        <div className="lg:w-2/3 space-y-4">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              ref={refs[n]}
              className={`bg-white rounded-md shadow-card transition-all overflow-hidden ${
                openStep === n ? "p-4" : "p-4 max-h-16"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-walty-teal text-white flex items-center justify-center font-bold">
                  {n + 1}
                </div>
                <h3 className="font-recoleta text-walty-teal">Section {n + 1}</h3>
              </div>
              {openStep === n && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">Placeholder content for section {n + 1}</p>
                  <button
                    onClick={() => handleComplete(n)}
                    className="rounded-md bg-walty-orange text-walty-cream px-4 py-2"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="lg:w-1/3 lg:sticky lg:top-4 mt-8 lg:mt-0">
          <Summary subtotal={subtotal} shipping={shipping} total={total} />
        </div>
      </div>
    </div>
  );
}

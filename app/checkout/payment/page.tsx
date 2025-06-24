"use client";
import { useState, useRef } from "react";
import { ChevronDown, CreditCard, Apple, Wallet } from "lucide-react";
import PaymentPlaceholder from "../PaymentPlaceholder";
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

  const [activeStep, setActiveStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [method, setMethod] = useState<'card' | 'apple' | 'google'>('card');
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const handleComplete = (idx: number) => {
    if (idx < refs.length - 1) {
      setMaxStep(idx + 1);
      setActiveStep(idx + 1);
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
          {[0, 1, 2].map((n) => {
            const disabled = n > maxStep;
            return (
              <div
                key={n}
                ref={refs[n]}
                className={`bg-white rounded-md shadow-card transition-all overflow-hidden ${
                  activeStep === n ? "p-4" : "p-4 max-h-16"
                } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !disabled && setActiveStep(n)}
                    className={`p-1 -ml-1 transition-transform ${
                      activeStep === n ? "rotate-0" : "-rotate-90"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-walty-teal text-white flex items-center justify-center font-bold">
                    {n + 1}
                  </div>
                  <h3 className="font-recoleta text-walty-teal">
                    {n === 2 ? 'Payment' : `Section ${n + 1}`}
                  </h3>
                </div>
                {activeStep === n && (
                  <div className="mt-4 space-y-4">
                    {n === 2 ? (
                      <>
                        <div className="flex gap-4">
                          {(
                            [
                              { id: 'card', label: 'Card', Icon: CreditCard },
                              { id: 'apple', label: 'Apple Pay', Icon: Apple },
                              { id: 'google', label: 'Google Pay', Icon: Wallet },
                            ] as const
                          ).map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setMethod(id)}
                              className={`flex flex-col items-center border rounded-md p-4 flex-1 gap-2 ${
                                method === id
                                  ? 'border-walty-orange bg-walty-cream'
                                  : 'border-gray-300'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-sm">{label}</span>
                            </button>
                          ))}
                        </div>
                        {method === 'card' && (
                          <PaymentPlaceholder checked={false} onCheck={() => {}} />
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          Placeholder content for section {n + 1}
                        </p>
                        <button
                          onClick={() => handleComplete(n)}
                          className="rounded-md bg-walty-orange text-walty-cream px-4 py-2"
                        >
                          Continue
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="lg:w-1/3 lg:sticky lg:top-4 mt-8 lg:mt-0">
          <Summary subtotal={subtotal} shipping={shipping} total={total} />
        </div>
      </div>
    </div>
  );
}

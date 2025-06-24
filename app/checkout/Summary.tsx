"use client";
import { useState } from "react";
interface Props {
  subtotal: number;
  shipping: number;
  total: number;
}

export default function Summary({ subtotal, shipping, total }: Props) {
  const [code, setCode] = useState("");

  const redeem = () => {
    console.log("Redeem voucher", code);
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-card space-y-2">
      <h3 className="font-display text-lg text-walty-teal mb-2">Smiles Summary</h3>
      <div className="flex justify-between text-sm">
        <span>Cost of Smiles</span>
        <span>£{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Cost of Postage</span>
        <span>£{shipping.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-semibold border-t pt-2">
        <span>All In</span>
        <span>£{total.toFixed(2)}</span>
      </div>

      <div className="pt-4">
        <h4 className="font-display text-md text-walty-teal mb-2">Got A Voucher Code?</h4>
        <input
          type="text"
          placeholder="Enter code..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-2 w-full border rounded p-2 text-sm placeholder-gray-400"
        />
        <button
          onClick={redeem}
          className="w-full rounded-md bg-walty-teal text-walty-cream px-4 py-2 hover:bg-walty-teal/90 transition"
        >
          Redeem Voucher
        </button>
      </div>
    </div>
  );
}

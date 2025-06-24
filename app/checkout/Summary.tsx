"use client";
interface Props {
  subtotal: number;
  shipping: number;
  total: number;
}

export default function Summary({ subtotal, shipping, total }: Props) {
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
    </div>
  );
}

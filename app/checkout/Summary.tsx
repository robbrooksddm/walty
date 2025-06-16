"use client";
interface Props {
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
}

export default function Summary({ subtotal, shipping, vat, total }: Props) {
  return (
    <div className="bg-white p-4 rounded-md shadow-card space-y-2">
      <h3 className="font-display text-lg text-walty-teal mb-2">Order Summary</h3>
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>£{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Shipping</span>
        <span>£{shipping.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>VAT</span>
        <span>£{vat.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-semibold border-t pt-2">
        <span>Total</span>
        <span>£{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

"use client";
interface Props {
  checked: boolean;
  onCheck: (c: boolean) => void;
}

export default function PaymentPlaceholder({ checked, onCheck }: Props) {
  return (
    <div className="border rounded-md p-6 bg-white shadow-card space-y-4">
      <h3 className="font-display text-lg text-walty-teal">Card details</h3>
      <div className="h-40 border border-dashed flex items-center justify-center rounded-md">
        <span className="text-gray-500 text-sm">Stripe PaymentElement goes here later</span>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} />
        Card details entered
      </label>
    </div>
  );
}

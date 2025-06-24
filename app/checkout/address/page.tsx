"use client";
import { useAddressBook, Address } from '@/lib/useAddressBook';
import AddressDrawer from '../AddressDrawer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddressPage() {
  const { addresses, addAddress } = useAddressBook();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto px-4 py-8 font-sans space-y-4">
      <h2 className="font-recoleta text-xl text-walty-teal mb-4">Where should we send your order to?</h2>
      <div className="space-y-2">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            onClick={() => router.push('/checkout')}
            className="w-full text-left border rounded-md p-4 hover:bg-walty-cream"
          >
            <div className="font-semibold">{addr.name}</div>
            <div className="text-sm">
              {addr.line1}, {addr.city}, {addr.postcode}, {addr.country}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
      >
        Add new address
      </button>
      <AddressDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSave={(addr: Address) => {
          addAddress(addr);
          setOpen(false);
        }}
      />
    </div>
  );
}

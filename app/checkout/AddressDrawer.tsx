"use client";
import { useState } from 'react';
import { Address } from './CheckoutClient';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (addr: Address) => void;
}

export default function AddressDrawer({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('UK');

  const reset = () => {
    setName('');
    setLine1('');
    setCity('');
    setPostcode('');
    setCountry('UK');
  };

  const handleSave = () => {
    const id = Date.now().toString();
    onSave({ id, name, line1, city, postcode, country });
    reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-xl p-6 overflow-y-auto">
        <h3 className="font-display text-lg text-walty-teal mb-4">Add Address</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm mb-1" htmlFor="name">Name</label>
            <input
              id="name"
              className="w-full border rounded p-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="line1">Line 1</label>
            <input
              id="line1"
              className="w-full border rounded p-2 text-sm"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="city">City</label>
            <input
              id="city"
              className="w-full border rounded p-2 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="postcode">Postcode</label>
            <input
              id="postcode"
              className="w-full border rounded p-2 text-sm"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="country">Country</label>
            <select
              id="country"
              className="w-full border rounded p-2 text-sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="UK">UK</option>
              <option value="US">US</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" className="rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

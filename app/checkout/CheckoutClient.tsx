"use client";
import { useState } from 'react';
import { useBasket } from '@/lib/useBasket';
import Basket from './Basket';
import AddressDrawer from './AddressDrawer';
import Summary from './Summary';
import PaymentPlaceholder from './PaymentPlaceholder';
import { CARD_SIZES } from './sizeOptions';

export interface CartItem {
  id: string;
  coverUrl: string;
  proofUrl: string;
  pageImages: string[];
  title: string;
  sku: string;
  variant: string;
  qty: number;
  price: number;
  addressId?: string;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  city: string;
  postcode: string;
  country: string;
}

export default function CheckoutClient({
  initialItems,
  initialAddresses,
}: {
  initialItems: CartItem[];
  initialAddresses: Address[];
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { updateVariant: updateBasketVariant } = useBasket();

  const openDrawer = (itemId: string) => {
    setActiveItemId(itemId);
    setDrawerOpen(true);
  };

  const handleSaveAddress = (addr: Address) => {
    setAddresses((prev) => [...prev, addr]);
    if (activeItemId) {
      setCartItems((prev) =>
        prev.map((it) =>
          it.id === activeItemId ? { ...it, addressId: addr.id } : it,
        ),
      );
    }
    setDrawerOpen(false);
  };

  const updateQty = (id: string, qty: number) => {
    setCartItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)));
  };

  const regenerateProof = async (variant: string, images: string[], slug: string) => {
    try {
      const res = await fetch('/api/proof', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pageImages: images, sku: variant, id: slug, filename: `${variant}.jpg` }),
      });
      if (!res.ok) return null;
      const blob = await res.blob();
      const form = new FormData();
      form.append('file', new File([blob], `${variant}.jpg`, { type: blob.type }));
      const up = await fetch('/api/upload', { method: 'POST', body: form });
      if (up.ok) {
        const { url } = await up.json();
        return typeof url === 'string' && url ? url : null;
      }
    } catch (err) {
      console.error('proof regen', err);
    }
    return null;
  };

  const updateVariant = async (id: string, variant: string) => {
    const size = CARD_SIZES.find((s) => s.id === variant);
    if (!size) return;
    const item = cartItems.find((it) => it.id === id);
    if (!item) return;
    const url = await regenerateProof(variant, item.pageImages, item.sku);
    if (!url) return;
    setCartItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, variant, price: size.price, proofUrl: url } : it,
      ),
    );
    updateBasketVariant(id, variant, url, item.pageImages);
  };

  const updateItemAddress = (id: string, addressId: string) => {
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, addressId } : it)),
    );
  };

  const sendOrders = async () => {
    for (const item of cartItems) {
      const addr = addresses.find((a) => a.id === item.addressId);
      try {
        let proof = item.proofUrl;
        if (!proof) {
          proof = (await regenerateProof(item.variant, item.pageImages, item.sku)) || '';
          if (proof) {
            setCartItems((prev) =>
              prev.map((it) => (it.id === item.id ? { ...it, proofUrl: proof } : it)),
            );
            updateBasketVariant(item.id, item.variant, proof, item.pageImages);
          }
        }

        const res = await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantHandle: item.variant,
            fulfilHandle: 'toSender_flat_std',
            assets: [{ url: proof }],
            copies: item.qty,
            address: addr || undefined,
            id: item.sku,
            pageImages: proof ? undefined : item.pageImages,
          }),
        });
        const data = await res.json().catch(() => ({}));
        console.log('order', data);
      } catch (err) {
        console.error('order error', err);
      }
    }
  };

  const handleContinue = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    await sendOrders();
    document.getElementById('payment')?.scrollIntoView({ behavior: 'smooth' });
  };

  const subtotal = cartItems.reduce((sum, it) => sum + it.qty * it.price, 0);
  const shipping = 0; // TODO: replace with API calculation
  const vat = 0; // TODO: replace with API calculation
  const total = subtotal + shipping + vat;

  const placeOrder = () => {
    console.log({ cartItems, addresses, totals: { subtotal, shipping, vat, total } });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* Progress bar */}
      <div className="flex items-center mb-6">
        {['Basket', 'Payment', 'Review'].map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i === 0 ? 'bg-walty-orange text-walty-cream' : 'bg-gray-300 text-gray-600'
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
        <div className="lg:w-2/3">
          <Basket
            items={cartItems}
            addresses={addresses}
            onQtyChange={updateQty}
            onAddressChange={updateItemAddress}
            onVariantChange={updateVariant}
            onAddNew={openDrawer}
          />
        </div>
        <div className="lg:w-1/3 lg:sticky lg:top-4 mt-8 lg:mt-0">
          <Summary subtotal={subtotal} shipping={shipping} vat={vat} total={total} />
          <button
            onClick={handleContinue}
            className="block w-full mt-4 rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
          >
            Continue to payment
          </button>
        </div>
      </div>

      {/* Payment */}
      <div id="payment" className="mt-12">
        <PaymentPlaceholder checked={paymentComplete} onCheck={setPaymentComplete} />
      </div>

      <div className="mt-6 text-center">
        <button
          className="rounded-md bg-walty-orange text-walty-cream px-6 py-3 hover:bg-orange-600 transition disabled:opacity-50"
          disabled={!paymentComplete}
          onClick={placeOrder}
        >
          Place order
        </button>
      </div>

      <AddressDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveAddress}
      />
    </div>
  );
}

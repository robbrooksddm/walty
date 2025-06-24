"use client";
import { useState } from 'react';
import Basket from './Basket';
import AddressDrawer from './AddressDrawer';
import Summary from './Summary';
import PaymentPlaceholder from './PaymentPlaceholder';
import { CARD_SIZES } from './sizeOptions';

export interface CartItem {
  id: string;
  coverUrl: string;
  proofUrl: string;
  proofs: Record<string, string>;
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

  const updateVariant = (id: string, variant: string) => {
    const size = CARD_SIZES.find((s) => s.id === variant);
    if (!size) return;
    setCartItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              variant,
              price: size.price,
              proofUrl: it.proofs[variant] || it.proofUrl,
            }
          : it,
      ),
    );
  };

  const updateItemAddress = (id: string, addressId: string) => {
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, addressId } : it)),
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const sendOrders = async () => {
    for (const item of cartItems) {
      const addr = addresses.find((a) => a.id === item.addressId);
      try {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantHandle: item.variant,
            fulfilHandle: 'toSender_flat_std',
            assets: [{ url: item.proofUrl }],
            copies: item.qty,
            address: addr || undefined,
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
  const total = subtotal + shipping;

  const placeOrder = () => {
    console.log({ cartItems, addresses, totals: { subtotal, shipping, total } });
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
            onRemove={removeItem}
          />
        </div>
        <div className="lg:w-1/3 lg:sticky lg:top-4 mt-8 lg:mt-0">
          <Summary subtotal={subtotal} shipping={shipping} total={total} />
          <button
            onClick={handleContinue}
            className="block w-full mt-4 rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600 transition"
          >
            Onward to Postage! →
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

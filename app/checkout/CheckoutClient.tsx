"use client";
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import Basket from './Basket';
import AddressDrawer from './AddressDrawer';
import Summary from './Summary';
import PaymentPlaceholder from './PaymentPlaceholder';
import { CARD_SIZES } from './sizeOptions';
import { useAddressBook, Address } from '@/lib/useAddressBook';
import { useAddressAssignments } from '@/lib/useAddressAssignments';

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

export default function CheckoutClient({
  initialItems,
  initialAddresses,
}: {
  initialItems: CartItem[];
  initialAddresses: Address[];
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const { addresses, addAddress } = useAddressBook();
  const { assignments, assign } = useAddressAssignments();
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [shipDialog, setShipDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCartItems((prev) =>
      prev.map((it) => ({ ...it, addressId: assignments[it.id] || it.addressId }))
    );
  }, [assignments]);

  useEffect(() => {
    if (!addressesLoaded && addresses.length === 0 && initialAddresses.length > 0) {
      initialAddresses.forEach((a) => addAddress(a));
      setAddressesLoaded(true);
    }
  }, [addressesLoaded, addresses.length, initialAddresses, addAddress]);

  const openDrawer = (itemId: string) => {
    setActiveItemId(itemId);
    setDrawerOpen(true);
  };

  const handleSaveAddress = (addr: Address) => {
    addAddress(addr);
    if (activeItemId) {
      setCartItems((prev) =>
        prev.map((it) =>
          it.id === activeItemId ? { ...it, addressId: addr.id } : it,
        ),
      );
      assign(activeItemId, addr.id);
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
    assign(id, addressId);
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
    assign(id, '');
  };

  const handleContinue = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    setShipDialog(true);
  };

  const subtotal = cartItems.reduce((sum, it) => sum + it.qty * it.price, 0);
  const shipping = 0; // TODO: replace with API calculation
  const total = subtotal + shipping;

  const placeOrder = () => {
    console.log({ cartItems, addresses, totals: { subtotal, shipping, total } });
  };

  const TEST_FULFIL_HANDLE = 'toSender_flat_std';

  const sendTestOrder = async () => {
    const item = cartItems[0];
    if (!item) return;
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantHandle: item.variant,
          fulfilHandle: TEST_FULFIL_HANDLE,
          assets: [{ url: item.proofUrl }],
          copies: item.qty,
          address: addresses.find(a => a.id === item.addressId) || null,
        }),
      });
      const text = await res.text();
      console.log('Prodigi response', text);
    } catch (err) {
      console.error('test order', err);
    }
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
        <button
          onClick={sendTestOrder}
          className="ml-4 rounded-md border border-walty-orange text-walty-orange px-6 py-3 hover:bg-walty-orange/10"
        >
          Test Prodigi Order
        </button>
      </div>

      <AddressDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveAddress}
      />
      {shipDialog && (
        <Transition.Root show={true} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={() => setShipDialog(false)}>
            <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="relative z-10 bg-white rounded shadow-lg w-[min(90vw,420px)] p-6 space-y-4">
                <Dialog.Title className="font-recoleta text-lg text-walty-teal">Send items to?</Dialog.Title>
                <p className="text-sm">Are the items going to one address or multiple?</p>
                <div className="flex justify-end gap-4 pt-2">
                  <button onClick={() => { setShipDialog(false); router.push('/checkout/address'); }} className="rounded-md bg-walty-orange text-walty-cream px-4 py-2">One address</button>
                  <button onClick={() => { setShipDialog(false); router.push('/checkout/address/multiple'); }} className="rounded-md border border-gray-300 px-4 py-2">Multiple</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </Dialog>
        </Transition.Root>
      )}
    </div>
  );
}

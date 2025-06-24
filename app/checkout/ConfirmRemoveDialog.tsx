"use client";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmRemoveDialog({ open, onConfirm, onCancel }: Props) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={onCancel}>
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="relative z-10 bg-white rounded shadow-lg w-[min(90vw,420px)] p-6 space-y-4">
            <Dialog.Title className="font-recoleta text-xl text-walty-teal">Remove item?</Dialog.Title>
            <p className="text-sm">You&apos;re about to remove the product from your basket and will lose any customisations made to it.</p>
            <div className="flex justify-end gap-4 pt-2">
              <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2">No, return to basket</button>
              <button onClick={onConfirm} className="rounded-md bg-walty-orange text-walty-cream px-4 py-2 hover:bg-orange-600">Yes, remove</button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
}

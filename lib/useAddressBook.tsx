"use client";
import { createContext, useContext, useEffect, useState } from "react";

export interface Address {
  id: string;
  name: string;
  line1: string;
  city: string;
  postcode: string;
  country: string;
}

interface AddressBookValue {
  addresses: Address[];
  addAddress: (addr: Address) => void;
}

const AddressBookContext = createContext<AddressBookValue>({
  addresses: [],
  addAddress: () => {},
});

export function AddressBookProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("addressBook") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("addressBook", JSON.stringify(addresses));
    } catch {
      // ignore
    }
  }, [addresses]);

  const addAddress = (addr: Address) => {
    setAddresses((prev) => [...prev, addr]);
  };

  return (
    <AddressBookContext.Provider value={{ addresses, addAddress }}>
      {children}
    </AddressBookContext.Provider>
  );
}

export function useAddressBook() {
  return useContext(AddressBookContext);
}

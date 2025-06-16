import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  // Seed dummy cart items and addresses
  const items = [
    {
      id: '1',
      coverUrl: '/templates/daisy/daisy-front-cover.jpg',
      title: 'Birthday Card',
      sku: 'BDY-001',
      qty: 1,
      price: 3.5,
    },
    {
      id: '2',
      coverUrl: '/templates/daisy/daisy-inner-left.jpg',
      title: 'Thank You Card',
      sku: 'THX-002',
      qty: 2,
      price: 3.0,
    },
  ];

  const addresses = [
    {
      id: 'a1',
      name: 'Alice Example',
      line1: '1 Apple Way',
      city: 'London',
      postcode: 'N1 1AA',
      country: 'UK',
    },
    {
      id: 'a2',
      name: 'Bob Example',
      line1: '2 Orange Road',
      city: 'Bristol',
      postcode: 'BS1 2BB',
      country: 'UK',
    },
  ];

  return <CheckoutClient initialItems={items} initialAddresses={addresses} />;
}

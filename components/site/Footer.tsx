'use client'
import Link from 'next/link'

export default function Footer() {
  const cream = '#F7F3EC'
  const teal = '#005B55'
  return (
    <footer className="py-10 text-center text-sm" style={{ backgroundColor: teal, color: cream }}>
      © {new Date().getFullYear()} Walty Ltd. All rights reserved.{' '}
      <Link href="/greetings-cards/test-27-jun-2025" className="underline ml-2">
        Test product page
      </Link>
    </footer>
  )
}

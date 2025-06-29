// app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Pencil, Truck, Star } from "lucide-react";
import { recoleta } from "@/lib/fonts"; // ① <— brings in your local Recoleta
import { sanityFetch } from "@/lib/sanityClient";
import { urlFor } from "@/sanity/lib/image";

export default async function HomePage() {
  /* Brand palette */
  const cream  = "#F7F3EC";
  const teal   = "#005B55";
  const orange = "#C64A19";
  const brown  = "#3E2C20";

  const templates = await sanityFetch<{
    _id: string
    title: string
    slug: {current: string}
    coverImage?: any
  }[]>(`*[_type=="cardTemplate" && isLive==true]{_id,title,slug,coverImage}`)

  return (
    <main
      /* ② Attach Recoleta variable so Tailwind’s `font-serif` resolves */
      className={`${recoleta.variable} min-h-screen font-sans`}
      style={{ backgroundColor: cream, color: teal }}
    >

      {/* HERO */}
      <section className="mx-auto max-w-7xl grid md:grid-cols-2 gap-12 px-6 py-24 items-center">
        <div className="space-y-6 order-2 md:order-1">
          <h1
            /* ③ Headlines now guaranteed to render in Recoleta */
            className="font-serif text-4xl md:text-5xl font-bold leading-tight"
            style={{ color: teal }}
          >
            Gift a card that<br className="hidden md:block" />
            transforms <span style={{ color: orange }}>photos</span><br className="hidden md:block" />
            into frame-worthy art
          </h1>

          <p className="text-lg max-w-md" style={{ color: brown }}>
            Make a card as unique as they are—one they’ll want to frame, not throw away.
          </p>

          <Link
            href="/templates"
            className="inline-block rounded-md px-8 py-3 font-semibold shadow"
            style={{ backgroundColor: orange, color: cream }}
          >
            Design a Card
          </Link>
        </div>

        {/* Illustration */}
        <div className="order-1 md:order-2">
          <Image
            src="/images/assets_task_01jwb6e3v8f1wtssx3eg2820ex_1748427616_img_2.webp"
            alt="Cartoon person holding personalised card"
            width={560}
            height={520}
            className="w-full h-auto"
            priority
          />
        </div>
      </section>

      {/* 3-STEP RIBBON */}
      <section className="mx-auto max-w-7xl px-6 -mt-10 mb-20">
        <div
          className="bg-white rounded-xl shadow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x"
          style={{ borderColor: `${teal}10` }}
        >
          {[
            { icon: Star,   title: "Pick a template" },
            { icon: Pencil, title: "Personalize" },
            { icon: Truck,  title: "We print & ship" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="flex items-center gap-4 p-6 md:flex-1">
              <Icon className="w-7 h-7" style={{ color: orange }} />
              <span className="font-medium" style={{ color: teal }}>{title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TEMPLATE GRID */}
      <section id="templates" className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="font-serif text-3xl font-bold text-center mb-12" style={{ color: teal }}>
          Your Templates
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {templates.map((tpl) => (
            <Link key={tpl._id} href={`/cards/${tpl.slug.current}/customise`}>
              {tpl.coverImage && (
                <Image
                  src={urlFor(tpl.coverImage).width(480).height(640).url()}
                  alt={tpl.title}
                  width={480}
                  height={640}
                  className="rounded-lg shadow-md hover:shadow-lg transition"
                />
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <Image
          src="/images/testimonial-avatar.jpg"
          alt="Happy customer"
          width={80}
          height={80}
          className="mx-auto rounded-full mb-6"
        />
        <p className="text-xl italic" style={{ color: brown }}>
          “A really unique and personal way to surprise your loved ones! My friend literally called me crying laughing when she got the cat card.”
        </p>
        <span className="mt-4 block font-semibold" style={{ color: teal }}>— Jess P.</span>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-20" style={{ backgroundColor: orange, color: cream }}>
        <h2 className="font-serif text-3xl font-bold mb-6">
          Ready to make something they’ll keep forever?
        </h2>
        <Link
          href="/templates"
          className="inline-block bg-white text-xl font-semibold px-8 py-4 rounded-md shadow"
          style={{ color: orange }}
        >
          Get Started
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-sm" style={{ backgroundColor: teal, color: cream }}>
        © {new Date().getFullYear()} Walty Ltd. All rights reserved.
                  <div className="mt-2"><Link href="/products/cards/test-27-jun-2025" className="underline">Test product page</Link></div>
      </footer>
    </main>
  );
}

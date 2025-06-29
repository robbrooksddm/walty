import ProductTabs from "@/components/ProductTabs";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { sanityPreview } from '@/sanity/lib/client';
import { getTemplatePages } from '@/app/library/getTemplatePages';

export default async function ProductPage({ params }: { params: { productSlug: string; templateSlug: string } }) {
  const { productSlug, templateSlug } = params;

  const query = `*[_type=="cardTemplate" && slug.current==$tpl][0]{
    title,
    products[slug.current==$prod][0]->{
      title,
      description,
      slug,
      variants[]->{title, variantHandle, slug, price}
    }
  }`;

  const tpl = await sanityPreview.fetch<{ title: string; products?: any }>(query, { tpl: templateSlug, prod: productSlug });

  if (!tpl || !tpl.products) notFound();
  const product = tpl.products;

  const { pages } = await getTemplatePages(templateSlug);

  const images = pages
    .map(p => p.layers.find(l => l.type === 'image' && typeof l.src === 'string')?.src)
    .filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex gap-4 overflow-x-auto">
          {images.map((src, i) => (
            <img key={i} src={src} alt={`Page ${i + 1}`} className="w-60 h-auto rounded shadow" />
          ))}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold">{tpl.title}</h1>
          <ul className="space-y-1">
            {product.variants?.map((v: any) => (
              <li key={v.variantHandle}>{v.title}</li>
            ))}
          </ul>
          <Link
            href={`/cards/${templateSlug}/customise`}
            className="block text-center bg-[--walty-orange] text-white font-semibold py-3 rounded-md"
          >
            Personalise this design
          </Link>
        </div>
      </div>
      <ProductTabs description={product.description} />
    </main>
  );
}


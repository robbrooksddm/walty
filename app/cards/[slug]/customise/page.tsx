/**********************************************************************
 * cards/[slug]/customise/page.tsx
 *********************************************************************/

import CustomiseClient from "./CustomiseClient";
import { getTemplatePages } from '@/app/library/getTemplatePages'
import { sanityPreview } from '@/sanity/lib/client'

// Path: app/cards/[slug]/customise/page.tsx
// This is a **server component**. In Next 15 `params` is a Promise, so we need to
// unwrap it with `await` before we read `slug`.

export default async function CustomisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 🡇 open the "params" gift‑box and pull out slug
  const { slug } = await params;

  const { pages, spec, previewSpec, coverImage, products, showSafeArea } = await getTemplatePages(slug)
  const meta = await sanityPreview.fetch<{title:string}>(
    `*[_type=="cardTemplate" && slug.current==$s][0]{title}`,
    { s: slug }
  )
  console.log('SERVER tpl.pages =', pages)
  console.log('↳ template printSpec', spec)

  return (
    <CustomiseClient
      slug={slug}
      title={meta?.title || slug}
      coverImage={coverImage}
      tpl={{ pages, spec, previewSpec, products, showSafeArea }}
    />
  )
}

"use client";

import CardEditor from "@/app/components/CardEditor";

export default function CustomiseClient({ slug, title, coverImage, tpl }: { slug: string; title: string; coverImage?: string; tpl: any }) {
  // keep the old log
  console.log("TPL pages 👉", tpl.pages);

  // put them on window so we can inspect in DevTools
  if (typeof window !== "undefined") {
    (window as any).tplPages = tpl.pages;
    (window as any).tplPreview = tpl.previewSpec;
  }

  // use customer mode so shoppers get the streamlined editor
  return (
    <CardEditor
      initialPages={tpl.pages}
      printSpec={tpl.spec}
      previewSpec={tpl.previewSpec}
      products={tpl.products}
      showSafeArea={tpl.showSafeArea}
      slug={slug}
      title={title}
      coverImage={coverImage}
      mode="customer"
    />
  );
}

import { templates } from "@/data/templates";
import CustomiseClient from "./CustomiseClient";

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

  const tpl = templates.find((t) => t.slug === slug);
  if (!tpl) return <p>Template not found</p>;

  console.log("SERVER tpl.pages =", tpl.pages);
  
  /* pass the template down as a plain prop */
  return <CustomiseClient tpl={tpl} />;
}

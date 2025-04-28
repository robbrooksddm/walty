import { templates } from "@/data/templates";
import { notFound } from "next/navigation";

export default function Product({ params }: { params: { slug: string } }) {
  const tpl = templates.find((t) => t.slug === params.slug);
  if (!tpl) notFound();

  return (
    <main className="p-6 flex flex-col items-center">
      <img src={tpl.cover} alt="" className="w-64 rounded shadow" />
      <h1 className="text-2xl font-bold mt-4">{tpl.title}</h1>

      <a
        href={`/cards/${tpl.slug}/customise`}
        className="mt-6 px-6 py-2 bg-pink-600 text-white rounded"
      >
        Personalise →
      </a>
    </main>
  );
}

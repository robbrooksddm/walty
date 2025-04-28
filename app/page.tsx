import DesignCanvas from "@/app/components/DesignCanvas";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Get-Card Editor (alpha)</h1>
      <DesignCanvas />
    </main>
  );  
}
import Hero from "./_components/Hero";
import Download from "./_components/Download";

export default function Page() {
  return (
    <main className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar">
      <Hero />
      <Download />
    </main>
  );
}

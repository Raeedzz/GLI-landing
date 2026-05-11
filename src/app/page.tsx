import Hero from "./_components/Hero";
import Download from "./_components/Download";
import Logo from "./_components/Logo";
import GitHubLink from "./_components/GitHubLink";

export default function Page() {
  return (
    <>
      <Logo />
      <GitHubLink />
      <main className="h-[100svh] w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar">
        <Hero />
        <Download />
      </main>
    </>
  );
}

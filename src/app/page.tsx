import Socials from "./_components/Socials";
import HeroCanvas from "./_components/HeroCanvas";
import DownloadButton from "./_components/DownloadButton";
import Logo from "./_components/Logo";

export default function Page() {
  return (
    <>
      <Logo />
      <main className="h-[100svh] w-full overflow-y-scroll bg-black no-scrollbar">
        <section
          id="hero"
          className="h-[160svh] w-full"
          aria-hidden="true"
        />
        <Socials />
        <HeroCanvas />
        <DownloadButton />
      </main>
    </>
  );
}

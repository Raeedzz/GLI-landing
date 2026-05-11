export default function Download() {
  return (
    <section className="h-screen w-full snap-start bg-black flex flex-col items-center justify-center gap-12 px-6 text-center">
      <h1 className="font-mono text-3xl md:text-5xl lg:text-6xl text-white/90 max-w-4xl leading-tight tracking-tight">
        A GPU accelerated terminal
        <br />
        for multi agent use
      </h1>
      <a
        href="https://github.com/sckryteam/GLI/releases/latest/download/Goonware.dmg"
        download
        className="font-mono text-xs md:text-sm uppercase tracking-[0.25em] border border-white/30 px-10 py-4 text-white/90 hover:bg-white hover:text-black transition-colors duration-200"
      >
        Download for Mac
      </a>
    </section>
  );
}

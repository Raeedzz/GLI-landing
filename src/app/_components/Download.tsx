import DownloadButton from "./DownloadButton";

export default function Download() {
  return (
    <section
      id="download"
      className="h-[100svh] w-full snap-start bg-black flex flex-col items-center justify-center gap-8 sm:gap-12 px-5 sm:px-6 text-center"
    >
      <h1 className="font-mono text-[1.7rem] leading-[1.15] sm:text-3xl sm:leading-tight md:text-5xl lg:text-6xl text-white/90 max-w-[95vw] sm:max-w-2xl md:max-w-4xl tracking-tight">
        A GPU accelerated terminal
        <br className="hidden sm:inline" />{" "}
        for multi agent use
      </h1>
      <DownloadButton />
    </section>
  );
}

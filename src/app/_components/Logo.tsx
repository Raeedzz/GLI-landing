import Image from "next/image";

export default function Logo() {
  return (
    <div
      className="fixed top-5 left-5 sm:top-7 sm:left-8 z-50 pointer-events-none"
      aria-hidden="true"
    >
      <Image
        src="/goonware-logo.png"
        alt="goonware"
        width={140}
        height={33}
        priority
        className="w-[110px] sm:w-[140px] h-auto select-none opacity-90"
      />
    </div>
  );
}

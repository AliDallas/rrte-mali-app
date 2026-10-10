import Image from "next/image";

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Logo RRTE"
      width={size}
      height={size}
      priority
      className="rounded-full bg-white object-cover"
      style={{ width: size, height: size }}
    />
  );
}

const TINTS = [
  "bg-gold-100 text-gold-700",
  "bg-[#E3F0DC] text-[#3C7026]",
  "bg-[#F8DDD8] text-[#A8301F]",
  "bg-[#D7E8F4] text-[#12608F]",
];

export default function Avatar({
  prenom,
  nom,
  size = 48,
  photo,
}: {
  photo?: string;
  prenom?: string;
  nom?: string;
  size?: number;
}) {
  const initials = `${(prenom ?? "?").charAt(0)}${(nom ?? "").charAt(0)}`.toUpperCase();
  const seed = `${prenom ?? ""}${nom ?? ""}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" className="flex-none rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-bold ${TINTS[h % TINTS.length]}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

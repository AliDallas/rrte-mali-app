import { Star } from "lucide-react";

export default function Etoiles({ note, size = 16 }: { note: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${note.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i <= Math.round(note) ? "fill-gold-500 text-gold-500" : "text-line"}
        />
      ))}
    </span>
  );
}

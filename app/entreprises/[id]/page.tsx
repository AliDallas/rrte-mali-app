"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { Briefcase, ChevronLeft, Clock, Globe, Mail, MapPin, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Entreprise, entrepriseDepuisDoc, etiquetteLien, lienPropre, videoYoutube } from "@/lib/entreprises";
import { chiffres } from "@/lib/fiches";

export default function EntrepriseDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [e, setE] = useState<Entreprise | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "entreprises", id))
      .then((s) => {
        if (!s.exists()) return setState("absent");
        setE(entrepriseDepuisDoc(s.id, s.data()));
        setState("ok");
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  const peutGerer = !!e && (profile?.role === "admin" || e.ownerUid === user?.uid);

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "entreprises", id));
    router.push("/entreprises");
  }

  return (
    <AppShell title={e?.nom || "Entreprise"} subtitle={e?.categorie || "Fiche entreprise"}>
      <Link href="/entreprises" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Entreprises
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {state === "ok" && e && (
        <div className="space-y-4">
          {e.statut === "en_attente" && (
            <div className="rounded-xl bg-gold-100 p-3 text-sm text-gold-700">
              En attente de validation par un administrateur. Elle sera visible de tous une fois validée.
            </div>
          )}
          {e.photos.length > 0 && (
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5">
              {e.photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt="" className="h-56 w-[85%] flex-none snap-center rounded-2xl object-cover" />
              ))}
            </div>
          )}

          <div className="card flex items-center gap-4 p-5">
            {e.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.logo} alt="Logo" className="h-16 w-16 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Briefcase size={26} strokeWidth={1.75} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display text-xl font-bold">{e.nom}</p>
              <p className="text-sm text-muted">{[e.categorie, e.quartier].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-xs font-semibold text-gold-700">
                {e.ownerNom ? `Entreprise de ${e.ownerNom}` : ""}
              </p>
            </div>
          </div>

          {e.description && <p className="card whitespace-pre-line p-5 text-[15px]">{e.description}</p>}

          <div className="card divide-y divide-line">
            {e.tel && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
                <span className="flex-1 text-[15px]">{e.tel}</span>
                <a href={`tel:${e.tel}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                  Appeler
                </a>
                <a
                  href={`https://wa.me/${chiffres(e.tel)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
                >
                  <MessageCircle size={17} />
                </a>
              </div>
            )}
            {e.email && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail size={18} strokeWidth={1.75} className="text-gold-600" />
                <a href={`mailto:${e.email}`} className="flex-1 break-all text-[15px]">
                  {e.email}
                </a>
              </div>
            )}
            {e.siteWeb && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Globe size={18} strokeWidth={1.75} className="text-gold-600" />
                <a href={lienPropre(e.siteWeb)} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-[15px]">
                  {etiquetteLien(e.siteWeb)}
                </a>
              </div>
            )}
            {(e.adresse || e.quartier) && (
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin size={18} strokeWidth={1.75} className="text-gold-600" />
                <span className="flex-1 text-[15px]">{[e.adresse, e.quartier].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {e.horaires && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Clock size={18} strokeWidth={1.75} className="text-gold-600" />
                <span className="flex-1 text-[15px]">{e.horaires}</span>
              </div>
            )}
          </div>

          {e.liens.length > 0 && (
            <div className="space-y-3">
              {e.liens.map((l) => {
                const yt = videoYoutube(l);
                return yt ? (
                  <div key={l} className="card overflow-hidden">
                    <iframe
                      src={yt}
                      title="Vidéo"
                      className="aspect-video w-full"
                      allow="accelerometer; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    key={l}
                    href={l}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card flex items-center gap-3 px-4 py-3"
                  >
                    <Globe size={18} strokeWidth={1.75} className="text-gold-600" />
                    <span className="flex-1 truncate text-[15px] font-semibold">{etiquetteLien(l)}</span>
                  </a>
                );
              })}
            </div>
          )}

          {peutGerer && (
            <div className="flex gap-3">
              <Link href={`/entreprises/${e.id}/modifier`} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white py-3 text-sm font-semibold">
                <Pencil size={16} /> Modifier
              </Link>
              {confirm ? (
                <button onClick={supprimer} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-red py-3 text-sm font-semibold text-white">
                  <Trash2 size={16} /> Confirmer
                </button>
              ) : (
                <button onClick={() => setConfirm(true)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white py-3 text-sm font-semibold text-brand-red">
                  <Trash2 size={16} /> Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

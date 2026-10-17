"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QuerySnapshot, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { Baby, Bell, ChevronLeft, Flower2, Heart, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EvenementVie, TYPES_VIE } from "@/lib/caisse";

const ICONES: Record<string, typeof Baby> = { naissance: Baby, deces: Flower2, mariage: Heart, autre: Bell };
const TEINTES: Record<string, string> = {
  naissance: "bg-[#E3F0DC] text-[#3C7026]",
  deces: "bg-[#ECECEC] text-[#3B3F45]",
  mariage: "bg-[#FBE3EA] text-[#A82652]",
  autre: "bg-gold-100 text-gold-700",
};
const libelleType = (t: string) => TYPES_VIE.find((x) => x.cle === t)?.label ?? "Événement";
const parDateDesc = (a: EvenementVie, b: EvenementVie) => b.date.localeCompare(a.date);

function Carte({ e, children }: { e: EvenementVie; children?: React.ReactNode }) {
  const Icone = ICONES[e.type] ?? Bell;
  return (
    <div className="card space-y-2 p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${TEINTES[e.type] ?? TEINTES.autre}`}>
          <Icone size={20} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{libelleType(e.type)} · {e.personne}</p>
          <p className="text-xs text-muted">{e.date ? new Date(e.date).toLocaleDateString("fr-FR") : ""} · signalé par {e.nomSignalant}</p>
        </div>
      </div>
      {e.message && <p className="whitespace-pre-line text-[15px]">{e.message}</p>}
      {children}
    </div>
  );
}

function Contenu() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const admin = profile?.role === "admin";
  const [publies, setPublies] = useState<EvenementVie[] | null>(null);
  const [miens, setMiens] = useState<EvenementVie[]>([]);
  const [aValider, setAValider] = useState<EvenementVie[]>([]);

  const charger = useCallback(async () => {
    if (!uid) return;
    const lire = (r: QuerySnapshot) => r.docs.map((d) => ({ ...(d.data() as EvenementVie), id: d.id }));
    try {
      setPublies(lire(await getDocs(query(collection(db, "vie_evenements"), where("statut", "==", "valide")))).sort(parDateDesc));
    } catch {
      setPublies([]);
    }
    try {
      setMiens(lire(await getDocs(query(collection(db, "vie_evenements"), where("uid", "==", uid)))).sort(parDateDesc));
    } catch {
      /* ignoré */
    }
    if (admin) {
      try {
        setAValider(lire(await getDocs(query(collection(db, "vie_evenements"), where("statut", "==", "en_attente")))).sort(parDateDesc));
      } catch {
        /* ignoré */
      }
    }
  }, [uid, admin]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function decider(e: EvenementVie, statut: "valide" | "refuse") {
    await updateDoc(doc(db, "vie_evenements", e.id), { statut, decideLe: serverTimestamp(), decidePar: uid ?? "" });
    await charger();
  }
  async function supprimer(e: EvenementVie) {
    await deleteDoc(doc(db, "vie_evenements", e.id));
    await charger();
  }

  const enCours = miens.filter((e) => e.statut !== "valide");

  return (
    <AppShell title="Vie du groupe" subtitle="Naissances, décès, mariages">
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>
      <div className="space-y-4">
        <Link href="/caisse/vie/nouveau" className="btn-gold flex items-center justify-center gap-2">
          <Plus size={18} /> Signaler un événement
        </Link>
        <p className="text-sm text-muted">
          Informez le groupe d’une naissance, d’un décès ou d’un mariage. Un administrateur valide avant publication. Ne partagez que ce que la famille accepte de faire savoir.
        </p>

        {admin && aValider.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-display text-base font-bold">À valider ({aValider.length})</h2>
            {aValider.map((e) => (
              <Carte key={e.id} e={e}>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => decider(e, "valide")} className="btn-gold">Publier</button>
                  <button onClick={() => decider(e, "refuse")} className="btn-outline">Refuser</button>
                </div>
              </Carte>
            ))}
          </section>
        )}

        {enCours.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-display text-base font-bold">Mes signalements</h2>
            {enCours.map((e) => (
              <Carte key={e.id} e={e}>
                <div className="flex items-center gap-3 text-sm">
                  <span className={e.statut === "refuse" ? "font-semibold text-brand-red" : "font-semibold text-gold-700"}>
                    {e.statut === "refuse" ? "Refusé" : "En attente de validation"}
                  </span>
                  {e.statut === "en_attente" && (
                    <button onClick={() => supprimer(e)} aria-label="Supprimer" className="ml-auto text-muted"><Trash2 size={16} /></button>
                  )}
                </div>
              </Carte>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold">Dans le groupe</h2>
          {publies === null ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : publies.length === 0 ? (
            <p className="card p-6 text-center text-muted">Aucun événement publié pour l’instant.</p>
          ) : (
            publies.map((e) => (
              <Carte key={e.id} e={e}>
                {admin && (
                  <button onClick={() => supprimer(e)} className="text-xs text-muted underline">Retirer de la liste</button>
                )}
              </Carte>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function VieGroupePage() {
  return (
    <CaisseAcces>
      <Contenu />
    </CaisseAcces>
  );
}

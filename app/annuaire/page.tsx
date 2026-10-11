"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import Badges from "@/components/Badges";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, ficheDepuisDoc, ficheIncomplete, nomComplet } from "@/lib/fiches";
import { ecrireCache, lireCache } from "@/lib/cache";

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function AnnuairePage() {
  const { profile } = useAuth();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [avecEnt, setAvecEnt] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [quartier, setQuartier] = useState("");
  const [pays, setPays] = useState("");
  const [seulEnt, setSeulEnt] = useState(false);
  const [seulIncomplet, setSeulIncomplet] = useState(false);
  const [seulAdmin, setSeulAdmin] = useState(false);
  const [compte, setCompte] = useState<"" | "avec" | "sans">("");

  useEffect(() => {
    if (!profile || profile.statut !== "actif") return;
    const c = lireCache<Fiche[]>("annuaire");
    const e = lireCache<string[]>("annuaire-ent");
    if (c) {
      setFiches(c);
      setLoaded(true);
    }
    if (e) setAvecEnt(new Set(e));
    if (c && e) return;
    Promise.all([
      getDocs(collection(db, "fiches")),
      getDocs(query(collection(db, "entreprises"), where("statut", "==", "publie"))),
    ])
      .then(([snap, ents]) => {
        const list = snap.docs.map((d) => ficheDepuisDoc(d.id, d.data()));
        list.sort((a, b) => `${a.nom} ${a.prenom}`.trim().localeCompare(`${b.nom} ${b.prenom}`.trim(), "fr"));
        setFiches(list);
        ecrireCache("annuaire", list);
        const uids = Array.from(new Set(ents.docs.map((d) => String(d.data().ownerUid || "")).filter(Boolean)));
        setAvecEnt(new Set(uids));
        ecrireCache("annuaire-ent", uids);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  // listes de choix construites à partir des fiches (quartiers et pays réellement présents)
  const quartiers = useMemo(() => {
    const m = new Map<string, string>();
    fiches.forEach((f) => {
      const k = norm(f.ville);
      if (k && !m.has(k)) m.set(k, f.ville.trim());
    });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [fiches]);
  const payss = useMemo(() => {
    const m = new Map<string, string>();
    fiches.forEach((f) => {
      const k = norm(f.pays);
      if (k && !m.has(k)) m.set(k, f.pays.trim());
    });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [fiches]);

  const filtered = useMemo(() => {
    const s = norm(q);
    return fiches.filter((f) => {
      if (quartier && !norm(f.ville).includes(quartier)) return false;
      if (pays && norm(f.pays) !== pays) return false;
      if (seulEnt && !(f.uid && avecEnt.has(f.uid))) return false;
      if (seulIncomplet && !ficheIncomplete(f)) return false;
      if (seulAdmin && !f.admin) return false;
      if (compte === "avec" && !f.uid) return false;
      if (compte === "sans" && f.uid) return false;
      return !s || norm(`${f.prenom} ${f.nom} ${f.activite} ${f.competences} ${f.ville} ${f.presentation}`).includes(s);
    });
  }, [fiches, q, quartier, pays, seulEnt, seulIncomplet, seulAdmin, compte, avecEnt]);

  const chip = (on: boolean) =>
    `flex-none rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`;
  const nbComptes = fiches.filter((f) => f.uid).length;
  const filtresActifs = !!(compte || quartier || pays || seulEnt || seulIncomplet || seulAdmin);

  return (
    <AppShell
      title="Membres"
      subtitle={
        loaded
          ? filtresActifs || q
            ? `${filtered.length} sur ${fiches.length} membres`
            : `${fiches.length} membres · ${nbComptes} ont créé leur compte`
          : "Chargement..."
      }
    >
      <label className="card mb-3 flex items-center gap-3 px-4 py-3 text-muted">
        <Search size={18} strokeWidth={1.75} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, métier, compétence, quartier…"
          className="w-full bg-transparent text-[#202326] outline-none placeholder:text-muted"
        />
      </label>

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <select value={quartier} onChange={(e) => setQuartier(e.target.value)} className={chip(!!quartier)}>
          <option value="">Quartier</option>
          {quartiers.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={pays} onChange={(e) => setPays(e.target.value)} className={chip(!!pays)}>
          <option value="">Pays</option>
          {payss.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button onClick={() => setCompte((v) => (v === "avec" ? "" : "avec"))} className={chip(compte === "avec")}>
          Compte créé
        </button>
        <button onClick={() => setCompte((v) => (v === "sans" ? "" : "sans"))} className={chip(compte === "sans")}>
          Sans compte
        </button>
        <button onClick={() => setSeulEnt((v) => !v)} className={chip(seulEnt)}>
          Avec entreprise
        </button>
        <button onClick={() => setSeulAdmin((v) => !v)} className={chip(seulAdmin)}>
          Administrateurs
        </button>
        <button onClick={() => setSeulIncomplet((v) => !v)} className={chip(seulIncomplet)}>
          Fiche à compléter
        </button>
        {filtresActifs && (
          <button
            onClick={() => {
              setQuartier("");
              setPays("");
              setSeulEnt(false);
              setSeulIncomplet(false);
              setSeulAdmin(false);
              setCompte("");
            }}
            className="flex-none text-sm font-semibold text-brand-red"
          >
            Effacer
          </button>
        )}
      </div>

      {loaded && filtered.length === 0 && (
        <p className="card p-6 text-center text-muted">
          {fiches.length === 0 ? "L’annuaire est vide pour l’instant." : "Aucun résultat."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((f) => (
          <Link key={f.id} href={`/annuaire/${f.id}`} className={`card flex flex-col items-center gap-1 px-3 py-5 text-center ${f.uid ? "border-2 border-emerald-500 bg-emerald-50" : "border border-dashed border-line opacity-90"}`}>
            <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={56} photo={f.photo} />
            <p className="mt-1 text-sm font-semibold">{nomComplet(f)}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.uid ? "bg-emerald-600 text-white" : "bg-gray-200 text-muted"}`}>
              {f.uid ? "Compte créé" : "Pas encore inscrit"}
            </span>
            {f.admin && <Badges admin compact />}
            {f.activite && <p className="line-clamp-2 text-xs text-muted">{f.activite}</p>}
            {ficheIncomplete(f) && (
              <span className="mt-1 rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-semibold text-brand-red">
                Fiche à compléter
              </span>
            )}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

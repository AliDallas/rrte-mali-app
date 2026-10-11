"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MessageCircle, Phone, Search, SlidersHorizontal } from "lucide-react";
import { TAGS } from "@/lib/tags";
import Badges from "@/components/Badges";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, chiffres, ficheDepuisDoc, ficheIncomplete, nomComplet } from "@/lib/fiches";
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
  const [ouvert, setOuvert] = useState(false);
  const [quartier, setQuartier] = useState("");
  const [pays, setPays] = useState("");
  const [seulEnt, setSeulEnt] = useState(false);
  const [seulIncomplet, setSeulIncomplet] = useState(false);
  const [seulAdmin, setSeulAdmin] = useState(false);
  const [tag, setTag] = useState("");
  const [seulCherche, setSeulCherche] = useState(false);
  const [seulPropose, setSeulPropose] = useState(false);
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
      if (tag && !f.tags.includes(tag)) return false;
      if (seulCherche && !f.cherche.trim()) return false;
      if (seulPropose && !f.propose.trim()) return false;
      if (compte === "avec" && !f.uid) return false;
      if (compte === "sans" && f.uid) return false;
      return !s || norm(`${f.prenom} ${f.nom} ${f.activite} ${f.competences} ${f.ville} ${f.presentation} ${f.cherche} ${f.propose} ${f.tags.join(" ")}`).includes(s);
    });
  }, [fiches, q, quartier, pays, seulEnt, seulIncomplet, seulAdmin, compte, tag, seulCherche, seulPropose, avecEnt]);

  const chip = (on: boolean) =>
    `max-w-full rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`;
  const nbComptes = fiches.filter((f) => f.uid).length;
  const nbFiltres = [tag, seulCherche, seulPropose, compte, quartier, pays, seulEnt, seulIncomplet, seulAdmin].filter(Boolean).length;
  const filtresActifs = !!(tag || seulCherche || seulPropose || compte || quartier || pays || seulEnt || seulIncomplet || seulAdmin);

  return (
    <AppShell
      title="Membres"
      subtitle={
        loaded
          ? filtresActifs || q
            ? `${filtered.length} sur ${fiches.length} membres`
            : `${fiches.length} membres · ${nbComptes} ${nbComptes > 1 ? "ont" : "a"} créé leur compte`
          : "Chargement..."
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <label className="card flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-muted">
          <Search size={18} strokeWidth={1.75} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, métier, compétence, quartier…"
            className="w-full min-w-0 bg-transparent text-[#202326] outline-none placeholder:text-muted"
          />
        </label>
        <button
          onClick={() => setOuvert((v) => !v)}
          aria-label="Filtres"
          className={`relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl border ${
            ouvert || nbFiltres > 0 ? "border-gold-500 bg-gold-500 text-ink" : "border-line bg-white text-muted"
          }`}
        >
          <SlidersHorizontal size={20} strokeWidth={1.75} />
          {nbFiltres > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white">
              {nbFiltres}
            </span>
          )}
        </button>
      </div>

      {ouvert && (
      <div className="card mb-4 flex flex-wrap items-center gap-2 p-3">
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
        <select value={tag} onChange={(e) => setTag(e.target.value)} className={chip(!!tag)}>
          <option value="">Domaine</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button onClick={() => setSeulCherche((v) => !v)} className={chip(seulCherche)}>
          Cherche
        </button>
        <button onClick={() => setSeulPropose((v) => !v)} className={chip(seulPropose)}>
          Propose
        </button>
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
              setTag("");
              setSeulCherche(false);
              setSeulPropose(false);
            }}
            className="flex-none text-sm font-semibold text-brand-red"
          >
            Effacer
          </button>
        )}
      </div>
      )}

      {loaded && filtered.length === 0 && (
        <p className="card p-6 text-center text-muted">
          {fiches.length === 0 ? "L’annuaire est vide pour l’instant." : "Aucun résultat."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((f) => (
          <div
            key={f.id}
            className={`card flex flex-col ${f.uid ? "border-2 border-emerald-500 bg-emerald-50" : "border border-dashed border-line opacity-90"}`}
          >
            <Link href={`/annuaire/${f.id}`} className="flex flex-1 flex-col items-center gap-1 px-3 pb-2 pt-5 text-center">
              <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={56} photo={f.photo} />
              <p className="mt-1 text-sm font-semibold">{nomComplet(f)}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.uid ? "bg-emerald-600 text-white" : "bg-gray-200 text-muted"}`}>
                {f.uid ? "Compte créé" : "Pas encore inscrit"}
              </span>
              {f.admin && <Badges admin compact />}
              {f.activite && <p className="line-clamp-2 text-xs text-muted">{f.activite}</p>}
              {f.cherche && <p className="line-clamp-2 text-xs"><span className="font-semibold text-gold-700">Cherche :</span> {f.cherche}</p>}
              {f.propose && <p className="line-clamp-2 text-xs"><span className="font-semibold text-gold-700">Propose :</span> {f.propose}</p>}
              {ficheIncomplete(f) && (
                <span className="mt-1 rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-semibold text-brand-red">
                  Fiche à compléter
                </span>
              )}
            </Link>
            {f.tels[0] && (
              <div className="flex gap-2 px-3 pb-3 pt-1">
                <a
                  href={`tel:${f.tels[0]}`}
                  aria-label="Appeler"
                  className="flex flex-1 items-center justify-center gap-1 rounded-full border border-line bg-white py-1.5 text-xs font-semibold"
                >
                  <Phone size={14} /> Appeler
                </a>
                <a
                  href={`https://wa.me/${chiffres(f.tels[0])}?text=${encodeURIComponent("Salam, je te contacte via l’application RRTE.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gold-500 text-ink"
                >
                  <MessageCircle size={15} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

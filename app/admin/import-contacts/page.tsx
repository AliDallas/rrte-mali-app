"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { ChevronLeft, Upload } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { chiffres, lireCsv } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";
import { DOMAINES } from "@/lib/domaines";

interface Ligne {
  col: "entreprises" | "prestataires";
  id: string;
  data: Record<string, unknown>;
}

function slug(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function ImportContactsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [ignorees, setIgnorees] = useState(0);
  const [horsListe, setHorsListe] = useState<string[]>([]);
  const [fichier, setFichier] = useState("");
  const [erreur, setErreur] = useState("");
  const [etat, setEtat] = useState<"attente" | "envoi" | "fini">("attente");
  const [fait, setFait] = useState(0);

  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    setErreur("");
    setEtat("attente");
    setLignes([]);
    const f = e.target.files?.[0];
    if (!f) return;
    setFichier(f.name);
    const rows = lireCsv(await f.text());
    if (rows.length === 0 || !("nom" in rows[0]) || !("domaine" in rows[0]) || !("destination" in rows[0])) {
      setErreur("Fichier non reconnu : il faut le fichier RRTE-IMPORT-ENTREPRISES.csv préparé avec Claude.");
      return;
    }
    const vus = new Set<string>();
    const out: Ligne[] = [];
    const inconnus = new Set<string>();
    let ign = 0;
    rows.forEach((r, i) => {
      const nom = (r.nom ?? "").trim();
      const col = r.destination === "prestataires" ? "prestataires" : r.destination === "entreprises" ? "entreprises" : null;
      if (!nom || !col) {
        ign++;
        return;
      }
      const domaine = (r.domaine ?? "").trim();
      if (domaine && !DOMAINES.includes(domaine)) inconnus.add(domaine);
      const tels = (r.tel ?? "").split(/[;/|]/).map((t) => t.trim()).filter(Boolean);
      const tel = tels[0] ?? "";
      let description = (r.description ?? "").trim();
      if (tels.length > 1) description += `${description ? "\n" : ""}Autre numéro : ${tels.slice(1).join(" / ")}`;
      const membre = (r.membre ?? "").trim();
      let id = `imp-${tel ? chiffres(tel) : slug(nom) || i}`;
      if (vus.has(col + id)) id = `${id}-${i + 1}`;
      vus.add(col + id);
      const commun = { nom, description, quartier: (r.quartier ?? "").trim(), tel, ownerUid: "import-rrte", ownerNom: membre || "RRTE", importLe: serverTimestamp() };
      out.push(
        col === "prestataires"
          ? { col, id, data: { ...commun, metier: domaine || "Services divers", nbAvis: 0, sommeNotes: 0, statut: "valide" } }
          : {
              col,
              id,
              data: {
                ...commun,
                type: membre ? "proprietaire" : "recommandation",
                categorie: domaine || "Services divers",
                adresse: "",
                email: "",
                siteWeb: "",
                liens: [],
                horaires: "",
                logo: "",
                vignette: "",
                statut: "publie",
              },
            }
      );
    });
    setLignes(out);
    setIgnorees(ign);
    setHorsListe(Array.from(inconnus));
  }

  async function importer() {
    setEtat("envoi");
    setErreur("");
    setFait(0);
    try {
      for (let i = 0; i < lignes.length; i += 400) {
        const batch = writeBatch(db);
        lignes.slice(i, i + 400).forEach((l) => batch.set(doc(db, l.col, l.id), l.data, { merge: true }));
        await batch.commit();
        setFait(Math.min(i + 400, lignes.length));
      }
      viderCache("prestataires");
      viderCache("entreprises");
      setEtat("fini");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur pendant l’import.");
      setEtat("attente");
    }
  }

  const nbEnt = lignes.filter((l) => l.col === "entreprises").length;
  const nbPrest = lignes.length - nbEnt;

  return (
    <AppShell title="Administration" subtitle="Importer entreprises et recommandés">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <div className="space-y-4">
          <label className="card flex cursor-pointer flex-col items-center gap-2 p-6 text-center">
            <Upload className="text-gold-600" size={28} strokeWidth={1.75} />
            <span className="font-semibold">Choisir le fichier RRTE-IMPORT-ENTREPRISES.csv</span>
            <span className="text-sm text-muted">{fichier || "Aucun fichier choisi"}</span>
            <input type="file" accept=".csv,text/csv" onChange={choisir} className="hidden" />
          </label>

          {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}

          {lignes.length > 0 && (
            <div className="card space-y-1 p-5">
              <p className="font-semibold">{lignes.length} fiches prêtes à importer</p>
              <p className="text-sm text-muted">{nbEnt} dans Entreprises</p>
              <p className="text-sm text-muted">{nbPrest} dans Recommandés</p>
              {ignorees > 0 && <p className="text-sm text-muted">{ignorees} lignes ignorées (sans nom ou sans destination)</p>}
              {horsListe.length > 0 && (
                <p className="text-sm text-brand-red">Domaines hors liste (importés quand même) : {horsListe.join(", ")}</p>
              )}
              <p className="pt-2 text-xs text-muted">
                Relancer l’import met à jour les mêmes fiches sans créer de doublons. Les fiches importées sont publiées tout de suite.
              </p>
              <button onClick={importer} disabled={etat === "envoi"} className="btn-gold mt-3">
                {etat === "envoi" ? `Import… ${fait}/${lignes.length}` : "Importer maintenant"}
              </button>
            </div>
          )}

          {etat === "fini" && (
            <div className="rounded-xl bg-[#E3F0DC] p-4 text-sm text-[#3C7026]">
              Import terminé : {lignes.length} fiches. Elles apparaissent dans Entreprises et Recommandés.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

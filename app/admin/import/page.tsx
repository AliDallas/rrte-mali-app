"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, writeBatch } from "firebase/firestore";
import { ChevronLeft, Upload } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { chiffres, cle, lireCsv } from "@/lib/fiches";

interface Ligne {
  id: string;
  data: Record<string, unknown>;
}

export default function ImportPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [lignes, setLignes] = useState<Ligne[]>([]);
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
    if (rows.length === 0 || !("nom" in rows[0]) || !("tel1" in rows[0])) {
      setErreur("Fichier non reconnu : il faut le fichier RRTE-MEMBRES-IMPORT.csv.");
      return;
    }
    const vus = new Set<string>();
    const out: Ligne[] = [];
    rows.forEach((r, i) => {
      const tels = [r.tel1, r.tel2, r.tel3].filter((t) => t);
      let id = tels[0] ? chiffres(tels[0]) : `sans-tel-${i + 1}`;
      if (vus.has(id)) id = `${id}-${i + 1}`;
      vus.add(id);
      out.push({
        id,
        data: {
          nom: r.nom ?? "",
          prenom: r.prenom ?? "",
          tels,
          cles: tels.map(cle),
          email: r.email ?? "",
          ville: r.ville ?? "",
          activite: r.activite ?? "",
          competences: r.competences ?? "",
          anciennete: r.anciennete ?? "",
          reseaux: r.reseaux ?? "",
          attentes: r.attentes ?? "",
          info: r.info ?? "",
          nomWhatsapp: r.nom_whatsapp ?? "",
          aConfirmer: r.a_confirmer_sur_app === "Oui",
          statutFiche: r.statut_fiche ?? "",
        },
      });
    });
    setLignes(out);
  }

  async function importer() {
    setEtat("envoi");
    setErreur("");
    setFait(0);
    try {
      for (let i = 0; i < lignes.length; i += 400) {
        const batch = writeBatch(db);
        lignes.slice(i, i + 400).forEach((l) => batch.set(doc(db, "fiches", l.id), l.data, { merge: true }));
        await batch.commit();
        setFait(Math.min(i + 400, lignes.length));
      }
      setEtat("fini");
    } catch (e) {
      setErreur(
        e instanceof Error
          ? `${e.message} (si c’est un refus d’autorisation, publiez d’abord les nouvelles règles Firestore)`
          : "Erreur pendant l’import."
      );
      setEtat("attente");
    }
  }

  const complet = lignes.filter((l) => l.data.statutFiche === "Fiche complète").length;
  const aConf = lignes.filter((l) => l.data.aConfirmer === true).length;

  return (
    <AppShell title="Administration" subtitle="Importer l’annuaire">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <div className="space-y-4">
          <label className="card flex cursor-pointer flex-col items-center gap-2 p-6 text-center">
            <Upload className="text-gold-600" size={28} strokeWidth={1.75} />
            <span className="font-semibold">Choisir le fichier RRTE-MEMBRES-IMPORT.csv</span>
            <span className="text-sm text-muted">{fichier || "Aucun fichier choisi"}</span>
            <input type="file" accept=".csv,text/csv" onChange={choisir} className="hidden" />
          </label>

          {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}

          {lignes.length > 0 && (
            <div className="card space-y-1 p-5">
              <p className="font-semibold">{lignes.length} membres prêts à importer</p>
              <p className="text-sm text-muted">{complet} fiches complètes</p>
              <p className="text-sm text-muted">{aConf} à confirmer sur l’application</p>
              <p className="pt-2 text-xs text-muted">
                Relancer l’import met à jour les fiches existantes sans créer de doublons.
              </p>
              <button onClick={importer} disabled={etat === "envoi"} className="btn-gold mt-3">
                {etat === "envoi" ? `Import… ${fait}/${lignes.length}` : "Importer dans l’annuaire"}
              </button>
            </div>
          )}

          {etat === "fini" && (
            <div className="rounded-xl bg-[#E3F0DC] p-4 text-sm text-[#3C7026]">
              Import terminé : {lignes.length} fiches. Elles apparaissent dans l’onglet Membres.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

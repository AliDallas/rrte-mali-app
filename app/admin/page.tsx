"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { Activity, BellRing, Check, FileSpreadsheet, Flag, Inbox, LayoutDashboard, ShieldCheck, UserCheck, Users, Wrench, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth, MemberProfile } from "@/lib/AuthContext";
import { Entreprise, enregistrerPhotos, entrepriseDepuisDoc, saisieVersDoc } from "@/lib/entreprises";
import { viderCache } from "@/lib/cache";
import AdminTableau, { OngletAdmin } from "@/components/AdminTableau";
import { ResultatAttente, compterAttente } from "@/lib/enAttente";
import CopierPresentation from "@/components/CopierPresentation";
import MessagePersonne from "@/components/MessagePersonne";
import { DonneesPresentation, donneesDepuisInscription, donneesDepuisFiche, texteAcceptation } from "@/lib/presentation";
import { Prestataire, prestataireDepuisDoc } from "@/lib/prestataires";
import { chiffres, cle, nomComplet, ficheDepuisDoc, Fiche } from "@/lib/fiches";

export default function AdminPage() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<MemberProfile[]>([]);
  const [liens, setLiens] = useState<Record<string, Fiche>>({});
  const [possibles, setPossibles] = useState<Record<string, Fiche[]>>({});
  const [refusDe, setRefusDe] = useState<string | null>(null);
  const [msgRefus, setMsgRefus] = useState("");
  const [choix, setChoix] = useState<Record<string, string>>({}); // uid -> id de la fiche choisie ("" = automatique, "nouvelle" = aucune)
  const [entAttente, setEntAttente] = useState<Entreprise[]>([]);
  const [recoAttente, setRecoAttente] = useState<Prestataire[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [valides, setValides] = useState<(DonneesPresentation & { enTest?: boolean })[]>([]);
  const [inscrits, setInscrits] = useState<MemberProfile[]>([]);
  const isAdmin = profile?.role === "admin";
  const [onglet, setOnglet] = useState<OngletAdmin>("tableau");
  const [attente, setAttente] = useState<{ total: number; details: ResultatAttente[] } | null>(null);
  const [comptage, setComptage] = useState(false);

  const actualiser = useCallback(() => {
    setComptage(true);
    compterAttente()
      .then(setAttente)
      .finally(() => setComptage(false));
  }, []);

  useEffect(() => {
    if (isAdmin) actualiser();
  }, [isAdmin, onglet, actualiser]);

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "users"), where("statut", "==", "en_attente")));
    const attente = snap.docs.map((d) => d.data() as MemberProfile);
    const snapInscrits = await getDocs(query(collection(db, "users"), where("statut", "==", "inscrit")));
    const sansAcces = snapInscrits.docs.map((d) => d.data() as MemberProfile);
    setPending(attente);
    setInscrits(sansAcces);
    const list = [...attente, ...sansAcces];
    // rapprochement automatique avec l'annuaire importé, par numéro de téléphone
    const trouves: Record<string, Fiche> = {};
    await Promise.all(
      list.map(async (m) => {
        const k = m.telephone ? cle(m.telephone) : "";
        if (k.length < 8) return;
        const r = await getDocs(query(collection(db, "fiches"), where("cles", "array-contains", k)));
        if (!r.empty) trouves[m.uid] = ficheDepuisDoc(r.docs[0].id, r.docs[0].data());
      })
    );
    setLiens(trouves);
    // doublons possibles : même e-mail ou même nom dans l'annuaire (la personne a pu donner un autre numéro)
    const toutes = await getDocs(collection(db, "fiches"));
    const fiches = toutes.docs.map((d) => ficheDepuisDoc(d.id, d.data()));
    const nn = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const poss: Record<string, Fiche[]> = {};
    for (const m of list) {
      const mots = nn(`${m.prenom} ${m.nom}`).split(" ").filter((w) => w.length > 1);
      poss[m.uid] = fiches.filter((f) => {
        if (trouves[m.uid]?.id === f.id) return false;
        if (m.email && f.email && f.email.trim().toLowerCase() === m.email.trim().toLowerCase()) return true;
        const cible = nn(`${f.prenom} ${f.nom}`);
        return mots.length >= 2 && mots.every((w) => cible.includes(w));
      });
    }
    setPossibles(poss);
    const ents = await getDocs(query(collection(db, "entreprises"), where("statut", "==", "en_attente")));
    setEntAttente(ents.docs.map((d) => entrepriseDepuisDoc(d.id, d.data())));
    const recos = await getDocs(query(collection(db, "prestataires"), where("statut", "==", "en_attente")));
    setRecoAttente(recos.docs.map((d) => prestataireDepuisDoc(d.id, d.data())));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isAdmin) load().catch(() => setLoaded(true));
  }, [isAdmin, load]);

  // fiche à laquelle rattacher l'inscription : celle choisie par l'administrateur, sinon celle trouvée par le numéro
  function ficheRetenue(m: MemberProfile): Fiche | undefined {
    const c = choix[m.uid];
    if (c === "nouvelle") return undefined;
    if (c) return (possibles[m.uid] ?? []).find((f) => f.id === c);
    return liens[m.uid];
  }

  const MODELES: [string, (p: string) => string][] = [
    [
      "Pas installé / pas d’activité au Mali",
      (p) =>
        `Bonjour${p ? ` ${p}` : ""},\n\nMerci pour l’intérêt que vous portez à RRTE. Après examen de votre demande, nous ne pouvons pas vous donner accès pour le moment : l’application est réservée aux personnes de la diaspora installées au Mali ou y exerçant une activité.\n\nSi votre situation évolue, vous pourrez nous refaire une demande. Nous vous souhaitons une belle continuation.\n\nL’équipe RRTE`,
    ],
    [
      "Informations incomplètes ou non vérifiables",
      (p) =>
        `Bonjour${p ? ` ${p}` : ""},\n\nMerci pour votre demande d’accès à RRTE. Nous n’avons pas pu la valider car les informations fournies sont incomplètes ou n’ont pas pu être vérifiées. N’hésitez pas à nous contacter pour les compléter.\n\nL’équipe RRTE`,
    ],
    ["Autre motif (à rédiger)", (p) => `Bonjour${p ? ` ${p}` : ""},\n\n\n\nL’équipe RRTE`],
  ];

  function ouvrirRefus(m: MemberProfile) {
    setRefusDe(m.uid);
    setMsgRefus(MODELES[0][1](m.prenom));
  }

  async function confirmerRefus(m: MemberProfile) {
    setBusy(m.uid);
    try {
      await updateDoc(doc(db, "users", m.uid), { statut: "refuse", messageRefus: msgRefus.trim() });
      setPending((l) => l.filter((x) => x.uid !== m.uid));
      setRefusDe(null);
    } finally {
      setBusy(null);
    }
  }

  async function decide(uid: string, statut: "actif" | "refuse" | "inscrit") {
    setBusy(uid);
    try {
      const m = pending.find((x) => x.uid === uid) ?? inscrits.find((x) => x.uid === uid);
      if (statut === "actif" && m) {
        // la fiche saisie à l'inscription alimente l'annuaire (sans créer de doublon)
        const f = m.fiche;
        const tel = m.telephone || "";
        const donnees: Record<string, unknown> = { uid, email: m.email, statutFiche: "Fiche complète", aConfirmer: false, inscritLe: Date.now() };
        const mettre = (k: string, v?: string) => {
          if (v && v.trim()) donnees[k] = v.trim();
        };
        if (f) {
          mettre("reseaux", f.reseaux);
          mettre("pays", f.pays);
          mettre("ville", f.quartier);
          mettre("anciennete", f.anneeRetour);
          mettre("activite", f.activite);
          mettre("presentation", f.presentation);
          mettre("logo", f.logo);
          mettre("photo", f.photo);
          viderCache("annuaire");
          mettre("competences", f.competences);
          mettre("attentes", f.objectif);
        }
        const existante = ficheRetenue(m);
        if (existante) {
          await setDoc(doc(db, "fiches", existante.id), donnees, { merge: true });
          // le numéro donné à l'inscription est ajouté à la fiche existante (sans doublon)
          if (tel && cle(tel).length >= 8 && !existante.cles.includes(cle(tel))) {
            await updateDoc(doc(db, "fiches", existante.id), { tels: arrayUnion(tel), cles: arrayUnion(cle(tel)) });
          }
        } else {
          const id = chiffres(tel) || uid;
          await setDoc(
            doc(db, "fiches", id),
            { ...donnees, nom: m.nom, prenom: m.prenom, tels: tel ? [tel] : [], cles: tel ? [cle(tel)] : [], info: "" },
            { merge: true }
          );
        }
      }
      if (statut === "actif" && m?.entreprises?.length) {
        // les entreprises saisies à l'inscription sont publiées d'office (l'admin vient de valider la personne)
        for (const ent of m.entreprises) {
          if (!ent.nom?.trim()) continue;
          const ref = await addDoc(collection(db, "entreprises"), {
            ...saisieVersDoc(ent),
            ownerUid: uid,
            ownerNom: `${m.prenom} ${m.nom}`.trim(),
            statut: "publie",
            createdAt: serverTimestamp(),
          });
          const vignette = await enregistrerPhotos(ref.id, ent.photos ?? []);
          await updateDoc(ref, { vignette });
        }
        viderCache("entreprises");
      }
      await updateDoc(doc(db, "users", uid), { statut });
      if (statut === "inscrit" && m) setValides((l) => [{ ...donneesDepuisInscription(m, ficheRetenue(m)), enTest: true }, ...l]);
      if (statut === "actif" && m) setValides((l) => [donneesDepuisInscription(m, ficheRetenue(m)), ...l]);
      setPending((p) => p.filter((x) => x.uid !== uid));
      setInscrits((l) => (statut === "inscrit" && m ? [m, ...l.filter((x) => x.uid !== uid)] : l.filter((x) => x.uid !== uid)));
    } finally {
      setBusy(null);
    }
  }

  // ouvre l'application à toutes les personnes validées pour WhatsApp (celles dont la fiche est en conflit sont laissées de côté)
  async function ouvrirTous() {
    if (!window.confirm(`Ouvrir l’application à ${inscrits.length} personne(s) ?`)) return;
    for (const m of [...inscrits]) {
      const f = ficheRetenue(m);
      if (f?.uid && f.uid !== m.uid) continue;
      await decide(m.uid, "actif");
    }
  }

  async function decideReco(id: string, valider: boolean) {
    setBusy(id);
    try {
      if (valider) await updateDoc(doc(db, "prestataires", id), { statut: "valide" });
      else await deleteDoc(doc(db, "prestataires", id));
      viderCache("prestataires");
      setRecoAttente((l) => l.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  }

  async function decideEnt(id: string, publier: boolean) {
    setBusy(id);
    try {
      if (publier) await updateDoc(doc(db, "entreprises", id), { statut: "publie" });
      else await deleteDoc(doc(db, "entreprises", id));
      setEntAttente((l) => l.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title="Administration" subtitle="Tableau de bord">
      {!isAdmin && <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>}
      {isAdmin && (
        <nav className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
          {([
            ["tableau", "Tableau de bord", LayoutDashboard, 0],
            ["inscriptions", "Inscriptions", Users, pending.length + inscrits.length],
            ["contenus", "Contenus", Inbox, entAttente.length + recoAttente.length],
            ["outils", "Outils", Wrench, 0],
          ] as [OngletAdmin, string, typeof Users, number][]).map(([cle, libelle, Icone, n]) => (
            <button
              key={cle}
              onClick={() => setOnglet(cle)}
              className={`flex flex-none items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${onglet === cle ? "border-ink bg-ink text-ink-fg" : "border-line bg-white text-muted"}`}
            >
              <Icone size={15} /> {libelle}
              {n > 0 && <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-red px-1.5 text-xs font-bold text-white">{n}</span>}
            </button>
          ))}
        </nav>
      )}
      {isAdmin && onglet === "tableau" && (
        <AdminTableau attente={attente} chargement={comptage} onActualiser={actualiser} onAller={setOnglet} nbInscrits={inscrits.length} />
      )}
      {isAdmin && onglet === "outils" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">Gestion des administrateurs et imports de fichiers.</p>
          <Link href="/admin/a-traiter" className="card flex items-center gap-3 border-2 border-gold-500 p-4">
            <BellRing className="text-gold-600" size={22} strokeWidth={1.75} />
            <div className="flex-1">
              <p className="font-semibold">À traiter (vue détaillée)</p>
              <p className="text-xs text-muted">Tout ce qui attend une validation, par rubrique</p>
            </div>
          </Link>
      <Link href="/admin/activite" className="card flex items-center gap-3 p-4">
          <Activity className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Activité des membres</p>
            <p className="text-xs text-muted">Qui est en ligne, dernières connexions</p>
          </div>
        </Link>
      {(
        <Link href="/admin/administrateurs" className="card flex items-center gap-3 p-4">
          <ShieldCheck className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Administrateurs</p>
            <p className="text-xs text-muted">Nommer ou retirer un administrateur</p>
          </div>
        </Link>
      )}
      {(
        <Link href="/admin/import" className="card flex items-center gap-3 p-4">
          <FileSpreadsheet className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Importer l’annuaire</p>
            <p className="text-xs text-muted">Charger le fichier des membres (CSV)</p>
          </div>
        </Link>
      )}
      {(
        <Link href="/admin/signalements" className="card flex items-center gap-3 p-4">
          <Flag className="text-brand-red" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Signalements</p>
            <p className="text-xs text-muted">Membres ou contenus signalés</p>
          </div>
        </Link>
      )}
      {(
        <Link href="/admin/import-contacts" className="card flex items-center gap-3 p-4">
          <FileSpreadsheet className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Importer entreprises et recommandés</p>
            <p className="text-xs text-muted">Charger le fichier trié (CSV)</p>
          </div>
        </Link>
      )}
      {(
        <Link href="/admin/import-demarches" className="card flex items-center gap-3 p-4">
          <FileSpreadsheet className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Importer les fiches de démarches</p>
            <p className="text-xs text-muted">État civil Mali et France (à relire)</p>
          </div>
        </Link>
      )}
        </div>
      )}
      {isAdmin && onglet === "inscriptions" && (
        <>
      {isAdmin && valides.length > 0 && (
        <div className="mb-5 space-y-3">
          <h2 className="font-display text-lg font-bold">Membres validés : à prévenir et à annoncer</h2>
          {valides.map((v, i) => (
            <div key={i} className="card space-y-3 border-2 border-emerald-500 p-4">
              <p className="font-semibold">{`${v.prenom} ${v.nom}`.trim()}</p>
              <div>
                <p className="text-sm font-semibold">1. Prévenir la personne</p>
                <div className="mt-1">
                  <MessagePersonne
                    tel={v.tel}
                    message={
                      v.enTest
                        ? `Bonjour${v.prenom ? ` ${v.prenom}` : ""},\n\nVotre inscription RRTE est validée, merci ! Vous êtes ajouté(e) au groupe WhatsApp. L’application est pour l’instant en phase de test avec un petit groupe de travail : son utilisation complète sera ouverte à tous les membres plus tard, et nous vous préviendrons dans le groupe.\n\nL’équipe RRTE`
                        : texteAcceptation(v.prenom)
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">2. Annoncer dans le groupe WhatsApp</p>
                <CopierPresentation donnees={v} />
              </div>
            </div>
          ))}
        </div>
      )}
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : !loaded ? (
        <p className="text-center text-muted">Chargement...</p>
      ) : pending.length === 0 ? (
        <p className="card p-6 text-center text-muted">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-3">
          <p className="rounded-xl bg-gold-100 p-3 text-xs text-ink">
            <b>Coche pleine</b> : accès complet à l’application. <b>Coche avec silhouette</b> : validé pour le groupe WhatsApp
            seulement, accès à l’application plus tard (phase de test).
          </p>
          {pending.map((m) => (
            <div key={m.uid} className="card flex flex-wrap items-start gap-3 p-4">
              <Avatar prenom={m.prenom} nom={m.nom} size={44} photo={m.photo} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {m.prenom} {m.nom}
                </p>
                <p className="truncate text-sm text-muted">{m.email}</p>
                {m.telephone && <p className="truncate text-sm text-muted">{m.telephone}</p>}
                {m.fiche && (m.fiche.activite || m.fiche.pays) && (
                  <p className="mt-1 text-sm">
                    {[m.fiche.activite, m.fiche.quartier, m.fiche.pays].filter(Boolean).join(" · ")}
                  </p>
                )}
                {(() => {
                  const f = ficheRetenue(m);
                  if (f && f.uid && f.uid !== m.uid)
                    return (
                      <p className="mt-1 rounded-lg bg-brand-red/10 p-2 text-xs font-semibold text-brand-red">
                        Attention : la fiche « {nomComplet(f)} » a déjà un compte. C’est probablement un doublon : refusez cette demande.
                      </p>
                    );
                  if (f)
                    return <p className="mt-1 text-xs font-semibold text-[#3C7026]">Fiche trouvée : {nomComplet(f)}</p>;
                  return <p className="mt-1 text-xs text-brand-red">Aucune fiche avec ce numéro</p>;
                })()}
                {(possibles[m.uid]?.length ?? 0) > 0 && (
                  <label className="mt-2 block rounded-lg bg-gold-100 p-2 text-xs">
                    <span className="font-semibold">Fiches ressemblantes (même nom ou même e-mail) :</span>
                    <select
                      value={choix[m.uid] ?? ""}
                      onChange={(e) => setChoix((c) => ({ ...c, [m.uid]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-2 text-sm"
                    >
                      <option value="">Garder le choix automatique</option>
                      {possibles[m.uid].map((f) => (
                        <option key={f.id} value={f.id}>
                          Lier à : {nomComplet(f)} {f.tels[0] ? `(${f.tels[0]})` : ""}{f.uid ? " · a déjà un compte" : ""}
                        </option>
                      ))}
                      <option value="nouvelle">Créer une nouvelle fiche</option>
                    </select>
                  </label>
                )}
                {m.reglementAccepteLe ? (
                  <p className="mt-1 text-xs font-semibold text-[#3C7026]">
                    Règlement accepté le {new Date(m.reglementAccepteLe).toLocaleDateString("fr-FR")}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">Règlement : acceptation non enregistrée</p>
                )}
                <CopierPresentation donnees={donneesDepuisInscription(m, liens[m.uid])} />
              </div>
              <button
                disabled={busy === m.uid}
                onClick={() => ouvrirRefus(m)}
                aria-label="Refuser"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
              >
                <X size={18} />
              </button>
              <button
                disabled={busy === m.uid || (!!ficheRetenue(m)?.uid && ficheRetenue(m)?.uid !== m.uid)}
                onClick={() => decide(m.uid, "inscrit")}
                aria-label="Valider pour le groupe WhatsApp, sans accès à l’application"
                title="Valider pour WhatsApp seulement (accès à l’application plus tard)"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500 text-gold-700 hover:bg-gold-100 disabled:opacity-50"
              >
                <UserCheck size={18} />
              </button>
              <button
                disabled={busy === m.uid || (!!ficheRetenue(m)?.uid && ficheRetenue(m)?.uid !== m.uid)}
                onClick={() => decide(m.uid, "actif")}
                aria-label="Approuver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
              >
                <Check size={18} />
              </button>
              {refusDe === m.uid && (
                <div className="basis-full space-y-2 rounded-xl border border-brand-red/40 bg-brand-red/5 p-3">
                  <p className="text-sm font-semibold">Refuser cette demande et envoyer un message</p>
                  <select
                    onChange={(e) => setMsgRefus(MODELES[Number(e.target.value)][1](m.prenom))}
                    className="w-full rounded-lg border border-line bg-white px-2 py-2 text-sm"
                  >
                    {MODELES.map(([t], i) => (
                      <option key={t} value={i}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={7}
                    value={msgRefus}
                    onChange={(e) => setMsgRefus(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white p-2 text-sm"
                  />
                  <p className="text-xs text-muted">
                    Ce message sera aussi affiché à la personne quand elle se connectera. Vous pouvez aussi le copier ou l’envoyer directement par WhatsApp.
                  </p>
                  <MessagePersonne tel={m.telephone || ""} message={msgRefus} sansApercu />
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy === m.uid} onClick={() => confirmerRefus(m)} className="btn-gold flex-1">
                      Confirmer le refus
                    </button>
                    <button onClick={() => setRefusDe(null)} className="w-full text-sm text-muted">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {isAdmin && loaded && inscrits.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-1 font-display text-lg font-bold">Inscrits sans accès à l’application ({inscrits.length})</h2>
          <p className="mb-3 text-xs text-muted">
            Validés pour le groupe WhatsApp pendant la phase de test. Appuyez sur la coche pour leur ouvrir l’application.
          </p>
          <button
            disabled={busy !== null}
            onClick={ouvrirTous}
            className="btn-gold mb-3"
          >
            Ouvrir l’accès à tous les inscrits ({inscrits.length})
          </button>
          <div className="space-y-3">
            {inscrits.map((m) => (
              <div key={m.uid} className="card flex items-center gap-3 p-4">
                <Avatar prenom={m.prenom} nom={m.nom} size={40} photo={m.photo} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {m.prenom} {m.nom}
                  </p>
                  <p className="truncate text-sm text-muted">{m.telephone || m.email}</p>
                </div>
                <button
                  disabled={busy === m.uid || (!!ficheRetenue(m)?.uid && ficheRetenue(m)?.uid !== m.uid)}
                  onClick={() => decide(m.uid, "actif")}
                  aria-label="Ouvrir l’accès à l’application"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
                >
                  <Check size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
      {isAdmin && onglet === "contenus" && (
        <>
      {isAdmin && loaded && entAttente.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold">Entreprises à valider</h2>
          <div className="space-y-3">
            {entAttente.map((x) => (
              <div key={x.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/entreprises/${x.id}`} className="font-semibold underline">
                    {x.nom}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {[x.categorie, x.type === "recommandation" ? `recommandée par ${x.ownerNom}` : `ajoutée par ${x.ownerNom}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  disabled={busy === x.id}
                  onClick={() => decideEnt(x.id, false)}
                  aria-label="Refuser"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
                >
                  <X size={18} />
                </button>
                <button
                  disabled={busy === x.id}
                  onClick={() => decideEnt(x.id, true)}
                  aria-label="Publier"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
                >
                  <Check size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {isAdmin && loaded && recoAttente.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold">Recommandations à valider</h2>
          <div className="space-y-3">
            {recoAttente.map((x) => (
              <div key={x.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/prestataires/${x.id}`} className="font-semibold underline">
                    {x.nom}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {[x.metier, x.quartier, `recommandé par ${x.ownerNom}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  disabled={busy === x.id}
                  onClick={() => decideReco(x.id, false)}
                  aria-label="Refuser"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
                >
                  <X size={18} />
                </button>
                <button
                  disabled={busy === x.id}
                  onClick={() => decideReco(x.id, true)}
                  aria-label="Valider"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
                >
                  <Check size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
          {loaded && entAttente.length === 0 && recoAttente.length === 0 && (
            <p className="card p-6 text-center text-muted">Aucune entreprise ni recommandation en attente. Les autres rubriques se valident depuis le Tableau de bord.</p>
          )}
        </>
      )}
    </AppShell>
  );
}

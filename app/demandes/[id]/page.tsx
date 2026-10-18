"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc, collection, deleteDoc, serverTimestamp, doc, getDoc, getDocs, increment, orderBy, query, updateDoc, where,
} from "firebase/firestore";
import { CheckCircle2, ChevronLeft, MessageCircle, Phone, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import SignalerBouton from "@/components/SignalerBouton";
import { Demande, Reponse, demandeDepuisDoc, ilYa, motsCles, reponseDepuisDoc, libelleType } from "@/lib/demandes";
import { Fiche, chiffres, cle, ficheDepuisDoc, nomComplet } from "@/lib/fiches";
import { METIERS, Prestataire, prestataireDepuisDoc } from "@/lib/prestataires";
import { lireCache, ecrireCache, viderCache } from "@/lib/cache";

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function DemandeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [d, setD] = useState<Demande | null>(null);
  const [etat, setEtat] = useState<"loading" | "ok" | "absente">("loading");
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [telAuteur, setTelAuteur] = useState("");
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [presta, setPresta] = useState<Prestataire[]>([]);
  const [texte, setTexte] = useState("");
  const [joindre, setJoindre] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [msg, setMsg] = useState("");
  const [recoOn, setRecoOn] = useState(false);
  const [recoNom, setRecoNom] = useState("");
  const [recoTel, setRecoTel] = useState("");
  const [recoMetier, setRecoMetier] = useState("");
  const [ajoutEnCours, setAjoutEnCours] = useState<string | null>(null);

  const actif = profile?.statut === "actif";
  const estAuteur = !!d && d.auteurUid === user?.uid;
  const peutGerer = estAuteur || profile?.role === "admin";

  async function chargerReponses() {
    if (!id) return;
    const r = await getDocs(query(collection(db, "demandes", id, "reponses"), orderBy("createdAt", "asc")));
    setReponses(r.docs.map((x) => reponseDepuisDoc(x.id, x.data())));
  }

  useEffect(() => {
    if (!id || !actif) return;
    getDoc(doc(db, "demandes", id))
      .then((snap) => {
        if (!snap.exists()) return setEtat("absente");
        const x = demandeDepuisDoc(snap.id, snap.data());
        setD(x);
        setEtat("ok");
        chargerReponses().catch(() => undefined);
        getDocs(query(collection(db, "fiches"), where("uid", "==", x.auteurUid)))
          .then((r) => setTelAuteur(r.docs[0]?.data().tels?.[0] ?? ""))
          .catch(() => undefined);
        const c = lireCache<Fiche[]>("annuaire");
        if (c) setFiches(c);
        else
          getDocs(collection(db, "fiches"))
            .then((r) => {
              const l = r.docs.map((y) => ficheDepuisDoc(y.id, y.data()));
              ecrireCache("annuaire", l);
              setFiches(l);
            })
            .catch(() => undefined);
        getDocs(collection(db, "prestataires"))
          .then((r) => setPresta(r.docs.map((y) => prestataireDepuisDoc(y.id, y.data()))))
          .catch(() => undefined);
      })
      .catch(() => setEtat("absente"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, actif]);

  // suggestions : membres et prestataires de l'application qui correspondent à la demande
  const suggestions = useMemo(() => {
    if (!d) return { membres: [] as Fiche[], presta: [] as Prestataire[] };
    const mots = motsCles(`${d.titre} ${d.categorie}`);
    if (mots.length === 0) return { membres: [], presta: [] };
    const hit = (t: string) => mots.some((m) => norm(t).includes(m));
    return {
      membres: fiches
        .filter((f) => f.uid !== d.auteurUid && hit(`${f.activite} ${f.competences} ${f.propose} ${f.tags.join(" ")}`))
        .slice(0, 5),
      presta: presta.filter((p) => p.statut === "valide").filter((p) => hit(`${p.metier} ${p.nom} ${p.description}`)).slice(0, 5),
    };
  }, [d, fiches, presta]);

  async function repondre(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !id || !texte.trim()) return;
    setEnvoi(true);
    setMsg("");
    try {
      await addDoc(collection(db, "demandes", id, "reponses"), {
        auteurUid: user.uid,
        auteurNom: `${profile.prenom} ${profile.nom}`.trim(),
        auteurPhoto: profile.photo ?? "",
        texte: texte.trim(),
        tel: joindre ? profile.telephone ?? "" : "",
        ...(recoOn && recoNom.trim() && recoTel.trim()
          ? { reco: { nom: recoNom.trim(), tel: recoTel.trim(), metier: recoMetier || d?.categorie || "" } }
          : {}),
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, "demandes", id), { nbReponses: increment(1) });
      setTexte("");
      setRecoOn(false);
      setRecoNom("");
      setRecoTel("");
      await chargerReponses();
      setD((x) => (x ? { ...x, nbReponses: x.nbReponses + 1 } : x));
    } catch {
      setMsg("Impossible d’envoyer votre réponse. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  const dejaRecommande = (tel: string) => presta.some((p) => cle(p.tel) === cle(tel) && cle(tel).length >= 8);

  async function ajouterAuxRecommandes(r: Reponse) {
    if (!user || !profile || !r.reco) return;
    setAjoutEnCours(r.id);
    try {
      const data = {
        nom: r.reco.nom,
        metier: r.reco.metier,
        tel: r.reco.tel,
        quartier: "",
        description: d ? `Recommandé suite à la demande « ${d.titre} »` : "",
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        nbAvis: 0,
        sommeNotes: 0,
        statut: profile.role === "admin" ? "valide" : "en_attente",
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "prestataires"), data);
      viderCache("prestataires");
      setPresta((l) => [...l, prestataireDepuisDoc(ref.id, { ...data, createdAt: Date.now() })]);
    } catch {
      setMsg("Impossible d’ajouter aux Recommandés pour le moment.");
    } finally {
      setAjoutEnCours(null);
    }
  }

  async function resoudre() {
    if (!d || !id) return;
    const statut = d.statut === "resolue" ? "ouverte" : "resolue";
    await updateDoc(doc(db, "demandes", id), { statut });
    setD({ ...d, statut });
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "demandes", id));
    router.push("/demandes");
  }

  async function supprimerReponse(rid: string) {
    if (!id) return;
    await deleteDoc(doc(db, "demandes", id, "reponses", rid));
    await updateDoc(doc(db, "demandes", id), { nbReponses: increment(-1) }).catch(() => undefined);
    await chargerReponses();
  }

  const contacts = (tel: string, texteWa: string) =>
    tel ? (
      <div className="flex gap-2">
        <a href={`tel:${tel}`} className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
          <Phone size={14} /> Appeler
        </a>
        <a
          href={`https://wa.me/${chiffres(tel)}?text=${encodeURIComponent(texteWa)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1.5 text-sm font-semibold text-ink"
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      </div>
    ) : null;

  return (
    <AppShell title="Demande" subtitle={d ? libelleType(d.type, d.categorie) : "Je cherche"}>
      <Link href="/demandes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Demandes
      </Link>
      {etat === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {etat === "absente" && <p className="card p-6 text-center text-muted">Cette annonce n’existe plus.</p>}
      {etat === "ok" && d && (
        <div className="space-y-4">
          <div className="card space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.type === "cherche" ? "bg-brand-red/10 text-brand-red" : "bg-emerald-100 text-emerald-700"}`}>
                {libelleType(d.type, d.categorie)}
              </span>
              {d.categorie && <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700">{d.categorie}</span>}
              {d.statut === "resolue" && <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-muted">Résolue</span>}
            </div>
            <p className="font-display text-xl font-bold">{d.titre}</p>
            {d.details && <p className="whitespace-pre-wrap text-[15px]">{d.details}</p>}
            <div className="flex items-center gap-3 border-t border-line pt-3">
              <Avatar prenom={d.auteurNom.split(" ")[0]} nom={d.auteurNom.split(" ").slice(1).join(" ")} size={40} photo={d.auteurPhoto} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.auteurNom}</p>
                <p className="text-xs text-muted">{ilYa(d.createdAt)}</p>
              </div>
            </div>
            {!estAuteur && contacts(telAuteur, `Salam, je te contacte au sujet de ton annonce « ${d.titre} » sur l’application RRTE.`)}
            {peutGerer && (
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <button onClick={resoudre} className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
                  <CheckCircle2 size={14} /> {d.statut === "resolue" ? "Rouvrir" : "Marquer comme résolue"}
                </button>
                {confirme ? (
                  <>
                    <button onClick={supprimer} className="rounded-full bg-brand-red px-3 py-1.5 text-sm font-semibold text-white">Confirmer la suppression</button>
                    <button onClick={() => setConfirme(false)} className="rounded-full border border-line px-3 py-1.5 text-sm">Annuler</button>
                  </>
                ) : (
                  <button onClick={() => setConfirme(true)} className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-brand-red">
                    <Trash2 size={14} /> Supprimer
                  </button>
                )}
              </div>
            )}
          </div>

          {(suggestions.membres.length > 0 || suggestions.presta.length > 0) && (
            <div className="card space-y-3 p-5">
              <h2 className="font-display text-lg font-bold">Déjà dans l’application</h2>
              {suggestions.membres.map((f) => (
                <Link key={f.id} href={`/annuaire/${f.id}`} className="flex items-center gap-3">
                  <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={40} photo={f.photo} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{nomComplet(f)}</p>
                    <p className="truncate text-xs text-muted">{f.propose || f.activite || "Membre RRTE"}</p>
                  </div>
                </Link>
              ))}
              {suggestions.presta.map((p) => (
                <Link key={p.id} href={`/prestataires/${p.id}`} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-700">★</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.nom}</p>
                    <p className="truncate text-xs text-muted">Recommandé · {p.metier}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Réponses ({reponses.length})</h2>
            {reponses.length === 0 && <p className="text-sm text-muted">Pas encore de réponse.</p>}
            {reponses.map((r) => (
              <div key={r.id} className="card space-y-2 p-4">
                <div className="flex items-center gap-3">
                  <Avatar prenom={r.auteurNom.split(" ")[0]} nom={r.auteurNom.split(" ").slice(1).join(" ")} size={36} photo={r.auteurPhoto} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.auteurNom}</p>
                    <p className="text-xs text-muted">{ilYa(r.createdAt)}</p>
                  </div>
                  {r.auteurUid !== user?.uid && (
                    <SignalerBouton cibleType="reponse" cibleId={`${id}_${r.id}`} cibleNom={`Réponse de ${r.auteurNom}`} cibleUid={r.auteurUid} libelle="" className="p-1" />
                  )}
                  {(r.auteurUid === user?.uid || profile?.role === "admin") && (
                    <button onClick={() => supprimerReponse(r.id)} aria-label="Supprimer" className="text-muted">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-[15px]">{r.texte}</p>
                {r.reco && (
                  <div className="space-y-2 rounded-xl border border-gold-500 bg-gold-100/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">Contact recommandé</p>
                    <p className="text-sm font-semibold">{r.reco.nom}{r.reco.metier ? ` · ${r.reco.metier}` : ""}</p>
                    {contacts(r.reco.tel, `Salam, on m’a donné ton contact via l’application RRTE.`)}
                    {dejaRecommande(r.reco.tel) ? (
                      <p className="text-xs font-semibold text-emerald-700">Déjà dans les Recommandés</p>
                    ) : (
                      <button
                        onClick={() => ajouterAuxRecommandes(r)}
                        disabled={ajoutEnCours === r.id}
                        className="rounded-full border border-gold-500 bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                      >
                        {ajoutEnCours === r.id ? "Ajout..." : "Ajouter aux Recommandés"}
                      </button>
                    )}
                  </div>
                )}
                {r.tel && contacts(r.tel, `Salam, je te contacte suite à ta réponse sur l’application RRTE.`)}
              </div>
            ))}
          </div>

          {d.statut === "ouverte" && (
            <form onSubmit={repondre} className="card space-y-3 p-5">
              <h2 className="font-display text-lg font-bold">{estAuteur ? "Ajouter une précision" : "Répondre"}</h2>
              <textarea
                required
                rows={3}
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                placeholder={d.type === "cherche" ? "Je connais quelqu’un, voici son contact… ou je peux vous aider." : "Ça m’intéresse, voici ce dont j’ai besoin…"}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              {profile?.telephone && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={joindre} onChange={(e) => setJoindre(e.target.checked)} />
                  Joindre mon numéro pour être contacté
                </label>
              )}
              {d.type === "cherche" && !estAuteur && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={recoOn} onChange={(e) => setRecoOn(e.target.checked)} />
                    Je recommande quelqu’un (nom + numéro)
                  </label>
                  {recoOn && (
                    <div className="space-y-2">
                      <input value={recoNom} onChange={(e) => setRecoNom(e.target.value)} placeholder="Nom de la personne ou de l’entreprise" className="w-full rounded-2xl border border-line bg-white px-4 py-3" />
                      <input type="tel" value={recoTel} onChange={(e) => setRecoTel(e.target.value)} placeholder="Numéro de téléphone" className="w-full rounded-2xl border border-line bg-white px-4 py-3" />
                      <select value={recoMetier || d.categorie} onChange={(e) => setRecoMetier(e.target.value)} className="w-full rounded-2xl border border-line bg-white px-4 py-3">
                        <option value="">Métier</option>
                        {METIERS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {msg && <p className="text-sm text-brand-red">{msg}</p>}
              <button type="submit" disabled={envoi} className="btn-gold">
                {envoi ? "Envoi..." : "Envoyer"}
              </button>
            </form>
          )}
        </div>
      )}
    </AppShell>
  );
}

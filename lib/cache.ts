/** Petit cache en mémoire : une liste déjà chargée s'affiche instantanément quand on revient sur la page. */
const mem = new Map<string, { t: number; v: unknown }>();

export function lireCache<T>(cle: string, dureeMs = 5 * 60 * 1000): T | null {
  const e = mem.get(cle);
  return e && Date.now() - e.t < dureeMs ? (e.v as T) : null;
}

export function ecrireCache(cle: string, v: unknown) {
  mem.set(cle, { t: Date.now(), v });
}

export function viderCache(prefixe = "") {
  Array.from(mem.keys()).forEach((k) => {
    if (k.startsWith(prefixe)) mem.delete(k);
  });
}

/** N'accepte que des liens http(s) ; ajoute https:// si l'utilisateur l'a oublié. */
export function nettoyerLien(brut: string): string {
  let u = brut.trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:" ? x.toString() : "";
  } catch {
    return "";
  }
}

export function plateforme(url: string): "YouTube" | "TikTok" | "Facebook" | "Instagram" | "Google Maps" | "Lien" {
  const u = url.toLowerCase();
  if (u.includes("youtu")) return "YouTube";
  if (u.includes("tiktok")) return "TikTok";
  if (u.includes("facebook") || u.includes("fb.watch") || u.includes("fb.com")) return "Facebook";
  if (u.includes("instagram")) return "Instagram";
  if (u.includes("maps.google") || u.includes("goo.gl/maps") || u.includes("maps.app.goo.gl") || u.includes("google.com/maps")) return "Google Maps";
  return "Lien";
}

/** Identifiant d'une vidéo YouTube (pour l'afficher dans la page), ou "". */
export function idYoutube(url: string): string {
  try {
    const x = new URL(url);
    let id = "";
    if (x.hostname.includes("youtu.be")) id = x.pathname.slice(1);
    else if (x.hostname.includes("youtube.com")) {
      if (x.pathname === "/watch") id = x.searchParams.get("v") ?? "";
      else {
        const m = x.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
        if (m) id = m[2];
      }
    }
    return /^[\w-]{6,15}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

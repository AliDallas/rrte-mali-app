// Fabrique un vrai fichier Excel (.xlsx, plusieurs feuilles) sans aucune bibliothèque : un .xlsx est une archive ZIP de fichiers XML.

export interface FeuilleXlsx {
  nom: string;
  colonnes: string[];
  lignes: (string | number | null | undefined)[][];
}

const enc = new TextEncoder();

function crc32(data: Uint8Array): number {
  let c: number;
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = (crc ^ data[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(fichiers: { nom: string; contenu: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff];
  const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
  const heure = 0;
  const date = ((2024 - 1980) << 9) | (1 << 5) | 1;
  for (const f of fichiers) {
    const nom = enc.encode(f.nom);
    const crc = crc32(f.contenu);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(heure), ...u16(date),
      ...u32(crc), ...u32(f.contenu.length), ...u32(f.contenu.length), ...u16(nom.length), ...u16(0),
    ]);
    parts.push(local, nom, f.contenu);
    central.push(
      new Uint8Array([
        ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(heure), ...u16(date),
        ...u32(crc), ...u32(f.contenu.length), ...u32(f.contenu.length), ...u16(nom.length), ...u16(0), ...u16(0),
        ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ]),
      nom
    );
    offset += local.length + nom.length + f.contenu.length;
  }
  const tailleCentral = central.reduce((t, p) => t + p.length, 0);
  const fin = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(fichiers.length), ...u16(fichiers.length),
    ...u32(tailleCentral), ...u32(offset), ...u16(0),
  ]);
  const total = [...parts, ...central, fin];
  const sortie = new Uint8Array(total.reduce((t, p) => t + p.length, 0));
  let pos = 0;
  for (const p of total) {
    sortie.set(p, pos);
    pos += p.length;
  }
  return sortie;
}

const echapper = (t: string) =>
  t
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function lettre(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function xmlFeuille(f: FeuilleXlsx): string {
  const nbCol = f.colonnes.length;
  const largeurs = f.colonnes.map((c, i) => {
    let max = c.length;
    for (const l of f.lignes) {
      const v = l[i];
      const len = v == null ? 0 : String(v).length;
      if (len > max) max = len;
    }
    return Math.min(60, Math.max(10, max + 2));
  });
  const cols = largeurs.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  const cell = (v: string | number | null | undefined, r: number, c: number, style: number) => {
    const ref = `${lettre(c)}${r}`;
    if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}" s="2"><v>${v}</v></c>`;
    if (v == null || v === "") return `<c r="${ref}"${style ? ` s="${style}"` : ""}/>`;
    return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t xml:space="preserve">${echapper(String(v))}</t></is></c>`;
  };
  const entete = `<row r="1">${f.colonnes.map((c, i) => cell(c, 1, i, 1)).join("")}</row>`;
  const corps = f.lignes
    .map((l, ri) => `<row r="${ri + 2}">${Array.from({ length: nbCol }, (_, ci) => cell(l[ci], ri + 2, ci, 0)).join("")}</row>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${cols}</cols><sheetData>${entete}${corps}</sheetData></worksheet>`
  );
}

const STYLES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFF6E3A8"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
  `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

/** Renvoie le contenu d'un fichier .xlsx contenant une feuille par élément. */
export function fabriquerXlsx(feuilles: FeuilleXlsx[]): Uint8Array {
  const noms = feuilles.map((f, i) => (f.nom.replace(/[\[\]:*?/\\]/g, " ").trim().slice(0, 31) || `Feuille ${i + 1}`));
  const fichiers: { nom: string; contenu: Uint8Array }[] = [];
  const ajouter = (nom: string, texte: string) => fichiers.push({ nom, contenu: enc.encode(texte) });

  ajouter(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      feuilles.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
  );
  ajouter(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  );
  ajouter(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
      noms.map((n, i) => `<sheet name="${echapper(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") +
      `</sheets></workbook>`
  );
  ajouter(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      feuilles.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
      `<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  );
  ajouter("xl/styles.xml", STYLES);
  feuilles.forEach((f, i) => ajouter(`xl/worksheets/sheet${i + 1}.xml`, xmlFeuille(f)));
  return zip(fichiers);
}

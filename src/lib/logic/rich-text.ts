/**
 * Utilitas teks berformat (HTML) untuk butir soal.
 *
 * Sanitasi sengaja dibuat berbasis string murni (tanpa DOM) supaya hasilnya
 * identik di server maupun di browser — mencegah hydration mismatch — dan
 * tetap aman walau isi soal berasal dari tempelan Word / sumber luar.
 */

const TAG_DIIZINKAN = new Set([
  "p", "div", "br", "span", "b", "strong", "i", "em", "u", "s", "strike",
  "sub", "sup", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "hr",
  "table", "thead", "tbody", "tr", "td", "th", "font",
])

const TAG_KOSONG = new Set(["br", "hr"])

const PROPERTI_CSS = new Set([
  "text-align", "margin", "padding", "margin-left", "padding-left", "text-indent", "line-height",
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-decoration", "text-decoration-line", "vertical-align",
  "border", "border-collapse", "width",
])

/** Penanda bahwa string sudah berupa HTML (bukan teks polos lama). */
const POLA_HTML = /<\/?(p|div|br|span|b|strong|i|em|u|s|strike|sub|sup|ul|ol|li|blockquote|h[1-4]|hr|table|tr|td|th|font)\b[^>]*>/i

export function adalahHtml(s: string | null | undefined): boolean {
  return !!s && POLA_HTML.test(s)
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function saringStyle(style: string): string {
  return style
    .split(";")
    .map((d) => {
      const idx = d.indexOf(":")
      if (idx < 0) return ""
      const prop = d.slice(0, idx).trim().toLowerCase()
      const val = d.slice(idx + 1).trim()
      if (!PROPERTI_CSS.has(prop) || !val) return ""
      if (/url\s*\(|expression|javascript:|[<>"'\\]/i.test(val)) return ""
      return `${prop}: ${val}`
    })
    .filter(Boolean)
    .join("; ")
}

function ambilAtribut(attrs: string, nama: string): string | null {
  const m = attrs.match(new RegExp(`\\b${nama}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))
  if (!m) return null
  return m[2] ?? m[3] ?? m[4] ?? ""
}

/** Buang semua tag/atribut di luar daftar izin. */
export function sanitasiHtml(input: string): string {
  let s = String(input || "")
  s = s.replace(/<!--[\s\S]*?-->/g, "")
  s = s.replace(/<(script|style|iframe|object|embed|noscript|template|xml|head|title|meta|link)\b[\s\S]*?<\/\1\s*>/gi, "")
  s = s.replace(/<(script|style|iframe|object|embed|meta|link)\b[^>]*>/gi, "")

  return s.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)([^>]*)>/g, (_, tutup, namaRaw, attrs) => {
    const nama = String(namaRaw).toLowerCase()
    if (!TAG_DIIZINKAN.has(nama)) return ""
    if (tutup) return TAG_KOSONG.has(nama) ? "" : `</${nama}>`

    const bagian: string[] = []
    const style = ambilAtribut(attrs, "style")
    let css = style ? saringStyle(style) : ""

    if (nama === "font") {
      // execCommand lama memakai <font color size>; ubah jadi CSS.
      const warna = ambilAtribut(attrs, "color")
      if (warna && /^#?[0-9a-z]+$/i.test(warna)) css = `color: ${warna}${css ? "; " + css : ""}`
    }
    if (css) bagian.push(`style="${css}"`)

    if (nama === "td" || nama === "th") {
      for (const a of ["colspan", "rowspan"]) {
        const v = ambilAtribut(attrs, a)
        if (v && /^\d{1,2}$/.test(v)) bagian.push(`${a}="${v}"`)
      }
    }
    const tag = nama === "font" ? "span" : nama
    return `<${tag}${bagian.length ? " " + bagian.join(" ") : ""}>`
  }).replace(/<\/font>/g, "</span>")
}

/** Ubah isi soal (HTML baru maupun teks polos lama) menjadi HTML aman. */
export function keHtmlAman(isi: string | null | undefined): string {
  if (!isi) return ""
  if (!adalahHtml(isi)) return escapeHtml(isi).replace(/\r?\n/g, "<br>")
  return sanitasiHtml(isi)
}

/** Teks polos untuk pratinjau satu baris / dialog konfirmasi. */
export function keTeksPolos(isi: string | null | undefined): string {
  if (!isi) return ""
  if (!adalahHtml(isi)) return isi
  return isi
    .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

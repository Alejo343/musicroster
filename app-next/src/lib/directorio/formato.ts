// Formato del directorio público — mismas reglas que hoy assets/js/contratar.js.
const VACIAS = /^(los|las|la|el|del|de|y|&|dj|dúo|duo|orquesta|grupo|banda|combo|conjunto|colectivo|gran)$/i;

export function iniciales(nombre: string): string {
  const palabras = nombre.split(/\s+/);
  const utiles = palabras.filter((w) => !VACIAS.test(w));
  return (utiles.length ? utiles : palabras).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const norm = (s: string) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// "Cali, Valle del Cauca" — el país solo si no es Colombia, sin repetir "Bogotá D.C."
export function lugar(t: { pais: string; region: string; ciudad: string }): string {
  const partes = [t.ciudad];
  if (t.region && norm(t.region) !== norm(t.ciudad)) partes.push(t.region);
  if (t.pais && t.pais !== "Colombia") partes.push(t.pais);
  return partes.filter(Boolean).join(", ");
}

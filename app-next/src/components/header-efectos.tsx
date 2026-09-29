"use client";

// Comportamiento del header (antes en public/assets/js/main.js). Como SiteHeader se monta en cada
// página, el efecto se vuelve a enlazar al header nuevo en cada navegación del lado del cliente.
import { useEffect } from "react";

export default function HeaderEfectos() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
    const ac = new AbortController();
    const { signal } = ac;

    const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true, signal });

    const cerrar = () => {
      document.body.classList.remove("nav-open");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.setAttribute("aria-label", "Abrir menú");
    };
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      }, { signal });
      document.querySelectorAll(".main-nav a").forEach((a) => a.addEventListener("click", cerrar, { signal }));
    }

    return () => {
      ac.abort();
      document.body.classList.remove("nav-open");
    };
  }, []);

  return null;
}

"use client";

export default function AdminMenuToggle() {
  return (
    <button
      type="button"
      className="adm-menu"
      aria-label="Abrir menú"
      aria-controls="adm-side"
      onClick={(e) => {
        const open = document.body.classList.toggle("side-open");
        e.currentTarget.setAttribute("aria-expanded", String(open));
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

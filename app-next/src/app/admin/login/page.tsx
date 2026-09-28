"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../../styles/admin.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="adm">
    <div className="login">
      <section className="login-art">
        <Link className="brand" href="/" aria-label="Billboard MusicRoster — Inicio">
          <span className="brand-bb">
            billboard<sup>®</sup>
          </span>
          <span className="brand-mr">
            MUSICROSTER<sup>®</sup>
          </span>
        </Link>
        <div>
          <p className="kicker">
            <span className="num">●</span> Panel de administración
          </p>
          <h1 className="display">
            Gestiona el <span>roster</span>
          </h1>
        </div>
        <p>Revisa, corrige, aprueba y publica los proyectos musicales registrados en Billboard MusicRoster.</p>
      </section>

      <section className="login-form">
        <div className="login-box">
          <h2>Ingresar</h2>
          <p>Acceso solo para el equipo de MusicRoster.</p>
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setEnviando(true);
              const form = new FormData(e.currentTarget);
              const res = await fetch("/api/auth/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
              });
              setEnviando(false);
              if (!res.ok) {
                setError("Correo o contraseña incorrectos.");
                return;
              }
              router.push("/admin");
              router.refresh();
            }}
          >
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input type="email" id="email" name="email" required autoComplete="username" />
            </div>
            <div className="field">
              <label htmlFor="pass">Contraseña</label>
              <input type="password" id="pass" name="password" required autoComplete="current-password" />
            </div>
            {error && <p className="err" style={{ display: "block" }}>{error}</p>}
            <button type="submit" className="btn btn-cta" disabled={enviando}>
              {enviando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
          <div className="login-note">
            <span>Cada consulta a datos privados, como los documentos de identidad, queda registrada con tu nombre.</span>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}

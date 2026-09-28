import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/">
              <span className="brand-bb">
                billboard<sup>®</sup>
              </span>
              <span className="brand-mr">
                MUSICROSTER<sup>®</sup>
              </span>
            </Link>
            <p>El directorio que registra e identifica proyectos musicales para conectarlos con las oportunidades de la industria.</p>
          </div>
          <div>
            <h4>MusicRoster</h4>
            <ul>
              <li>
                <Link href="/registro">Regístrate</Link>
              </li>
              <li>
                <Link href="/buscar">Buscar artistas</Link>
              </li>
              <li>
                <Link href="/contratar">Para quienes contratan</Link>
              </li>
              <li>
                <Link href="/#como-funciona">Cómo funciona</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Información</h4>
            <ul>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/reglamento">Reglamento</Link>
              </li>
              <li>
                <Link href="/politica-datos">Política de datos</Link>
              </li>
              <li>
                <Link href="/bmic">BMIC</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © <span id="year">{new Date().getFullYear()}</span> Billboard® MusicRoster®
          </span>
          <span>
            <b>Registro gratuito.</b> Nadie debe cobrarte por registrarte.
          </span>
        </div>
      </div>
    </footer>
  );
}

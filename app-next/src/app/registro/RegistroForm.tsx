"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registroSchema,
  identidadDe,
  type RegistroInput,
} from "@/lib/schemas/registro";
import { validarFoto } from "@/lib/validarFoto";
import {
  TIPOS_PROYECTO,
  TIPOS_DOCUMENTO,
  ROLES_INTEGRANTE,
  PLATAFORMAS_MUSICA,
  PLATAFORMAS_REDES,
  RANGOS_CONTRATACION,
  QUIEN_REGISTRA,
  GENEROS,
  OTROS_GENEROS,
  PAISES,
  REGIONES,
  MUNICIPIOS_CO,
} from "@/lib/catalogos";

type Paso = { titulo: string; campos: (keyof RegistroInput)[] };

const PASOS: Paso[] = [
  { titulo: "Proyecto", campos: ["tipo", "otroDescripcion", "otroComposicion", "nombreProyecto"] },
  { titulo: "Géneros", campos: ["generoPrincipal", "otrosGeneros", "otroGenero"] },
  { titulo: "Territorio", campos: ["nacionalidad", "paisResidencia", "regionResidencia", "ciudadActual", "paisOrigen", "regionOrigen", "ciudadOrigen"] },
  { titulo: "Identidad", campos: ["nombreCompleto", "tipoDocumento", "numeroDocumento", "paisExpedicion", "miembros", "liderIndex"] },
  { titulo: "Música", campos: ["plataformaMusical", "enlaceMusical", "otrosEnlaces", "redSocialTipo", "redSocial", "otrasRedes"] },
  { titulo: "Contratación", campos: ["rangoContratacion", "contactoNombre", "contactoWhatsapp", "contactoEmail"] },
  { titulo: "Confirmación", campos: ["quienRegistra", "registranteNombre", "registranteEmail", "registranteWhatsapp", "declInfo", "declAutorizado", "declIntegrantes", "declMayoria", "declDatos", "declReglamento"] },
];

const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const buscarClave = (obj: Record<string, unknown>, clave: string) =>
  Object.keys(obj).find((k) => norm(k) === norm(clave));

const valoresIniciales: RegistroInput = {
  tipo: undefined as unknown as RegistroInput["tipo"],
  otroDescripcion: "",
  otroComposicion: undefined,
  nombreProyecto: "",
  generoPrincipal: "",
  otrosGeneros: [],
  otroGenero: "",
  nacionalidad: "Colombia",
  paisResidencia: "Colombia",
  regionResidencia: "",
  ciudadActual: "",
  paisOrigen: "Colombia",
  regionOrigen: "",
  ciudadOrigen: "",
  nombreCompleto: "",
  tipoDocumento: undefined,
  numeroDocumento: "",
  paisExpedicion: "Colombia",
  miembros: [],
  liderIndex: undefined,
  plataformaMusical: "spotify",
  enlaceMusical: "",
  otrosEnlaces: [],
  redSocialTipo: "instagram",
  redSocial: "",
  otrasRedes: [],
  rangoContratacion: "",
  contactoNombre: "",
  contactoWhatsapp: "",
  contactoEmail: "",
  quienRegistra: undefined as unknown as RegistroInput["quienRegistra"],
  registranteNombre: "",
  registranteEmail: "",
  registranteWhatsapp: "",
  declInfo: false as unknown as true,
  declAutorizado: false as unknown as true,
  declIntegrantes: false,
  declMayoria: false as unknown as true,
  declDatos: false as unknown as true,
  declReglamento: false as unknown as true,
};

export default function RegistroForm() {
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema) as unknown as Resolver<RegistroInput>,
    defaultValues: valoresIniciales,
    mode: "onSubmit",
  });

  const miembros = useFieldArray({ control, name: "miembros" });
  const otrosEnlaces = useFieldArray({ control, name: "otrosEnlaces" });
  const otrasRedes = useFieldArray({ control, name: "otrasRedes" });

  // Todos los useWatch se llaman siempre, sin condicionales ni loops (reglas de los hooks):
  // los pasos que no se muestran simplemente no leen estos valores.
  const tipo = useWatch({ control, name: "tipo" });
  const otroComposicion = useWatch({ control, name: "otroComposicion" });
  const quienRegistra = useWatch({ control, name: "quienRegistra" });
  const generoPrincipal = useWatch({ control, name: "generoPrincipal" });
  const otrosGenerosSel = useWatch({ control, name: "otrosGeneros" }) ?? [];
  const liderIndex = useWatch({ control, name: "liderIndex" });
  const paisResidencia = useWatch({ control, name: "paisResidencia" }) ?? "";
  const regionResidencia = useWatch({ control, name: "regionResidencia" }) ?? "";
  const paisOrigen = useWatch({ control, name: "paisOrigen" }) ?? "";
  const regionOrigen = useWatch({ control, name: "regionOrigen" }) ?? "";
  const miembrosValores = useWatch({ control, name: "miembros" }) ?? [];

  const identidad = identidadDe(tipo, otroComposicion);
  const terceros = identidad === "colectivo" || (quienRegistra && quienRegistra !== "artista");

  const [paso, setPaso] = useState(0);
  const [foto, setFoto] = useState<File | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [referencia, setReferencia] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Una agrupación necesita al menos 2 integrantes (igual que hoy applyConditions()).
  const esColectivo = identidad === "colectivo";
  useEffect(() => {
    if (esColectivo && miembros.fields.length === 0) {
      miembros.append({ nombre: "", tipoDocumento: "CC", numeroDocumento: "", paisExpedicion: "Colombia", rol: "voz", rolOtro: "" });
      miembros.append({ nombre: "", tipoDocumento: "CC", numeroDocumento: "", paisExpedicion: "Colombia", rol: "voz", rolOtro: "" });
    }
    // Si se deja de ser colectivo, no deben quedar integrantes huérfanos.
    if (!esColectivo && miembros.fields.length > 0) {
      miembros.replace([]);
      setValue("liderIndex", undefined);
    }
    // Si el líder señalado ya no existe (se quitó un integrante), se limpia.
    if (liderIndex != null && liderIndex >= miembros.fields.length) {
      setValue("liderIndex", undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esColectivo, miembros.fields.length]);

  const irA = async (destino: number) => {
    if (destino > paso) {
      const ok = await trigger(PASOS[paso].campos);
      if (!ok) return;
      if (paso === 4 && !foto) {
        setErrorFoto(validarFoto(null));
        return;
      }
    }
    setPaso(destino);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onFoto = (archivo: File | null) => {
    setFoto(archivo);
    setErrorFoto(archivo ? validarFoto(archivo) : null);
  };

  const onSubmit = async (datos: RegistroInput) => {
    const problemaFoto = validarFoto(foto);
    if (problemaFoto) {
      setErrorFoto(problemaFoto);
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const formData = new FormData();
      formData.set("datos", JSON.stringify(datos));
      formData.set("foto", foto as File);
      const res = await fetch("/api/registro", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErrorEnvio("No pudimos enviar tu registro. Revisa los datos e inténtalo de nuevo.");
        return;
      }
      setReferencia(json.id);
    } catch {
      setErrorEnvio("No pudimos enviar tu registro. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (referencia) {
    return (
      <section className="reg-form confirm" aria-live="polite">
        <div className="confirm-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" strokeWidth={3}>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <span className="step-eyebrow">Registro completado</span>
        <h2>Tu proyecto ha sido registrado en Billboard MusicRoster</h2>
        <div className="project-name">{getValues("nombreProyecto")}</div>
        <p>Hemos recibido correctamente tu información.</p>
        <div className="code">
          Número de registro: <b>{referencia}</b>
        </div>
        <p>Tu número de documento no se mostrará públicamente.</p>
        <div className="confirm-ctas">
          <Link className="btn btn-ghost btn-lg" href="/">
            Volver a MusicRoster
          </Link>
        </div>
      </section>
    );
  }

  const ultimo = paso === PASOS.length - 1;

  return (
    <div className="wrap reg-layout">
      <aside className="reg-aside" aria-label="Progreso del registro">
        <div className="reg-progress">
          <i style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }} />
        </div>
        <ol className="reg-steps">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className={i === paso ? "current" : i < paso ? "done" : undefined}>
              <button type="button" onClick={() => irA(i)} disabled={i > paso}>
                <span className="n">{i + 1}</span>
                <span className="label">{p.titulo}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="reg-aside-note">
          <strong>Registro gratuito</strong>
          Si alguien te solicita dinero afirmando que debes pagar para registrarte en Billboard MusicRoster, no está autorizado para hacerlo.
        </div>
      </aside>

      <div>
        <form className="reg-form" ref={formRef} onSubmit={handleSubmit(onSubmit)} noValidate>
          {paso === 0 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 1 · Proyecto</span>
                <h2>¿Qué tipo de proyecto musical vas a registrar?</h2>
              </legend>
              <p className="step-help">El cuestionario se adapta según tu respuesta.</p>

              <div className="choice-group">
                <div className="choice-grid cols-3">
                  {(Object.entries(TIPOS_PROYECTO) as [RegistroInput["tipo"], string][]).map(([valor, etiqueta]) => (
                    <label className="choice" key={valor}>
                      <input type="radio" value={valor} {...register("tipo")} />
                      <span className="card">
                        <strong>{etiqueta}</strong>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.tipo && <p className="err" style={{ display: "block" }}>{errors.tipo.message}</p>}
              </div>

              {tipo === "otro" && (
                <div className="cond">
                  <div className="field-grid" style={{ marginTop: 24 }}>
                    <div className="field full">
                      <label>¿Qué tipo de proyecto es?</label>
                      <input type="text" {...register("otroDescripcion")} placeholder="Ej.: colectivo de música tradicional, proyecto audiovisual-musical…" />
                      {errors.otroDescripcion && <span className="err" style={{ display: "block" }}>{errors.otroDescripcion.message}</span>}
                    </div>
                  </div>
                  <div className="choice-group" style={{ marginTop: 18 }}>
                    <p className="field" style={{ margin: "0 0 8px" }}>
                      <span className="label">¿Cuántas personas conforman la identidad oficial del proyecto?</span>
                    </p>
                    <div className="choice-grid cols-2">
                      <label className="choice compact">
                        <input type="radio" value="individual" {...register("otroComposicion")} />
                        <span className="card"><strong>Una persona</strong></span>
                      </label>
                      <label className="choice compact">
                        <input type="radio" value="colectivo" {...register("otroComposicion")} />
                        <span className="card"><strong>Varias personas</strong></span>
                      </label>
                    </div>
                    {errors.otroComposicion && <p className="err" style={{ display: "block" }}>{errors.otroComposicion.message}</p>}
                  </div>
                </div>
              )}

              <h3 className="subhead">Nombre</h3>
              <div className="field-grid">
                <div className="field full">
                  <label>¿Cuál es el nombre artístico del proyecto?</label>
                  <input type="text" autoComplete="off" placeholder="Nombre artístico / nombre de la agrupación" {...register("nombreProyecto")} />
                  {errors.nombreProyecto && <span className="err" style={{ display: "block" }}>{errors.nombreProyecto.message}</span>}
                </div>
              </div>
            </fieldset>
          )}

          {paso === 1 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 2 · Géneros</span>
                <h2>Tu sonido</h2>
              </legend>
              <p className="step-help">Un proyecto puede tener un género principal y varios géneros asociados.</p>
              <div className="field-grid">
                <div className="field full">
                  <label>¿Cuál es el género musical principal de tu proyecto?</label>
                  <select {...register("generoPrincipal")}>
                    <option value="">Selecciona un género</option>
                    {GENEROS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.generoPrincipal && <span className="err" style={{ display: "block" }}>{errors.generoPrincipal.message}</span>}
                </div>
                <div className="field full">
                  <span className="label">
                    ¿Tu proyecto se identifica también con otros géneros? <span className="opt">(puedes seleccionar varios · máximo 4)</span>
                  </span>
                  <div className="tag-choices">
                    {OTROS_GENEROS.map((g) => {
                      const marcado = otrosGenerosSel.includes(g);
                      const deshabilitado = (g === generoPrincipal && g !== "Otro") || (!marcado && otrosGenerosSel.length >= 4);
                      return (
                        <label key={g}>
                          <input
                            type="checkbox"
                            value={g}
                            disabled={deshabilitado}
                            checked={marcado}
                            onChange={(e) => {
                              const actual = getValues("otrosGeneros") ?? [];
                              setValue("otrosGeneros", e.target.checked ? [...actual, g] : actual.filter((x) => x !== g));
                            }}
                          />
                          <span>{g}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {otrosGenerosSel.includes("Otro") && (
                  <div className="field full cond">
                    <label>¿Qué otro género?</label>
                    <input type="text" {...register("otroGenero")} />
                    {errors.otroGenero && <span className="err" style={{ display: "block" }}>{errors.otroGenero.message}</span>}
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {paso === 2 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 3 · Identidad y territorio</span>
                <h2>¿De dónde es tu proyecto?</h2>
              </legend>
              <p className="step-help">Así te encontrarán quienes buscan artistas por territorio.</p>
              <div className="field-grid">
                <div className="field full">
                  <label>¿Cuál es la nacionalidad del artista o proyecto?</label>
                  <input type="text" list="paises" autoComplete="off" {...register("nacionalidad")} />
                  {errors.nacionalidad && <span className="err" style={{ display: "block" }}>{errors.nacionalidad.message}</span>}
                </div>
              </div>

              <h3 className="subhead">Residencia actual</h3>
              <CampoTerritorio
                prefijo="Residencia"
                pais={paisResidencia}
                region={regionResidencia}
                registerPais={register("paisResidencia")}
                registerRegion={register("regionResidencia")}
                registerCiudad={register("ciudadActual")}
                labelPais="¿En qué país reside actualmente?"
                labelRegion="¿En qué departamento, estado o región?"
                labelCiudad="¿En qué ciudad o municipio reside actualmente?"
                erroresPais={errors.paisResidencia?.message}
                erroresRegion={errors.regionResidencia?.message}
                erroresCiudad={errors.ciudadActual?.message}
              />

              <h3 className="subhead">Origen del proyecto</h3>
              <p className="step-help">¿Dónde nació o se originó el proyecto musical? Puede ser distinto de la residencia actual.</p>
              <CampoTerritorio
                prefijo="Origen"
                pais={paisOrigen}
                region={regionOrigen}
                registerPais={register("paisOrigen")}
                registerRegion={register("regionOrigen")}
                registerCiudad={register("ciudadOrigen")}
                labelPais="País"
                labelRegion="Departamento / región"
                labelCiudad="Ciudad / municipio"
                erroresPais={errors.paisOrigen?.message}
                erroresRegion={errors.regionOrigen?.message}
                erroresCiudad={errors.ciudadOrigen?.message}
              />
            </fieldset>
          )}

          {paso === 3 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 4 · Identificación</span>
                <h2>{identidad === "colectivo" ? "Miembros oficiales" : "Identidad del artista"}</h2>
              </legend>

              {identidad === "individual" && (
                <div className="cond">
                  <p className="step-help">Estos datos identifican a la persona titular del proyecto, que debe ser mayor de 18 años.</p>
                  <div className="field-grid">
                    <div className="field full">
                      <label>Nombre completo del artista</label>
                      <input type="text" autoComplete="name" {...register("nombreCompleto")} />
                      {errors.nombreCompleto && <span className="err" style={{ display: "block" }}>{errors.nombreCompleto.message}</span>}
                    </div>
                    <div className="field">
                      <label>Tipo de documento</label>
                      <select {...register("tipoDocumento")}>
                        <option value="">Selecciona</option>
                        {Object.entries(TIPOS_DOCUMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      {errors.tipoDocumento && <span className="err" style={{ display: "block" }}>{errors.tipoDocumento.message}</span>}
                    </div>
                    <div className="field">
                      <label>Número de documento</label>
                      <input type="text" {...register("numeroDocumento")} />
                      {errors.numeroDocumento && <span className="err" style={{ display: "block" }}>{errors.numeroDocumento.message}</span>}
                    </div>
                    <div className="field full">
                      <label>País de expedición</label>
                      <input type="text" list="paises" autoComplete="off" {...register("paisExpedicion")} />
                      {errors.paisExpedicion && <span className="err" style={{ display: "block" }}>{errors.paisExpedicion.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {identidad === "colectivo" && (
                <div className="cond">
                  <p className="step-help">
                    ¿Quiénes son los miembros oficiales del proyecto? Incluye únicamente a quienes forman parte de la identidad artística de la
                    agrupación. Todos deben ser mayores de 18 años.
                  </p>
                  <div className="members">
                    {miembros.fields.map((campo, i) => {
                      const rol = miembrosValores[i]?.rol;
                      const errM = errors.miembros?.[i];
                      return (
                        <div className="member" key={campo.id}>
                          <div className="member-head">
                            <strong>Integrante {i + 1}</strong>
                            {miembros.fields.length > 2 && (
                              <button type="button" className="btn-remove" onClick={() => miembros.remove(i)}>Quitar</button>
                            )}
                          </div>
                          <div className="field-grid">
                            <div className="field full">
                              <label>Nombre completo</label>
                              <input type="text" {...register(`miembros.${i}.nombre` as const)} />
                              {errM?.nombre && <span className="err" style={{ display: "block" }}>{errM.nombre.message}</span>}
                            </div>
                            <div className="field">
                              <label>Tipo de documento</label>
                              <select {...register(`miembros.${i}.tipoDocumento` as const)}>
                                {Object.entries(TIPOS_DOCUMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                            <div className="field">
                              <label>Número de documento</label>
                              <input type="text" {...register(`miembros.${i}.numeroDocumento` as const)} />
                              {errM?.numeroDocumento && <span className="err" style={{ display: "block" }}>{errM.numeroDocumento.message}</span>}
                            </div>
                            <div className="field">
                              <label>País de expedición</label>
                              <input type="text" list="paises" autoComplete="off" {...register(`miembros.${i}.paisExpedicion` as const)} />
                            </div>
                            <div className="field">
                              <label>Rol dentro del proyecto</label>
                              <select {...register(`miembros.${i}.rol` as const)}>
                                {Object.entries(ROLES_INTEGRANTE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                            {rol === "otro" && (
                              <div className="field full">
                                <label>¿Cuál rol?</label>
                                <input type="text" {...register(`miembros.${i}.rolOtro` as const)} />
                                {errM?.rolOtro && <span className="err" style={{ display: "block" }}>{errM.rolOtro.message}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => miembros.append({ nombre: "", tipoDocumento: "CC", numeroDocumento: "", paisExpedicion: "Colombia", rol: "voz", rolOtro: "" })}
                  >
                    Agregar integrante
                  </button>
                  {typeof errors.miembros?.message === "string" && <p className="err" style={{ display: "block" }}>{errors.miembros.message}</p>}

                  <div className="notice">
                    <span><strong>Aclaración:</strong> no incluyas músicos acompañantes, contratados o de sesión que no formen parte oficialmente del proyecto.</span>
                  </div>

                  <h3 className="subhead">Líder o director</h3>
                  <div className="field-grid">
                    <div className="field full">
                      <label>¿Quién es el líder o director del proyecto?</label>
                      <select
                        value={liderIndex ?? ""}
                        onChange={(e) => setValue("liderIndex", e.target.value === "" ? undefined : Number(e.target.value))}
                      >
                        <option value="">Selecciona un integrante</option>
                        {miembros.fields.map((campo, i) => {
                          const nombre = getValues(`miembros.${i}.nombre`);
                          return <option key={campo.id} value={i}>{nombre?.trim() || `Integrante ${i + 1}`}</option>;
                        })}
                      </select>
                      {errors.liderIndex && <span className="err" style={{ display: "block" }}>{errors.liderIndex.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="notice dark">
                <span>
                  <strong>El nombre completo aparecerá en el perfil público.</strong> El número de documento no será público: identifica a la persona y
                  permite prevenir duplicidades y suplantaciones.
                </span>
              </div>
            </fieldset>
          )}

          {paso === 4 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 5 · Presencia musical</span>
                <h2>Dónde suena tu proyecto</h2>
              </legend>
              <p className="step-help">Comparte el enlace donde mejor se escucha tu música y tu red social principal.</p>
              <div className="field-grid">
                <div className="field full">
                  <label>¿Cuál es el principal enlace para escuchar tu música?</label>
                  <div className="input-combo">
                    <select aria-label="Plataforma musical" {...register("plataformaMusical")}>
                      {PLATAFORMAS_MUSICA.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="url" placeholder="https://" {...register("enlaceMusical")} />
                  </div>
                  {errors.enlaceMusical && <span className="err" style={{ display: "block" }}>{errors.enlaceMusical.message}</span>}
                </div>

                <ListaEnlaces titulo="¿Tienes otros enlaces musicales?" opciones={PLATAFORMAS_MUSICA} campos={otrosEnlaces} register={register} nombreBase="otrosEnlaces" />

                <div className="field full">
                  <label>¿Cuál es la principal red social del proyecto?</label>
                  <div className="input-combo">
                    <select aria-label="Red social" {...register("redSocialTipo")}>
                      {PLATAFORMAS_REDES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="text" placeholder="@usuario o enlace" {...register("redSocial")} />
                  </div>
                  {errors.redSocial && <span className="err" style={{ display: "block" }}>{errors.redSocial.message}</span>}
                </div>

                <ListaEnlaces titulo="Otras redes sociales" opciones={PLATAFORMAS_REDES} campos={otrasRedes} register={register} nombreBase="otrasRedes" />
              </div>

              <h3 className="subhead">Imagen</h3>
              <div className="field-grid">
                <div className="field full">
                  <span className="label">Sube una fotografía oficial del proyecto</span>
                  <span className="hint">La imagen será utilizada para identificar visualmente tu proyecto dentro de MusicRoster.</span>
                  <label className="photo-drop">
                    <span className="preview" style={foto ? { backgroundImage: `url(${URL.createObjectURL(foto)})`, backgroundSize: "cover" } : undefined} />
                    <span>
                      <strong>{foto ? foto.name : "Sube o arrastra una imagen"}</strong>
                      <small>Buena resolución, sin marcas de agua y correspondiente al proyecto registrado · JPG, PNG o WEBP · máximo 5 MB.</small>
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFoto(e.target.files?.[0] ?? null)} />
                  </label>
                  {errorFoto && <span className="err" style={{ display: "block" }}>{errorFoto}</span>}
                </div>
              </div>
            </fieldset>
          )}

          {paso === 5 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 6 · Contratación</span>
                <h2>Contratación</h2>
              </legend>
              <p className="step-help">
                ¿Cuál es aproximadamente el valor de contratación de tu proyecto para una presentación en vivo? <em>(Pesos colombianos)</em>
              </p>
              <div className="choice-group">
                <div className="choice-grid cols-3">
                  {RANGOS_CONTRATACION.map(([v, l]) => (
                    <label className="choice compact" key={v}>
                      <input type="radio" value={v} {...register("rangoContratacion")} />
                      <span className="card"><strong>{l}</strong></span>
                    </label>
                  ))}
                </div>
                {errors.rangoContratacion && <p className="err" style={{ display: "block" }}>{errors.rangoContratacion.message}</p>}
              </div>
              <div className="notice">
                <span>Este rango se mostrará en tu perfil público. Es referencial y puede variar según ciudad, país, fecha, formato, producción y características del evento.</span>
              </div>

              <h3 className="subhead">Contacto para contratación</h3>
              <div className="field-grid">
                <div className="field full">
                  <label>¿Quién es el contacto para oportunidades y contratación?</label>
                  <input type="text" autoComplete="name" placeholder="Nombre" {...register("contactoNombre")} />
                  {errors.contactoNombre && <span className="err" style={{ display: "block" }}>{errors.contactoNombre.message}</span>}
                </div>
                <div className="field">
                  <label>WhatsApp de contacto <span className="opt">(con código de país)</span></label>
                  <input type="tel" placeholder="+57 300 000 0000" autoComplete="tel" {...register("contactoWhatsapp")} />
                  {errors.contactoWhatsapp && <span className="err" style={{ display: "block" }}>{errors.contactoWhatsapp.message}</span>}
                </div>
                <div className="field">
                  <label>Correo electrónico de contacto</label>
                  <input type="email" placeholder="contacto@tuproyecto.com" autoComplete="email" {...register("contactoEmail")} />
                  {errors.contactoEmail && <span className="err" style={{ display: "block" }}>{errors.contactoEmail.message}</span>}
                </div>
              </div>
              <div className="notice">
                <span><strong>Estos datos serán públicos</strong> para que puedan contactarte. Te recomendamos usar un número y un correo de uso profesional.</span>
              </div>
            </fieldset>
          )}

          {paso === 6 && (
            <fieldset className="reg-step">
              <legend>
                <span className="step-eyebrow">Paso 7 · Confirmación</span>
                <h2>¿Quién está realizando este registro?</h2>
              </legend>
              <p className="step-help">Puede hacerlo el artista o alguien de su equipo autorizado.</p>
              <div className="choice-group">
                <div className="choice-grid cols-3">
                  {Object.entries(QUIEN_REGISTRA).map(([v, l]) => (
                    <label className="choice compact" key={v}>
                      <input type="radio" value={v} {...register("quienRegistra")} />
                      <span className="card"><strong>{l}</strong></span>
                    </label>
                  ))}
                </div>
                {errors.quienRegistra && <p className="err" style={{ display: "block" }}>{errors.quienRegistra.message}</p>}
              </div>

              {quienRegistra && quienRegistra !== "artista" && (
                <div className="cond">
                  <h3 className="subhead">Tus datos</h3>
                  <div className="field-grid">
                    <div className="field full">
                      <label>Nombre completo de quien diligencia</label>
                      <input type="text" autoComplete="name" {...register("registranteNombre")} />
                      {errors.registranteNombre && <span className="err" style={{ display: "block" }}>{errors.registranteNombre.message}</span>}
                    </div>
                    <div className="field">
                      <label>Correo electrónico</label>
                      <input type="email" autoComplete="email" {...register("registranteEmail")} />
                      {errors.registranteEmail && <span className="err" style={{ display: "block" }}>{errors.registranteEmail.message}</span>}
                    </div>
                    <div className="field">
                      <label>WhatsApp</label>
                      <input type="tel" placeholder="+57 300 000 0000" autoComplete="tel" {...register("registranteWhatsapp")} />
                      {errors.registranteWhatsapp && <span className="err" style={{ display: "block" }}>{errors.registranteWhatsapp.message}</span>}
                    </div>
                  </div>
                  <div className="notice">
                    <span><strong>Importante:</strong> aunque el formulario sea diligenciado por un tercero, los datos de identificación anteriores deben corresponder al artista o a los miembros oficiales del proyecto.</span>
                  </div>
                </div>
              )}

              <h3 className="subhead">Declaraciones y autorizaciones</h3>
              <div className="checks">
                <label className="check">
                  <input type="checkbox" {...register("declInfo")} />
                  <span>Declaro que la información suministrada es verdadera y corresponde al proyecto musical registrado.</span>
                </label>
                <label className="check">
                  <input type="checkbox" {...register("declAutorizado")} />
                  <span>Declaro que soy el artista, un miembro del proyecto o una persona autorizada para realizar este registro.</span>
                </label>
                {terceros && (
                  <label className="check cond">
                    <input type="checkbox" {...register("declIntegrantes")} />
                    <span>Cuando suministro información correspondiente a otras personas, declaro contar con su autorización para hacerlo y que conocen qué datos serán públicos.</span>
                  </label>
                )}
                <label className="check">
                  <input type="checkbox" {...register("declMayoria")} />
                  <span>Declaro que el artista o todos los miembros oficiales del proyecto, así como quien diligencia este registro, son mayores de 18 años.</span>
                </label>
                <label className="check">
                  <input type="checkbox" {...register("declDatos")} />
                  <span>Autorizo el tratamiento de los datos personales, incluida la publicación de los datos del perfil, conforme a la Política de Tratamiento de Datos Personales de Billboard MusicRoster.</span>
                </label>
                <label className="check">
                  <input type="checkbox" {...register("declReglamento")} />
                  <span>Declaro haber leído y aceptado el Reglamento de Billboard MusicRoster.</span>
                </label>
              </div>
              {(errors.declInfo || errors.declAutorizado || errors.declIntegrantes || errors.declMayoria || errors.declDatos || errors.declReglamento) && (
                <p className="err" style={{ display: "block", color: "#d42a20", fontWeight: 600, fontSize: 13, marginTop: 12 }}>
                  Debes aceptar todas las declaraciones para continuar.
                </p>
              )}
              <div className="doc-links">
                <a href="/reglamento" target="_blank" rel="noopener">Ver reglamento</a>
                <a href="/politica-datos" target="_blank" rel="noopener">Ver política de datos</a>
              </div>
              {errorEnvio && <p className="err" style={{ display: "block" }}>{errorEnvio}</p>}
            </fieldset>
          )}

          <div className="reg-nav">
            {paso > 0 && (
              <button type="button" className="btn btn-back" onClick={() => irA(paso - 1)}>← Atrás</button>
            )}
            <span className="spacer" />
            {!ultimo && (
              <button type="button" className="btn btn-next" onClick={() => irA(paso + 1)}>Continuar →</button>
            )}
            {ultimo && (
              <div className="btn-submit-wrap">
                <button type="submit" className="btn btn-cta btn-lg" disabled={isSubmitting || enviando}>
                  {enviando ? "Enviando…" : "Registrar mi proyecto"}
                </button>
                <small><b>100% gratuito.</b> Nadie debe cobrarte por registrarte.</small>
              </div>
            )}
          </div>
        </form>
      </div>

      <datalist id="paises">
        {PAISES.map((p) => <option key={p} value={p} />)}
      </datalist>
    </div>
  );
}

// ---------- Territorio: país -> región (datalist) -> ciudad (datalist, DIVIPOLA si es Colombia) ----------
function CampoTerritorio(props: {
  prefijo: string;
  pais: string;
  region: string;
  registerPais: ReturnType<ReturnType<typeof useForm<RegistroInput>>["register"]>;
  registerRegion: ReturnType<ReturnType<typeof useForm<RegistroInput>>["register"]>;
  registerCiudad: ReturnType<ReturnType<typeof useForm<RegistroInput>>["register"]>;
  labelPais: string;
  labelRegion: string;
  labelCiudad: string;
  erroresPais?: string;
  erroresRegion?: string;
  erroresCiudad?: string;
}) {
  const { prefijo, pais, region, registerPais, registerRegion, registerCiudad, labelPais, labelRegion, labelCiudad, erroresPais, erroresRegion, erroresCiudad } = props;
  const idRegiones = `regiones-${prefijo}`;
  const idCiudades = `ciudades-${prefijo}`;

  const regiones = useMemo(() => {
    const clave = buscarClave(REGIONES, pais);
    return clave ? REGIONES[clave] : [];
  }, [pais]);

  const ciudades = useMemo(() => {
    if (norm(pais) !== "colombia") return [];
    const propios = buscarClave(MUNICIPIOS_CO, region);
    if (propios) return MUNICIPIOS_CO[propios].map(([, nombre]) => nombre);
    // Sin departamento elegido se sugieren todos los municipios de Colombia (varios
    // departamentos repiten nombre de municipio, p. ej. "La Unión": se deduplica para el datalist).
    return [...new Set(Object.values(MUNICIPIOS_CO).flat().map(([, nombre]) => nombre))];
  }, [pais, region]);

  return (
    <div className="field-grid">
      <div className="field">
        <label>{labelPais}</label>
        <input type="text" list="paises" autoComplete="off" {...registerPais} />
        {erroresPais && <span className="err" style={{ display: "block" }}>{erroresPais}</span>}
      </div>
      <div className="field">
        <label>{labelRegion}</label>
        <input type="text" list={idRegiones} autoComplete="off" {...registerRegion} />
        <datalist id={idRegiones}>
          {regiones.map((r) => <option key={r} value={r} />)}
        </datalist>
        {erroresRegion && <span className="err" style={{ display: "block" }}>{erroresRegion}</span>}
      </div>
      <div className="field full">
        <label>{labelCiudad}</label>
        <input type="text" list={idCiudades} autoComplete="off" {...registerCiudad} />
        <datalist id={idCiudades}>
          {ciudades.map((c) => <option key={c} value={c} />)}
        </datalist>
        {erroresCiudad && <span className="err" style={{ display: "block" }}>{erroresCiudad}</span>}
      </div>
    </div>
  );
}

// ---------- Filas repetibles de enlaces (musicales u otras redes), opcionales ----------
function ListaEnlaces(props: {
  titulo: string;
  opciones: readonly (readonly [string, string])[];
  campos: ReturnType<typeof useFieldArray<RegistroInput, "otrosEnlaces" | "otrasRedes">>;
  register: ReturnType<typeof useForm<RegistroInput>>["register"];
  nombreBase: "otrosEnlaces" | "otrasRedes";
}) {
  const { titulo, opciones, campos, register, nombreBase } = props;
  return (
    <div className="field full">
      <span className="label">{titulo} <span className="opt">(opcional)</span></span>
      <div className="link-rows">
        {campos.fields.map((campo, i) => (
          <div className="link-row" key={campo.id}>
            <select {...register(`${nombreBase}.${i}.plataforma` as const)}>
              {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input type="text" placeholder="https:// o @usuario" {...register(`${nombreBase}.${i}.url` as const)} />
            <button type="button" className="btn-remove" onClick={() => campos.remove(i)}>Quitar</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-add" onClick={() => campos.append({ plataforma: opciones[0][0], url: "" })}>
        Agregar enlace
      </button>
    </div>
  );
}

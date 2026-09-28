-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('pendiente', 'correccion', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoProyecto" AS ENUM ('solista', 'agrupacion', 'duo', 'orquesta', 'dj', 'otro');

-- CreateEnum
CREATE TYPE "Identidad" AS ENUM ('individual', 'colectivo');

-- CreateEnum
CREATE TYPE "RolAdmin" AS ENUM ('moderador', 'admin');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'pendiente',
    "motivo" TEXT,
    "tipo" "TipoProyecto" NOT NULL,
    "otroDescripcion" TEXT,
    "otroComposicion" "Identidad",
    "identidad" "Identidad" NOT NULL,
    "nombreProyecto" TEXT NOT NULL,
    "generoPrincipal" TEXT NOT NULL,
    "otrosGeneros" TEXT[],
    "otroGenero" TEXT,
    "nacionalidad" TEXT NOT NULL,
    "paisResidencia" TEXT NOT NULL,
    "regionResidencia" TEXT NOT NULL,
    "ciudadActual" TEXT NOT NULL,
    "paisOrigen" TEXT NOT NULL,
    "regionOrigen" TEXT NOT NULL,
    "ciudadOrigen" TEXT NOT NULL,
    "nombreCompleto" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "paisExpedicion" TEXT,
    "plataformaMusical" TEXT NOT NULL,
    "enlaceMusical" TEXT NOT NULL,
    "otrosEnlaces" JSONB NOT NULL DEFAULT '[]',
    "redSocialTipo" TEXT NOT NULL,
    "redSocial" TEXT NOT NULL,
    "otrasRedes" JSONB NOT NULL DEFAULT '[]',
    "foto" TEXT,
    "rangoContratacion" TEXT NOT NULL,
    "contactoNombre" TEXT NOT NULL,
    "contactoWhatsapp" TEXT NOT NULL,
    "contactoEmail" TEXT NOT NULL,
    "quienRegistra" TEXT NOT NULL,
    "registranteNombre" TEXT,
    "registranteEmail" TEXT,
    "registranteWhatsapp" TEXT,
    "declInfo" BOOLEAN NOT NULL DEFAULT false,
    "declAutorizado" BOOLEAN NOT NULL DEFAULT false,
    "declIntegrantes" BOOLEAN NOT NULL DEFAULT false,
    "declMayoria" BOOLEAN NOT NULL DEFAULT false,
    "declDatos" BOOLEAN NOT NULL DEFAULT false,
    "declReglamento" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "paisExpedicion" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "rolOtro" TEXT,
    "esLider" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autor" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "privado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autor" TEXT NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DismissedDuplicate" (
    "key" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedDuplicate_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolAdmin" NOT NULL DEFAULT 'moderador',
    "iniciales" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerAccount" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "sector" TEXT,
    "organizacion" TEXT,
    "cargo" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "buyerAccountId" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringRequest" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "buyerAccountId" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "fecha" TEXT,
    "fechaFlexible" BOOLEAN NOT NULL DEFAULT false,
    "ciudad" TEXT NOT NULL,
    "lugar" TEXT,
    "aforo" INTEGER,
    "duracion" TEXT,
    "presupuesto" TEXT,
    "incluye" TEXT[],
    "mensaje" TEXT NOT NULL,
    "solicitanteNombre" TEXT NOT NULL,
    "solicitanteSector" TEXT,
    "solicitanteOrganizacion" TEXT,
    "solicitanteCargo" TEXT,
    "solicitanteEmail" TEXT NOT NULL,
    "solicitanteWhatsapp" TEXT NOT NULL,
    "aceptaDatos" BOOLEAN NOT NULL DEFAULT false,
    "aceptaRango" BOOLEAN NOT NULL DEFAULT false,
    "aceptaReglamento" BOOLEAN NOT NULL DEFAULT false,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiringRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringRequestProject" (
    "hiringRequestId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "HiringRequestProject_pkey" PRIMARY KEY ("hiringRequestId","projectId")
);

-- CreateIndex
CREATE INDEX "Project_numeroDocumento_idx" ON "Project"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Project_nombreProyecto_idx" ON "Project"("nombreProyecto");

-- CreateIndex
CREATE INDEX "Project_contactoEmail_idx" ON "Project"("contactoEmail");

-- CreateIndex
CREATE INDEX "Project_estado_idx" ON "Project"("estado");

-- CreateIndex
CREATE INDEX "Member_projectId_idx" ON "Member"("projectId");

-- CreateIndex
CREATE INDEX "Member_numeroDocumento_idx" ON "Member"("numeroDocumento");

-- CreateIndex
CREATE INDEX "StatusHistory_projectId_idx" ON "StatusHistory"("projectId");

-- CreateIndex
CREATE INDEX "Note_projectId_idx" ON "Note"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerAccount_email_key" ON "BuyerAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_token_key" ON "MagicLinkToken"("token");

-- CreateIndex
CREATE INDEX "MagicLinkToken_buyerAccountId_idx" ON "MagicLinkToken"("buyerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "HiringRequest_ref_key" ON "HiringRequest"("ref");

-- CreateIndex
CREATE INDEX "HiringRequestProject_projectId_idx" ON "HiringRequestProject"("projectId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_buyerAccountId_fkey" FOREIGN KEY ("buyerAccountId") REFERENCES "BuyerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringRequest" ADD CONSTRAINT "HiringRequest_buyerAccountId_fkey" FOREIGN KEY ("buyerAccountId") REFERENCES "BuyerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringRequestProject" ADD CONSTRAINT "HiringRequestProject_hiringRequestId_fkey" FOREIGN KEY ("hiringRequestId") REFERENCES "HiringRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringRequestProject" ADD CONSTRAINT "HiringRequestProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

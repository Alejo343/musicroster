// Script puntual para crear/actualizar un AdminUser en producción, fuera del
// seed de datos de prueba (que no debe correr contra la base real). Uso:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_ROL=admin node prisma/crear-admin.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const rol = process.env.ADMIN_ROL === "moderador" ? "moderador" : "admin";

if (!email || !password) {
  console.error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD");
  process.exit(1);
}

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);

const usuario = await prisma.adminUser.upsert({
  where: { email },
  update: { passwordHash, rol },
  create: { email, passwordHash, rol, nombre: "Contacto Billboard MusicRoster" },
});

console.log(`Listo: ${usuario.email} (${usuario.rol})`);
await prisma.$disconnect();

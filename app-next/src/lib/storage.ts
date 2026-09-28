// Almacenamiento de la fotografía oficial del proyecto.
// Con MINIO_ENDPOINT configurado (VPS/producción) sube a MinIO (S3-compatible).
// Sin configurar (desarrollo local, sin Docker) cae a disco local bajo public/uploads/,
// servido directamente por Next.js — nunca se usa en producción.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function extensionDe(tipo: string): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[tipo] ?? "bin";
}

function s3Cliente(): S3Client | null {
  if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ROOT_USER || !process.env.MINIO_ROOT_PASSWORD) return null;
  return new S3Client({
    endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT ?? "9000"}`,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER,
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
    },
  });
}

export async function guardarFoto(archivo: File): Promise<string> {
  const nombre = `${crypto.randomUUID()}.${extensionDe(archivo.type)}`;
  const bytes = new Uint8Array(await archivo.arrayBuffer());

  const s3 = s3Cliente();
  if (s3) {
    const bucket = process.env.MINIO_BUCKET ?? "musicroster-fotos";
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: nombre, Body: bytes, ContentType: archivo.type }));
    const base = process.env.MINIO_PUBLIC_URL ?? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT ?? "9000"}/${bucket}`;
    return `${base.replace(/\/$/, "")}/${nombre}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nombre), bytes);
  return `/uploads/${nombre}`;
}

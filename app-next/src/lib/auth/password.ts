import bcrypt from "bcryptjs";

const RONDAS = 12;

export const hashearPassword = (plano: string) => bcrypt.hash(plano, RONDAS);
export const verificarPassword = (plano: string, hash: string) => bcrypt.compare(plano, hash);

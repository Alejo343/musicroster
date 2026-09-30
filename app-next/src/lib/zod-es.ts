// Mensajes de validación de Zod en español (todo el texto de la interfaz va en español — ver
// CLAUDE.md). Sirve de respaldo para los campos que no traen un mensaje propio: sin esto, Zod
// muestra su mensaje por defecto en inglés (p. ej. "Too small: expected string to have >=1
// characters"). Cada esquema que use Zod debe importar este módulo por su efecto secundario,
// antes de declarar sus campos.
import { z } from "zod";

z.config(z.locales.es());

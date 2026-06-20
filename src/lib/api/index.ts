/**
 * Barrel for the VoltChess backend API client modules.
 *
 * Each file in this folder owns one backend domain (academies, classrooms,
 * assignments, games, …) and wraps the shared axios instance from `@/api`.
 * Importing through this barrel — `import { joinClassroom } from "@/lib/api"` —
 * keeps call sites stable and discoverable as the API surface grows, instead of
 * each page reaching into deep per-file paths. Add new domain modules here.
 */
export * from "./academies";
export * from "./annotations";
export * from "./assignments";
export * from "./classrooms";
export * from "./coaching";
export * from "./games";
export * from "./sync";

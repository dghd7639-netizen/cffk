import type { RuntimeAdapter } from "@universal-middleware/core";
import { getContext } from "telefunc";
import { appError } from "@/lib/app-error";
import { bindRoot, deleteUnboundSetupUser, hasRoot } from "@/server/admin";
import { createServerAuth } from "@/server/better-auth";
import { getDrizzleDb } from "@/database/drizzle";
import { user } from "@/database/drizzle/schema";
import { eq } from "drizzle-orm";
import { telefuncAction } from "@/server/telefunc-action";

type SetupContext = {
  env?: Record<string, unknown> & {
    DB?: D1Database;
    SETUP_TOKEN?: string;
  };
};

type SetupInput = {
  setupToken: string;
  name: string;
  email: string;
  password: string;
};

function timingSafeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index]! ^ (rightBytes[index] ?? 0);
  return difference === 0;
}

/**
 * Until a root account exists, anyone who can reach /setup could otherwise
 * claim the store. The deployer proves ownership with a secret that only they
 * configured, so a stranger who finds a freshly deployed site first cannot.
 */
export function assertSetupToken(configured: unknown, provided: unknown) {
  const expected = typeof configured === "string" ? configured.trim() : "";
  if (expected.length < 16) appError("ROOT_SETUP_TOKEN_NOT_CONFIGURED");
  const candidate = typeof provided === "string" ? provided.trim() : "";
  if (!candidate || !timingSafeEqual(candidate, expected)) appError("ROOT_SETUP_TOKEN_INVALID");
}


function validateAccountInput(input: SetupInput) {

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";


  if (!name || name.length > 100) appError("ROOT_SETUP_NAME_INVALID");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) appError("ROOT_SETUP_EMAIL_INVALID");
  if (password.length < 8 || password.length > 128) appError("ROOT_SETUP_PASSWORD_INVALID");

  return { name, email, password };
}

async function internalOnSetupRoot(input: SetupInput) {
  const context = getContext<SetupContext>();
  if (!context.env?.DB) appError("DATABASE_UNAVAILABLE");

  const runtime = { runtime: "workerd", env: context.env } as unknown as RuntimeAdapter;
  if (await hasRoot(runtime)) appError("ROOT_SETUP_NOT_FOUND");
  assertSetupToken(context.env.SETUP_TOKEN, input.setupToken);


  const values = validateAccountInput(input);
  const result = await createServerAuth(runtime, undefined, { allowSetupRegistration: true }).api.signUpEmail({
    body: {

      name: values.name,
      email: values.email,
      password: values.password,
    } as { name: string; email: string; password: string },
  });

  if (!result.user?.id) throw new Error("Better Auth did not return the created setup user");
  await getDrizzleDb(runtime).update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, result.user.id));
  if (!(await bindRoot(runtime, result.user.id))) {
    await deleteUnboundSetupUser(runtime, result.user.id);
    appError("ROOT_SETUP_NOT_FOUND");
  }

  return { initialized: true as const };
}

export const onSetupRoot = telefuncAction(internalOnSetupRoot);

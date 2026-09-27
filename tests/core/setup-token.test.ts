import assert from "node:assert/strict";
// @ts-expect-error Tests run with Bun, while this project intentionally omits Bun's global type package.
import { test } from "bun:test";
import { AppError } from "../../lib/app-error";
import { assertSetupToken } from "../../server/setup.telefunc";

function errorCodeOf(run: () => void) {
  try {
    run();
  } catch (cause) {
    assert.ok(cause instanceof AppError);
    return cause.code;
  }
  return null;
}

const configured = "a7f3c9e1b5d24f68";

test("root setup refuses to run until a strong SETUP_TOKEN is configured", () => {
  assert.equal(errorCodeOf(() => assertSetupToken(undefined, configured)), "ROOT_SETUP_TOKEN_NOT_CONFIGURED");
  assert.equal(errorCodeOf(() => assertSetupToken("", "")), "ROOT_SETUP_TOKEN_NOT_CONFIGURED");
  assert.equal(errorCodeOf(() => assertSetupToken("short-token", "short-token")), "ROOT_SETUP_TOKEN_NOT_CONFIGURED");
});

test("root setup requires the exact configured SETUP_TOKEN", () => {
  assert.equal(errorCodeOf(() => assertSetupToken(configured, undefined)), "ROOT_SETUP_TOKEN_INVALID");
  assert.equal(errorCodeOf(() => assertSetupToken(configured, "")), "ROOT_SETUP_TOKEN_INVALID");
  assert.equal(errorCodeOf(() => assertSetupToken(configured, `${configured}x`)), "ROOT_SETUP_TOKEN_INVALID");
  assert.equal(errorCodeOf(() => assertSetupToken(configured, configured.slice(0, -1))), "ROOT_SETUP_TOKEN_INVALID");
  assert.equal(errorCodeOf(() => assertSetupToken(configured, configured.toUpperCase())), "ROOT_SETUP_TOKEN_INVALID");
  assert.equal(errorCodeOf(() => assertSetupToken(configured, configured)), null);
  assert.equal(errorCodeOf(() => assertSetupToken(`  ${configured}\n`, ` ${configured} `)), null);
});

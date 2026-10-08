import { test } from "node:test";
import assert from "node:assert/strict";
import { requestHeaders, roomRequestError } from "./supabase-errors.ts";

test("publishable keys are not sent as JWT Bearer tokens", () => {
  assert.equal(requestHeaders("sb_publishable_example").Authorization, undefined);
  assert.equal(requestHeaders("sb_publishable_example").apikey, "sb_publishable_example");
});
test("legacy anon keys retain Bearer authorization", () => {
  assert.equal(requestHeaders("legacy-jwt").Authorization, "Bearer legacy-jwt");
});
test("missing functions produce schema setup instructions", () => {
  assert.match(roomRequestError(404, { code: "PGRST202" }), /database functions are missing/);
});
test("invalid credentials produce deployment instructions", () => {
  assert.match(roomRequestError(401, {}), /credentials/);
});
test("permissions and unknown rooms are distinguished", () => {
  assert.match(roomRequestError(403, { code: "42501" }), /function grants/);
  assert.match(roomRequestError(400, { message: "Room not found" }), /does not exist/);
});
test("arbitrary server messages and details are not exposed", () => {
  const message = roomRequestError(500, { message: "private-room-token", details: "private-key", code: "XX000" });
  assert.doesNotMatch(message, /private-room-token|private-key/);
  assert.match(message, /HTTP 500, XX000/);
});
test("non-JSON errors have a safe fallback", () => {
  assert.match(roomRequestError(502, null), /HTTP 502/);
});
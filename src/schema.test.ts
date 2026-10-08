import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("shared rooms enforce invite capabilities, valid results, and isolation", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated;");
    await db.exec(
      readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    );
    await db.exec("set role anon;");
    const token = "a".repeat(64);
    const other = "b".repeat(64);
    const missing = "c".repeat(64);
    const match = {
      id: "00000000-0000-4000-8000-000000000001",
      date: "2026-01-01",
      puzzle: 1000,
      kritika: 3,
      raj: 4,
      first: "Raj",
    };
    await db.query("select ww_create_room($1)", [token]);
    await db.query("select ww_create_room($1)", [other]);
    await assert.rejects(db.query("select ww_create_room($1)", ["short"]));
    await assert.rejects(db.query("select ww_load_room($1)", [missing]));
    await assert.rejects(db.query("select * from ww_rooms"));
    await assert.rejects(db.query("select * from ww_matches"));
    await assert.rejects(db.query("select ww_resolve_room($1)", [token]));
    await db.query("select ww_save_match($1,$2)", [
      token,
      JSON.stringify(match),
    ]);
    const stored = await db.query<{ ww_load_room: unknown[] }>(
      "select ww_load_room($1)",
      [token],
    );
    assert.deepEqual(stored.rows[0].ww_load_room, [match]);
    const empty = await db.query<{ ww_load_room: unknown[] }>(
      "select ww_load_room($1)",
      [other],
    );
    assert.deepEqual(empty.rows[0].ww_load_room, []);
    await assert.rejects(
      db.query("select ww_save_match($1,$2)", [other, JSON.stringify(match)]),
    );
    await assert.rejects(
      db.query("select ww_save_match($1,$2)", [
        token,
        JSON.stringify({ ...match, raj: 9 }),
      ]),
    );
    await assert.rejects(
      db.query("select ww_save_match($1,$2)", [
        token,
        JSON.stringify({ ...match, raj: "3" }),
      ]),
    );
    await assert.rejects(
      db.query("select ww_save_match($1,$2)", [
        token,
        JSON.stringify({
          ...match,
          id: "00000000-0000-4000-8000-000000000002",
        }),
      ]),
    );
    await db.query("select ww_delete_match($1,$2)", [other, match.id]);
    assert.equal(
      (
        await db.query<{ ww_load_room: unknown[] }>("select ww_load_room($1)", [
          token,
        ])
      ).rows[0].ww_load_room.length,
      1,
    );
    await db.query("select ww_save_match($1,$2)", [
      token,
      JSON.stringify({ ...match, raj: 2 }),
    ]);
    assert.deepEqual(
      (
        await db.query<{ ww_load_room: unknown[] }>("select ww_load_room($1)", [
          token,
        ])
      ).rows[0].ww_load_room,
      [{ ...match, raj: 2 }],
    );
    await db.query("select ww_delete_match($1,$2)", [token, match.id]);
    assert.deepEqual(
      (
        await db.query<{ ww_load_room: unknown[] }>("select ww_load_room($1)", [
          token,
        ])
      ).rows[0].ww_load_room,
      [],
    );
  } finally {
    await db.close();
  }
});

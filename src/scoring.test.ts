import { test } from "node:test";
import assert from "node:assert/strict";
import { winner, stats, validMatch } from "./scoring.ts";
import type { Match } from "./scoring.ts";

const match: Match = {
  id: "test",
  date: "2026-10-08",
  puzzle: 1767,
  kritika: 3,
  raj: 4,
  first: "Raj",
};
test("fewer guesses wins regardless of finish order", () =>
  assert.equal(winner(match), "Kritika"));
test("first solver breaks equal guesses", () =>
  assert.equal(winner({ ...match, raj: 3 }), "Raj"));
test("equal guesses can draw", () =>
  assert.equal(winner({ ...match, raj: 3, first: "draw" }), "draw"));
test("a solve beats a failure", () =>
  assert.equal(winner({ ...match, kritika: "X", raj: 6 }), "Raj"));
test("two failures draw regardless of finish order", () =>
  assert.equal(winner({ ...match, kritika: "X", raj: "X" }), "draw"));
test("failed solves are excluded from average", () =>
  assert.equal(
    stats([match, { ...match, id: "other", kritika: "X" }], "Kritika").average,
    "3.0",
  ));
test("empty season has no wins or average", () =>
  assert.deepEqual(stats([], "Raj"), {
    wins: 0,
    streak: 0,
    average: "-",
    distribution: [0, 0, 0, 0, 0, 0],
  }));
test("invalid scores are rejected", () =>
  assert.equal(validMatch({ ...match, raj: 9 }), false));
test("impossible calendar dates are rejected", () =>
  assert.equal(validMatch({ ...match, date: "2026-02-30" }), false));
test("valid leap days are accepted", () =>
  assert.equal(validMatch({ ...match, date: "2028-02-29" }), true));
test("non-integer puzzle numbers are rejected", () =>
  assert.equal(validMatch({ ...match, puzzle: 1.5 }), false));
test("oversized database puzzle numbers are rejected", () =>
  assert.equal(validMatch({ ...match, puzzle: 2147483648 }), false));
test("winning streak uses chronological order", () =>
  assert.equal(
    stats(
      [
        { ...match, date: "2026-10-07" },
        { ...match, date: "2026-10-08", raj: 2 },
      ],
      "Kritika",
    ).streak,
    0,
  ));

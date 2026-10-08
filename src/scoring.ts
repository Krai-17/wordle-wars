export type Player = "Kritika" | "Raj";
export type Result = 1 | 2 | 3 | 4 | 5 | 6 | "X";
export interface Match {
  id: string;
  date: string;
  puzzle: number;
  kritika: Result;
  raj: Result;
  first: Player | "draw";
}

export function winner(match: Match): Player | "draw" {
  const kritika = match.kritika === "X" ? 7 : match.kritika;
  const raj = match.raj === "X" ? 7 : match.raj;
  if (kritika === 7 && raj === 7) return "draw";
  if (kritika < raj) return "Kritika";
  if (raj < kritika) return "Raj";
  return match.first;
}

export function stats(matches: Match[], player: Player) {
  const scores = matches.map((match) =>
    player === "Kritika" ? match.kritika : match.raj,
  );
  const solved = scores.filter(
    (score): score is Exclude<Result, "X"> => score !== "X",
  );
  const wins = matches.filter((match) => winner(match) === player).length;
  let streak = 0;
  for (const match of [...matches].sort((left, right) =>
    right.date.localeCompare(left.date),
  )) {
    if (winner(match) !== player) break;
    streak++;
  }
  return {
    wins,
    streak,
    average: solved.length
      ? (solved.reduce((sum, score) => sum + score, 0) / solved.length).toFixed(
          1,
        )
      : "-",
    distribution: [1, 2, 3, 4, 5, 6].map(
      (value) => scores.filter((score) => score === value).length,
    ),
  };
}

export function validMatch(value: unknown): value is Match {
  if (!value || typeof value !== "object") return false;
  const match = value as Match;
  const scores: unknown[] = [1, 2, 3, 4, 5, 6, "X"];
  const parsedDate =
    typeof match.date === "string"
      ? new Date(`${match.date}T12:00:00Z`)
      : new Date(NaN);
  return (
    typeof match.id === "string" &&
    match.id.length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(match.date) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === match.date &&
    Number.isInteger(match.puzzle) &&
    match.puzzle > 0 &&
    match.puzzle <= 2147483647 &&
    scores.includes(match.kritika) &&
    scores.includes(match.raj) &&
    ["Kritika", "Raj", "draw"].includes(match.first)
  );
}

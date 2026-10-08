import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
  Globe,
  Moon,
  Plus,
  RefreshCw,
  Share2,
  Sun,
  Swords,
  Trash2,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { stats, validMatch, winner } from "./scoring";
import type { Match, Player, Result } from "./scoring";
import "./App.css";

const sample: Match[] = [
  {
    id: "demo-1",
    date: "2026-10-07",
    puzzle: 1766,
    kritika: 3,
    raj: 4,
    first: "Kritika",
  },
  {
    id: "demo-2",
    date: "2026-10-06",
    puzzle: 1765,
    kritika: 4,
    raj: 3,
    first: "Raj",
  },
  {
    id: "demo-3",
    date: "2026-10-05",
    puzzle: 1764,
    kritika: 2,
    raj: 4,
    first: "Kritika",
  },
  {
    id: "demo-4",
    date: "2026-10-04",
    puzzle: 1763,
    kritika: 3,
    raj: 3,
    first: "Kritika",
  },
  {
    id: "demo-5",
    date: "2026-10-03",
    puzzle: 1762,
    kritika: 5,
    raj: 4,
    first: "Raj",
  },
  {
    id: "demo-6",
    date: "2026-10-02",
    puzzle: 1761,
    kritika: 3,
    raj: "X",
    first: "Kritika",
  },
  {
    id: "demo-7",
    date: "2026-10-01",
    puzzle: 1760,
    kritika: 4,
    raj: 4,
    first: "draw",
  },
];
const localKey = "wordle-wars-matches-v1";
const today = () => new Date().toLocaleDateString("en-CA");
const cloudUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const cloudKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const configured = Boolean(cloudUrl && cloudKey);
async function rpc(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!cloudUrl || !cloudKey)
    throw new Error("Shared storage is not configured.");
  const response = await fetch(`${cloudUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: cloudKey,
      Authorization: `Bearer ${cloudKey}`,
    },
    body: JSON.stringify(args),
  });
  if (!response.ok)
    throw new Error(
      "Room request failed. Check your invite link and connection.",
    );
  return response.status === 204 ? null : response.json();
}
async function loadRoom(token: string): Promise<Match[]> {
  const data = await rpc("ww_load_room", { room_token: token });
  if (!Array.isArray(data) || !data.every(validMatch))
    throw new Error("Invalid room results.");
  return data;
}
function readLocal(): Match[] | null {
  try {
    const stored = localStorage.getItem(localKey);
    if (!stored) return null;
    const data: unknown = JSON.parse(stored);
    return Array.isArray(data) && data.every(validMatch) ? data : null;
  } catch {
    return null;
  }
}
function Tiles({ score, accent }: { score: Result; accent: string }) {
  return (
    <div
      className="tiles"
      aria-label={score === "X" ? "Failed" : `${score} guesses`}
    >
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <span
          key={index}
          className={
            score !== "X" && index <= score
              ? accent
              : index === 2 || index === 4
                ? "yellow"
                : ""
          }
        />
      ))}
    </div>
  );
}
export default function App() {
  const [initial] = useState(readLocal);
  const [matches, setMatches] = useState<Match[]>(initial ?? sample);
  const [demo, setDemo] = useState(initial === null);
  const [dark, setDark] = useState(
    () => localStorage.getItem("wordle-wars-theme") === "dark",
  );
  const [tab, setTab] = useState("Overview");
  const [filter, setFilter] = useState("All matches");
  const [editing, setEditing] = useState<Match | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [room, setRoom] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("room") ?? "",
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const shareDialog = useRef<HTMLDialogElement>(null);
  const kritika = stats(matches, "Kritika"),
    raj = stats(matches, "Raj");
  const draws = matches.filter((match) => winner(match) === "draw").length;
  const lead =
    kritika.wins === raj.wins
      ? null
      : kritika.wins > raj.wins
        ? "Kritika"
        : "Raj";
  const sorted = [...matches].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("wordle-wars-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    if (formOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [formOpen]);
  useEffect(() => {
    if (shareOpen) shareDialog.current?.showModal();
    else shareDialog.current?.close();
  }, [shareOpen]);
  useEffect(() => {
    if (!room || !configured) return;
    let active = true;
    setLoaded(false);
    setBusy(true);
    loadRoom(room)
      .then((data) => {
        if (active) {
          setMatches(data);
          setDemo(false);
          setLoaded(true);
          setStatus("Room connected");
        }
      })
      .catch((error) => {
        if (active) setStatus(error.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [room]);
  function persist(next: Match[]) {
    setMatches(next);
    if (!room) localStorage.setItem(localKey, JSON.stringify(next));
    setDemo(false);
  }
  async function save(match: Match) {
    setBusy(true);
    try {
      if (room) {
        if (!loaded) throw new Error("Load the room before saving.");
        await rpc("ww_save_match", { room_token: room, result: match });
        persist(await loadRoom(room));
      } else
        persist([
          ...(demo ? [] : matches).filter((item) => item.id !== match.id),
          {
            ...match,
            id: match.id.startsWith("demo-") ? crypto.randomUUID() : match.id,
          },
        ]);
      setFormOpen(false);
      setStatus("Result saved. Rivalry updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  async function remove(match: Match) {
    if (!confirm(`Delete Wordle #${match.puzzle}?`)) return;
    setBusy(true);
    try {
      if (room) {
        await rpc("ww_delete_match", { room_token: room, match_id: match.id });
        persist(await loadRoom(room));
      } else persist(matches.filter((item) => item.id !== match.id));
      setFormOpen(false);
      setStatus("Result deleted");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }
  function exportResults() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(matches, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wordle-wars-results.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function edit(match: Match) {
    setEditing(match);
    setFormOpen(true);
  }
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => event.preventDefault()}
        >
          <span className="brand-icon">
            <Swords size={22} />
          </span>{" "}
          ATTACK OF TILES<span className="brand-dot">.</span>
        </a>
        <div className="header-actions">
          <span className="league-tag">A TWO-PERSON LEAGUE</span>
          <button
            className="icon-button"
            title={dark ? "Light mode" : "Dark mode"}
            aria-label={dark ? "Light mode" : "Dark mode"}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="outline-button" onClick={() => setShareOpen(true)}>
            <Share2 size={16} /> Invite rival
          </button>
        </div>
      </header>
      <main>
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> WORDLE WARS / THE DAILY DUEL
            </div>
            <h1>
              Small tiles. <span>Big rivalry.</span>
            </h1>
            <p>Two friends. One word. Absolutely no mercy.</p>
          </div>
          <button
            className="primary-button"
            disabled={busy || Boolean(room && !loaded)}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={19} /> Log a duel
          </button>
        </section>
        <div className="navigation">
          <nav aria-label="Dashboard views">
            {["Overview", "Match history", "The rulebook"].map((item) => (
              <button
                key={item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {item}
                {item === "Match history" && <span>{matches.length}</span>}
              </button>
            ))}
          </nav>
          <span className="storage-label">
            <Globe size={13} />
            {room ? "Shared league" : demo ? "Sample season" : "Local league"}
            {room && (
              <button
                className="icon-button"
                title="Refresh shared scores"
                aria-label="Refresh shared scores"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    persist(await loadRoom(room));
                    setLoaded(true);
                    setStatus("Scores refreshed");
                  } catch (error) {
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "Could not refresh",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <RefreshCw size={14} />
              </button>
            )}
          </span>
        </div>
        {demo && (
          <div className="demo-note">
            <span>
              A preview of the rivalry. These results are sample data.
            </span>
            <button
              onClick={() => {
                if (confirm("Remove sample scores and start a fresh season?")) {
                  persist([]);
                  setStatus("A fresh rivalry starts here.");
                }
              }}
            >
              Start our season <ArrowRight size={14} />
            </button>
          </div>
        )}
        {room && !configured && (
          <div className="error-banner">
            Shared storage is not configured on this deployment.
          </div>
        )}
        {tab === "Overview" && (
          <>
            <section className="scoreboard" aria-label="Head to head standings">
              <div className="scoreboard-top">
                <span>
                  <Swords size={15} /> THE HEAD-TO-HEAD
                </span>
                <span>ALL-TIME STANDINGS</span>
              </div>
              <div className="duel">
                <div className="contender">
                  <div className="avatar kritika">
                    K
                    <span>
                      <Zap size={18} />
                    </span>
                  </div>
                  <div>
                    <span className="player-tag">THE WORD WHISPERER</span>
                    <h2>Kritika</h2>
                    <span className="player-sub">
                      {kritika.streak
                        ? `${kritika.streak}-duel win streak`
                        : "One word away from glory"}
                    </span>
                  </div>
                </div>
                <div className="score">
                  <span className="green-text">{kritika.wins}</span>
                  <span className="score-divider">:</span>
                  <span className="pink-text">{raj.wins}</span>
                  <small>WINS</small>
                </div>
                <div className="contender raj-contender">
                  <div>
                    <span className="player-tag">THE LETTER LEGEND</span>
                    <h2>Raj</h2>
                    <span className="player-sub">
                      {raj.streak
                        ? `${raj.streak}-duel win streak`
                        : "Plotting the comeback"}
                    </span>
                  </div>
                  <div className="avatar raj">
                    R
                    <span>
                      <Flame size={18} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="tug-bar">
                <span style={{ flex: kritika.wins + raj.wins ? kritika.wins : 1 }} />
                <span style={{ flex: kritika.wins + raj.wins ? raj.wins : 1 }} />
              </div>
              <div className="scoreboard-bottom">
                <span>
                  <Trophy size={15} />
                  {lead
                    ? `${lead} leads by ${Math.abs(kritika.wins - raj.wins)} ${Math.abs(kritika.wins - raj.wins) === 1 ? 'duel' : 'duels'}`
                    : "An evenly matched rivalry"}
                </span>
                <span>
                  {draws} {draws === 1 ? 'draw' : 'draws'} <b>/</b> {matches.length} {matches.length === 1 ? 'duel' : 'duels'} played
                </span>
              </div>
            </section>
            <section className="stat-strip">
              {[
                {
                  label: "DUELS PLAYED",
                  value: matches.length,
                  sub: "and counting",
                  color: "yellow",
                  icon: <Swords />,
                },
                {
                  label: "KRITIKA'S AVG.",
                  value: kritika.average,
                  sub: "guesses / solve",
                  color: "green",
                  icon: <Zap />,
                },
                {
                  label: "RAJ'S AVG.",
                  value: raj.average,
                  sub: "guesses / solve",
                  color: "pink",
                  icon: <Zap />,
                },
                {
                  label: "CURRENT WIN STREAK",
                  value: Math.max(kritika.streak, raj.streak),
                  sub: kritika.streak
                    ? "Kritika is on fire"
                    : raj.streak
                      ? "Raj is on fire"
                      : "Up for grabs",
                  color: "orange",
                  icon: <Flame />,
                },
              ].map((item) => (
                <div key={item.label}>
                  <span className={`stat-icon ${item.color}-icon`}>
                    {item.icon}
                  </span>
                  <div>
                    <span>{item.label}</span>
                    <strong>
                      {item.value}
                      <small>{item.sub}</small>
                    </strong>
                  </div>
                </div>
              ))}
            </section>
            <div className="lower-grid">
              <section>
                <div className="section-heading">
                  <h2>
                    The latest battles
                    <span className="tiny-dot" />
                  </h2>
                  <button onClick={() => setTab("Match history")}>
                    All duels <ArrowRight size={15} />
                  </button>
                </div>
                <MatchList matches={sorted.slice(0, 4)} onEdit={edit} />
              </section>
              <section className="distribution-section">
                <div className="section-heading">
                  <h2>Guess game</h2>
                  <span className="small-label">SOLVED DUELS</span>
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="green-dot" /> Kritika
                  </span>
                  <span>
                    <i className="pink-dot" /> Raj
                  </span>
                </div>
                <div className="distribution">
                  {kritika.distribution.map((count, index) => (
                    <div className="distribution-row" key={index}>
                      <span>{index + 1}</span>
                      <div>
                        <div
                          className="chart-bar green"
                          style={{
                            width: `${Math.max(7, (count / Math.max(1, ...kritika.distribution, ...raj.distribution)) * 100)}%`,
                          }}
                        >
                          {count}
                        </div>
                        <div
                          className="chart-bar pink"
                          style={{
                            width: `${Math.max(7, (raj.distribution[index] / Math.max(1, ...kritika.distribution, ...raj.distribution)) * 100)}%`,
                          }}
                        >
                          {raj.distribution[index]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chart-footer">Every guess tells a story.</div>
              </section>
            </div>
            <section className="next-duel">
              <span className="next-icon">
                <Zap size={28} />
              </span>
              <div>
                <span className="eyebrow">THE NEXT CHAPTER</span>
                <h2>Same time. Same word. New bragging rights.</h2>
              </div>
              <a
                href="https://www.nytimes.com/games/wordle/index.html"
                target="_blank"
                rel="noreferrer"
              >
                Play Wordle <ArrowRight size={17} />
              </a>
              <div className="decorative-tiles" aria-hidden="true">
                <span>W</span>
                <span>A</span>
                <span>R</span>
              </div>
            </section>
          </>
        )}
        {tab === "Match history" && (
          <section className="history">
            <div className="section-heading">
              <h2>Every duel, on the record.</h2>
              <div className="history-actions">
                <select
                  aria-label="Filter matches"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  {["All matches", "Kritika", "Raj", "draw"].map((value) => (
                    <option key={value} value={value}>
                      {value === "draw"
                        ? "Draws"
                        : value === "All matches"
                          ? value
                          : `${value} wins`}
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  title="Export results"
                  aria-label="Export results"
                  onClick={exportResults}
                >
                  <ArrowDownToLine size={18} />
                </button>
              </div>
            </div>
            <MatchList
              matches={sorted.filter(
                (match) => filter === "All matches" || winner(match) === filter,
              )}
              onEdit={edit}
            />
          </section>
        )}
        {tab === "The rulebook" && (
          <section className="rulebook">
            <div className="eyebrow">THE GENTLEPERSON'S AGREEMENT</div>
            <h2>Fair play. Fierce competition.</h2>
            {[
              [
                "01",
                "Start together",
                "Play the same official Wordle puzzle and agree on a simultaneous start.",
              ],
              [
                "02",
                "Fifteen minutes. Six guesses.",
                "A solve after the 15-minute limit counts as X. Timing is on the honor system.",
              ],
              [
                "03",
                "Less is more",
                "Fewer guesses wins. A solve always beats an X.",
              ],
              [
                "04",
                "A photo finish",
                "Equal guesses? The first solver wins. Same finish time or two X results means a draw.",
              ],
            ].map(([number, title, text]) => (
              <div className="rule" key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </section>
        )}
        <footer>
          <span>
            <Swords size={14} /> WORDLE WARS
          </span>
          <span>Made for two. Played for pride.</span>
          <button onClick={exportResults}>
            <ArrowDownToLine size={14} /> Export scores
          </button>
        </footer>
      </main>
      {status && (
        <div className="toast" role="status">
          <span>{status}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setStatus("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <dialog ref={dialog} onCancel={() => setFormOpen(false)}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">THE DAILY DUEL</span>
            <h2>{editing ? "Edit the record." : "How did it go?"}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close result form"
            onClick={() => setFormOpen(false)}
          >
            <X />
          </button>
        </div>
        {formOpen && (
          <ResultForm
            key={editing?.id ?? "new"}
            match={editing}
            matches={demo ? [] : matches}
            busy={busy}
            onSave={save}
          />
        )}
        {editing && (
          <button
            className="delete-button"
            disabled={busy || Boolean(room && !loaded)}
            onClick={() => remove(editing)}
          >
            <Trash2 size={15} /> Delete duel
          </button>
        )}
      </dialog>
      <dialog ref={shareDialog} onCancel={() => setShareOpen(false)}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">A RIVALRY WORTH SHARING</span>
            <h2>Invite your rival.</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close invitation"
            onClick={() => setShareOpen(false)}
          >
            <X />
          </button>
        </div>
        {configured ? (
          <>
            <p className="dialog-copy">
              No accounts. No sign-in. Anyone with the private room link can
              view and edit scores. Keep it between you two.
            </p>
            {room ? (
              <>
                <label className="field-label">
                  PRIVATE ROOM LINK
                  <input readOnly value={location.href} />
                </label>
                <button
                  className="primary-button full"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(location.href);
                      setStatus("Invite link copied");
                    } catch {
                      setStatus("Copy the link from the field above");
                    }
                  }}
                >
                  <Share2 size={17} /> Copy invite link
                </button>
              </>
            ) : (
              <button
                className="primary-button full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const token = Array.from(
                      crypto.getRandomValues(new Uint8Array(32)),
                      (byte) => byte.toString(16).padStart(2, "0"),
                    ).join("");
                    await rpc("ww_create_room", { room_token: token });
                    location.hash = `room=${token}`;
                    setRoom(token);
                    setStatus("Fresh shared room created");
                  } catch (error) {
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "Could not create room",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Plus size={17} /> Create shared room
              </button>
            )}
          </>
        ) : (
          <>
            <p className="dialog-copy">
              This league is saved in this browser only. Shared rooms become
              available once Supabase is configured for your deployment.
            </p>
            <div className="connection-note">
              <Globe size={22} />
              <span>
                Local league<span>No sign-in required</span>
              </span>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
function MatchList({
  matches,
  onEdit,
}: {
  matches: Match[];
  onEdit: (match: Match) => void;
}) {
  if (!matches.length)
    return (
      <div className="empty-state">
        <Swords size={32} />
        <h3>No duels on the board.</h3>
        <p>The bragging rights are still up for grabs.</p>
      </div>
    );
  return (
    <div className="match-list">
      <div className="match-labels">
        <span>THE DUEL</span>
        <span>KRITIKA</span>
        <span>RAJ</span>
        <span>VICTOR</span>
      </div>
      {matches.map((match) => {
        const victor = winner(match);
        return (
          <button
            className="match-row"
            key={match.id}
            onClick={() => onEdit(match)}
            aria-label={`Edit Wordle ${match.puzzle}`}
          >
            <div className="match-date">
              <strong>#{match.puzzle}</strong>
              <span>
                {new Date(`${match.date}T12:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </span>
            </div>
            <div className="match-result">
              <Tiles score={match.kritika} accent="green" />
              <span>{match.kritika}/6</span>
            </div>
            <div className="match-result">
              <Tiles score={match.raj} accent="pink" />
              <span>{match.raj}/6</span>
            </div>
            <div
              className={`victor ${victor === "Kritika" ? "victor-green" : victor === "Raj" ? "victor-pink" : ""}`}
            >
              {victor !== "draw" && <Trophy size={12} />}{" "}
              {victor === "draw" ? "Draw" : victor}
              <ChevronRight className="row-chevron" size={15} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
function ResultForm({
  match,
  matches,
  busy,
  onSave,
}: {
  match: Match | null;
  matches: Match[];
  busy: boolean;
  onSave: (match: Match) => void;
}) {
  const [date, setDate] = useState(match?.date ?? today()),
    [puzzle, setPuzzle] = useState(match?.puzzle.toString() ?? "");
  const [kritika, setKritika] = useState<Result>(match?.kritika ?? 3),
    [raj, setRaj] = useState<Result>(match?.raj ?? 4);
  const [first, setFirst] = useState<Player | "draw">(match?.first ?? "draw"),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (
          matches.some(
            (item) =>
              item.id !== match?.id &&
              (item.puzzle === Number(puzzle) || item.date === date),
          )
        ) {
          setError(
            "A duel already exists for this puzzle or date. Edit it instead.",
          );
          return;
        }
        const result: Match = {
          id: match?.id ?? crypto.randomUUID(),
          date,
          puzzle: Number(puzzle),
          kritika,
          raj,
          first,
        };
        if (!validMatch(result)) {
          setError("Enter a valid date and positive puzzle number.");
          return;
        }
        onSave(result);
      }}
    >
      <div className="form-grid">
        <label className="field-label">
          DATE
          <input
            type="date"
            required
            value={date}
            max={today()}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="field-label">
          WORDLE NUMBER
          <input
            type="number"
            required
            min="1"
            step="1"
            placeholder="e.g. 1767"
            value={puzzle}
            onChange={(event) => setPuzzle(event.target.value)}
          />
        </label>
      </div>
      {(["Kritika", "Raj"] as const).map((player) => (
        <fieldset key={player}>
          <legend>{player}'s guesses</legend>
          <div className="score-picker">
            {([1, 2, 3, 4, 5, 6, "X"] as Result[]).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={(player === "Kritika" ? kritika : raj) === value}
                className={
                  (player === "Kritika" ? kritika : raj) === value
                    ? player === "Kritika"
                      ? "selected-green"
                      : "selected-pink"
                    : ""
                }
                onClick={() =>
                  player === "Kritika" ? setKritika(value) : setRaj(value)
                }
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {kritika === raj && kritika !== "X" && (
        <label className="field-label">
          WHO SOLVED FIRST?
          <select
            value={first}
            onChange={(event) =>
              setFirst(event.target.value as Player | "draw")
            }
          >
            <option value="draw">Same time / draw</option>
            <option>Kritika</option>
            <option>Raj</option>
          </select>
        </label>
      )}
      <div className="winner-preview">
        <Trophy size={17} />
        {winner({
          id: "",
          date,
          puzzle: Number(puzzle),
          kritika,
          raj,
          first,
        }) === "draw"
          ? "An honorable draw."
          : `${winner({ id: "", date, puzzle: Number(puzzle), kritika, raj, first })} takes the duel.`}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button full" disabled={busy} type="submit">
        <Check size={17} />
        {busy ? "Saving..." : "Save duel"}
      </button>
    </form>
  );
}

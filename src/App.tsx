import { useState, useCallback } from "react";
import "./App.css";

type Player = { mention: string; name: string };
type Ribbon = { qty: string; emoji: string; label: string };
type XpEntry = { desc: string; xp: string; bonuses: { desc: string; xp: string }[] };
type LootItem = { name: string; url: string };

const RIBBON_GROUPS = [
  { type: "Quest", names: ["Combat", "Social", "Deception", "Stealth", "Transport", "Research", "Duel", "Exploration"] },
  { type: "Planar", names: ["Air", "Wood", "Water", "Metal", "Earth", "Fire", "Draconic", "Vitality", "Void", "Outsider"] },
  { type: "Guild", names: ["Guild"] },
  { type: "Event", names: ["Spring", "Summer", "Autumn", "Winter"] },
];
const RIBBON_CHOICES = RIBBON_GROUPS.flatMap((group) =>
  group.names.map((name) => ({ name, emoji: `:ribbon_${name.toLowerCase()}:` }))
);

export default function App() {
  const [gameName, setGameName] = useState("Fight For Your Life!");
  const [eventSummary, setEventSummary] = useState("");

  const [players, setPlayers] = useState<Player[]>([
    { mention: "<@123456789>", name: "Valeros" },
  ]);
  const [ribbons, setRibbons] = useState<Ribbon[]>([]);
  const [xpEntries, setXpEntries] = useState<XpEntry[]>([
    { desc: "Encounter 1 enemies", xp: "80", bonuses: [] },
  ]);
  const [loot, setLoot] = useState<LootItem[]>([]);
  const [includeReminder, setIncludeReminder] = useState(false);
  const [favorLevel, setFavorLevel] = useState("");
  const [favorFaction, setFavorFaction] = useState("");
  const [lootStatement, setLootStatement] = useState("");

  const addPlayer = () =>
    setPlayers((p) => [...p, { mention: "", name: "" }]);
  const removePlayer = (i: number) =>
    setPlayers((p) => p.filter((_, idx) => idx !== i));
  const updatePlayer = (i: number, field: "mention" | "name", value: string) =>
    setPlayers((p) =>
      p.map((pl, idx) => (idx === i ? { ...pl, [field]: value } : pl))
    );

  const addRibbon = () =>
    setRibbons((r) => [
      ...r,
      { qty: "1", emoji: "", label: "" },
    ]);
  const removeRibbon = (i: number) =>
    setRibbons((r) => r.filter((_, idx) => idx !== i));
  const updateRibbon = (i: number, field: keyof Ribbon, value: string) =>
    setRibbons((r) =>
      r.map((rb, idx) => (idx === i ? { ...rb, [field]: value } : rb))
    );
  const selectRibbon = (i: number, emoji: string) => {
    const selected = RIBBON_CHOICES.find((choice) => choice.emoji === emoji);
    setRibbons((r) =>
      r.map((rb, idx) =>
        idx === i
          ? { ...rb, emoji, label: selected?.name === "Guild" ? "" : selected?.name ?? "" }
          : rb
      )
    );
  };

  const addXp = () =>
    setXpEntries((x) => [
      ...x,
      { desc: "", xp: "", bonuses: [] },
    ]);
  const removeXp = (i: number) =>
    setXpEntries((x) => x.filter((_, idx) => idx !== i));
  const updateXp = (
    i: number,
    field: "desc" | "xp" | "bonuses",
    value: string | { desc: string; xp: string }
  ) =>
    setXpEntries((x) =>
      x.map((en, idx) =>
        idx === i
          ? field === "bonuses"
            ? { ...en, bonuses: [...en.bonuses, value as { desc: string; xp: string }] }
            : { ...en, [field]: value }
          : en
      )
    );
  const addBonus = (i: number) =>
    setXpEntries((x) =>
      x.map((en, idx) =>
        idx === i
          ? { ...en, bonuses: [...en.bonuses, { desc: "", xp: "" }] }
          : en
      )
    );
  const removeBonus = (i: number, bi: number) =>
    setXpEntries((x) =>
      x.map((en, idx) =>
        idx === i
          ? { ...en, bonuses: en.bonuses.filter((_, bidx) => bidx !== bi) }
          : en
      )
    );
  const updateBonus = (i: number, bi: number, field: "desc" | "xp", value: string) =>
    setXpEntries((x) =>
      x.map((en, idx) =>
        idx === i
          ? {
              ...en,
              bonuses: en.bonuses.map((b, bidx) =>
                bidx === bi ? { ...b, [field]: value } : b
              ),
            }
          : en
      )
    );

  const addLoot = () =>
    setLoot((l) => [...l, { name: "", url: "" }]);
  const removeLoot = (i: number) =>
    setLoot((l) => l.filter((_, idx) => idx !== i));
  const updateLoot = (i: number, field: "name" | "url", value: string) =>
    setLoot((l) => l.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

    const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

  const buildDiscord = useCallback((): string => {
    const playersBlock = players
      .filter((p) => normalize(p.mention) && normalize(p.name))
      .map((p) => `${normalize(p.mention) || ""} as *${normalize(p.name)}*`)
      .join("\n");

    const intro = [`# **${normalize(gameName) || "Game Summary"}**`];
    if (playersBlock) intro.push(playersBlock);
    if (includeReminder) {
      intro.push("**Reset your queue position if you haven't yet!**");
    }
    const sections = [intro.join("\n")];
    if (eventSummary.trim()) sections.push(eventSummary.trim());

    if (favorLevel || favorFaction) {
      const favor = normalize(favorLevel) || "Favor";
      const faction = normalize(favorFaction);
      sections.push(`🎭 **${favor}** 🎭${faction ? ` for ${faction}` : ""}`);
    }

    if (ribbons.length) {
      const ribbonLines = ribbons
        .filter((r) => normalize(r.emoji) && normalize(r.label))
        .map((r) => `${normalize(r.qty) || "1"} ${normalize(r.emoji)} ${normalize(r.label)}`);
      if (ribbonLines.length) {
        sections.push(`🎀 **Ribbons** 🎀\n${ribbonLines.join("\n")}`);
      }
    }

    if (xpEntries.some((entry) => normalize(entry.desc) && Number(entry.xp) > 0)) {
      sections.push("⭐ **XP** ⭐\n\n```diff\n" + buildXpDiff() + "\n```");
    }

    if (loot.length) {
      const lootLines = loot
        .filter((it) => normalize(it.name) && normalize(it.url))
        .map((it) => `- [${normalize(it.name)}](<${normalize(it.url)}>)`);
      if (lootLines.length) {
        sections.push(
          ["💰 **Loot** 💰", normalize(lootStatement), lootLines.join("\n")]
            .filter(Boolean)
            .join("\n")
        );
      }
    }

    return sections.join("\n\n");
  }, [
    gameName,
    players,
    includeReminder,
    eventSummary,
    favorLevel,
    favorFaction,
    ribbons,
    xpEntries,
    loot,
    lootStatement,
  ]);

  function buildXpDiff(): string {
    let total = 0;
    const parts: string[] = [];
    for (const e of xpEntries) {
      const desc = normalize(e.desc);
      const x = Number(e.xp) || 0;
      if (!desc || !x) continue;
      total += x;
      const main = `${desc} ${x} XP`;
      const bonusLines = e.bonuses
        .map((b) => {
          const d = normalize(b.desc);
          const bx = Number(b.xp) || 0;
          if (d && bx) {
            total += bx;
            return `+ ${d} +${bx} XP`;
          }
          return null;
        })
        .filter(Boolean);
      // Keep each encounter and its bonuses in ONE part joined by single
      // newlines; join different encounter parts with two newlines.
      parts.push([main, ...bonusLines].join("\n"));
    }
    return `${parts.join("\n\n")}\n\n(total ${total} XP)`;
  }

  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const copyOutput = async (text: string) => {
    let success = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        success = document.execCommand("copy");
      } catch { /* The output remains available for manual copying. */ }
      ta.remove();
    }
    setCopied(success);
    setCopyMessage(success ? "Summary copied to clipboard." : "Automatic copy failed. Use Copy summary.");
    if (success) setTimeout(() => setCopied(false), 2000);
  };
  const handleGenerate = () => {
    const summary = buildDiscord();
    setGeneratedOutput(summary);
    setCopied(false);
    setCopyMessage("");
    void copyOutput(summary);
  };

  return (
    <div className="app-container">
      <div className="inner-container">
        <div className="app-header">
          <h1>Game Summary</h1>
        </div>

        <form
          className="form-card"
          onSubmit={(event) => {
            event.preventDefault();
            handleGenerate();
          }}
        >
        <fieldset className="form-section">
          <legend>Game Information</legend>
          <label htmlFor="gameName">Game Name</label>
          <input
            id="gameName"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Fight For Your Life!"
          />
          <label htmlFor="eventSummary">Event summary &amp; achievements</label>
          <textarea
            id="eventSummary"
            value={eventSummary}
            onChange={(e) => setEventSummary(e.target.value)}
            placeholder="Notable moments and achievements..."
            required
          />
          <h2 className="subsection-title">Players</h2>
          {players.map((p, i) => (
            <div className="dynamic-row" key={i}>
              <div className="field-heading">Player {i + 1}</div>
              <div className="row-inline-2">
                <div>
                  <label htmlFor={`p-m-${i}`}>Discord mention</label>
                  <input
                    id={`p-m-${i}`}
                    type="text"
                    value={p.mention}
                    onChange={(e) => updatePlayer(i, "mention", e.target.value)}
                    placeholder="<@123456789>"
                  />
                </div>
                <div>
                  <label htmlFor={`p-n-${i}`}>Character name</label>
                  <input
                    id={`p-n-${i}`}
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePlayer(i, "name", e.target.value)}
                    placeholder="Valeros"
                  />
                </div>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="remove-row-btn"
                  onClick={() => removePlayer(i)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addPlayer}>
            + Add player
          </button>
          <details className="disclosure">
            <summary>Queue reminder (optional)</summary>
            <div className="disclosure-content">
          <div className="checkbox-row">
            <input
              id="reminder"
              type="checkbox"
              checked={includeReminder}
              onChange={(e) => setIncludeReminder(e.target.checked)}
            />
            <label htmlFor="reminder">
              Include “Reset your queue position if you haven&apos;t yet!”
            </label>
          </div>
            </div>
          </details>
        </fieldset>

        <fieldset className="form-section rewards-section">
          <legend>Rewards</legend>
          <details className="reward-disclosure">
            <summary>Favor (optional)</summary>
            <div className="disclosure-content">
              <label htmlFor="favorLevel">Favor level / type</label>
              <input
                id="favorLevel"
                type="text"
                value={favorLevel}
                onChange={(e) => setFavorLevel(e.target.value)}
                placeholder="Minor favor"
              />
              <label htmlFor="favorFaction">NPC faction</label>
              <input
                id="favorFaction"
                type="text"
                value={favorFaction}
                onChange={(e) => setFavorFaction(e.target.value)}
                placeholder="Pathfinder Society"
              />
            </div>
          </details>
          <section className="reward-group">
            <h2>Ribbons</h2>

              {ribbons.map((r, i) => (
            <div className="dynamic-row reward-entry" key={i}>
              <div className="field-heading">Ribbon {i + 1}</div>
              <div className="ribbon-fields">
                <div>
                  <label htmlFor={`rb-q-${i}`}>Quantity</label>
                  <input
                    id={`rb-q-${i}`}
                    type="number"
                    min="0"
                    value={r.qty}
                    onChange={(e) =>
                      updateRibbon(i, "qty", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label htmlFor={`rb-e-${i}`}>Ribbon</label>
                  <select
                    id={`rb-e-${i}`}
                    value={r.emoji}
                    onChange={(e) => selectRibbon(i, e.target.value)}
                    required
                  >
                    <option value="">Choose ribbon</option>
                    {RIBBON_GROUPS.map((group) => (
                      <optgroup key={group.type} label={group.type}>
                        {group.names.map((name) => (
                          <option key={name} value={`:ribbon_${name.toLowerCase()}:`}>
                            {name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`rb-l-${i}`}>{r.emoji === ":ribbon_guild:" ? "Guild name" : "Ribbon name"}</label>
                  <input
                    id={`rb-l-${i}`}
                    type="text"
                    value={r.label}
                    onChange={(e) =>
                      updateRibbon(i, "label", e.target.value)
                    }
                    placeholder={r.emoji === ":ribbon_guild:" ? "e.g. Artisan" : "Name in summary"}
                    required
                  />
                </div>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="remove-row-btn"
                  onClick={() => removeRibbon(i)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addRibbon}>
            + Add ribbon
          </button>
          </section>

          <section className="reward-group">
          <h2>XP</h2>
          {xpEntries.map((e, i) => (
            <div className="dynamic-row reward-entry" key={i}>
              <div className="field-heading">XP entry {i + 1}</div>
              <div className="row-inline-2">
                <div>
                  <label htmlFor={`xp-d-${i}`}>Description</label>
                  <input
                    id={`xp-d-${i}`}
                    type="text"
                    value={e.desc}
                    onChange={(ev) => updateXp(i, "desc", ev.target.value)}
                    placeholder="Encounter 1 enemies"
                  />
                </div>
                <div>
                  <label htmlFor={`xp-x-${i}`}>XP amount</label>
                  <input
                    id={`xp-x-${i}`}
                    type="number"
                    value={e.xp}
                    onChange={(ev) => updateXp(i, "xp", ev.target.value)}
                    placeholder="80"
                  />
                </div>
              </div>
              <div className="bonus-group">
                {e.bonuses.length > 0 && e.bonuses.map((b, bi) => (
                  <div className="dynamic-row" key={bi}>
                    <div className="row-inline">
                      <div>
                        <label htmlFor={`xp-b-d-${i}-${bi}`}>Bonus</label>
                        <input
                          id={`xp-b-d-${i}-${bi}`}
                          type="text"
                          value={b.desc}
                          onChange={(ev) =>
                            updateBonus(i, bi, "desc", ev.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor={`xp-b-x-${i}-${bi}`}>Bonus XP</label>
                        <input
                          id={`xp-b-x-${i}-${bi}`}
                          type="number"
                          value={b.xp}
                          onChange={(ev) =>
                            updateBonus(i, bi, "xp", ev.target.value)
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => removeBonus(i, bi)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-row-btn"
                  onClick={() => addBonus(i)}
                >
                  + Add bonus
                </button>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="remove-row-btn"
                  onClick={() => removeXp(i)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addXp}>
            + Add XP entry
          </button>
          </section>

          <section className="reward-group">
          <h2>Loot</h2>
          <label htmlFor="lootStatement">Loot statement</label>
          <input
            id="lootStatement"
            type="text"
            value={lootStatement}
            onChange={(e) => setLootStatement(e.target.value)}
            placeholder="One selection and 10 GP each"
          />
          {loot.map((it, i) => (
            <div className="dynamic-row reward-entry" key={i}>
              <div className="field-heading">Loot item {i + 1}</div>
              <div className="row-inline">
                <div>
                  <label htmlFor={`loot-n-${i}`}>Item name</label>
                  <input
                    id={`loot-n-${i}`}
                    type="text"
                    value={it.name}
                    onChange={(e) => updateLoot(i, "name", e.target.value)}
                    placeholder="Item 1"
                  />
                </div>
                <div>
                  <label htmlFor={`loot-u-${i}`}>URL</label>
                  <input
                    id={`loot-u-${i}`}
                    type="text"
                    value={it.url}
                    onChange={(e) => updateLoot(i, "url", e.target.value)}
                    placeholder="https://example.com/item1"
                  />
                </div>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="remove-row-btn"
                  onClick={() => removeLoot(i)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addLoot}>
            + Add loot item
          </button>
          </section>
        </fieldset>

          <button type="submit" className="generate-btn">Generate Summary</button>
        </form>

        {generatedOutput !== null && <section className="output-section">
          <div className="copy-bar">
            <span className="output-label">Discord summary</span>
            <button
              type="button"
              className={`copy-btn${copied ? " copied" : ""}`}
              onClick={() => void copyOutput(generatedOutput)}
            >
              {copied ? "Copied!" : "Copy summary"}
            </button>
          </div>
          {copyMessage && <p className="copy-notice" role="status">{copyMessage}</p>}
          <pre className="output-pre" aria-label="Discord summary">{generatedOutput}</pre>
        </section>}
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from "react";
import "./App.css";

type Player = { mention: string; name: string };
type Ribbon = { qty: string; emoji: string; label: string };
type XpEntry = { desc: string; xp: string; bonuses: { desc: string; xp: string }[] };
type LootItem = { name: string; url: string };

export default function App() {
  const [gameName, setGameName] = useState("Fight For Your Life!");
  const [eventSummary, setEventSummary] = useState("");

  const [players, setPlayers] = useState<Player[]>([
    { mention: "<@123456789>", name: "Valeros" },
  ]);
  const [ribbons, setRibbons] = useState<Ribbon[]>([
    { qty: "1", emoji: ":ribbon_combat:", label: "Combat" },
  ]);
  const [xpEntries, setXpEntries] = useState<XpEntry[]>([
    { desc: "Encounter 1 enemies", xp: "80", bonuses: [{ desc: "side objective", xp: "30" }] },
  ]);
  const [loot, setLoot] = useState<LootItem[]>([
    { name: "Item 1", url: "https://example.com/item1" },
  ]);
  const [includeReminder, setIncludeReminder] = useState(true);
  const [favorLevel, setFavorLevel] = useState("Minor favor");
  const [favorFaction, setFavorFaction] = useState("Pathfinder Society");
  const [lootStatement, setLootStatement] = useState(
    "One selection and 10 GP each"
  );

  const [openSections, setOpenSections] = useState({
    eventSummary: eventSummary.trim().length > 0,
    favor: Boolean(favorLevel || favorFaction),
    ribbons: ribbons.length > 0,
    loot: loot.length > 0,
  });

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

    const lines: string[] = [];
    lines.push(`# **${normalize(gameName)}**`);
    if (playersBlock) lines.push(playersBlock);
    if (includeReminder) {
      lines.push("**Reset your queue position if you haven't yet!**");
    }
    lines.push("");

    if (eventSummary.trim()) lines.push(eventSummary);
    lines.push("");

    if (favorLevel || favorFaction) {
      lines.push(
        `🎭 **${normalize(favorLevel)}** 🎭 for ${normalize(favorFaction)}`
      );
      lines.push("");
    }

    if (ribbons.length) {
      const ribbonLines = ribbons
        .filter((r) => normalize(r.emoji) && normalize(r.label))
        .map((r) => `${normalize(r.qty)} ${r.emoji} ${normalize(r.label)}`)
      if (ribbonLines.length) {
        lines.push("🎀 **Ribbons** 🎀");
        lines.push(ribbonLines.join("\n"));
        lines.push("");
      }
    }

    if (xpEntries.length) {
      lines.push("⭐ **XP** ⭐");
      lines.push("");
      lines.push("```diff");
      lines.push(buildXpDiff());
      lines.push("```");
      lines.push("");
    }

    if (loot.length) {
      const lootLines = loot
        .filter((it) => normalize(it.name) && normalize(it.url))
        .map((it) => `- [${normalize(it.name)}](<${normalize(it.url)}>)`)
      if (lootLines.length) {
        lines.push("💰 **Loot** 💰");
        if (lootStatement) lines.push(normalize(lootStatement));
        lines.push(lootLines.join("\n"));
        lines.push("");
      }
    }

    return lines.join("\n");
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

  const discordOutput = useMemo(() => buildDiscord(), [buildDiscord]);
  const [copied, setCopied] = useState(false);
  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(discordOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = discordOutput;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (e) {
        console.error("Copy failed", e);
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="app-container">
      <div className="inner-container">
        <div className="app-header">
          <h1>Game Summary</h1>
        </div>

        <section className="form-card">
          <div className="section-title">Game</div>
          <label htmlFor="gameName">Game Name</label>
          <input
            id="gameName"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Fight For Your Life!"
          />
          <button
            type="button"
            className="disclosure-toggle"
            onClick={() =>
              setOpenSections((s) => ({ ...s, eventSummary: !s.eventSummary }))
            }
          >
            {openSections.eventSummary
              ? "Hide"
              : "Show"}
            {" "}event summary &amp; achievements
          </button>
          {openSections.eventSummary && (
            <>
              <label htmlFor="eventSummary">Event summary &amp; achievements</label>
              <textarea
                id="eventSummary"
                value={eventSummary}
                onChange={(e) => setEventSummary(e.target.value)}
                placeholder="Notable moments and achievements..."
              />
            </>
          )}
        </section>

        <section className="form-card">
          <div className="section-title">Players</div>
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
        </section>

        <section className="form-card">
          <div className="section-title">Queue</div>
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
        </section>

        <section className="form-card">
          <details className="disclosure" open={openSections.favor} onToggle={(e) => {
            const isOpen = e.currentTarget.open
            setOpenSections((s) => ({ ...s, favor: isOpen }))
          }}>
            <summary>Favor details (optional)</summary>
            <div>
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
        </section>

        <section className="form-card">
          <details className="disclosure" open={openSections.ribbons} onToggle={(e) => {
            const isOpen = e.currentTarget.open
            setOpenSections((s) => ({ ...s, ribbons: isOpen }))
          }}>
            <summary>Ribbons (optional)</summary>
            <div>
              {ribbons.map((r, i) => (
            <div className="dynamic-row" key={i}>
              <div className="field-heading">Ribbon {i + 1}</div>
              <div className="row-inline-3">
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
                  <label htmlFor={`rb-e-${i}`}>Emoji</label>
                  <input
                    id={`rb-e-${i}`}
                    type="text"
                    value={r.emoji}
                    onChange={(e) =>
                      updateRibbon(i, "emoji", e.target.value)
                    }
                    placeholder=":ribbon_combat:"
                  />
                </div>
                <div>
                  <label htmlFor={`rb-l-${i}`}>Label</label>
                  <input
                    id={`rb-l-${i}`}
                    type="text"
                    value={r.label}
                    onChange={(e) =>
                      updateRibbon(i, "label", e.target.value)
                    }
                    placeholder="Combat"
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
          </div>
          </details>
        </section>

        <section className="form-card">
          <div className="section-title">XP</div>
          {xpEntries.map((e, i) => (
            <div className="dynamic-row" key={i}>
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
              <div>
                <label>
                  Bonus / secondary lines
                  <span className="inline-note"> (one or more)</span>
                </label>
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

        <section className="form-card">
          <details className="disclosure" open={openSections.loot} onToggle={(e) => {
            const isOpen = e.currentTarget.open
            setOpenSections((s) => ({ ...s, loot: isOpen }))
          }}>
            <summary>Loot (optional)</summary>
          <label htmlFor="lootStatement">Loot statement</label>
          <input
            id="lootStatement"
            type="text"
            value={lootStatement}
            onChange={(e) => setLootStatement(e.target.value)}
            placeholder="One selection and 10 GP each"
          />
          {loot.map((it, i) => (
            <div className="dynamic-row" key={i}>
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
          </details>
        </section>

        <section className="output-section">
          <div className="copy-bar">
            <span className="output-label">Discord output</span>
            <button
              type="button"
              className={`copy-btn${copied ? " copied" : ""}`}
              onClick={copyOutput}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
          <textarea
            className="output-box"
            readOnly
            value={discordOutput}
            aria-label="Discord output"
          />

        </section>
      </div>
    </div>
  );
}

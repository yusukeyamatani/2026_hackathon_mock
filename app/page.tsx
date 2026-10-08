"use client";
import { useEffect, useState } from "react";
import {
  create,
  transition,
  names,
  icons,
  bits,
  missions,
  moves,
  pair,
  neighbors,
  solution,
  levels,
  type Kind,
  type State,
} from "../lib/game";
const games: {
  id: Kind;
  title: string;
  en: string;
  icon: string;
  tag: string;
  color: string;
  desc: string;
  rule: string;
}[] = [
  {
    id: "lost",
    title: "ロストリンク",
    en: "LOST LINK",
    icon: "✦",
    tag: "推理 × 共鳴",
    color: "#a5b4fc",
    desc: "8人の中に、あなたと同じ記憶を持つ人がいる。",
    rule: "あなたと3属性が一致する仲間は1人だけ。全体観察で候補を絞り、調査や共鳴テストで確かめよう。誤った指名は2行動消費。",
  },
  {
    id: "sync",
    title: "シンクロエージェント",
    en: "SYNC AGENT",
    icon: "◈",
    tag: "駆け引き × 潜入",
    color: "#7dd3fc",
    desc: "言葉はいらない。同じ任務なら、動きでわかる。",
    rule: "秘密の3手周期に従うと任務得点が増える。3点以上で同任務の仲間を指名しよう。NPCの最初の3手は正直。以降は隠密を交える。任務行動3回で監視が反応し1点失う。隠密で警戒を2下げよう。",
  },
  {
    id: "dungeon",
    title: "バディダンジョン",
    en: "BUDDY DUNGEON",
    icon: "⚑",
    tag: "協力 × パズル",
    color: "#bef264",
    desc: "ひとりでは開かない扉を、ふたりで。",
    rule: "探索者🧑‍🚀だけが鍵を拾える。守護者🐰だけが圧力板を押せる。守護者が板を押している間に、鍵を持った探索者を出口へ。移動→NPC指示の順に1ターン。3ステージに挑戦。",
  },
  {
    id: "element",
    title: "エレメントリンク",
    en: "ELEMENT LINK",
    icon: "ϟ",
    tag: "観察 × バトル",
    color: "#fda4af",
    desc: "隠された属性を見抜いて、ふたりの力を解き放て。",
    rule: "技を観察して同じ属性の仲間と合流すると合体技が解放。敵を倒せば勝利。3ターンごとの大攻撃を防御しよう。NPCは毎ターン援護する。",
  },
  {
    id: "chain",
    title: "仲間チェーン",
    en: "NAKAMA CHAIN",
    icon: "⌘",
    tag: "情報 × 接続",
    color: "#fcd34d",
    desc: "小さなヒントをつないだ先に、ひとつの輪がある。",
    rule: "6人は秘密の輪でつながっている。各人に聞くと両隣の名前がわかる。2枚のカードを選んで線を追加・削除し、正しい6本の輪を完成させよう。接続編集は行動を消費しない。",
  },
];
type Rating = {
  game: Kind;
  fun: number;
  clear: number;
  again: boolean;
  date: number;
};
const dirs = ["↑ 上", "→ 右", "↓ 下", "← 左", "・ 待機", "↗ 追従"];
export default function Home() {
  const [selected, setSelected] = useState<Kind | null>(null);
  const [s, setS] = useState<State | null>(null);
  const [easy, setEasy] = useState(false);
  const [debug, setDebug] = useState(false);
  const [target, setTarget] = useState(1);
  const [attr, setAttr] = useState(0);
  const [npc, setNpc] = useState(4);
  const [first, setFirst] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [compare, setCompare] = useState(false);
  const [fun, setFun] = useState(4);
  const [clear, setClear] = useState(4);
  const [again, setAgain] = useState(true);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("nakama-ratings") ?? "[]");
      if (Array.isArray(data))
        setRatings(
          data.filter(
            (v) =>
              games.some((g) => g.id === v.game) &&
              v.fun >= 1 &&
              v.fun <= 5 &&
              v.clear >= 1 &&
              v.clear <= 5 &&
              typeof v.again === "boolean",
          ),
        );
    } catch {
      setStorageError(true);
    }
  }, []);
  const game = games.find((g) => g.id === selected);
  const act = (type: string, value?: number, t = target, other?: number) =>
    setS((prev) =>
      prev ? transition(prev, { type, value, target: t, other }) : prev,
    );
  function start(stage = 0) {
    if (!selected) return;
    setS(create(selected, Date.now() >>> 0, easy, stage));
    setTarget(1);
    setFirst(null);
    setSaved(false);
  }
  function save() {
    if (!s) return;
    const next = [
      ...ratings,
      { game: s.kind, fun, clear, again, date: Date.now() },
    ];
    try {
      localStorage.setItem("nakama-ratings", JSON.stringify(next));
      setRatings(next);
      setSaved(true);
    } catch {
      setStorageError(true);
    }
  }
  return (
    <main>
      <header>
        <button
          className="brand"
          onClick={() => {
            setSelected(null);
            setS(null);
          }}
        >
          ✳{" "}
          <span>
            NAKAMA<span className="brand-sub">PLAY LAB</span>
          </span>
        </button>
        <span className="header-note">つながりを、あそぼう。</span>
        <button
          className="small"
          onClick={() => {
            setCompare(!compare);
            setSelected(null);
            setS(null);
          }}
        >
          プレイ評価 <span className="dot">{ratings.length}</span>
        </button>
      </header>
      {!selected ? (
        <>
          <section className="hero">
            <div className="eyebrow">
              <span className="status-dot" /> HACKATHON EXPERIMENT / 01
            </div>
            <h1>
              きっと、どこかに。
              <br />
              <span>あなたの仲間がいる。</span>
            </h1>
            <p>
              見抜く。助け合う。つながる。
              <br />
              5つの小さなゲームで、「仲間」の見つけ方を探してみよう。
            </p>
            <div className="hero-meta">
              <span>◉ 1人＋NPCでプレイ</span>
              <span>◷ 1プレイ 3〜5分</span>
              <span>↻ 何度でも挑戦</span>
            </div>
            <div className="orbital" aria-hidden="true">
              <div className="orbit o1" />
              <div className="orbit o2" />
              <div className="planet p1">🧑‍🚀</div>
              <div className="planet p2">🐰</div>
              <div className="planet p3">🦊</div>
              <div className="planet p4">🐸</div>
              <div className="orbit-center">✳</div>
              <span className="orbit-caption">FIND YOUR PEOPLE</span>
            </div>
          </section>
          {compare && (
            <section className="comparison">
              <h2>あなたのプレイノート</h2>
              <p>この端末の評価を比較。遊んでから判断しよう。</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ゲーム</th>
                      <th>件数</th>
                      <th>面白さ</th>
                      <th>わかりやすさ</th>
                      <th>再プレイ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g) => {
                      const r = ratings.filter((v) => v.game === g.id);
                      return (
                        <tr key={g.id}>
                          <td>{g.title}</td>
                          <td>{r.length}</td>
                          <td>
                            {r.length
                              ? (
                                  r.reduce((a, v) => a + v.fun, 0) / r.length
                                ).toFixed(1)
                              : "—"}
                          </td>
                          <td>
                            {r.length
                              ? (
                                  r.reduce((a, v) => a + v.clear, 0) / r.length
                                ).toFixed(1)
                              : "—"}
                          </td>
                          <td>
                            {r.length
                              ? Math.round(
                                  (r.filter((v) => v.again).length / r.length) *
                                    100,
                                ) + "%"
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <section className="library">
            <div className="section-label">
              <h2>どのつながりから、はじめる？</h2>
              <span>CHOOSE YOUR GAME / 05</span>
            </div>
            <div className="game-grid">
              {games.map((g, i) => (
                <button
                  key={g.id}
                  className={"game-card card-" + g.id}
                  style={{ "--accent": g.color } as React.CSSProperties}
                  onClick={() => {
                    setSelected(g.id);
                    setS(null);
                  }}
                >
                  <div className="card-top">
                    <span className="game-number">0{i + 1}</span>
                    <span className="pill">{g.tag}</span>
                  </div>
                  <div className="card-art">
                    <span className="art-ring" />
                    <span className="art-symbol">{g.icon}</span>
                    <span className="art-star">✧</span>
                    <span className="art-mini">{icons[i + 1]}</span>
                  </div>
                  <div className="card-info">
                    <span className="english">{g.en}</span>
                    <h3>{g.title}</h3>
                    <p>{g.desc}</p>
                    <div className="card-bottom">
                      <span>SOLO + NPC</span>
                      <span className="arrow">↗</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <footer>
            <span>NAKAMA PLAY LAB</span>
            <span>正解だけじゃない。好きな遊びを見つけよう。</span>
          </footer>
        </>
      ) : (
        game && (
          <section
            className="play-section"
            style={{ "--accent": game.color } as React.CSSProperties}
          >
            <button
              className="back"
              onClick={() => {
                setSelected(null);
                setS(null);
              }}
            >
              ← ゲーム選択へ
            </button>
            <div className="play-heading">
              <div>
                <div className="eyebrow">{game.en}</div>
                <h1>{game.title}</h1>
              </div>
              <span className="large-symbol">{game.icon}</span>
            </div>
            <p className="rules">{game.rule}</p>
            {!s ? (
              <div className="intro">
                <div className="intro-icons">
                  🧑‍🚀 <span>⋯ ✦ ⋯</span> {icons[1]}
                </div>
                <h2>まだ知らない仲間に、会いにいこう。</h2>
                <p>
                  秘密と配役はプレイごとに変わります。
                  <br />
                  あなたの観察と選択が、出会いの手掛かり。
                </p>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={easy}
                    onChange={(e) => setEasy(e.target.checked)}
                  />{" "}
                  やさしいモード（推理の余裕・NPCのブラフを調整）
                </label>
                <button className="primary" onClick={() => start()}>
                  ゲーム開始 <span>→</span>
                </button>
              </div>
            ) : (
              <>
                <div className="hud">
                  <span>
                    <small>{s.kind === "dungeon" ? "STAGE" : "TURN"}</small>
                    <b>
                      {s.kind === "dungeon"
                        ? `${s.stage + 1} / 3`
                        : s.turn + (s.status === "playing" ? 1 : 0)}
                    </b>
                  </span>
                  <span>
                    <small>残り行動</small>
                    <b>{Math.max(0, s.limit - s.turn)}</b>
                  </span>
                  <span>
                    <small>STATUS</small>
                    <b className="live">
                      {s.status === "playing"
                        ? "プレイ中"
                        : s.status === "won"
                          ? "クリア！"
                          : "終了"}
                    </b>
                  </span>
                  {s.kind === "sync" && (
                    <span>
                      <small>任務得点</small>
                      <b>{s.score} / 3</b>
                    </span>
                  )}
                  {s.kind === "element" && (
                    <span>
                      <small>あなた / 敵 HP</small>
                      <b>
                        {s.hp} / {s.enemy}
                      </b>
                    </span>
                  )}
                </div>
                {s.status === "playing" ? (
                  <>
                    {s.kind === "lost" && (
                      <div className="secret-banner">
                        あなたの秘密：
                        {bits(s.roles[0]).map((v, i) => (
                          <span key={i}>
                            {["紋章", "波長", "方位"][i]}{" "}
                            {["☀ / ☾", "高 / 低", "東 / 西"][i].split(" / ")[v]}
                          </span>
                        ))}
                        <p>3つとも一致する人を探そう。</p>
                      </div>
                    )}
                    {s.kind === "sync" && (
                      <div className="secret-banner">
                        秘密の任務：
                        {missions[s.roles[0]].map((v) => moves[v]).join(" → ")}
                        （繰り返し）
                        <p>
                          監視警戒：{s.exposure} / 3（隠密で−2）／
                          今の任務行動：
                          <strong>
                            {moves[missions[s.roles[0]][s.turn % 3]]}
                          </strong>
                          。同じ任務の仲間を見抜こう。
                        </p>
                      </div>
                    )}
                    {s.kind === "element" && (
                      <div className="secret-banner">
                        あなたの属性：
                        {["🔥 炎", "💧 水", "⚡ 雷", "🍃 風"][s.roles[0]]} ／{" "}
                        {s.linked
                          ? "合体技 解放済み！"
                          : "仲間と合流して共鳴しよう"}
                        <p>
                          次の敵攻撃：
                          {s.turn % 3 === 2
                            ? "⚠ 大攻撃 9ダメージ"
                            : "通常攻撃 3ダメージ"}
                        </p>
                      </div>
                    )}
                    {s.kind !== "dungeon" && (
                      <div
                        className={
                          "characters " +
                          (s.kind === "chain" ? "chain-characters" : "")
                        }
                      >
                        {names
                          .slice(0, s.kind === "chain" ? 6 : 8)
                          .map((n, i) => (
                            <button
                              key={n}
                              aria-pressed={
                                s.kind === "chain" ? first === i : target === i
                              }
                              className={
                                "character " +
                                ((
                                  s.kind === "chain"
                                    ? first === i
                                    : target === i
                                )
                                  ? "selected"
                                  : "")
                              }
                              onClick={() => {
                                if (s.kind === "chain") {
                                  if (first === null) setFirst(i);
                                  else {
                                    act("edge", undefined, first, i);
                                    setFirst(null);
                                  }
                                } else if (i > 0) setTarget(i);
                              }}
                            >
                              <span className="avatar">{icons[i]}</span>
                              <strong>{n}</strong>
                              <span className="character-sub">
                                {i === 0 ? "YOU" : `NPC 0${i}`}
                              </span>
                              {s.kind === "lost" && (
                                <div className="attributes">
                                  {s.known[i].map((v, j) => (
                                    <span key={j}>
                                      {v === null
                                        ? "?"
                                        : ["☀☾", "高低", "東西"][j][v]}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {s.kind === "element" && (
                                <span>
                                  {s.known[i][0] === null
                                    ? "属性 ？？"
                                    : ["🔥 炎", "💧 水", "⚡ 雷", "🍃 風"][
                                        s.known[i][0]!
                                      ]}
                                </span>
                              )}
                              {s.kind === "chain" && s.hints.includes(i) && (
                                <small>
                                  {neighbors(s, i)
                                    .map((v) => names[v])
                                    .join("・")}
                                </small>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                    {s.kind === "lost" && (
                      <div className="controls">
                        <label>
                          調べる属性
                          <select
                            value={attr}
                            onChange={(e) => setAttr(+e.target.value)}
                          >
                            {["紋章", "波長", "方位"].map((v, i) => (
                              <option key={v} value={i}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button onClick={() => act("observe", attr)}>
                          全員を観察
                        </button>
                        <button onClick={() => act("inspect", attr)}>
                          {names[target]}を調査
                        </button>
                        <button onClick={() => act("test")}>共鳴テスト</button>
                        <button
                          className="primary"
                          onClick={() => act("guess")}
                        >
                          {names[target]}を仲間に指名
                        </button>
                      </div>
                    )}
                    {s.kind === "sync" && (
                      <>
                        <div className="controls">
                          {[...moves, "隠密"].map((v, i) => (
                            <button key={v} onClick={() => act("act", i)}>
                              {v}
                              {i === missions[s.roles[0]][s.turn % 3]
                                ? " ＋1点"
                                : ""}
                            </button>
                          ))}
                          <button
                            className="primary"
                            onClick={() => act("guess")}
                          >
                            {names[target]}を指名（3点必要）
                          </button>
                        </div>
                        <div className="table-wrap">
                          <table>
                            <caption>
                              公開行動履歴 — 最初の3手は任務の手掛かり
                            </caption>
                            <thead>
                              <tr>
                                <th>ターン</th>
                                {names.map((n) => (
                                  <th key={n}>{n}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {s.history.map((row, i) => (
                                <tr key={i}>
                                  <td>{i + 1}</td>
                                  {row.map((v, j) => (
                                    <td key={j}>{[...moves, "隠密"][v]}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {!s.history.length && (
                            <p className="empty">
                              行動すると全員の履歴が公開されます。
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {s.kind === "dungeon" && (
                      <div className="dungeon-layout">
                        <div>
                          <div
                            className="map"
                            style={{
                              gridTemplateColumns: `repeat(${levels[s.stage].w},1fr)`,
                            }}
                          >
                            {Array.from(
                              { length: levels[s.stage].w * levels[s.stage].h },
                              (_, i) => (
                                <div
                                  key={i}
                                  className={
                                    "tile " +
                                    (levels[s.stage].walls.includes(i)
                                      ? "wall"
                                      : "") +
                                    (i === levels[s.stage].plate
                                      ? " plate"
                                      : "")
                                  }
                                >
                                  <span>
                                    {i === s.pos
                                      ? "🧑‍🚀"
                                      : i === s.buddy
                                        ? "🐰"
                                        : levels[s.stage].walls.includes(i)
                                          ? ""
                                          : i === levels[s.stage].key && !s.key
                                            ? "🔑"
                                            : i === levels[s.stage].goal
                                              ? "🚪"
                                              : i === levels[s.stage].plate
                                                ? "◉"
                                                : ""}
                                  </span>
                                  {i === s.pos && i === s.buddy && (
                                    <small>🐰</small>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                          <div className="map-legend">
                            🧑‍🚀 探索者　🐰 守護者　🔑 鍵　◉ 圧力板　🚪 出口
                          </div>
                        </div>
                        <div className="dungeon-controls">
                          <h3>ふたりの作戦</h3>
                          <p>
                            鍵：{s.key ? "取得済み ✓" : "未取得"}
                            <br />
                            扉：
                            {s.buddy === levels[s.stage].plate
                              ? "開いている ✓"
                              : "圧力板で開く"}
                          </p>
                          <label>
                            NPCへの指示
                            <select
                              value={npc}
                              onChange={(e) => setNpc(+e.target.value)}
                            >
                              {dirs.map((v, i) => (
                                <option key={v} value={i}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </label>
                          <p>自分の行動を選ぶと、NPCも指示を実行。</p>
                          <div className="direction-buttons">
                            {dirs.slice(0, 5).map((v, i) => (
                              <button
                                key={v}
                                onClick={() => act("move", i, 0, npc)}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {s.kind === "element" && (
                      <div className="controls">
                        <button onClick={() => act("observe")}>
                          {names[target]}の技を観察
                        </button>
                        <button onClick={() => act("link")}>
                          {names[target]}と合流
                        </button>
                        <button onClick={() => act("guard")}>🛡 防御</button>
                        <button
                          className="primary"
                          onClick={() => act("attack")}
                        >
                          {s.linked ? "✦ 合体技" : "属性攻撃"}
                        </button>
                      </div>
                    )}
                    {s.kind === "chain" && (
                      <>
                        <div className="chain-board">
                          <svg
                            viewBox="0 0 400 280"
                            aria-label="現在の接続の輪"
                          >
                            {s.edges.map((e) => {
                              const [a, b] = e.split("-").map(Number);
                              const point = (i: number) => [
                                200 +
                                  110 *
                                    Math.cos((i * Math.PI) / 3 - Math.PI / 2),
                                140 +
                                  105 *
                                    Math.sin((i * Math.PI) / 3 - Math.PI / 2),
                              ];
                              const p = point(a),
                                q = point(b);
                              return (
                                <line
                                  key={e}
                                  x1={p[0]}
                                  y1={p[1]}
                                  x2={q[0]}
                                  y2={q[1]}
                                  stroke="var(--accent)"
                                  strokeWidth="3"
                                />
                              );
                            })}
                            {names.slice(0, 6).map((n, i) => (
                              <text
                                key={n}
                                x={
                                  200 +
                                  110 *
                                    Math.cos((i * Math.PI) / 3 - Math.PI / 2)
                                }
                                y={
                                  145 +
                                  105 *
                                    Math.sin((i * Math.PI) / 3 - Math.PI / 2)
                                }
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                              >
                                {n}
                              </text>
                            ))}
                          </svg>
                          <div>
                            <h3>
                              {first === null
                                ? "2人を選んでつなごう"
                                : `${names[first]}とつなぐ相手を選択`}
                            </h3>
                            <p>同じ2人を選ぶと線を削除できます。</p>
                            <div className="controls">
                              {names.slice(0, 6).map((n, i) => (
                                <button
                                  key={n}
                                  disabled={s.hints.includes(i)}
                                  onClick={() => act("hint", undefined, i)}
                                >
                                  {n}に聞く
                                </button>
                              ))}
                            </div>
                            <button
                              className="primary"
                              onClick={() => act("check")}
                            >
                              つながりを判定（{s.edges.length} / 6本）
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className={"result " + s.status} role="status">
                    <div className="result-symbol">
                      {s.status === "won" ? "✦" : "☾"}
                    </div>
                    <div className="eyebrow">
                      {s.status === "won" ? "LINK COMPLETE" : "TRY ANOTHER WAY"}
                    </div>
                    <h2>
                      {s.status === "won"
                        ? "つながった！"
                        : "次は、きっと見つかる。"}
                    </h2>
                    <p>{s.reason}</p>
                    {["lost", "sync", "element"].includes(s.kind) && (
                      <p>
                        正解の仲間：{icons[pair(s)]} {names[pair(s)]}
                      </p>
                    )}
                    {s.kind === "chain" && (
                      <p>
                        正しい輪：{s.order.map((i) => names[i]).join(" → ")} →{" "}
                        {names[s.order[0]]}
                      </p>
                    )}
                    <div className="controls">
                      {s.kind === "dungeon" &&
                        s.status === "won" &&
                        s.stage < 2 && (
                          <button
                            className="primary"
                            onClick={() => start(s.stage + 1)}
                          >
                            次のステージ →
                          </button>
                        )}
                      <button onClick={() => start(s.stage)}>リトライ</button>
                      <button
                        onClick={() => {
                          setS(null);
                          setSelected(null);
                        }}
                      >
                        ゲーム選択へ
                      </button>
                    </div>
                    <div className="rating">
                      <h3>この遊び、どうだった？</h3>
                      <div className="rating-fields">
                        <label>
                          面白さ
                          <select
                            value={fun}
                            onChange={(e) => setFun(+e.target.value)}
                          >
                            {[1, 2, 3, 4, 5].map((v) => (
                              <option key={v} value={v}>
                                {v} / 5
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          ルールの分かりやすさ
                          <select
                            value={clear}
                            onChange={(e) => setClear(+e.target.value)}
                          >
                            {[1, 2, 3, 4, 5].map((v) => (
                              <option key={v} value={v}>
                                {v} / 5
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          もう一度遊びたい？
                          <select
                            value={again ? "yes" : "no"}
                            onChange={(e) => setAgain(e.target.value === "yes")}
                          >
                            <option value="yes">はい</option>
                            <option value="no">いいえ</option>
                          </select>
                        </label>
                      </div>
                      <button disabled={saved} onClick={save}>
                        {saved
                          ? "評価を保存しました ✓"
                          : "この端末に評価を保存"}
                      </button>
                      {storageError && (
                        <p>
                          保存領域にアクセスできません。ブラウザの設定をご確認ください。
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {s.logs.length > 0 && (
                  <details className="log" open>
                    <summary>
                      冒険ログ <span>{s.logs.length}</span>
                    </summary>
                    {s.logs
                      .filter(
                        (v) =>
                          s.kind !== "sync" ||
                          (!v.includes("任務周期") && !v.includes("余裕")),
                      )
                      .slice(-8)
                      .reverse()
                      .map((v, i) => (
                        <p key={i}>{v}</p>
                      ))}
                  </details>
                )}
                {process.env.NODE_ENV === "development" && (
                  <div className="debug">
                    <label>
                      <input
                        type="checkbox"
                        checked={debug}
                        onChange={(e) => setDebug(e.target.checked)}
                      />{" "}
                      開発モード：秘密と判断理由を表示
                    </label>
                    {debug && (
                      <pre>
                        {JSON.stringify({ answer: pair(s), state: s }, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )
      )}
    </main>
  );
}

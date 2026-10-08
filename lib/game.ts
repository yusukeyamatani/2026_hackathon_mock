export type Kind = "lost" | "sync" | "dungeon" | "element" | "chain";
export const names = [
  "あなた",
  "ルナ",
  "カイ",
  "ミオ",
  "ソラ",
  "ネネ",
  "レン",
  "ハル",
];
export const icons = ["🧑‍🚀", "🐰", "🦊", "🐱", "🐻", "🐼", "🐸", "🐧"];
export const missions = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 2, 1],
];
export const moves = ["探索", "通信", "護衛"];
export function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function shuffle<T>(a: T[], r: () => number) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const levels = [
  {
    w: 5,
    h: 4,
    walls: [7, 12],
    start: 0,
    buddy: 15,
    plate: 16,
    key: 4,
    goal: 19,
  },
  {
    w: 5,
    h: 5,
    walls: [6, 7, 11, 17],
    start: 0,
    buddy: 20,
    plate: 21,
    key: 9,
    goal: 24,
  },
  {
    w: 6,
    h: 5,
    walls: [7, 8, 13, 16, 22],
    start: 0,
    buddy: 24,
    plate: 25,
    key: 5,
    goal: 29,
  },
];
export type State = {
  kind: Kind;
  seed: number;
  easy: boolean;
  actor: number;
  turn: number;
  limit: number;
  status: "playing" | "won" | "lost";
  reason: string;
  roles: number[];
  known: (number | null)[][];
  logs: string[];
  history: number[][];
  score: number;
  exposure: number;
  npcScores: number[];
  hp: number;
  enemy: number;
  linked: boolean;
  edges: string[];
  hints: number[];
  order: number[];
  stage: number;
  pos: number;
  buddy: number;
  key: boolean;
};
export type Action = {
  type: string;
  target?: number;
  value?: number;
  other?: number;
  actor?: number;
};
export function create(
  kind: Kind,
  seed: number,
  easy = false,
  stage = 0,
): State {
  const r = random(seed);
  const roles = shuffle([0, 0, 1, 1, 2, 2, 3, 3], r);
  const l = levels[stage];
  return {
    kind,
    seed,
    easy,
    actor: 0,
    turn: 0,
    limit:
      kind === "lost"
        ? easy
          ? 14
          : 10
        : kind === "dungeon"
          ? easy
            ? 60
            : 45
          : kind === "chain"
            ? easy
              ? 12
              : 10
            : kind === "element"
              ? easy
                ? 20
                : 16
              : 8,
    status: "playing",
    reason: "",
    roles,
    known: Array.from({ length: 8 }, () => [null, null, null]),
    logs: [],
    history: [],
    score: 0,
    exposure: 0,
    npcScores: Array(8).fill(0),
    hp: 42,
    enemy: 36,
    linked: false,
    edges: [],
    hints: [],
    order: shuffle([0, 1, 2, 3, 4, 5], r),
    stage,
    pos: l.start,
    buddy: l.buddy,
    key: false,
  };
}
export function pair(s: State) {
  return s.roles.findIndex((v, i) => i !== 0 && v === s.roles[0]);
}
export function bits(role: number) {
  return [role & 1, (role >> 1) & 1, (role & 1) ^ ((role >> 1) & 1)];
}
export function edge(a: number, b: number) {
  return [a, b].sort((x, y) => x - y).join("-");
}
export function solution(s: State) {
  return s.order.map((v, i) => edge(v, s.order[(i + 1) % 6]));
}
export function neighbors(s: State, id: number) {
  const i = s.order.indexOf(id);
  return [s.order[(i + 5) % 6], s.order[(i + 1) % 6]];
}
export function stepPosition(p: number, d: number, l: (typeof levels)[number]) {
  const x = p % l.w,
    y = Math.floor(p / l.w);
  const [dx, dy] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ][d] ?? [0, 0];
  const nx = x + dx,
    ny = y + dy;
  const n = ny * l.w + nx;
  return nx < 0 || nx >= l.w || ny < 0 || ny >= l.h || l.walls.includes(n)
    ? p
    : n;
}
function follow(from: number, to: number, l: (typeof levels)[number]) {
  const q = [from],
    seen = new Set(q),
    first = new Map<number, number>();
  while (q.length) {
    const p = q.shift()!;
    for (let d = 0; d < 4; d++) {
      const n = stepPosition(p, d, l);
      if (seen.has(n)) continue;
      seen.add(n);
      first.set(n, p === from ? n : first.get(p)!);
      if (n === to) return first.get(n)!;
      q.push(n);
    }
  }
  return from;
}
export function transition(state: State, a: Action): State {
  if (state.status !== "playing" || (a.actor ?? 0) !== state.actor)
    return state;
  const t = a.target ?? 1;
  if (!Number.isInteger(t) || t < 0 || t >= (state.kind === "chain" ? 6 : 8))
    return state;
  if (
    ["guess", "inspect", "test", "observe", "link"].includes(a.type) &&
    state.kind !== "chain" &&
    t === 0
  )
    return state;
  const s = structuredClone(state);
  let cost = 1;
  const win = (reason: string) => {
    s.status = "won";
    s.reason = reason;
  };
  if (s.kind === "lost") {
    if (a.type === "observe") {
      const v = a.value ?? 0;
      s.known.forEach((k, i) => (k[v] = bits(s.roles[i])[v]));
      s.logs.push(`全員の${["紋章", "波長", "方位"][v]}を観察した`);
    } else if (a.type === "inspect") {
      const v = a.value ?? 0;
      s.known[t][v] = bits(s.roles[t])[v];
      s.logs.push(`${names[t]}の属性を調査`);
    } else if (a.type === "test") {
      const n = bits(s.roles[t]).filter(
        (v, i) => v === bits(s.roles[0])[i],
      ).length;
      s.logs.push(`${names[t]}との共鳴：${n}/3 属性一致`);
    } else if (a.type === "guess") {
      if (t === pair(s)) win("3属性がすべて一致。ロストリンクが再接続された！");
      else {
        cost = 2;
        s.logs.push(`${names[t]}は別のリンク。誤答で2行動消費`);
      }
    } else return state;
  } else if (s.kind === "sync") {
    if (a.type === "guess") {
      if (s.score < 3) {
        s.logs.push("任務得点が3点必要です");
        cost = 0;
      } else if (t === pair(s))
        win("任務3点を達成し、同じ周期の仲間を特定した！");
      else s.logs.push(`${names[t]}は違う任務。1ターン消費`);
    } else if (a.type === "act") {
      const desired = missions[s.roles[0]][s.turn % 3];
      const value = a.value ?? 3;
      if (value === desired) {
        s.score++;
        s.exposure++;
      } else if (value === 3) s.exposure = Math.max(0, s.exposure - 2);
      if (s.exposure >= 3) {
        s.score = Math.max(0, s.score - 1);
        s.exposure = 0;
        s.logs.push(
          "同じ任務への連続行動で監視が反応！任務得点 −1。隠密を挟もう",
        );
      }
      const row = [value];
      for (let i = 1; i < 8; i++) {
        const honest = missions[s.roles[i]][s.turn % 3];
        const bluff =
          s.turn >= 3 &&
          s.npcScores[i] >= 3 &&
          !s.easy &&
          (s.turn + i + s.seed) % 4 === 0;
        row.push(bluff ? 3 : honest);
        if (!bluff) s.npcScores[i]++;
        s.logs.push(
          `${names[i]}：${bluff ? "任務進捗に余裕があり隠密" : "自分の任務周期を優先"}`,
        );
      }
      s.history.push(row);
    } else return state;
  } else if (s.kind === "dungeon") {
    if (a.type !== "move") return state;
    const l = levels[s.stage];
    s.pos = stepPosition(s.pos, a.value ?? 4, l);
    if (s.pos === l.key) s.key = true;
    s.buddy =
      a.other === 5
        ? follow(s.buddy, s.pos, l)
        : stepPosition(s.buddy, a.other ?? 4, l);
    if (s.pos === l.goal && s.key && s.buddy === l.plate)
      win("探索者が鍵を運び、守護者が扉を開いた！");
    s.logs.push(
      s.buddy === l.plate
        ? "守護者が圧力板を保持中"
        : "守護者は指示に従って移動",
    );
  } else if (s.kind === "element") {
    if (a.type === "observe") {
      s.known[t][0] = s.roles[t];
      s.logs.push(
        `${names[t]}は${["炎", "水", "雷", "風"][s.roles[t]]}の技を使った`,
      );
    } else if (a.type === "link") {
      if (t === pair(s)) {
        s.linked = true;
        s.logs.push("共鳴成功！合体技が解放");
      } else s.logs.push("属性が違う。合流失敗");
    } else if (a.type === "attack") {
      s.enemy -= s.linked ? 14 : 5;
      s.logs.push(s.linked ? "合体技！14ダメージ" : "属性攻撃！5ダメージ");
    } else if (a.type !== "guard") return state;
    const npcDamage = 1;
    s.enemy -= npcDamage;
    s.logs.push("NPCたちが自属性の技で援護：1ダメージ");
    if (s.enemy <= 0) {
      s.enemy = 0;
      win("仲間の力でエクリプスを撃破！");
    } else {
      const damage = s.turn % 3 === 2 ? 9 : 3;
      s.hp -= a.type === "guard" ? 1 : damage;
      s.logs.push(`敵の攻撃：${a.type === "guard" ? 1 : damage}ダメージ`);
      if (s.hp <= 0) {
        s.hp = 0;
        s.status = "lost";
        s.reason = "体力が尽きた。大攻撃の予告に合わせて防御しよう。";
      }
    }
  } else if (s.kind === "chain") {
    if (a.type === "hint") {
      if (s.hints.includes(t)) return state;
      s.hints.push(t);
      s.logs.push(
        `${names[t]}の両隣は ${neighbors(s, t)
          .map((i) => names[i])
          .join("・")}`,
      );
    } else if (a.type === "edge") {
      if (t === a.other) return state;
      const e = edge(t, a.other ?? 0);
      s.edges = s.edges.includes(e)
        ? s.edges.filter((v) => v !== e)
        : [...s.edges, e];
      cost = 0;
    } else if (a.type === "check") {
      const answer = solution(s);
      if (s.edges.length === 6 && s.edges.every((e) => answer.includes(e)))
        win("6人の秘密の輪がつながった！");
      else s.logs.push(`接続が違います。現在${s.edges.length}本／必要6本`);
    } else return state;
  }
  s.turn += cost;
  if (s.status === "playing" && s.turn >= s.limit) {
    s.status = "lost";
    s.reason = "行動回数を使い切った。集めた情報から次の作戦を考えよう。";
  }
  return s;
}

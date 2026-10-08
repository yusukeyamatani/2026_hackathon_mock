import { test } from "node:test";
import assert from "node:assert/strict";
import {
  create,
  transition,
  pair,
  bits,
  missions,
  levels,
  stepPosition,
  solution,
  type State,
} from "../lib/game";
function solveDungeon(s: State) {
  const l = levels[s.stage];
  const queue: [number, number, boolean, number[][]][] = [
    [s.pos, s.buddy, false, []],
  ];
  const seen = new Set<string>();
  while (queue.length) {
    const [p, b, k, path] = queue.shift()!;
    if (p === l.goal && b === l.plate && k) return path;
    for (let d = 0; d < 5; d++)
      for (let e = 0; e < 5; e++) {
        const np = stepPosition(p, d, l),
          nb = stepPosition(b, e, l),
          nk = k || np === l.key;
        const id = `${np},${nb},${nk}`;
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push([np, nb, nk, [...path, [d, e]]]);
      }
  }
  throw Error("unsolvable");
}
for (const seed of [13, 47, 93]) {
  test(`lost ${seed}: logical solution, wrong answer, reset`, () => {
    let s = create("lost", seed);
    for (let v = 0; v < 3; v++)
      s = transition(s, { type: "observe", value: v });
    const candidate = s.known.findIndex(
      (k, i) => i > 0 && k.every((v, j) => v === bits(s.roles[0])[j]),
    );
    assert.equal(candidate, pair(s));
    assert.equal(
      transition(s, { type: "guess", target: candidate }).status,
      "won",
    );
    const wrong = s.roles.findIndex((v, i) => i > 0 && v !== s.roles[0]);
    assert.equal(transition(s, { type: "guess", target: wrong }).turn, 5);
    assert.deepEqual(create("lost", seed).known[0], [null, null, null]);
  });
  test(`sync ${seed}: infer from public actions`, () => {
    let s = create("sync", seed);
    for (let v = 0; v < 3; v++)
      s = transition(s, {
        type: "act",
        value: missions[s.roles[0]][s.turn % 3],
      });
    const found = s.roles.findIndex(
      (_, i) =>
        i > 0 &&
        s.history.every((row, t) => row[i] === missions[s.roles[0]][t]),
    );
    assert.equal(found, pair(s));
    assert.equal(s.score, 2);
    s = transition(s, { type: "act", value: missions[s.roles[0]][s.turn % 3] });
    assert.equal(transition(s, { type: "guess", target: found }).status, "won");
    assert.equal(create("sync", seed).history.length, 0);
    let lose = create("sync", seed);
    for (let n = 0; n < 8; n++)
      lose = transition(lose, { type: "act", value: 3 });
    assert.equal(lose.status, "lost");
  });
  test(`dungeon ${seed}: all 3 stages, essential cooperation`, () => {
    for (let stage = 0; stage < 3; stage++) {
      let s = create("dungeon", seed, false, stage);
      const path = solveDungeon(s);
      assert.ok(path.length < 45);
      for (const [value, other] of path)
        s = transition(s, { type: "move", value, other });
      assert.equal(s.status, "won");
      assert.equal(s.buddy, levels[stage].plate);
      assert.ok(s.key);
      assert.equal(transition(s, { type: "move" }).status, "won");
      assert.equal(create("dungeon", seed, false, stage).key, false);
      let fail = create("dungeon", seed, false, stage);
      for (let i = 0; i < 45; i++)
        fail = transition(fail, { type: "move", value: 4, other: 4 });
      assert.equal(fail.status, "lost");
    }
  });
  test(`element ${seed}: infer without secret access, defend, retry`, () => {
    let s = create("element", seed);
    let target = 1;
    while (s.status === "playing" && !s.linked) {
      if (s.turn % 3 === 2) {
        s = transition(s, { type: "guard" });
        continue;
      }
      if (s.known[target][0] === s.roles[0])
        s = transition(s, { type: "link", target });
      else {
        s = transition(s, { type: "observe", target });
        if (s.known[target][0] !== s.roles[0]) target++;
      }
    }
    while (s.status === "playing")
      s = transition(s, { type: s.turn % 3 === 2 ? "guard" : "attack" });
    assert.equal(s.status, "won");
    assert.equal(create("element", seed).linked, false);
    let lose = create("element", seed);
    while (lose.status === "playing")
      lose = transition(lose, { type: "observe", target: 1 });
    assert.equal(lose.status, "lost");
  });
  test(`chain ${seed}: full clues sufficient, editable edges, retry`, () => {
    let s = create("chain", seed);
    for (let i = 0; i < 6; i++) s = transition(s, { type: "hint", target: i });
    for (const e of solution(s)) {
      const [target, other] = e.split("-").map(Number);
      s = transition(s, { type: "edge", target, other });
    }
    s = transition(s, { type: "check" });
    assert.equal(s.status, "won");
    assert.deepEqual(create("chain", seed).edges, []);
  });
}
test("actions cannot mutate state or impersonate another actor", () => {
  const s = create("lost", 7);
  assert.equal(transition(s, { type: "observe", actor: 1 }), s);
  transition(s, { type: "observe" });
  assert.equal(s.turn, 0);
});
test("sync: concealment avoids surveillance penalty", () => {
  let s = create("sync", 12);
  for (let i = 0; i < 2; i++)
    s = transition(s, { type: "act", value: missions[s.roles[0]][s.turn % 3] });
  assert.equal(s.exposure, 2);
  s = transition(s, { type: "act", value: 3 });
  assert.equal(s.exposure, 0);
  s = transition(s, { type: "act", value: missions[s.roles[0]][s.turn % 3] });
  assert.equal(s.score, 3);
});
test("lost and chain: depleted budget is defeat, wrong chain remains editable", () => {
  let l = create("lost", 12);
  while (l.status === "playing") l = transition(l, { type: "test", target: 1 });
  assert.equal(l.status, "lost");
  let c = create("chain", 12);
  c = transition(c, { type: "edge", target: 0, other: 1 });
  c = transition(c, { type: "edge", target: 0, other: 1 });
  assert.equal(c.edges.length, 0);
  while (c.status === "playing") c = transition(c, { type: "check" });
  assert.equal(c.status, "lost");
});

// Tests for the generator-based merge-sort engine in js/sort.js.
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { SongSort, expectedComparisons } from "../js/sort.js";

// Drive a sort to completion using a synchronous decide(left, right) callback.
// Returns -1, 0, or 1 (left wins, tie, right wins).
function runSort(items, decide) {
  const sort = new SongSort(items);
  let safety = 0;
  while (!sort.isDone()) {
    if (++safety > 10_000) throw new Error("sort did not terminate");
    sort.choose(decide(sort.currentLeft(), sort.currentRight()));
  }
  return sort;
}

const item = (id) => ({ id });

// ───────── Edge cases ─────────

test("empty input is done immediately", () => {
  const sort = new SongSort([]);
  assert.equal(sort.isDone(), true);
  assert.deepEqual(sort.results(), []);
  assert.equal(sort.progress(), 100);
});

test("single item is done immediately, ranked 1", () => {
  const sort = new SongSort([item("A")]);
  assert.equal(sort.isDone(), true);
  const r = sort.results();
  assert.equal(r.length, 1);
  assert.deepEqual(r[0], { rank: 1, item: { id: "A" } });
});

test("two items, left wins", () => {
  const sort = runSort(
    [
      item("A"),
      item("B"),
    ],
    () => -1,
  );
  assert.deepEqual(
    sort.results().map((r) => `${r.rank}:${r.item.id}`),
    [
      "1:A",
      "2:B",
    ],
  );
});

test("two items, right wins", () => {
  const sort = runSort(
    [
      item("A"),
      item("B"),
    ],
    () => 1,
  );
  assert.deepEqual(
    sort.results().map((r) => `${r.rank}:${r.item.id}`),
    [
      "1:B",
      "2:A",
    ],
  );
});

test("two items, tie produces shared rank 1", () => {
  const sort = runSort(
    [
      item("A"),
      item("B"),
    ],
    () => 0,
  );
  assert.deepEqual(
    sort.results().map((r) => `${r.rank}:${r.item.id}`),
    [
      "1:A",
      "1:B",
    ],
  );
});

// ───────── Algorithmic correctness ─────────

test("ascending preference yields original order (full ranking)", () => {
  const items = [
    "A",
    "B",
    "C",
    "D",
    "E",
  ].map((id) => ({ id, v: id.charCodeAt(0) }));
  const sort = runSort(items, (l, r) => (l.v < r.v ? -1 : 1));
  assert.deepEqual(
    sort.results().map((r) => r.item.id),
    [
      "A",
      "B",
      "C",
      "D",
      "E",
    ],
  );
});

test("descending preference reverses order", () => {
  const items = [
    "A",
    "B",
    "C",
    "D",
    "E",
  ].map((id) => ({ id, v: id.charCodeAt(0) }));
  const sort = runSort(items, (l, r) => (l.v < r.v ? 1 : -1));
  assert.deepEqual(
    sort.results().map((r) => r.item.id),
    [
      "E",
      "D",
      "C",
      "B",
      "A",
    ],
  );
});

test("all ties produce all rank 1", () => {
  const sort = runSort(
    [
      "A",
      "B",
      "C",
      "D",
    ].map(item),
    () => 0,
  );
  const r = sort.results();
  assert.equal(r.length, 4);
  assert.ok(r.every((x) => x.rank === 1));
});

test("larger sort: 10 items deterministic ranking", () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i, v: i }));
  const sort = runSort(items, (l, r) => r.v - l.v); // higher v wins
  assert.deepEqual(
    sort.results().map((r) => r.item.id),
    [
      9,
      8,
      7,
      6,
      5,
      4,
      3,
      2,
      1,
      0,
    ],
  );
});

test("competition ranking: tie group then continue", () => {
  // Setup: A=B at rank 1, C at rank 3 (2-way tie skips a rank).
  // First the inner merge of [A] vs [B] -> tie. Then merge [A,B] vs [C] with A vs C: C wins.
  const sort = new SongSort([
    item("A"),
    item("B"),
    item("C"),
  ]);
  // First comparison: A vs B (top-down split: ceil(3/2)=2, so [A,B] | [C], inner first)
  assert.equal(sort.currentLeft().id, "A");
  assert.equal(sort.currentRight().id, "B");
  sort.choose(0); // tie A=B
  // Now A vs C
  assert.equal(sort.currentLeft().id, "A");
  assert.equal(sort.currentRight().id, "C");
  sort.choose(1); // C wins
  assert.equal(sort.isDone(), true);
  assert.deepEqual(
    sort.results().map((r) => `${r.rank}:${r.item.id}`),
    [
      "1:C",
      "2:A",
      "2:B",
    ],
  );
});

test("tie auto-consume: tied chain on the winning side flows without re-asking", () => {
  // [A,B,C,D]: tie A=B, tie C=D, then A vs C: pick A.
  // Auto-consume should pull B (because equalData[A]=B) without asking A vs ?.
  const items = [
    "A",
    "B",
    "C",
    "D",
  ].map(item);
  const sort = new SongSort(items);
  // Order with my generator: [[A,B],[C,D]]; inner merges first.
  assert.equal(sort.currentLeft().id, "A");
  assert.equal(sort.currentRight().id, "B");
  sort.choose(0); // tie A=B
  assert.equal(sort.currentLeft().id, "C");
  assert.equal(sort.currentRight().id, "D");
  sort.choose(0); // tie C=D
  // Outer merge [A,B] vs [C,D]
  assert.equal(sort.currentLeft().id, "A");
  assert.equal(sort.currentRight().id, "C");
  sort.choose(-1); // A wins
  // After A wins, auto-consume B (equalData[A]=B). Now left empty. Drain right: C,D.
  assert.equal(sort.isDone(), true);
  assert.deepEqual(
    sort.results().map((r) => `${r.rank}:${r.item.id}`),
    [
      "1:A",
      "1:B",
      "3:C",
      "3:D",
    ],
  );
});

// ───────── Undo ─────────

test("undo returns false when there is no history", () => {
  const sort = new SongSort([
    item("A"),
    item("B"),
  ]);
  assert.equal(sort.undo(), false);
});

test("undo restores the previous comparison pair", () => {
  const items = [
    "A",
    "B",
    "C",
    "D",
  ].map(item);
  const sort = new SongSort(items);

  const firstPair = { l: sort.currentLeft().id, r: sort.currentRight().id };
  sort.choose(-1);
  const secondPair = { l: sort.currentLeft().id, r: sort.currentRight().id };
  sort.choose(1);
  const thirdPair = { l: sort.currentLeft().id, r: sort.currentRight().id };

  assert.equal(sort.undo(), true);
  assert.equal(sort.currentLeft().id, secondPair.l);
  assert.equal(sort.currentRight().id, secondPair.r);

  assert.equal(sort.undo(), true);
  assert.equal(sort.currentLeft().id, firstPair.l);
  assert.equal(sort.currentRight().id, firstPair.r);

  // sanity: we didn't accidentally see thirdPair earlier
  assert.notEqual(thirdPair.l + thirdPair.r, firstPair.l + firstPair.r);
});

test("undo all the way back to the start", () => {
  const items = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
  ].map((id) => ({ id, v: id.charCodeAt(0) }));
  const sort = runSort(items, (l, r) => (l.v < r.v ? -1 : 1));
  assert.equal(sort.isDone(), true);

  let undos = 0;
  while (sort.undo()) undos++;
  assert.equal(sort.isDone(), false);
  assert.equal(sort.battle, 1);
  assert.equal(sort.completed, 0);
  assert.equal(sort.history.length, 0);
  // We unraveled exactly the number of comparisons that were made.
  assert.ok(undos > 0);
});

test("undo then re-choose yields a different outcome", () => {
  const sort = new SongSort([
    item("A"),
    item("B"),
  ]);
  sort.choose(-1);
  assert.deepEqual(
    sort.results().map((r) => r.item.id),
    [
      "A",
      "B",
    ],
  );
  sort.undo();
  sort.choose(1);
  assert.deepEqual(
    sort.results().map((r) => r.item.id),
    [
      "B",
      "A",
    ],
  );
});

test("undo through a tie clears the equal link", () => {
  const sort = new SongSort([
    item("A"),
    item("B"),
    item("C"),
  ]);
  sort.choose(0); // tie A=B
  sort.choose(1); // C wins
  // Tied result: 1:C, 2:A, 2:B
  assert.deepEqual(
    sort.results().map((r) => r.rank),
    [
      1,
      2,
      2,
    ],
  );
  sort.undo(); // undo the C-win
  sort.undo(); // undo the tie
  // Re-do without ties: A>B, A>C, B>C — three comparisons for [A,B,C].
  sort.choose(-1);
  sort.choose(-1);
  sort.choose(-1);
  assert.deepEqual(
    sort.results().map((r) => `${r.rank}:${r.item.id}`),
    [
      "1:A",
      "2:B",
      "3:C",
    ],
  );
});

// ───────── State / progress ─────────

test("battle increments on each choice, decrements on undo", () => {
  const sort = new SongSort(
    [
      "A",
      "B",
      "C",
    ].map(item),
  );
  assert.equal(sort.battle, 1);
  sort.choose(-1);
  assert.equal(sort.battle, 2);
  sort.choose(0);
  assert.equal(sort.battle, 3);
  sort.undo();
  assert.equal(sort.battle, 2);
});

test("history exposes choices array length", () => {
  const sort = new SongSort(
    [
      "A",
      "B",
      "C",
    ].map(item),
  );
  assert.equal(sort.history.length, 0);
  sort.choose(-1);
  assert.equal(sort.history.length, 1);
  sort.choose(0);
  assert.equal(sort.history.length, 2);
  sort.undo();
  assert.equal(sort.history.length, 1);
});

test("progress reaches 100% when done", () => {
  const sort = runSort(
    [
      "A",
      "B",
      "C",
      "D",
      "E",
    ].map(item),
    () => -1,
  );
  assert.equal(sort.isDone(), true);
  assert.equal(sort.progress(), 100);
});

test("progress is monotonically non-decreasing during a sort", () => {
  const items = Array.from({ length: 16 }, (_, i) => ({ id: i, v: i }));
  const sort = new SongSort(items);
  let prev = sort.progress();
  while (!sort.isDone()) {
    sort.choose(-1);
    const cur = sort.progress();
    assert.ok(cur >= prev, `progress went backward: ${prev} -> ${cur}`);
    prev = cur;
  }
});

// Regression: progress() previously divided choices made by worst-case comparisons.
// A tie auto-consumes both sides (and chains through equal-links), so an all-tie
// sort completes in n-1 comparisons against a denominator of ~n·log(n). For n=8
// the visible bar capped at 6/17 = 35% before the final click jumped it to 100%.
// The placement-based metric measures total work, so ties advance the bar in
// proportion to items placed and it climbs steadily before completion.
test("all-tie sort: progress climbs past the comparison-only ceiling before completion", () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ id: i }));
  const sort = new SongSort(items);
  let maxBeforeDone = 0;
  while (!sort.isDone()) {
    sort.choose(0);
    if (!sort.isDone()) {
      maxBeforeDone = Math.max(maxBeforeDone, sort.progress());
    }
  }
  assert.ok(
    maxBeforeDone >= 50,
    `expected progress to climb past 50% before final click; saw max ${maxBeforeDone}%`,
  );
});

test("expectedComparisons matches recurrence T(n) = T(ceil(n/2)) + T(floor(n/2)) + (n - 1)", () => {
  assert.equal(expectedComparisons(0), 0);
  assert.equal(expectedComparisons(1), 0);
  assert.equal(expectedComparisons(2), 1); // T(1)+T(1)+1 = 1
  assert.equal(expectedComparisons(3), 3); // T(2)+T(1)+2 = 1+0+2 = 3
  assert.equal(expectedComparisons(4), 5); // T(2)+T(2)+3 = 1+1+3 = 5
  assert.equal(expectedComparisons(8), 17); // 2*T(4)+7 = 10+7 = 17
});

test("currentLeft/currentRight return null when done", () => {
  const sort = new SongSort([item("A")]);
  assert.equal(sort.currentLeft(), null);
  assert.equal(sort.currentRight(), null);
});

test("results() returns null while still in progress", () => {
  const sort = new SongSort(
    [
      "A",
      "B",
      "C",
    ].map(item),
  );
  assert.equal(sort.results(), null);
});

test("choose() after done is a no-op", () => {
  const sort = new SongSort([item("A")]);
  assert.equal(sort.isDone(), true);
  sort.choose(-1);
  assert.equal(sort.history.length, 0);
});

// ───────── Items pass through unchanged ─────────

test("results preserve full item objects, not just titles", () => {
  const items = [
    { id: "A", title: "Alpha", album: "X" },
    { id: "B", title: "Beta", album: "Y" },
  ];
  const sort = runSort(items, () => -1);
  const r = sort.results();
  assert.deepEqual(r[0].item, items[0]);
  assert.deepEqual(r[1].item, items[1]);
});

// ───────── Stress: deterministic large input ─────────

test("sorts 50 items deterministically", () => {
  const n = 50;
  const items = Array.from({ length: n }, (_, i) => ({ id: i, v: (i * 17) % n }));
  // Sort by v ascending. Two items can have the same v? With (i*17)%50, gcd(17,50)=1 so all unique.
  const sort = runSort(items, (l, r) => l.v - r.v);
  const ranks = sort.results().map((r) => r.item.v);
  // Check ordered ascending by v.
  for (let i = 1; i < ranks.length; i++) assert.ok(ranks[i] >= ranks[i - 1]);
});

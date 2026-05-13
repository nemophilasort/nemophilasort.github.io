// Generator-based merge sort with user-provided comparisons, tie support, and undo.
// Replaces the iterative state-machine version adapted from K-Factory's original
// migiwa sort engine in SakuraSort. Same external API, same algorithm (top-down
// merge sort), but the engine itself is a textbook recursive merge expressed via
// JS generators that yield each comparison out to the caller.
//
// Undo is implemented as "drop the last choice and replay the rest from a fresh
// generator". For our scale (a few hundred battles max), replay cost is sub-millisecond
// and the choices array is the entire persistent state.

export class SongSort {
  constructor(items) {
    this.items = items;
    this.choices = [];
    this.total = expectedComparisons(items.length);
    this._totalPlacements = totalPlacements(items.length);
    this._replay();
  }

  // Recreate the generator from scratch and feed every prior choice back into it.
  _replay() {
    this._equalData = new Map();
    this._stats = { placements: 0 };
    this._gen = mergeSort([...this.items.keys()], this._equalData, this._stats);
    this._cur = this._gen.next();
    for (const c of this.choices) {
      this._cur = this._gen.next(c);
    }
  }

  isDone() {
    return this._cur.done;
  }

  currentLeft() {
    if (this.isDone()) return null;
    return this.items[this._cur.value.left];
  }

  currentRight() {
    if (this.isDone()) return null;
    return this.items[this._cur.value.right];
  }

  // 1-indexed: the battle the user is currently looking at.
  get battle() {
    return this.choices.length + 1;
  }

  // Number of comparisons the user has answered so far. Used for the progress bar.
  get completed() {
    return this.choices.length;
  }

  // Backward-compat for UI code that checks `sort.history.length === 0` to disable Undo.
  get history() {
    return this.choices;
  }

  // Progress is measured by items placed across all merges, not by comparisons made.
  // A "tie" choice auto-consumes both sides (and chains through equal-links), so
  // counting comparisons against the worst-case denominator would undershoot, an
  // all-tie sort would only reach ~(n-1)/(n·log n). Placement count always reaches
  // _totalPlacements when the sort completes, regardless of how many ties happen.
  progress() {
    if (this.isDone()) return 100;
    if (this._totalPlacements === 0) return 100;
    return Math.min(100, Math.floor((this._stats.placements * 100) / this._totalPlacements));
  }

  // side: -1 = left wins, 0 = tie, 1 = right wins.
  choose(side) {
    if (this.isDone()) return;
    this.choices.push(side);
    this._cur = this._gen.next(side);
  }

  undo() {
    if (this.choices.length === 0) return false;
    this.choices.pop();
    this._replay();
    return true;
  }

  // Returns [{ rank, item }, ...] in sorted order, or null if not yet done.
  // Items linked via equalData (ties) share their rank; the next non-tied item
  // gets the rank it would have had had ties not occurred (competition ranking).
  results() {
    if (!this.isDone()) return null;
    const order = this._cur.value;
    const ranked = [];
    let rank = 1;
    let same = 1;
    for (let i = 0; i < order.length; i++) {
      ranked.push({ rank, item: this.items[order[i]] });
      if (i < order.length - 1) {
        if (this._equalData.get(order[i]) === order[i + 1]) {
          same++;
        } else {
          rank += same;
          same = 1;
        }
      }
    }
    return ranked;
  }
}

// Worst-case comparison count for top-down merge sort on n items.
// T(n) = T(ceil(n/2)) + T(floor(n/2)) + (n - 1)
export function expectedComparisons(n) {
  if (n <= 1) return 0;
  const mid = Math.ceil(n / 2);
  return expectedComparisons(mid) + expectedComparisons(n - mid) + (n - 1);
}

// Total item placements across all merges. Used as the progress denominator ,
// every out.push() in merge() increments stats.placements, and the sum reaches
// this value when the sort completes regardless of how many ties happen.
// M(n) = M(ceil(n/2)) + M(floor(n/2)) + n
function totalPlacements(n) {
  if (n <= 1) return 0;
  const mid = Math.ceil(n / 2);
  return totalPlacements(mid) + totalPlacements(n - mid) + n;
}

function* mergeSort(arr, equalData, stats) {
  if (arr.length <= 1) return arr;
  const mid = Math.ceil(arr.length / 2);
  const left = yield* mergeSort(arr.slice(0, mid), equalData, stats);
  const right = yield* mergeSort(arr.slice(mid), equalData, stats);
  return yield* merge(left, right, equalData, stats);
}

function* merge(left, right, equalData, stats) {
  const out = [];
  let i = 0;
  let j = 0;
  const place = (val) => {
    out.push(val);
    stats.placements++;
  };

  while (i < left.length && j < right.length) {
    const choice = yield { left: left[i], right: right[j] };

    // Consume the winner (or both, on tie) and auto-consume any subsequent items
    // on the same side that carry an equal-link, matches the original engine's
    // behavior where a tie chain keeps flowing without re-asking the user.
    if (choice <= 0) {
      place(left[i++]);
      while (i < left.length && equalData.has(out[out.length - 1])) {
        place(left[i++]);
      }
    }

    // On tie, link the *last consumed* left item to the current right item.
    // This must happen after the auto-consume above, otherwise we'd overwrite
    // a link we still need for traversal, and chains like A→B→C wouldn't form.
    if (choice === 0) {
      equalData.set(out[out.length - 1], right[j]);
    }

    if (choice >= 0) {
      place(right[j++]);
      while (j < right.length && equalData.has(out[out.length - 1])) {
        place(right[j++]);
      }
    }
  }

  // Drain the remainder. No auto-consume here, matches the original drain logic.
  while (i < left.length) place(left[i++]);
  while (j < right.length) place(right[j++]);
  return out;
}

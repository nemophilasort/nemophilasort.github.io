import { ALBUMS, buildSongList } from "./data.js";
import { SongSort } from "./sort.js";
import * as htmlToImage from "./vendor/html-to-image.js";

const els = {
  phaseSelect: document.getElementById("phase-select"),
  phaseSort: document.getElementById("phase-sort"),
  phaseResults: document.getElementById("phase-results"),
  albumGrid: document.getElementById("albumGrid"),
  selectAll: document.getElementById("selectAll"),
  startBtn: document.getElementById("startBtn"),
  battle: document.getElementById("battle"),
  progressBar: document.getElementById("progressBar"),
  progressPct: document.getElementById("progressPct"),
  leftCard: document.getElementById("leftCard"),
  rightCard: document.getElementById("rightCard"),
  tieBtn: document.getElementById("tieBtn"),
  undoBtn: document.getElementById("undoBtn"),
  restartSortBtn: document.getElementById("restartSortBtn"),
  podium: document.getElementById("podium"),
  resultsList: document.getElementById("resultsList"),
  resultsCard: document.getElementById("resultsCard"),
  viewToggle: document.querySelector("#phase-results .view-toggle"),
  sortToggle: document.getElementById("sortToggle"),
  selectionCount: document.getElementById("selectionCount"),
  rawTextBtn: document.getElementById("rawTextBtn"),
  exportImgBtn: document.getElementById("exportImgBtn"),
  restartBtn: document.getElementById("restartBtn"),
  rawDialog: document.getElementById("rawDialog"),
  rawText: document.getElementById("rawText"),
  copyBtn: document.getElementById("copyBtn"),
  closeDialogBtn: document.getElementById("closeDialogBtn"),
};

let sort = null;
let albumSort = "desc";

const SINGLES = ALBUMS.filter((a) => a.single);
const REGULAR_ALBUMS = ALBUMS.filter((a) => !a.single);
const SINGLES_TILE_ID = "__singles__";

// Synthetic tile that bundles all singles. Always pinned to the end of the grid.
const SINGLES_TILE =
  SINGLES.length === 0
    ? null
    : {
        id: SINGLES_TILE_ID,
        title: "Singles",
        cover: "img/newlogo.jpg",
        songs: SINGLES.flatMap((s) => s.songs),
      };

function gridEntries() {
  const albums = albumSort === "desc" ? [...REGULAR_ALBUMS].reverse() : REGULAR_ALBUMS;
  return SINGLES_TILE ? [...albums, SINGLES_TILE] : [...albums];
}

function showPhase(name) {
  els.phaseSelect.hidden = name !== "select";
  els.phaseSort.hidden = name !== "sort";
  els.phaseResults.hidden = name !== "results";
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function fullSongTitle(item) {
  return item.translation ? `${item.title} (${item.translation})` : item.title;
}

function renderAlbumGrid() {
  const prevChecked = new Map();
  for (const cb of els.albumGrid.querySelectorAll('input[name="album"]')) {
    prevChecked.set(cb.value, cb.checked);
  }

  els.albumGrid.replaceChildren();

  for (const entry of gridEntries()) {
    const wrap = document.createElement("div");
    wrap.className = "album-card-wrap";

    const label = document.createElement("label");
    label.className = "album-card";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = "album";
    cb.value = entry.id;
    cb.checked = prevChecked.has(entry.id) ? prevChecked.get(entry.id) : true;
    if (!cb.checked) label.classList.add("album-card--off");

    const img = document.createElement("img");
    img.src = entry.cover;
    img.alt = entry.title;
    img.loading = "lazy";

    const meta = document.createElement("div");
    meta.className = "album-card__meta";

    const title = document.createElement("span");
    title.className = "album-card__title";
    title.textContent = entry.title;
    meta.append(title);

    const subParts = [];
    if (entry.year != null) subParts.push(String(entry.year));
    const songCount = entry.songs?.length ?? entry.songCount ?? 0;
    if (songCount > 0) subParts.push(songCount === 1 ? "1 song" : `${songCount} songs`);
    if (subParts.length > 0) {
      const sub = document.createElement("span");
      sub.className = "album-card__year";
      sub.textContent = subParts.join(" · ");
      meta.append(sub);
    }

    cb.addEventListener("change", () => {
      label.classList.toggle("album-card--off", !cb.checked);
      updateSelectAllLabel();
      updateSelectionCount();
    });

    label.append(cb, img, meta);
    wrap.appendChild(label);

    if (Array.isArray(entry.songs) && entry.songs.length > 0) {
      const popover = document.createElement("div");
      popover.className = "album-card__popover";
      popover.setAttribute("aria-hidden", "true");

      const heading = document.createElement("div");
      heading.className = "album-card__popover-title";
      heading.textContent = entry.title;
      popover.appendChild(heading);

      const ol = document.createElement("ol");
      for (const song of entry.songs) {
        const li = document.createElement("li");
        const container = document.createElement("div");
        container.className = "album-card__popover-song";

        const main = document.createElement("span");
        main.className = "album-card__popover-song-main";
        main.textContent = song.title;
        container.appendChild(main);

        if (song.translation) {
          const sub = document.createElement("span");
          sub.className = "album-card__popover-song-sub";
          sub.textContent = song.translation;
          container.appendChild(sub);
        }

        li.appendChild(container);
        ol.appendChild(li);
      }
      popover.appendChild(ol);
      wrap.appendChild(popover);
    }

    els.albumGrid.appendChild(wrap);
  }

  updatePopoverSides();
  updateSelectionCount();
}

function updatePopoverSides() {
  const viewportCenter = window.innerWidth / 2;
  for (const wrap of els.albumGrid.querySelectorAll(".album-card-wrap")) {
    const rect = wrap.getBoundingClientRect();
    const wrapCenter = rect.left + rect.width / 2;
    if (wrapCenter > viewportCenter) {
      wrap.dataset.side = "right";
    } else {
      delete wrap.dataset.side;
    }
  }
}

function updateSelectAllLabel() {
  const checkboxes = els.albumGrid.querySelectorAll('input[name="album"]');
  const allChecked = [...checkboxes].every((cb) => cb.checked);
  els.selectAll.textContent = allChecked ? "Deselect all" : "Select all";
}

function selectedAlbumIds() {
  const ids = new Set();
  for (const c of els.albumGrid.querySelectorAll('input[name="album"]:checked')) {
    if (c.value === SINGLES_TILE_ID) {
      for (const s of SINGLES) ids.add(s.id);
    } else {
      ids.add(c.value);
    }
  }
  return ids;
}

function updateSelectionCount() {
  const songs = buildSongList(selectedAlbumIds());
  const n = songs.length;
  let label;
  if (n === 0) label = "No albums selected";
  else if (n === 1) label = "1 song";
  else label = `${n} songs`;
  els.selectionCount.textContent = label;
  els.startBtn.disabled = n < 2;
}

function setupSelectionPhase() {
  els.selectAll.addEventListener("click", () => {
    const checkboxes = [...els.albumGrid.querySelectorAll('input[name="album"]')];
    const allChecked = checkboxes.every((cb) => cb.checked);
    const next = !allChecked;
    for (const cb of checkboxes) {
      cb.checked = next;
      cb.closest(".album-card").classList.toggle("album-card--off", !next);
    }
    updateSelectAllLabel();
    updateSelectionCount();
  });

  els.sortToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-toggle__btn");
    if (!btn || btn.dataset.sort === albumSort) return;
    for (const b of els.sortToggle.querySelectorAll(".view-toggle__btn")) {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    albumSort = btn.dataset.sort;
    renderAlbumGrid();
  });

  els.startBtn.addEventListener("click", startSorting);
}

function startSorting() {
  const selected = selectedAlbumIds();
  if (selected.size === 0) {
    alert("Please pick at least one album.");
    return;
  }

  const songs = buildSongList(selected);
  if (songs.length < 2) {
    alert("Need at least two songs to sort. Pick more albums.");
    return;
  }

  sort = new SongSort(songs);
  showPhase("sort");
  renderComparison();
}

function cardContent(card, item) {
  card.replaceChildren();
  const img = document.createElement("img");
  img.src = item.album.cover;
  img.alt = item.album.title;
  img.className = "card__img";
  const text = document.createElement("div");
  text.className = "card__text";
  const title = document.createElement("span");
  title.className = "card__title";
  title.textContent = item.title;
  text.append(title);
  if (item.translation) {
    const translation = document.createElement("span");
    translation.className = "card__translation";
    translation.textContent = item.translation;
    text.append(translation);
  }
  const album = document.createElement("span");
  album.className = "card__album";
  album.textContent = item.album.title;
  text.append(album);
  card.append(img, text);
}

function renderComparison() {
  if (sort.isDone()) {
    showResults();
    return;
  }
  cardContent(els.leftCard, sort.currentLeft());
  cardContent(els.rightCard, sort.currentRight());
  els.battle.textContent = sort.battle;
  els.progressBar.value = sort.progress();
  els.progressPct.textContent = sort.progress();
  els.undoBtn.disabled = sort.history.length === 0;
}

function setupSortPhase() {
  els.leftCard.addEventListener("click", () => {
    sort.choose(-1);
    renderComparison();
  });
  els.rightCard.addEventListener("click", () => {
    sort.choose(1);
    renderComparison();
  });
  els.tieBtn.addEventListener("click", () => {
    sort.choose(0);
    renderComparison();
  });
  els.undoBtn.addEventListener("click", () => {
    if (sort.undo()) renderComparison();
  });
  els.restartSortBtn.addEventListener("click", () => {
    if (confirm("Discard current sort and pick albums again?")) location.reload();
  });
}

function buildPodiumCard({ rank, item }, place) {
  const card = document.createElement("div");
  card.className = `podium-card podium-card--${place}`;

  const badge = document.createElement("span");
  badge.className = "podium-card__rank";
  badge.textContent = rank;

  const img = document.createElement("img");
  img.className = "podium-card__img";
  img.src = item.album.cover;
  img.alt = item.album.title;

  const title = document.createElement("span");
  title.className = "podium-card__title";
  title.textContent = item.title;

  card.append(badge, img, title);

  if (item.translation) {
    const translation = document.createElement("span");
    translation.className = "podium-card__translation";
    translation.textContent = item.translation;
    card.append(translation);
  }

  const album = document.createElement("span");
  album.className = "podium-card__album";
  album.textContent = item.album.title;
  card.append(album);

  return card;
}

function buildResultCell({ rank, item }) {
  const li = document.createElement("li");
  li.className = "result-cell";

  const rankEl = document.createElement("span");
  rankEl.className = "result-cell__rank";
  rankEl.textContent = rank;

  const img = document.createElement("img");
  img.className = "result-cell__img";
  img.src = item.album.cover;
  img.alt = "";
  img.loading = "lazy";

  const text = document.createElement("div");
  text.className = "result-cell__text";
  const title = document.createElement("span");
  title.className = "result-cell__title";
  title.textContent = item.title;
  text.append(title);
  if (item.translation) {
    const translation = document.createElement("span");
    translation.className = "result-cell__translation";
    translation.textContent = item.translation;
    text.append(translation);
  }
  const album = document.createElement("span");
  album.className = "result-cell__album";
  album.textContent = item.album.title;
  text.append(album);

  li.append(rankEl, img, text);
  return li;
}

function showResults() {
  const ranked = sort.results();

  els.podium.replaceChildren();
  ranked.slice(0, 3).forEach((entry, idx) => {
    els.podium.appendChild(buildPodiumCard(entry, idx + 1));
  });

  els.resultsList.replaceChildren();
  for (const entry of ranked.slice(3)) {
    els.resultsList.appendChild(buildResultCell(entry));
  }

  showPhase("results");
}

function setupResultsPhase() {
  els.viewToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-toggle__btn");
    if (!btn) return;
    for (const b of els.viewToggle.querySelectorAll(".view-toggle__btn")) {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    els.resultsCard.dataset.view = btn.dataset.view;
  });

  els.rawTextBtn.addEventListener("click", () => {
    const ranked = sort.results();
    els.rawText.value = ranked.map(({ rank, item }) => `${rank}. ${fullSongTitle(item)} — ${item.album.title}`).join("\n");
    els.rawDialog.showModal();
  });
  els.copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.rawText.value);
      els.copyBtn.textContent = "Copied!";
      setTimeout(() => (els.copyBtn.textContent = "Copy"), 1500);
    } catch {
      els.rawText.select();
      document.execCommand("copy");
    }
  });
  els.closeDialogBtn.addEventListener("click", () => els.rawDialog.close());
  els.restartBtn.addEventListener("click", () => location.reload());

  els.exportImgBtn.addEventListener("click", async () => {
    const original = els.exportImgBtn.textContent;
    els.exportImgBtn.disabled = true;
    els.exportImgBtn.textContent = "Generating…";
    let objectUrl = null;
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const blob = await htmlToImage.toBlob(els.resultsCard, {
        backgroundColor: "#0a0a0a",
        pixelRatio: dpr,
        cacheBust: true,
      });
      if (!blob) throw new Error("Empty image blob");

      const date = new Date().toISOString().slice(0, 10);
      const filename = `nemophila-song-ranking-${date}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Mobile: native share sheet (Save to Photos, send to app, etc.)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "My NEMOPHILA Song Ranking" });
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
          // Fall through to download fallback if share failed for another reason
        }
      }

      // Desktop / fallback: trigger a download
      objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Couldn't generate the image. Take a screenshot instead?");
    } finally {
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      els.exportImgBtn.disabled = false;
      els.exportImgBtn.textContent = original;
    }
  });
}

renderAlbumGrid();
updateSelectAllLabel();
setupSelectionPhase();
setupSortPhase();
setupResultsPhase();
showPhase("select");

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updatePopoverSides, 100);
});

// Catalog editor: a no-code UI for editing songlist.json. Fetches the live
// catalog on load, lets the user mutate it, then emits a downloadable
// songlist.json the user uploads back to their repo.

const els = {
  addAlbumBtn: document.getElementById("addAlbumBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  status: document.getElementById("status"),
  albumList: document.getElementById("albumList"),
  emptyHint: document.getElementById("emptyHint"),
  editorPane: document.getElementById("editorPane"),
  albumForm: document.getElementById("albumForm"),
  deleteAlbumBtn: document.getElementById("deleteAlbumBtn"),
  songRows: document.getElementById("songRows"),
  addSongBtn: document.getElementById("addSongBtn"),
  songRowTemplate: document.getElementById("songRowTemplate"),
};

const state = {
  albums: [],
  selectedIndex: -1,
  // Per-album flag: true once the user manually edits the id, so we stop
  // auto-deriving it from the title.
  idLocked: new WeakMap(),
};

function setStatus(message, tone = "info") {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function slugify(text) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "album";
}

function ensureUniqueId(baseId, excludeAlbum) {
  let candidate = baseId;
  let n = 2;
  const used = new Set(state.albums.filter((a) => a !== excludeAlbum).map((a) => a.id));
  while (used.has(candidate)) {
    candidate = `${baseId}-${n++}`;
  }
  return candidate;
}

function newAlbum() {
  return {
    id: ensureUniqueId("new-album", null),
    title: "",
    year: new Date().getFullYear(),
    cover: "",
    isSingle: false,
    isCover: false,
    songs: [{ title: "", translation: "" }],
  };
}

function normalizeAlbum(raw) {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    year: Number(raw.year) || new Date().getFullYear(),
    cover: String(raw.cover ?? ""),
    isSingle: Boolean(raw.isSingle),
    isCover: Boolean(raw.isCover),
    songs: Array.isArray(raw.songs)
      ? raw.songs.map((s) => ({
          title: String(s.title ?? ""),
          translation: s.translation ? String(s.translation) : "",
        }))
      : [],
  };
}

async function loadCatalog() {
  try {
    const res = await fetch("js/songlist.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error("expected an array");
    state.albums = raw.map(normalizeAlbum);
    state.albums.forEach((a) => state.idLocked.set(a, true));
    state.selectedIndex = state.albums.length ? 0 : -1;
    renderAll();
    setStatus(`Loaded ${state.albums.length} album${state.albums.length === 1 ? "" : "s"}.`, "ok");
  } catch (err) {
    console.error(err);
    setStatus(`Could not load existing catalog (${err.message}). Start fresh by clicking + Add album.`, "error");
    renderAll();
  }
}

// Mutations ---------------------------------------------------------------

els.addAlbumBtn.addEventListener("click", () => {
  const album = newAlbum();
  album.id = ensureUniqueId("new-album", album);
  state.albums.unshift(album);
  state.selectedIndex = 0;
  renderAll();
  document.querySelector('[name="title"]')?.focus();
});

els.deleteAlbumBtn.addEventListener("click", () => {
  const album = currentAlbum();
  if (!album) return;
  const label = album.title || "this album";
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
  state.albums.splice(state.selectedIndex, 1);
  state.selectedIndex = Math.min(state.selectedIndex, state.albums.length - 1);
  renderAll();
});

els.albumForm.addEventListener("input", (event) => {
  const album = currentAlbum();
  if (!album) return;
  const field = event.target.name;
  if (!field) return;
  if (field === "title") {
    album.title = event.target.value;
    if (!state.idLocked.get(album)) {
      album.id = ensureUniqueId(slugify(album.title || "album"), album);
    }
  } else if (field === "year") {
    album.year = Number(event.target.value) || 0;
  } else if (field === "isSingle") {
    album.isSingle = event.target.checked;
  } else if (field === "isCover") {
    album.isCover = event.target.checked;
  } else if (field === "coverFilename") {
    const name = event.target.value.trim();
    album.cover = name ? `img/albums/${name}` : "";
  }
  renderAlbumListRow(state.selectedIndex);
  updateDownloadEnabled();
});

els.addSongBtn.addEventListener("click", () => {
  const album = currentAlbum();
  if (!album) return;
  album.songs.push({ title: "", translation: "" });
  renderSongs();
  els.songRows.lastElementChild?.querySelector(".editor-song-row__title")?.focus();
});

els.songRows.addEventListener("input", (event) => {
  const album = currentAlbum();
  if (!album) return;
  const row = event.target.closest(".editor-song-row");
  if (!row) return;
  const idx = Number(row.dataset.index);
  if (event.target.classList.contains("editor-song-row__title")) {
    album.songs[idx].title = event.target.value;
  } else if (event.target.classList.contains("editor-song-row__translation")) {
    album.songs[idx].translation = event.target.value;
  }
  updateDownloadEnabled();
});

els.songRows.addEventListener("click", (event) => {
  if (!event.target.classList.contains("editor-song-row__remove")) return;
  const album = currentAlbum();
  if (!album) return;
  const row = event.target.closest(".editor-song-row");
  const idx = Number(row.dataset.index);
  album.songs.splice(idx, 1);
  if (album.songs.length === 0) album.songs.push({ title: "", translation: "" });
  renderSongs();
  updateDownloadEnabled();
});

els.albumList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-index]");
  if (!item) return;
  state.selectedIndex = Number(item.dataset.index);
  renderAll();
});

// Rendering ---------------------------------------------------------------

function currentAlbum() {
  return state.albums[state.selectedIndex] ?? null;
}

function renderAll() {
  renderAlbumList();
  renderEditor();
  updateDownloadEnabled();
}

function renderAlbumList() {
  els.albumList.innerHTML = "";
  state.albums.forEach((_, i) => els.albumList.appendChild(buildAlbumListRow(i)));
  els.emptyHint.hidden = state.albums.length > 0;
}

function renderAlbumListRow(index) {
  const existing = els.albumList.querySelector(`[data-index="${index}"]`);
  const fresh = buildAlbumListRow(index);
  if (existing) existing.replaceWith(fresh);
}

function buildAlbumListRow(index) {
  const album = state.albums[index];
  const li = document.createElement("li");
  li.className = "editor-album-list__item";
  li.dataset.index = String(index);
  if (index === state.selectedIndex) li.classList.add("is-selected");
  const title = album.title || "(untitled album)";
  const meta = `${album.year || ","} · ${album.songs.length} song${album.songs.length === 1 ? "" : "s"}`;
  const tag = album.isSingle ? "Single" : album.isCover ? "Cover" : "";
  li.innerHTML = `
    <button type="button" class="editor-album-list__button">
      <span class="editor-album-list__title"></span>
      <span class="editor-album-list__meta"></span>
      ${tag ? `<span class="editor-album-list__tag">${tag}</span>` : ""}
    </button>
  `;
  li.querySelector(".editor-album-list__title").textContent = title;
  li.querySelector(".editor-album-list__meta").textContent = meta;
  return li;
}

function renderEditor() {
  const album = currentAlbum();
  if (!album) {
    els.editorPane.hidden = true;
    return;
  }
  els.editorPane.hidden = false;
  const f = els.albumForm.elements;
  f.title.value = album.title;
  f.year.value = album.year;
  f.isSingle.checked = album.isSingle;
  f.isCover.checked = album.isCover;
  f.coverFilename.value = album.cover ? album.cover.replace(/^img\/albums\//, "") : "";
  renderSongs();
}

function renderSongs() {
  const album = currentAlbum();
  els.songRows.innerHTML = "";
  if (!album) return;
  album.songs.forEach((song, i) => {
    const frag = els.songRowTemplate.content.cloneNode(true);
    const row = frag.querySelector(".editor-song-row");
    row.dataset.index = String(i);
    row.querySelector(".editor-song-row__title").value = song.title;
    row.querySelector(".editor-song-row__translation").value = song.translation;
    els.songRows.appendChild(frag);
  });
}

function updateDownloadEnabled() {
  els.downloadBtn.disabled = state.albums.length === 0;
}

// Output ------------------------------------------------------------------

els.downloadBtn.addEventListener("click", () => {
  const issues = validateCatalog();
  if (issues.length) {
    setStatus(issues[0], "error");
    return;
  }
  const text = serializeCatalog();
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "songlist.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus("Downloaded songlist.json, upload it to your repo's js/ folder.", "ok");
});

function validateCatalog() {
  const issues = [];
  const ids = new Set();
  state.albums.forEach((album, i) => {
    const label = album.title || `album #${i + 1}`;
    if (!album.id) issues.push(`${label} is missing an ID.`);
    else if (ids.has(album.id)) issues.push(`Two albums share the ID "${album.id}". IDs must be unique.`);
    ids.add(album.id);
    if (!album.title) issues.push(`Album #${i + 1} is missing a title.`);
    if (!album.year) issues.push(`${label} is missing a year.`);
    if (!album.cover) issues.push(`${label} is missing a cover image filename.`);
    const validSongs = album.songs.filter((s) => s.title.trim());
    if (validSongs.length === 0) issues.push(`${label} has no songs.`);
  });
  return issues;
}

function serializeCatalog() {
  // Build each object with explicit key order so the JSON diff stays meaningful.
  // JSON.stringify preserves insertion order on objects.
  const out = state.albums.map((album) => {
    const o = { id: album.id, title: album.title, year: album.year, cover: album.cover };
    if (album.isSingle) o.isSingle = true;
    if (album.isCover) o.isCover = true;
    o.songs = album.songs
      .filter((s) => s.title.trim())
      .map((s) => {
        const so = { title: s.title };
        if (s.translation && s.translation.trim()) so.translation = s.translation;
        return so;
      });
    return o;
  });
  return JSON.stringify(out, null, 2) + "\n";
}

// Initial render ----------------------------------------------------------
loadCatalog();

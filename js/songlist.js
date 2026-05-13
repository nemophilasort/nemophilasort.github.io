import RAW_ALBUMS from "./songlist.json" with { type: "json" };

// Array.sort is stable, so albums sharing a year preserve their songlist.json order.
export const ALBUMS = [...RAW_ALBUMS].sort((a, b) => a.year - b.year);

// Flatten the selected albums' tracklists into a deduped, sort-ready song list.
// Dedup key is `title` lowercased and trimmed; the first occurrence (by album year
// ascending, see ALBUMS export) wins. Each entry carries a back-reference to its
// source album so the UI can render album titles / cover art alongside the song.
export function buildSongList(selectedAlbumIds) {
  const songs = [];
  const seen = new Set();
  for (const album of ALBUMS) {
    if (!selectedAlbumIds.has(album.id)) continue;
    for (const song of album.songs) {
      const key = song.title.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      songs.push({ title: song.title, translation: song.translation, album });
    }
  }
  return songs;
}

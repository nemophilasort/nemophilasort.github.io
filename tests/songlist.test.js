import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ALBUMS, buildSongList } from "../js/songlist.js";

describe("ALBUMS export", () => {
  test("is a non-empty array", () => {
    assert.ok(Array.isArray(ALBUMS));
    assert.ok(ALBUMS.length > 0);
  });

  test("is sorted by year ascending", () => {
    for (let i = 1; i < ALBUMS.length; i++) {
      assert.ok(
        ALBUMS[i - 1].year <= ALBUMS[i].year,
        `out of order: ${ALBUMS[i - 1].title} (${ALBUMS[i - 1].year}) vs ${ALBUMS[i].title} (${ALBUMS[i].year})`,
      );
    }
  });

  test("every album has the required fields", () => {
    for (const a of ALBUMS) {
      assert.equal(typeof a.id, "string", `${a.title}: id`);
      assert.ok(a.id.length > 0, `${a.title}: empty id`);
      assert.equal(typeof a.title, "string", `${a.id}: title`);
      assert.equal(typeof a.year, "number", `${a.id}: year`);
      assert.ok(Number.isInteger(a.year), `${a.id}: year not integer`);
      assert.equal(typeof a.cover, "string", `${a.id}: cover`);
      assert.ok(a.cover.startsWith("img/"), `${a.id}: cover should start with img/`);
      assert.ok(Array.isArray(a.songs), `${a.id}: songs not an array`);
      assert.ok(a.songs.length > 0, `${a.id}: empty songs`);
    }
  });

  test("every song has at least a title", () => {
    for (const a of ALBUMS) {
      for (const song of a.songs) {
        assert.equal(typeof song.title, "string", `${a.id}: song.title`);
        assert.ok(song.title.length > 0, `${a.id}: empty song title`);
        if (song.translation !== undefined) {
          assert.equal(typeof song.translation, "string", `${a.id}/${song.title}: translation`);
        }
      }
    }
  });

  test("album ids are unique", () => {
    const ids = ALBUMS.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(", ")}`);
  });

  test("only valid `single` flag values", () => {
    for (const a of ALBUMS) {
      if (a.single !== undefined) {
        assert.equal(a.single, true, `${a.id}: single must be true if present`);
      }
    }
  });
});

describe("buildSongList", () => {
  test("returns an empty array when no albums are selected", () => {
    assert.deepEqual(buildSongList(new Set()), []);
  });

  test("includes only songs from selected albums", () => {
    const first = ALBUMS[0];
    const songs = buildSongList(new Set([first.id]));
    assert.equal(songs.length, first.songs.length);
    for (const s of songs) {
      assert.equal(s.album.id, first.id);
    }
  });

  test("each entry carries its source album reference", () => {
    const first = ALBUMS[0];
    const songs = buildSongList(new Set([first.id]));
    for (const s of songs) {
      assert.equal(typeof s.title, "string");
      assert.equal(s.album, first);
    }
  });

  test("dedupes duplicate titles across selected albums (first occurrence wins)", () => {
    const titleToAlbums = new Map();
    for (const a of ALBUMS) {
      for (const song of a.songs) {
        const k = song.title.trim().toLowerCase();
        if (!titleToAlbums.has(k)) titleToAlbums.set(k, []);
        titleToAlbums.get(k).push(a);
      }
    }
    const sharedEntry = [...titleToAlbums.entries()].find(
      ([
        ,
        list,
      ]) => list.length > 1,
    );
    if (!sharedEntry) {
      const a = ALBUMS[0];
      const target = a.songs[0].title;
      const result = buildSongList(new Set([a.id]));
      const occurrences = result.filter((s) => s.title === target).length;
      assert.equal(occurrences, 1);
      return;
    }
    const [
      ,
      owners,
    ] = sharedEntry;
    const ids = new Set(owners.map((a) => a.id));
    const result = buildSongList(ids);
    const titles = result.map((s) => s.title.trim().toLowerCase());
    assert.equal(new Set(titles).size, titles.length, "expected dedup");
  });

  test("dedupe is case-insensitive and trims whitespace", () => {
    const allIds = new Set(ALBUMS.map((a) => a.id));
    const songs = buildSongList(allIds);
    const keys = songs.map((s) => s.title.trim().toLowerCase());
    assert.equal(new Set(keys).size, keys.length, "every result song's dedup key is unique");
  });

  test("respects album sort order (year ascending) when emitting songs", () => {
    const ids = new Set(ALBUMS.map((a) => a.id));
    const songs = buildSongList(ids);
    assert.equal(songs[0].album, ALBUMS[0]);
    for (let i = 1; i < songs.length; i++) {
      assert.ok(
        songs[i - 1].album.year <= songs[i].album.year,
        `year order broken at index ${i}: ${songs[i - 1].album.year} > ${songs[i].album.year}`,
      );
    }
  });

  test("ignores album ids not present in the catalog", () => {
    const result = buildSongList(new Set(["__not-a-real-id__"]));
    assert.deepEqual(result, []);
  });
});

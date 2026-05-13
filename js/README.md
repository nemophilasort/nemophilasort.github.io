# Song Catalog

The catalog data lives in [./songlist.json](./songlist.json). [./songlist.js](./songlist.js) imports it, sorts by year, and exposes the helpers the app uses (`ALBUMS`, `buildSongList`).

## Editing the Songlist in the Editor

Open the **Catalog Editor**, either https://127.0.0.1:8000/editor.html (must start web server first, see [Testing Locally](../.github/CONTRIBUTING.md#testing-locally)) or `editor.html` locally, and edit through a form. 
It auto-loads the current catalog, validates as you go, and produces a downloadable `songlist.json` to drop back into this folder.

## Editing `songlist.json` Manually

The file is a JSON array of album objects. Here's one of each kind: a full album, a single, and a cover:

```json
[
  {
    "id": "dux",
    "title": "DUX",
    "year": 2024,
    "cover": "img/albums/DUX.png",
    "songs": [
      { "title": "Opening -follow the DUX-" },
      { "title": "KICKASS" },
      { "title": "iCON" }
    ]
  },
  {
    "id": "meihi-tensei",
    "title": "メイヒテンセイ (Meihi Tensei)",
    "year": 2026,
    "cover": "img/albums/MeihiTensei.png",
    "isSingle": true,
    "songs": [{ "title": "メイヒテンセイ", "translation": "Meihi Tensei" }]
  },
  {
    "id": "example-cover",
    "title": "Example Cover Title",
    "year": 2026,
    "cover": "img/albums/exampleCover.jpg",
    "isCover": true,
    "songs": [{ "title": "曲名", "translation": "Song Title" }]
  }
]
```

## Renaming or Removing An Album Manually

- **Rename**: change `"title"` and/or `"cover"`. Don't change `"id"` unless you have a reason, it doesn't appear in the UI but is used internally.
- **Remove**: delete the object (and any trailing comma between it and the next entry). Nothing else references it.

## Fixing A Song Title Manually

Edit the `"title"` (or `"translation"`) string on the appropriate song object. Be careful with punctuation: full-width vs. half-width characters (`（` vs. `(`), Japanese vs. English transliteration, and remix suffixes are all visible in the UI exactly as written.

## Duplicate songs

Songs that appear on more than one album are de-duplicated so they show only once in the sort battle.

## Field names

| Field name          | Required? | Description                                                                                                                                        |
|---------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| id                  | yes       | unique kebab-case slug (used as DOM value, must be unique)                                                                                         |
| title               | yes       | human-readable album name in any language (shown in UI)                                                                                            |
| year                | yes       | release year (used to sort albums chronologically)                                                                                                 |
| cover               | yes       | path to cover image, relative to the page                                                                                                          |
| songs               | yes       | array of song objects in track order. Each song is `{ "title", "translation"? }`                                                                   |
| songs / title       | yes       | the title of the song in any language                                                                                                              |
| songs / translation | no        | English / romaji rendering shown as subtext                                                                                                        |
| isSingle            | no        | set to `true` if this is a standalone single. The song will get bundled into the "Singles" tile on the album grid instead of getting its own tile. |
| isCover             | no        | set to `true` if this is a cover of another artist's song, gets bundled into the "Covers" tile so they can be excluded as a group.                |

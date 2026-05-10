# NEMOPHILA Song Sorter

https://nemophilasort.github.io/

# Adding albums and songs

All song data lives in [js/data.js](./js/data.js). One album is one object in the `RAW_ALBUMS` array.

Follow the steps below to add or modify albums and songs:

1. **Save the cover art**
   - Drop the cover image into [img/albums/](./img/albums). Square aspect ratio is best (the UI crops to 1:1). PNG or JPG both work. See the table in [Image sizes](.github/CONTRIBUTING.md#image-sizes) for recommended sizes.
2. **Add a new album or update songs**
   - To add a new album:
     - Open [js/data.js](./js/data.js) and append a new object to `RAW_ALBUMS`. Order inside the array does not matter.

   ```js
     {
       id: "evolve",
       title: "EVOLVE",
       year: 2023,
       cover: "img/albums/evolve.jpg",
       songs: [
         { title: "Enigma" },
         { title: "RISE" },
         { title: "YELL ～軌跡～", translation: "Kiseki" },
       ],
     },
   ```

   - To add songs to an existing album:
     - Find the album in `RAW_ALBUMS` and add the song object to its `songs` array. The order you list them in is the order they appear if anyone inspects the data, it does not affect the sort.
   - To add a single:
     - Same as adding an album, but include `single: true` on the entry. The song still keeps its own cover (shown on the sort cards and in the results list), but it's grouped under the shared "Singles" tile on the album-select page instead of getting its own tile. If no entries have `single: true`, the Singles tile is hidden entirely.

   ```js
     {
       id: "oiran",
       title: "OIRAN",
       year: 2020,
       cover: "img/albums/oiran.jpg",
       single: true,
       songs: [
         { title: "OIRAN - OIRAN Version" },
         { title: "Monsters - OIRAN Version" },
         { title: "Life - OIRAN Version" },
       ],
     },
   ```

3. **Test your changes**
   - Run `npm start` to open the web browser to test your changes. Allow Node.js if prompted. If you get an error, see [Testing locally](.github/CONTRIBUTING.md#testing-locally).

4. **Push your changes to GitHub**
   - No code changes needed elsewhere. Push your changes to GitHub and you're done.

# Renaming or removing an album

- **Rename**: change `title` and/or `cover`. Don't change `id` unless you have a reason, `id` doesn't appear in the UI.
- **Remove**: delete the object. Nothing else references it.
- **Hide temporarily**: comment the object out with `/* ... */`. Easy to re-enable.

# Fixing a song title

Edit the `title` (or `translation`) string on the appropriate song object. Be careful with punctuation: full-width vs. half-width characters (`（` vs. `(`), Japanese vs. English transliteration, and remix suffixes are all visible in the UI exactly as written.

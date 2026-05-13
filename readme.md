# NEMOPHILA Song Sorter

https://nemophilasort.github.io/

Want to create your own sorter? See the template at https://github.com/mstie/band-sorter-template.

# Adding Albums and Songs

The easiest way is the in-browser **Catalog Editor** at https://127.0.0.1:8000/editor.html (must start web server first, see [Testing Locally](../.github/CONTRIBUTING.md#testing-locally)). 
It loads the current catalog, lets you add and edit albums and songs in a form, and produces a fresh `songlist.json` you upload back to this repo.

Steps:

1. **Save the cover art**
   - Crop your image to a square (the UI displays at 1:1). PNG or JPG both work. See [Image sizes](.github/CONTRIBUTING.md#image-sizes) for recommended dimensions.
2. **Edit the catalog**
   - Start the web server by typing `npm run start`
   - Open https://127.0.0.1:8000/editor.html. Add a new album (or pick one to edit), fill in the title, year, songs, and the cover image filename from step 1.
   - Once finished with all albums and songs, Click **Download songlist.json** to save the updated catalog file.
   - Copy the downloaded json file to the [js](./js) folder overwriting the existing file
3. **Test your changes**
   - Open the sorter at https://127.0.0.1:8000/ and ensure your changes work.
4. **Upload your changes to GitHub**

Prefer editing the JSON by hand? See [js/README.md](./js/README.md) for the schema. To run the sorter locally first, see [CONTRIBUTING.md](.github/CONTRIBUTING.md).

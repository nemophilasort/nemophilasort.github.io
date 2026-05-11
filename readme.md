# NEMOPHILA Song Sorter

https://nemophilasort.github.io/

Want to create your own sorter, see the template at https://github.com/mstie/band-sorter-template

# Adding albums and songs

All song data lives in [js/songlist.js](./js/songlist.js). One album is one object in the `RAW_ALBUMS` array.

Follow the steps below to add or modify albums and songs:

1. **Save the cover art**
   - Drop the cover image into [img/albums/](./img/albums). Square aspect ratio is best (the UI crops to 1:1). PNG or JPG both work. See the table in [Image sizes](.github/CONTRIBUTING.md#image-sizes) for recommended sizes.
2. **Add a new album or update songs**
   - See [./js/README.md](./js/README.md) for instructions

3. **Test your changes**
   - Run `npm start` to open the web browser to test your changes. Allow Node.js if prompted. If you get an error, see [Testing locally](.github/CONTRIBUTING.md#testing-locally).

4. **Push your changes to GitHub**
   - No code changes needed elsewhere. Push your changes to GitHub and you're done.

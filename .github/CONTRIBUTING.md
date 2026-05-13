# Contributing

Thanks for helping keep the NEMOPHILA Song Sorter up to date. The most common contribution is adding a new release. This guide walks you through that, plus a few smaller edits.

This repo uses the discography found on the [NEMOPHILA Discography page](https://nemophila.tokyo/en/discography/) and in the NEMOPHILA Discord server.

## Ground Rules

- Only add NEMOPHILA songs to the song list when adding songs.
- Create an appropriate album entry when adding new releases or singles.
- Create issues or discussions for any major changes and enhancements that you wish to make. Discuss things transparently and get community feedback.
- Be nice.

## Testing locally

The site uses ES modules, which require an HTTP server (won't work via `file://`).

### Before you begin

1. Install Node.js and NPM at https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
2. Run `npm install`

### Running in a local browser

1. Run `npm start`
2. To stop the server later press `Ctrl + C`. If the server won't stop, run `npm run stop` and it will kill whatever is bound to port 8000.

### Running unit tests

1. Run `npm run build`

`npm test` will catch most data-shape regressions before you push: missing required fields on an album entry, non-unique album ids, malformed song objects, broken `buildSongList` dedup, sort-engine misbehavior, etc. If you change anything in `js/data.js` or `js/sort.js`, run it.

## Image sizes

When adding new cover art or photos, target these dimensions. The site already displays at much smaller sizes, so larger sources just waste bandwidth.

| Image                    | Recommended                                   | Reason                                                                                                      |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Album covers             | 600×600                                       | Largest on-page display is the 240px battle card; 600px gives 2× retina headroom. ~70KB after mozjpeg q=85. |
| Logo / share image       | 1200×1200 or 1200×630                         | Used as the `og:image` for Discord / Twitter / Slack embeds. Only loaded when someone shares the URL.       |
| Favicon                  | 32×32 `.ico` + 144×144 PNG                    | Standard browser tab and iOS home-screen sizes.                                                             |

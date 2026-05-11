const RAW_ALBUMS = [
  {
    id: "apple-of-my-eye",
    title: "Apple of my eye",
    year: 2025,
    cover: "img/albums/appleofmyeye.jpg",
    songs: [
      { title: "Just Do It!" },
      { title: "PROGRESS" },
      { title: "BRAINWASH" },
      { title: "Burn It" },
      { title: "ERROR DETECTION" },
      { title: "Beautiful Days" },
      { title: "G.O.D." },
      { title: "赤加賀智 -Akakagachi-" },
      { title: "アナタダレ" },
      { title: "Good as hell quartet" },
    ],
  },
  {
    id: "beautiful-days",
    title: "Beautiful days",
    year: 2024,
    cover: "img/albums/beautifuldays.jpg",
    songs: [
      { title: "Beautiful days" },
      { title: "G.O.D." },
      { title: "PROGRESS" },
    ],
  },
  {
    id: "evolve",
    title: "EVOLVE",
    year: 2023,
    cover: "img/albums/evolve.jpg",
    songs: [
      { title: "Enigma" },
      { title: "RISE" },
      { title: "OSKR" },
      { title: "AMA-TE-RAS" },
      { title: "ODYSSEY" },
      { title: "ALIVE" },
      { title: "Night Flight" },
      { title: "Justice" },
      { title: "Hammer Down" },
      { title: "YELL ～軌跡～", translation: "Kiseki" },
    ],
  },
  {
    id: "revive",
    title: "REVIVE",
    year: 2022,
    cover: "img/albums/revive.jpg",
    songs: [
      { title: "REVIVE" },
      { title: "DISSENSION" },
      { title: "鬼灯", translation: "Hoozuki" },
      { title: "HYPNOSIS" },
      { title: "GAME OVER" },
      { title: "Life REVIVE Ver." },
      { title: "SORAI" },
      { title: "Rollin' Rollin'" },
      { title: "Change the world" },
      { title: "雷霆 -RAITEI-" },
      { title: "OIRAN REVIVE Ver." },
    ],
  },
  {
    id: "seize-the-fate",
    title: "Seize the Fate",
    year: 2022,
    cover: "img/albums/stf.jpg",
    songs: [
      { title: "Seize the Fate" },
      { title: "炎天 -ENTEN-" },
      { title: "ZEN" },
      { title: "Back into the wild" },
      { title: "Rock'n'Roll Is?" },
      { title: "STYLE" },
      { title: "Waiting for you" },
      { title: "now I here" },
      { title: "A Ray Of Light" },
      { title: "徒花 -ADABANA-" },
      { title: "Soaring ~to be continued~" },
    ],
  },
  {
    id: "the-initial-impulse",
    title: "The Initial Impulse",
    year: 2023,
    cover: "img/albums/impulse.jpg",
    songs: [
      { title: "(Sic)" },
      { title: "Sugar" },
      { title: "Master of Puppets" },
      { title: "Stuck (feat. N∀OKI & NOBUYA)" },
    ],
  },
  {
    id: "dissension",
    title: "DISSENSION",
    year: 2021,
    cover: "img/albums/dissension.jpg",
    isSingle: true,
    songs: [
      { title: "雷霆 -RAITEI- -Instrumental-" },
      { title: "SORAI -Instrumental-" },
      { title: "Fighter" },
    ],
  },
  {
    id: "oiran",
    title: "OIRAN",
    year: 2020,
    cover: "img/albums/oiran.jpg",
    isSingle: true,
    songs: [
      { title: "OIRAN - OIRAN Version" },
      { title: "Monsters - OIRAN Version" },
      { title: "Life - OIRAN Version" },
    ],
  },
  {
    id: "raitei",
    title: "雷霆 -RAITEI-",
    year: 2021,
    cover: "img/albums/raitei.jpg",
    isSingle: true,
    songs: [
      { title: "OIRAN -Instrumental-" },
      { title: "MONSTERS -Instrumental-" },
      { title: "Life -Instrumental-" },
    ],
  },
];

// Sort.sort is stable, so albums sharing a year preserve their RAW_ALBUMS order.
export const ALBUMS = [...RAW_ALBUMS].sort((a, b) => a.year - b.year);

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

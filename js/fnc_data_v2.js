// 2008/7/3 Scripted by K-Factory@migiwa
// 2009/1/27 Modified by K-Factory@migiwa

// *****************************************************************************
str_CenterT = 'Tie!';
str_CenterB = 'Undo last choice';

str_ImgPath = 'img/';
// 0:順番に　1:昔の
var bln_ResultMode = 1;
// 0:テキスト　1:イラスト　2:テキスト＋イラスト
var int_ResultImg = 2;
// イラスト表示時、何位までをイラスト表示にするか。
var int_ResultRank = 3;

// ソート用のテーブルを
// 0:残す　1:消す
var bln_ResultStyle = 0;

// ソート進捗バーの表示
// 0:表示　1:消す
var bln_ProgessBar = 1;

// Maximum number of result rows before being broken off into another table.
var maxRows = 35;

// * タイトル情報（編集可能。最後の行に”,”を付けないようにしてください）
var int_Colspan = 3;
var ary_TitleData = [
  "REVIVE",
  "Seize the Fate",
  "EVOLVE",
  "The Initial Impulse",
  "OIRAN (Single)",
  "雷霆 -RAITEI- (Single)",
  "DISSENSION (Single)",
  "G.O.D. (Single)"
];

// * キャラクター情報（編集可能。最後の行に”,”を付けないようにしてください）
// * 使用フラグ（0にするとソートに入りません）, 
//   "タイトルID"（先頭から0, 1, 2...）, 
//   {タイトル別参加フラグ}（1を入れると対象タイトルに入ります）,
//   "キャラクター名", "画像（空白の場合、キャラクター名が使用されます）"
//                                      [1,2,3,4,5,6,7,8,9,
var ary_CharacterData = [
  [1, "REVIVE",                                           [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "DISSENSION",                                       [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "鬼灯 (Hoozuki)",                                    [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "HYPNOSIS",                                         [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "GAME OVER",                                        [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "Life REVIVE Ver.",                                 [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "SORAI",                                            [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "Rollin' Rollin'",                                  [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "Change the world",                                 [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "雷霆 -RAITEI-",                                     [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
  [1, "OIRAN REVIVE Ver.",                                [1,0,0,0,0,0,0,0], "albums/revive.jpg"],
    
  [1, "Seize the Fate",                                   [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "炎天 -ENTEN-",                                      [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "ZEN",                                              [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "Back into the wild",                               [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "Rock'n'Roll Is?",                                  [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "STYLE",                                            [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "Waiting for you",                                  [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "now I here",                                       [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "A Ray Of Light",                                   [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "徒花 -ADABANA-",                                    [0,1,0,0,0,0,0,0], "albums/stf.jpg"],
  [1, "Soaring ~to be continued~",                        [0,1,0,0,0,0,0,0], "albums/stf.jpg"],

  [1, "Enigma",                                           [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "RISE",                                             [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "OSKR",                                             [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "AMA-TE-RAS",                                       [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "ODYSSEY",                                          [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "ALIVE",                                            [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "Night Flight",                                     [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "Justice",                                          [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "Hammer Down",                                      [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],
  [1, "YELL ～軌跡～",                                     [0,0,1,0,0,0,0,0], "albums/evolve.jpg"],

  [1, "(Sic)",                                            [0,0,0,1,0,0,0,0], "albums/impulse.jpg"],
  [1, "Sugar",                                            [0,0,0,1,0,0,0,0], "albums/impulse.jpg"],
  [1, "Master of Puppets",                                [0,0,0,1,0,0,0,0], "albums/impulse.jpg"],
  [1, "Stuck (feat. N∀OKI & NOBUYA)",                     [0,0,0,1,0,0,0,0], "albums/impulse.jpg"],
    
  [1, "OIRAN - OIRAN Version",                            [0,0,0,0,1,0,0,0], "albums/oiran.jpg"],
  [1, "Monsters - OIRAN Version",                         [0,0,0,0,1,0,0,0], "albums/oiran.jpg"],
  [1, "Life - OIRAN Version",                             [0,0,0,0,1,0,0,0], "albums/oiran.jpg"],

  [1, "OIRAN -Instrumental-",                             [0,0,0,0,0,1,0,0], "albums/raitei.jpg"],
  [1, "MONSTERS -Instrumental-",                          [0,0,0,0,0,1,0,0], "albums/raitei.jpg"],
  [1, "Life -Instrumental-",                              [0,0,0,0,0,1,0,0], "albums/raitei.jpg"],
    
  [1, "雷霆 -RAITEI- -Instrumental-",                      [0,0,0,0,0,0,1,0], "albums/dissension.jpg"],
  [1, "SORAI -Instrumental-",                             [0,0,0,0,0,0,1,0], "albums/dissension.jpg"],
  [1, "Fighter",                                          [0,0,0,0,0,0,1,0], "albums/dissension.jpg"],

  [1, "G.O.D.",                                           [0,0,0,0,0,0,0,1], "albums/god.jpg"],

];

// Level data format:
// G = Ground, B = Brick, ? = Question Block, K = Solid Block
// C = Coin, E = Enemy, P = Pipe, F = Flag
// . = Empty space

const L1_MAP = [
  //0         1         2         3         4         5         6         7         8
  //0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567
  '..................................................................................',  // 0
  '..................................................................................',  // 1
  '..................................................................................',  // 2
  '..................................................................................',  // 3
  '..................................................................................',  // 4
  '..................................................................................',  // 5
  '..................................................................................',  // 6
  '....................C.C.C.........................................................',  // 7
  '..................................................................................',  // 8
  '.................?B?B?..........C.C.C.............................................',  // 9
  '..................................................................................',  // 10
  '...............................B?B?B?B............................................',  // 11
  '..........................................................C.C.C..................',  // 12
  '...................................E.......?...B?B................E..........F.....',  // 13
  '........E.................E....GGGGGGG....GGG.GGGGG....E....GGGGGGGGG...GGGGGGGGG',  // 14
  '..GGGGGGGGGGGG...GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',  // 15
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',  // 16
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',  // 17
]

function parseLevelMap(map: string[]): { tiles: string[][]; width: number; height: number; playerStart: { x: number; y: number } } {
  const tiles: string[][] = []
  let playerStart = { x: 2, y: 14 }

  for (let row = 0; row < map.length; row++) {
    const rowTiles: string[] = []
    for (let col = 0; col < map[row].length; col++) {
      rowTiles.push(map[row][col])
    }
    tiles.push(rowTiles)
  }

  return {
    tiles,
    width: map[0].length,
    height: map.length,
    playerStart,
  }
}

export const LEVEL_1 = parseLevelMap(L1_MAP)

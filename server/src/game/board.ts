import type { BoardCell } from './game.types';

/**
 * Official Sequence board layout (10x10) — matches physical Hasbro board.
 * null = corner (free/wild space for all teams).
 * Each non-Jack card appears exactly twice across the 96 non-corner cells.
 * Card codes: rank + suit initial (e.g. 'AH' = Ace of Hearts, 'TS' = 10 of Spades)
 */
export const SEQUENCE_BOARD_LAYOUT: (string | null)[][] = [
  [null, 'TS',  'QS',  'KS',  'AS',  '2D',  '3D',  '4D',  '5D',  null ],
  ['9S', 'TH',  '9H',  '8H',  '7H',  '6H',  '5H',  '4H',  '3H',  '6D' ],
  ['8S', 'QH',  '7D',  '8D',  '9D',  'TD',  'QD',  'KD',  '2H',  '7D' ],
  ['7S', 'KH',  '6D',  '2C',  'AH',  'KH',  'QH',  'AD',  '2S',  '8D' ],
  ['6S', 'AH',  '5D',  '3C',  '4H',  '3H',  'TH',  'AC',  '3S',  '9D' ],
  ['5S', '2C',  '4D',  '4C',  '5H',  '2H',  '9H',  'KC',  '4S',  'TD' ],
  ['4S', '3C',  '3D',  '5C',  '6H',  '7H',  '8H',  'QC',  '5S',  'QD' ],
  ['3S', '4C',  '2D',  '6C',  '7C',  '8C',  '9C',  'TC',  '6S',  'KD' ],
  ['2S', '5C',  'AS',  'KS',  'QS',  'TS',  '9S',  '8S',  '7S',  'AD' ],
  [null, '6C',  '7C',  '8C',  '9C',  'TC',  'QC',  'KC',  'AC',  null ],
];

export function createBoard(): BoardCell[][] {
  return SEQUENCE_BOARD_LAYOUT.map((row, rowIndex) =>
    row.map((cardCode, colIndex) => ({
      id: `${rowIndex}-${colIndex}`,
      row: rowIndex,
      col: colIndex,
      cardCode: cardCode,
      isCorner: cardCode === null,
      occupiedByTeamId: null,
      occupiedByPlayerId: null,
      isSequenceCell: false,
      sequenceId: null,
    }))
  );
}

export function getBoardCell(board: BoardCell[][], cellId: string): BoardCell | null {
  const [row, col] = cellId.split('-').map(Number);
  if (row === undefined || col === undefined) return null;
  return board[row]?.[col] ?? null;
}

/**
 * Returns all board positions that match the given card code.
 */
export function getCellsByCardCode(board: BoardCell[][], cardCode: string): BoardCell[] {
  const cells: BoardCell[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (cell.cardCode === cardCode) {
        cells.push(cell);
      }
    }
  }
  return cells;
}

import type { BoardCell } from './types';

/**
 * Standard Sequence board layout (10x10).
 * null = corner (free/wild space for all teams).
 * Each non-Jack card appears exactly twice.
 */
export const SEQUENCE_BOARD_LAYOUT: (string | null)[][] = [
  [null, '2S',  '3S',  '4S',  '5S',  '6S',  '7S',  '8S',  '9S',  null ],
  ['6C', '5C',  '4C',  '3C',  '2C',  'AH',  'KH',  'QH',  'TH',  'TS' ],
  ['7C', 'AS',  '2D',  '3D',  '4D',  '5D',  '6D',  '7D',  '9H',  'QS' ],
  ['8C', 'KS',  '6H',  '5H',  '4H',  '3H',  '2H',  '8D',  '8H',  'AD' ],
  ['9C', 'QS',  '7H',  'AC',  'KD',  'QD',  'AH',  '9D',  '9H',  'KC' ],
  ['TC', 'TH',  '8H',  'KC',  'QD',  'KD',  'KH',  'TD',  '6H',  '2C' ],
  ['QC', '9C',  'TC',  '7C',  'TS',  'QH',  '8C',  'KS',  '6C',  '5C' ],
  ['QC', 'AS',  'AC',  '7H',  'TD',  'AD',  '2H',  '3H',  '4H',  '5H' ],
  ['3C', '2S',  '3S',  '4S',  '5S',  '6S',  '7S',  '8S',  '9S',  '4C' ],
  [null, '2D',  '3D',  '4D',  '5D',  '6D',  '7D',  '8D',  '9D',  null ],
];

export function createEmptyBoard(): BoardCell[][] {
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

/** Returns all board cells that match a given card code */
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

/** Returns valid (empty) board cells the player can place a chip on with this card */
export function getValidPlacementCells(board: BoardCell[][], cardCode: string): string[] {
  return getCellsByCardCode(board, cardCode)
    .filter(cell => !cell.isCorner && cell.occupiedByTeamId === null)
    .map(cell => cell.id);
}

/** Returns cells with opponent chips that can be removed with a one-eyed Jack */
export function getRemovableCells(board: BoardCell[][], myTeamId: string): string[] {
  const cells: string[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (
        !cell.isCorner &&
        cell.occupiedByTeamId !== null &&
        cell.occupiedByTeamId !== myTeamId &&
        !cell.isSequenceCell
      ) {
        cells.push(cell.id);
      }
    }
  }
  return cells;
}

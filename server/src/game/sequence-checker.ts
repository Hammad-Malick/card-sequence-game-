import type { BoardCell } from './game.types';

export interface SequenceResult {
  found: boolean;
  sequences: FoundSequence[];
}

export interface FoundSequence {
  id: string;
  teamId: string;
  cellIds: string[];
}

const SEQUENCE_LENGTH = 5;

/**
 * Checks for all completed 5-in-a-row sequences on the board for all teams.
 * Corners count as wild cells (belong to any team for sequence purposes).
 */
export function checkAllSequences(board: BoardCell[][]): FoundSequence[] {
  const sequences: FoundSequence[] = [];
  const teamIds = new Set<string>();

  for (const row of board) {
    for (const cell of row) {
      if (cell.occupiedByTeamId) teamIds.add(cell.occupiedByTeamId);
    }
  }

  for (const teamId of teamIds) {
    const found = findSequencesForTeam(board, teamId);
    sequences.push(...found);
  }

  return sequences;
}

function findSequencesForTeam(board: BoardCell[][], teamId: string): FoundSequence[] {
  const sequences: FoundSequence[] = [];
  const usedCellIds = new Set<string>();

  const directions: [number, number][] = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ];

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      for (const [dr, dc] of directions) {
        const cellIds: string[] = [];
        let valid = true;

        for (let step = 0; step < SEQUENCE_LENGTH; step++) {
          const r = row + dr * step;
          const c = col + dc * step;

          if (r < 0 || r >= 10 || c < 0 || c >= 10) {
            valid = false;
            break;
          }

          const cell = board[r][c];
          // Corners are free for all teams
          if (!cell.isCorner && cell.occupiedByTeamId !== teamId) {
            valid = false;
            break;
          }
          cellIds.push(cell.id);
        }

        if (valid && cellIds.length === SEQUENCE_LENGTH) {
          // Avoid counting sequences that share more than one already-sequenced cell
          const alreadyUsed = cellIds.filter(id => usedCellIds.has(id)).length;
          if (alreadyUsed < SEQUENCE_LENGTH - 1) {
            const seqId = `seq-${teamId}-${sequences.length}`;
            sequences.push({ id: seqId, teamId, cellIds });
            cellIds.forEach(id => usedCellIds.add(id));
          }
        }
      }
    }
  }

  return sequences;
}

/**
 * Applies sequence markers to the board cells.
 * Returns a new board (immutable).
 */
export function applySequencesToBoard(
  board: BoardCell[][],
  sequences: FoundSequence[]
): BoardCell[][] {
  const flat = new Map<string, { isSequenceCell: boolean; sequenceId: string }>();

  for (const seq of sequences) {
    for (const cellId of seq.cellIds) {
      flat.set(cellId, { isSequenceCell: true, sequenceId: seq.id });
    }
  }

  return board.map(row =>
    row.map(cell => {
      const marker = flat.get(cell.id);
      if (marker) {
        return { ...cell, isSequenceCell: true, sequenceId: marker.sequenceId };
      }
      return cell;
    })
  );
}

/**
 * Returns the number of sequences each team has.
 */
export function countSequencesPerTeam(sequences: FoundSequence[]): Record<string, number> {
  return sequences.reduce<Record<string, number>>((acc, seq) => {
    acc[seq.teamId] = (acc[seq.teamId] ?? 0) + 1;
    return acc;
  }, {});
}

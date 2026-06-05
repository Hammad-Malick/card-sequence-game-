import type { Team } from './game.types';
import type { Player } from '../rooms/room.types';

/**
 * Builds turn order so play alternates across teams (e.g. blue → green → blue → green).
 * Players within each team keep their join order; teams follow the gameState.teams order.
 */
export function buildAlternatingTurnOrder(players: Player[], teams: Team[]): string[] {
  const playersByTeam = new Map<string, Player[]>();

  for (const team of teams) {
    playersByTeam.set(team.id, []);
  }

  for (const player of players) {
    const teamPlayers = playersByTeam.get(player.teamId);
    if (teamPlayers) {
      teamPlayers.push(player);
    }
  }

  const teamQueues = teams.map(team => playersByTeam.get(team.id) ?? []);
  const maxPlayersOnTeam = teamQueues.reduce(
    (max, queue) => Math.max(max, queue.length),
    0
  );

  const turnOrder: string[] = [];

  for (let round = 0; round < maxPlayersOnTeam; round++) {
    for (const queue of teamQueues) {
      const player = queue[round];
      if (player) {
        turnOrder.push(player.id);
      }
    }
  }

  return turnOrder;
}

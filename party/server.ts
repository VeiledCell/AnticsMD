import type * as Party from "partykit/server";

interface Player {
  id: string;
  x: number;
  y: number;
  rotation: number;
  status: 'idle' | 'walking' | 'interviewing' | 'charting';
}

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  players: Record<string, Player> = {};

  onConnect(conn: Party.Connection, ctx: Party.ConnectOptions) {
    // Send current players to the new connection
    conn.send(JSON.stringify({ type: "sync", players: this.players }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);

    if (data.type === "update") {
      const player: Player = {
        id: sender.id,
        x: data.x,
        y: data.y,
        rotation: data.rotation,
        status: data.status,
      };
      this.players[sender.id] = player;

      // Broadcast update to all other players
      this.room.broadcast(JSON.stringify({ type: "update", player }), [sender.id]);
    }
  }

  onClose(conn: Party.Connection) {
    delete this.players[conn.id];
    this.room.broadcast(JSON.stringify({ type: "remove", id: conn.id }));
  }
}

Server satisfies Party.Worker;

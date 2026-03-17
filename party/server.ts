import type * as Party from "partykit/server";

interface Player {
  id: string;
  x: number;
  y: number;
  rotation: number;
  status: 'idle' | 'walking' | 'interviewing' | 'charting';
  activePatientId?: string;
}

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  players: Record<string, Player> = {};
  locks: Record<string, string> = {}; // patientId -> playerId

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.send(JSON.stringify({ type: "sync", players: this.players, locks: this.locks }));
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
        activePatientId: data.activePatientId
      };
      this.players[sender.id] = player;
      this.room.broadcast(JSON.stringify({ type: "update", player }), [sender.id]);
    }

    if (data.type === "lock") {
      // Only allow lock if not already locked
      if (!this.locks[data.patientId]) {
        this.locks[data.patientId] = sender.id;
        this.room.broadcast(JSON.stringify({ type: "lock", patientId: data.patientId, playerId: sender.id }));
      }
    }

    if (data.type === "unlock") {
      if (this.locks[data.patientId] === sender.id) {
        delete this.locks[data.patientId];
        this.room.broadcast(JSON.stringify({ type: "unlock", patientId: data.patientId }));
      }
    }
  }

  onClose(conn: Party.Connection) {
    // Clear any locks held by this player
    Object.keys(this.locks).forEach(patientId => {
      if (this.locks[patientId] === conn.id) delete this.locks[patientId];
    });
    delete this.players[conn.id];
    this.room.broadcast(JSON.stringify({ type: "remove", id: conn.id }));
  }
}

Server satisfies Party.Worker;

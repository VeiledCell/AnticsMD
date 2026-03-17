import Phaser from 'phaser';
import PartySocket from 'partysocket';

interface PlayerData {
  id: string;
  x: number;
  y: number;
  rotation: number;
  status: string;
}

export default class WardScene extends Phaser.Scene {
  private socket: PartySocket;
  private players: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private player?: Phaser.GameObjects.Rectangle;
  private patients: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private locks: Map<string, string> = new Map(); // patientId -> playerId
  private playerId: string = Math.random().toString(36).substring(7);

  constructor() {
    super('WardScene');
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
    console.log('Connecting to PartyKit at:', host);
    this.socket = new PartySocket({
      host,
      room: 'hospital-ward',
      id: this.playerId,
    });

    this.socket.onopen = () => console.log('✅ Connected to PartyKit');
    this.socket.onerror = (err) => console.error('❌ PartyKit Error:', err);
  }

  preload() {
    // No assets for now
  }

  create() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as any;

    this.createIsometricGrid();

    // Create local player
    this.player = this.add.rectangle(400, 300, 32, 32, 0x00ff00);
    this.physics.add.existing(this.player);

    // Mock patient spawning
    this.spawnPatient('patient-1', 500, 350);
    this.spawnPatient('patient-2', 200, 450);

    // Socket listeners
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 [Socket] Incoming:', data);
      if (data.type === 'sync') {
        this.locks = new Map(Object.entries(data.locks));
        Object.entries(data.players).forEach(([id, p]: [string, any]) => {
          if (id !== this.playerId) this.updateRemotePlayer(p);
        });
        this.patients.forEach((_, id) => this.updatePatientColor(id));
      } else if (data.type === 'update') {
        if (data.player.id !== this.playerId) this.updateRemotePlayer(data.player);
      } else if (data.type === 'lock') {
        console.log('🔒 Message: Lock received for', data.patientId, 'by', data.playerId);
        this.locks.set(data.patientId, data.playerId);
        this.updatePatientColor(data.patientId);
      } else if (data.type === 'unlock') {
        console.log('🔓 Message: Unlock received for', data.patientId);
        this.locks.delete(data.patientId);
        this.updatePatientColor(data.patientId);
      } else if (data.type === 'remove') {
        this.removeRemotePlayer(data.id);
      }
    };
  }

  private updatePatientColor(id: string) {
    const p = this.patients.get(id);
    if (!p) return;
    p.setFillStyle(this.locks.has(id) ? 0xef4444 : 0x3b82f6); // Red if locked, blue if free
  }

  private spawnPatient(id: string, x: number, y: number) {
    const patient = this.add.rectangle(x, y, 32, 32, 0x3b82f6);
    this.physics.add.existing(patient, true);
    this.patients.set(id, patient);

    patient.setInteractive();
    patient.on('pointerdown', () => {
      if (!this.player) return;

      const lockOwner = this.locks.get(id);
      if (lockOwner && lockOwner !== this.playerId) {
        console.log('🔒 Locked by another player');
        return;
      }

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
      if (dist < 120) {
        console.log('📤 [Socket] Sending Lock for:', id);
        this.socket.send(JSON.stringify({ type: 'lock', patientId: id }));
        window.dispatchEvent(new CustomEvent('phaser-patient-interact', { detail: { id } }));
      }
    });
  }

  public unlockPatient(id: string) {
    this.socket.send(JSON.stringify({ type: 'unlock', patientId: id }));
  }

  update() {
    if (!this.player || !this.cursors || !this.wasd) return;

    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      body.setVelocityX(-speed);
      moving = true;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      body.setVelocityX(speed);
      moving = true;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      body.setVelocityY(-speed);
      moving = true;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      body.setVelocityY(speed);
      moving = true;
    }

    if (moving) {
      this.socket.send(JSON.stringify({
        type: 'update',
        x: this.player.x,
        y: this.player.y,
        rotation: 0,
        status: 'walking'
      }));
    }
  }

  private createIsometricGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xcccccc, 0.5);
    const gridSize = 32;
    const rows = 20;
    const cols = 20;
    for (let i = 0; i <= rows; i++) {
      graphics.moveTo(0, i * gridSize);
      graphics.lineTo(cols * gridSize, i * gridSize);
    }
    for (let j = 0; j <= cols; j++) {
      graphics.moveTo(j * gridSize, 0);
      graphics.lineTo(j * gridSize, rows * gridSize);
    }
    graphics.strokePath();
  }

  private updateRemotePlayer(data: PlayerData) {
    let remote = this.players.get(data.id);
    if (!remote) {
      remote = this.add.rectangle(data.x, data.y, 32, 32, 0xff0000);
      this.players.set(data.id, remote);
    } else {
      remote.setPosition(data.x, data.y);
    }
  }

  private removeRemotePlayer(id: string) {
    const remote = this.players.get(id);
    if (remote) {
      remote.destroy();
      this.players.delete(id);
    }
  }
}

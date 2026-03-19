import * as Phaser from 'phaser';
import PartySocket from 'partysocket';
import { supabase } from '@/lib/supabase';

interface PlayerData {
  id: string;
  x: number;
  y: number;
  rotation: number;
  status: string;
  activePatientId?: string;
}

export default class WardScene extends Phaser.Scene {
  private socket: PartySocket;
  private players: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private remotePlayerData: Map<string, PlayerData> = new Map();
  private lastUpdateSent: number = 0;
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
  
  private activePatientId: string | null = null;
  private interactionRadius: number = 60;
  private autoUnlockRadius: number = 100;

  // Ward Layout Config
  private readonly BAY_COORDINATES = [
    { x: 150, y: 150, id: 'bay-1' }, { x: 400, y: 150, id: 'bay-2' }, { x: 650, y: 150, id: 'bay-3' },
    { x: 150, y: 450, id: 'bay-4' }, { x: 400, y: 450, id: 'bay-5' }, { x: 650, y: 450, id: 'bay-6' }
  ];
  private occupiedBays: Set<string> = new Set();

  constructor() {
    super('WardScene');
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
    this.socket = new PartySocket({
      host,
      room: 'hospital-ward',
      id: this.playerId,
    });
  }

  preload() {
    // No assets
  }

  create() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as any;

    this.createWardEnvironment();

    // Create local player
    this.player = this.add.rectangle(400, 300, 32, 32, 0x00ff00);
    this.physics.add.existing(this.player);
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    }

    // Fetch and spawn real patients from Supabase
    this.spawnLivePatients();

    // Socket listeners
    this.socket.onmessage = (event) => {
      if (!this.sys || !this.sys.isActive()) return;

      const data = JSON.parse(event.data);
      if (data.type === 'sync') {
        this.locks = new Map(Object.entries(data.locks));
        Object.entries(data.players).forEach(([id, p]: [string, any]) => {
          if (id !== this.playerId) this.updateRemotePlayer(p);
        });
        this.patients.forEach((_, id) => this.updatePatientColor(id));
      } else if (data.type === 'update') {
        if (data.player.id !== this.playerId) this.updateRemotePlayer(data.player);
      } else if (data.type === 'lock') {
        this.locks.set(data.patientId, data.playerId);
        this.updatePatientColor(data.patientId);
      } else if (data.type === 'unlock') {
        this.locks.delete(data.patientId);
        this.updatePatientColor(data.patientId);
      } else if (data.type === 'remove') {
        this.removeRemotePlayer(data.id);
      }
    };

    this.events.on('shutdown', () => this.socket.close());
    this.events.on('destroy', () => this.socket.close());
  }

  private createWardEnvironment() {
    // 1. Draw Floor
    this.add.grid(400, 300, 800, 600, 40, 40, 0xf8fafc, 1, 0xe2e8f0);
    
    // 2. Ward Boundaries (Walls)
    const walls = this.physics.add.staticGroup();
    
    // Create patient bays
    this.BAY_COORDINATES.forEach(bay => {
      // Bay floor highlight
      this.add.rectangle(bay.x, bay.y, 120, 120, 0xeef2ff).setDepth(-1).setStrokeStyle(2, 0xc7d2fe);
      this.add.text(bay.x - 50, bay.y - 55, bay.id.toUpperCase(), { 
        fontSize: '10px', 
        fontFamily: 'monospace',
        color: '#6366f1',
        fontStyle: 'bold'
      });
      
      // Bay partitions
      const leftPartition = this.add.rectangle(bay.x - 60, bay.y, 4, 120, 0xcbd5e1);
      const rightPartition = this.add.rectangle(bay.x + 60, bay.y, 4, 120, 0xcbd5e1);
      walls.add(leftPartition);
      walls.add(rightPartition);
    });

    // Outer walls
    walls.add(this.add.rectangle(400, 5, 800, 10, 0x1e293b));
    walls.add(this.add.rectangle(400, 595, 800, 10, 0x1e293b));
    walls.add(this.add.rectangle(5, 300, 10, 600, 0x1e293b));
    walls.add(this.add.rectangle(795, 300, 10, 600, 0x1e293b));

    if (this.player) {
      this.physics.add.collider(this.player, walls);
    }
  }

  private async spawnLivePatients() {
    try {
      console.log('📡 Fetching patients from Supabase...');
      const { data, error } = await supabase
        .from('daily_vignettes')
        .select('id')
        .eq('is_active', true)
        .limit(6);

      if (error) {
        console.error('❌ Supabase Fetch Error:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No active patients found in Supabase table.');
        return;
      }

      console.log(`🏥 Found ${data.length} patients in Supabase. Spawning into bays...`);
      data.forEach((row, index) => {
        const bay = this.BAY_COORDINATES[index];
        if (bay) {
          this.spawnPatient(row.id.toString(), bay.x, bay.y);
          this.occupiedBays.add(bay.id);
        }
      });
    } catch (e) {
      console.error('❌ Exception in spawnLivePatients:', e);
    }
  }

  private spawnPatient(id: string, x: number, y: number) {
    const patient = this.add.rectangle(x, y, 32, 32, 0x3b82f6);
    this.physics.add.existing(patient, true);
    this.patients.set(id, patient);

    patient.setInteractive();
    patient.on('pointerdown', () => {
      if (!this.player) return;

      const lockOwner = this.locks.get(id);
      if (lockOwner && lockOwner !== this.playerId) return;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
      if (dist < this.interactionRadius) {
        this.activePatientId = id;
        this.socket.send(JSON.stringify({ type: 'lock', patientId: id }));
        this.socket.send(JSON.stringify({
          type: 'update',
          x: this.player.x,
          y: this.player.y,
          rotation: 0,
          status: 'interviewing',
          activePatientId: id
        }));
        window.dispatchEvent(new CustomEvent('phaser-patient-interact', { detail: { id } }));
      }
    });
  }

  private updatePatientColor(id: string) {
    const p = this.patients.get(id);
    if (!p) return;
    p.setFillStyle(this.locks.has(id) ? 0xef4444 : 0x3b82f6);
  }

  public unlockPatient(id: string, isSubmitted: boolean = false) {
    // Only despawn patient upon chart submission
    if (isSubmitted) {
      const p = this.patients.get(id);
      if (p) {
        p.destroy();
        this.patients.delete(id);
      }
    }

    this.socket.send(JSON.stringify({ type: 'unlock', patientId: id }));
    this.activePatientId = null;
    
    if (this.player) {
      this.socket.send(JSON.stringify({
        type: 'update',
        x: this.player.x,
        y: this.player.y,
        rotation: 0,
        status: 'walking',
        activePatientId: undefined
      }));
    }
  }

  update(time: number) {
    if (!this.player || !this.cursors || !this.wasd) return;

    if (this.activePatientId) {
      const p = this.patients.get(this.activePatientId);
      if (p) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
        if (dist > this.autoUnlockRadius) {
          this.unlockPatient(this.activePatientId);
          window.dispatchEvent(new CustomEvent('phaser-patient-autounlock'));
        }
      }
    }

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
        status: this.activePatientId ? 'interviewing' : 'walking',
        activePatientId: this.activePatientId || undefined
      }));
    }

    if (time > this.lastUpdateSent + 500) {
      this.lastUpdateSent = time;
      window.dispatchEvent(new CustomEvent('phaser-remote-update', { 
        detail: { 
          players: Object.fromEntries(this.remotePlayerData), 
          localPlayer: { x: this.player.x, y: this.player.y } 
        } 
      }));
    }
  }

  private updateRemotePlayer(data: PlayerData) {
    this.remotePlayerData.set(data.id, data);
    let remote = this.players.get(data.id);
    if (!remote) {
      remote = this.add.rectangle(data.x, data.y, 32, 32, 0xff0000);
      this.players.set(data.id, remote);
    } else {
      remote.setPosition(data.x, data.y);
    }
  }

  private removeRemotePlayer(id: string) {
    this.remotePlayerData.delete(id);
    const remote = this.players.get(id);
    if (remote) {
      remote.destroy();
      this.players.delete(id);
    }
  }
}

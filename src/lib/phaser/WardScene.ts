import * as Phaser from 'phaser';
import PartySocket from 'partysocket';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    console.log('🏗️ WardScene create() called. Local Player:', this.playerId);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as any;

    this.createWardEnvironment();

    // Create local player
    this.player = this.add.rectangle(400, 300, 32, 32, 0x00ff00);
    this.player.setDepth(20);
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
      console.log('📡 Socket Message Received:', data.type, data);

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
      } else if (data.type === 'despawn') {
        console.log('🧨 Global Despawn received for:', data.patientId);
        this.internalDespawn(data.patientId);
      }
    };

    this.events.on('shutdown', () => this.socket.close());
    this.events.on('destroy', () => this.socket.close());
  }

  private createWardEnvironment() {
    // Floor grid (lowest depth)
    const floor = this.add.grid(400, 300, 800, 600, 40, 40, 0xf8fafc, 1, 0xe2e8f0);
    floor.setDepth(-10);

    const walls = this.physics.add.staticGroup();
    
    this.BAY_COORDINATES.forEach(bay => {
      // Bay floor highlight
      const bg = this.add.rectangle(bay.x, bay.y, 120, 120, 0xeef2ff).setStrokeStyle(2, 0xc7d2fe);
      bg.setDepth(-5);

      this.add.text(bay.x - 50, bay.y - 55, bay.id.toUpperCase(), { 
        fontSize: '10px', 
        fontFamily: 'monospace',
        color: '#6366f1',
        fontStyle: 'bold'
      }).setDepth(5);

      // Visual partitions
      const p1 = this.add.rectangle(bay.x - 60, bay.y, 4, 120, 0xcbd5e1);
      const p2 = this.add.rectangle(bay.x + 60, bay.y, 4, 120, 0xcbd5e1);
      p1.setDepth(5);
      p2.setDepth(5);
      walls.add(p1);
      walls.add(p2);
    });

    // Outer walls
    const w1 = this.add.rectangle(400, 5, 800, 10, 0x1e293b);
    const w2 = this.add.rectangle(400, 595, 800, 10, 0x1e293b);
    const w3 = this.add.rectangle(5, 300, 10, 600, 0x1e293b);
    const w4 = this.add.rectangle(795, 300, 10, 600, 0x1e293b);
    [w1, w2, w3, w4].forEach(w => {
      w.setDepth(100);
      walls.add(w);
    });

    if (this.player) {
      this.physics.add.collider(this.player, walls);
    }
  }

  private async spawnLivePatients() {
    try {
      console.log('📡 spawnLivePatients: Fetching from Supabase...');
      
      const uid = this.registry.get('uid');
      let completedIds: string[] = [];
      if (uid && db) {
        try {
          const statsRef = doc(db, "game_stats", uid);
          const docSnap = await getDoc(statsRef);
          if (docSnap.exists()) {
            completedIds = docSnap.data().completedQuestions || [];
          }
        } catch (e) {
          console.warn("Phaser: Failed to fetch completed questions:", e);
        }
      }

      const { data, error } = await supabase
        .from('daily_vignettes')
        .select('id')
        .eq('is_active', true)
        .limit(20); // Fetch more to allow for filtering

      if (error) {
        console.error('❌ Supabase Fetch Error:', error);
        this.spawnFallbackPatients();
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No active patients in Supabase - spawning fallbacks');
        this.spawnFallbackPatients();
        return;
      }

      // Filter out completed ones
      const filteredData = data.filter(row => !completedIds.includes(row.id.toString()));

      filteredData.slice(0, 6).forEach((row, index) => {
        const bay = this.BAY_COORDINATES[index];
        if (bay) {
          this.spawnPatient(row.id.toString(), bay.x, bay.y);
        }
      });
    } catch (e) {
      console.error('❌ spawnLivePatients Exception:', e);
      this.spawnFallbackPatients();
    }
  }

  private spawnFallbackPatients() {
    console.log('🛠️ Spawning Fallback Patients...');
    for (let i = 0; i < 3; i++) {
      const bay = this.BAY_COORDINATES[i];
      this.spawnPatient(`fallback-${i}`, bay.x, bay.y);
    }
  }

  private spawnPatient(id: string, x: number, y: number) {
    if (this.patients.has(id)) return;

    console.log(`👤 spawnPatient: Creating GameObject for ${id} at (${x}, ${y})`);
    const patient = this.add.rectangle(x, y, 32, 32, 0x3b82f6);
    patient.setDepth(10);
    this.physics.add.existing(patient, true);
    this.patients.set(id, patient);

    patient.setInteractive();
    patient.on('pointerdown', () => {
      if (!this.player) return;
      const lockOwner = this.locks.get(id);
      if (lockOwner && lockOwner !== this.playerId) {
        console.log(`🔒 Patient ${id} is locked by ${lockOwner}`);
        return;
      }

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
      if (dist < this.interactionRadius) {
        console.log(`✅ Encounter started with patient ${id}`);
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
      } else {
        console.log(`📏 Too far to interact: ${dist.toFixed(1)}u`);
      }
    });
  }

  private updatePatientColor(id: string) {
    const p = this.patients.get(id);
    if (!p) return;
    const isLocked = this.locks.has(id);
    const isByMe = this.locks.get(id) === this.playerId;
    
    // Red if locked by someone else, Blue if free, Green if being seen by me
    if (isLocked) {
      p.setFillStyle(isByMe ? 0x10b981 : 0xef4444);
    } else {
      p.setFillStyle(0x3b82f6);
    }
  }

  /**
   * REVISED: Manual close or walk-away. DO NOT destroy the patient.
   */
  public releasePatientLock(id: string) {
    console.log(`🔓 releasePatientLock: Releasing ${id}`);
    if (this.activePatientId === id) {
      this.activePatientId = null;
    }
    this.socket.send(JSON.stringify({ type: 'unlock', patientId: id }));
    this.sendWalkingUpdate();
  }

  /**
   * REVISED: Only called on SUBMIT.
   */
  public despawnPatient(id: string) {
    console.log(`🧨 despawnPatient: PERMANENT REMOVAL of ${id}`);
    if (this.activePatientId === id) {
      this.activePatientId = null;
    }
    
    // 1. Notify server so it broadcasts 'despawn' to everyone
    this.socket.send(JSON.stringify({ type: 'despawn', patientId: id }));
    
    // 2. Locally destroy
    this.internalDespawn(id);
    
    // 3. Reset state
    this.sendWalkingUpdate();
  }

  private internalDespawn(id: string) {
    const p = this.patients.get(id);
    if (p) {
      console.log(`  -> DESTROYING patient ${id} GameObject from map`);
      p.destroy();
      this.patients.delete(id);
    }
  }

  private sendWalkingUpdate() {
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
          console.log(`📏 Distance check failed (${dist.toFixed(1)}u) - Closing encounter`);
          const id = this.activePatientId;
          window.dispatchEvent(new CustomEvent('phaser-patient-autounlock'));
          this.releasePatientLock(id);
        }
      }
    }

    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;
    if (this.cursors.left.isDown || this.wasd.A.isDown) { body.setVelocityX(-speed); moving = true; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { body.setVelocityX(speed); moving = true; }

    if (this.cursors.up.isDown || this.wasd.W.isDown) { body.setVelocityY(-speed); moving = true; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { body.setVelocityY(speed); moving = true; }

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
      remote.setDepth(15);
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

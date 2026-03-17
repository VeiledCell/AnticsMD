'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import WardScene from '@/lib/phaser/WardScene';

export default function GameCanvas() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [WardScene],
    };

    const game = new Phaser.Game(config);
    (window as any).phaserGame = game;

    return () => {
      delete (window as any).phaserGame;
      game.destroy(true);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-slate-900 min-h-[600px] rounded-xl overflow-hidden shadow-2xl">
      <div ref={gameRef} />
      <div className="mt-4 p-4 text-white text-sm">
        <p>Use WASD or Arrow Keys to move. Other players appear as red squares.</p>
      </div>
    </div>
  );
}

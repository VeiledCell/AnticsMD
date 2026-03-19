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
      parent: gameRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
      },
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
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <div ref={gameRef} />
    </div>
  );
}

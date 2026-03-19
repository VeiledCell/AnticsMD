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
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
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
    <div className="w-full h-full bg-black overflow-hidden relative">
      <div ref={gameRef} className="w-full h-full" />
    </div>
  );
}

// src/dungeon.js
import { Level } from "./level.js";

export class Dungeon {
  constructor(seed = 12345, params = {}) {
    this.seed = seed;
    this.params = params;
    this.levels = [];
    this.liftConnections = [];
  }

  generate() {
    this.levels = [];
    const levelCount = this.params.levelCount || 3;
    const roomCountPerLevel = this.params.roomCountPerLevel || 8;

    for (let i = 0; i < levelCount; i++) {
      const level = new Level(i, {
        roomCount: roomCountPerLevel,
        totalLevels: levelCount,
      });
      level.generateRooms();
      this.levels.push(level);
    }

    this.linkLifts();
  }

  linkLifts() {
    // Связываем лифты между уровнями (для будущей логики переходов)
    for (let i = 0; i < this.levels.length - 1; i++) {
      const upperLift = this.levels[i].rooms.find(r => r.type === "lift");
      const lowerLift = this.levels[i + 1].rooms.find(r => r.type === "lift");
      if (upperLift && lowerLift) {
        this.liftConnections.push({
          from: upperLift.id,
          to: lowerLift.id,
        });
      }
    }
  }
}

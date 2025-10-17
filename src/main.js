import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { Level } from "./level.js";
import { DebugMode } from "./debug.js"; // ← ДОБАВЛЯЕМ

window.addEventListener("DOMContentLoaded", () => {
  const renderer = new Renderer("renderCanvas");
  let debugMode = null;

  async function generateLevel() {
    const level = new Level(0, 20);

    // Первая комната
    const room1 = new Room(2, 2, 5, 5, {
      doorSide: 'south',
      tunnelSide: 'west'
    });
    room1.fillFloor();
    room1.generateWalls();
    room1.generateDecor();
    level.addRoom(room1);

    // Для сокровищницы:
    const treasureRoom = new Room(15, 15, 4, 4, {
      doorSide: 'north',
      isTreasureRoom: true // ← Помечаем как сокровищницу
    });
    treasureRoom.fillFloor();
    treasureRoom.generateWalls();
    treasureRoom.generateDecor();
    level.addRoom(treasureRoom);

    await renderer.renderLevel(level);
    debugMode = new DebugMode(renderer, level);
  }

  generateLevel();
});
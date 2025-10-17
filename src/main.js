import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { Level } from "./level.js";

window.addEventListener("DOMContentLoaded", () => {
  const renderer = new Renderer("renderCanvas");

  async function generateLevel() {
    // Создаем уровень 40x40
    const level = new Level(0, 40);

    // Комната 1
    const room1 = new Room(0, 0, 8, 6, {
      doorSide: 'east',
      tunnelSide: 'south'
    });
    room1.fillFloor();
    room1.generateWalls();
    level.addRoom(room1);

    const room2 = new Room(20, 20, 3, 3, {
      doorSide: 'east',
      tunnelSide: 'south'
    });
    room2.fillFloor();
    room2.generateWalls();
    level.addRoom(room2);

    // Рендерим весь уровень
    await renderer.renderLevel(level);
  }

  generateLevel();
});
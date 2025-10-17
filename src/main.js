import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { Level } from "./level.js";

window.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const renderer = new Renderer("renderCanvas");

  async function generateSingleRoom() {
    renderer.clearScene();

    // Создаем уровень с сеткой 10x10
    const level = new Level(0, 10);

    // ОДНА комната 3x3 с дверью и туннелем
    const room = new Room(3, 3, 3, 3, {
      doorSide: 'east',
      tunnelSide: 'north'
    });
    
    room.fillFloor();
    room.generateWalls();
    
    level.addRoom(room);

    // Получаем данные для рендера
    const levelData = level.mergeRooms();
    console.log("=== ROOM DATA ===");
    console.log("Room tiles:", levelData.tiles);

    // Отрисовываем - передаем ВСЕ данные тайлов включая side
    await renderer.renderLevel(levelData);
    renderer.updateGrid(levelData.bounds);
  }

  generateBtn.addEventListener("click", generateSingleRoom);
  generateSingleRoom();
});
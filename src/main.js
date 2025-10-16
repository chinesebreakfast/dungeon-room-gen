import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { RoomMerger } from "./roomMerger.js";
import { generateWalls } from "./wallGenerator.js";

window.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const renderer = new Renderer("renderCanvas"); // без комнаты

  async function generateLRoom() {
    renderer.clearScene();

    const roomMerger = new RoomMerger();
    
    // Создаем L-образную комнату
    const room1 = new Room(3, 4); // 3x4
    room1.fillWithFloor();
    roomMerger.addRoom(room1, 0, 0);
    
    const room2 = new Room(5, 3); // 5x3  
    room2.fillWithFloor();
    roomMerger.addRoom(room2, 2, 1); // пересекается с первой
    
    const mergedRoom = roomMerger.mergeRooms();

    // Отрисовываем пол
    const floorCells = mergedRoom.getAllFloorCells();
    for (const cell of floorCells) {
      await renderer.setTile(cell.x, cell.z, "floor");
    }

    // Генерируем стены
    generateWalls(mergedRoom, renderer);
  }

  generateBtn.addEventListener("click", generateLRoom);
  generateLRoom();
});
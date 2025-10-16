import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { generateWalls } from "./wallGenerator.js";

window.addEventListener("DOMContentLoaded", () => {
  const roomWidthInput = document.getElementById("roomWidth");
  const roomHeightInput = document.getElementById("roomHeight");
  const generateBtn = document.getElementById("generateBtn");

  let room = new Room(parseInt(roomWidthInput.value), parseInt(roomHeightInput.value));
  const renderer = new Renderer("renderCanvas", room);

  async function generateRoom() {
    room = new Room(parseInt(roomWidthInput.value), parseInt(roomHeightInput.value));
    renderer.room = room;

    renderer.clearScene();
    room.fillWithFloor();
    await renderer.fillRoom();

    // Добавляем стены
    generateWalls(room, renderer);
  }

  generateBtn.addEventListener("click", generateRoom);
  generateRoom();
});

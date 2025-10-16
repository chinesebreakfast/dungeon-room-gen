// src/main.js
import { Renderer } from "./render.js";
import { Dungeon } from "./dungeon.js";

let renderer;
let dungeon;

window.addEventListener("DOMContentLoaded", () => {
  renderer = new Renderer("renderCanvas");
  renderer.run();

  document.getElementById("generateBtn").addEventListener("click", () => {
    generateDungeon();
  });

  generateDungeon(); // генерация при запуске
});

function generateDungeon() {
  const roomCount = parseInt(document.getElementById("roomsCount").value);
  const seed = parseInt(document.getElementById("seed").value);

  dungeon = new Dungeon(seed, { roomCountPerLevel: roomCount, levelCount: 3 });
  dungeon.generate();
  renderer.renderDungeon(dungeon);
}

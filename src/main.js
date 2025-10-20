import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { Level } from "./level.js";
import { DebugMode } from "./debug.js";
import { EnemyManager } from './enemies/enemyManager.js';
import { EnemyRenderer } from './enemies/enemyRenderer.js';

window.addEventListener("DOMContentLoaded", () => {
  const renderer = new Renderer("renderCanvas");
  let debugMode = null;

  let enemyManager = null;
  let enemyRenderer = null;

  async function generateLevel() {
    const level = new Level(0, 20);

    enemyManager = new EnemyManager(level);
    enemyRenderer = new EnemyRenderer(renderer.scene, "./assets/enemy/");

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
    
    // Спавн врагов в комнатах
    level.rooms.forEach(room => {
      enemyManager.spawnEnemiesInRoom(room);
    });

    await renderer.renderLevel(level);

    // Рендерим врагов

    const enemiesData = enemyManager.getAllEnemiesForRender();
    await enemyRenderer.renderEnemies(enemiesData, enemyManager);

    startEnemyUpdateLoop();
    enemiesData.forEach(enemy => {
      console.log(`- ${enemy.type} at (${enemy.x}, ${enemy.z})`);
    });

    debugMode = new DebugMode(renderer, level);
  }
  function startEnemyUpdateLoop() {
    function updateLoop() {
      enemyManager.updateAllEnemies();
      requestAnimationFrame(updateLoop);
    }
    updateLoop();
  }

  generateLevel();
});
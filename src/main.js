import { Renderer } from "./renderer.js";
import { Room } from "./room.js";
import { Level } from "./level.js";
import { DebugMode } from "./debug.js";
import { EnemyManager } from './enemies/enemyManager.js';
import { EnemyRenderer } from './enemies/enemyRenderer.js';
import { EnemyNavigation } from "./enemies/enemyNavigation.js";

window.addEventListener("DOMContentLoaded", () => {
  const renderer = new Renderer("renderCanvas");
  let debugMode = null;

  let enemyManager = null;
  let enemyRenderer = null;
  let enemyNavigation = null;

  async function generateLevel() {
    const level = new Level(0, 30);
    level.generateRooms();

    
    enemyNavigation = new EnemyNavigation(level);
    enemyRenderer = new EnemyRenderer(renderer.scene, "./assets/enemy/");
    enemyManager = new EnemyManager(enemyNavigation);
    await enemyRenderer.preloadEnemyTypes();
    

    // Спавн врагов в комнатах
    level.rooms.forEach(room => {
      enemyManager.spawnEnemiesInRoom(room);
    });

    await renderer.renderLevel(level);

    // Рендерим врагов

    const enemiesData = enemyManager.getAllEnemiesForRender();
    await enemyRenderer.renderEnemies(enemiesData, enemyManager);
    enemyRenderer.debugEnemyPositions();

    startEnemyUpdateLoop();
    // Отладочная информация
    console.log('=== DUNGEON GENERATION SUMMARY ===');
    console.log(`Level: ${level.levelIndex}`);
    console.log(`Grid size: ${level.gridSize}`);
    console.log(`Rooms: ${level.rooms.length}`);
    console.log(`Enemies: ${enemyManager.getEnemyCount()}`);
    
    // Показываем позиции комнат
    level.rooms.forEach((room, index) => {
      console.log(`Room ${index}: (${room.posX},${room.posZ}) ${room.width}x${room.height}`);
    });

    debugMode = new DebugMode(renderer, level);
    debugMode.setEnemyNavigation(enemyNavigation);
    debugMode.setEnemyManager(enemyManager);
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
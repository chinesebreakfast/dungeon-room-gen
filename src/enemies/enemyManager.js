// enemies/enemyManager.js
import { Enemy } from './enemy.js';
import { ENEMY_TYPES } from './enemyTypes.js';

export class EnemyManager {
  constructor() {
    this.enemies = new Map(); // enemyId -> Enemy
    this.lastUpdateTime = Date.now();
  }

  // Генерация врагов для комнаты
  spawnEnemiesInRoom(room) {
    const roomId = `${room.posX},${room.posZ}`;
    
    const availableTiles = this.getAvailableSpawnTiles(room);
    console.log(`   Found ${availableTiles.length} available tiles`);
    
    let spawnedCount = 0;
    
    for (const tile of availableTiles) {
      if (Math.random() < this.getSpawnProbability()) {
        const enemyType = this.selectRandomEnemyType();
        const enemy = new Enemy(enemyType, tile.x, tile.z, room);
        this.enemies.set(enemy.id, enemy);
        spawnedCount++;
        
      }
    }
    
    console.log(`✅ Spawned ${spawnedCount} enemies in room ${roomId}`);
  }

  // Обновление всех врагов
  updateAllEnemies() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // в секундах
    this.lastUpdateTime = currentTime;

    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);
    });
  }

  // Получение доступных тайлов для спавна (пол без декора)
  getAvailableSpawnTiles(room) {
    const roomData = room.getRoomData();
    const availableTiles = [];
    
    // Собираем позиции с декорациями
    const decorPositions = new Set();
    roomData.decor.forEach(decor => {
      decorPositions.add(`${decor.x},${decor.z}`);
    });

    // Ищем свободные тайлы пола
    roomData.tiles.forEach(tile => {
      if (tile.type === 'floor') {
        const tileKey = `${tile.x},${tile.z}`;
        if (!decorPositions.has(tileKey)) {
          availableTiles.push({ x: tile.x, z: tile.z });
        }
      }
    });

    return availableTiles;
  }

  // Вероятность спавна врага на тайле
  getSpawnProbability() {
    return 0.4; // 40% шанс
  }

  // Выбор случайного типа врага
  selectRandomEnemyType() {
    const types = Object.keys(ENEMY_TYPES);
    return types[Math.floor(Math.random() * types.length)];
  }

  // Получение всех врагов для рендеринга
  getAllEnemiesForRender() {
    const enemiesData = [];
    this.enemies.forEach(enemy => {
      enemiesData.push(enemy.getRenderData());
    });
    return enemiesData;
  }

  // Получение врага по ID
  getEnemyById(id) {
    return this.enemies.get(id);
  }

  // Получение количества врагов
  getEnemyCount() {
    return this.enemies.size;
  }

  // Очистка всех врагов
  clearAllEnemies() {
    this.enemies.clear();
    console.log('🧹 Cleared all enemies');
  }
}
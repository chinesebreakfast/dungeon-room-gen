// enemies/enemyNavigation.js
import { DECOR_TYPES } from '../decor.js';
export class EnemyNavigation {
  constructor(level) {
    this.level = level;
    this.walkableGrid = new Set();
    this.buildWalkableGrid();
  }

  buildWalkableGrid() {
    this.walkableGrid.clear();

    this.level.rooms.forEach(room => {
      const roomData = room.getRoomData();
      const decorMap = this.buildDecorMap(roomData.decor);

      roomData.tiles.forEach(tile => {
        if (this.isTileWalkable(tile, decorMap)) {
          this.walkableGrid.add(`${tile.x},${tile.z}`);
        }
      });
    });
  }

  buildDecorMap(decorArray) {
    const map = new Map();
    decorArray.forEach(decor => {
      map.set(`${decor.x},${decor.z}`, decor.type);
    });
    return map;
  }

  isTileWalkable(tile, decorMap) {
    if (tile.type !== 'floor') return false;
    
    const decorType = decorMap.get(`${tile.x},${tile.z}`);
    if (!decorType) return true; // Нет декора - можно ходить
    
    // Проверяем настройки navmesh для этого типа декора
    return DECOR_TYPES[decorType]?.navmesh === true;
  }

  isWalkable(x, z) {
    return this.walkableGrid.has(`${x},${z}`);
  }

  getWalkableNeighbors(x, z) {
    const neighbors = [];
    const directions = [
      { dx: 0, dz: -1 },  // север
      { dx: 1, dz: 0 },   // восток  
      { dx: 0, dz: 1 },   // юг
      { dx: -1, dz: 0 }   // запад
    ];
    
    directions.forEach(dir => {
      const newX = x + dir.dx;
      const newZ = z + dir.dz;
      
      if (this.isWalkable(newX, newZ)) {
        neighbors.push({ x: newX, z: newZ });
      }
    });
    
    return neighbors;
  }

  // Для отладки
  getWalkableCells() {
    return Array.from(this.walkableGrid).map(key => {
      const [x, z] = key.split(',').map(Number);
      return {x, z};
    });
  }
}
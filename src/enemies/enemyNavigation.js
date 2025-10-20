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
    const directions = [[0,1], [1,0], [0,-1], [-1,0]]; // N,E,S,W

    directions.forEach(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      if (this.isWalkable(nx, nz)) {
        neighbors.push({x: nx, z: nz});
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
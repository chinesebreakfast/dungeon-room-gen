export class Level {
  constructor(levelIndex, gridSize) {
    this.levelIndex = levelIndex;
    this.gridSize = gridSize;
    this.rooms = [];
  }

  addRoom(room) {
    this.rooms.push(room);
    return this;
  }

  // Для одной комнаты просто возвращаем ее данные
  mergeRooms() {
    if (this.rooms.length === 0) {
      return { tiles: [], bounds: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 } };
    }

    // Для одной комнаты просто берем ее тайлы
    const roomData = this.rooms[0].getRoomData();
    const tiles = roomData.tiles;

    return {
      level: this.levelIndex,
      tiles: tiles,
      bounds: this.calculateBounds(tiles)
    };
  }

  calculateBounds(tiles) {
    if (tiles.length === 0) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    for (const tile of tiles) {
      minX = Math.min(minX, tile.x);
      maxX = Math.max(maxX, tile.x);
      minZ = Math.min(minZ, tile.z);
      maxZ = Math.max(maxZ, tile.z);
    }
    
    return { minX, maxX, minZ, maxZ };
  }
}
import { Room } from "./room.js";

export class Level {
  constructor(levelIndex, gridSize) {
    this.levelIndex = levelIndex;
    this.gridSize = gridSize; // Фиксированный размер сетки уровня
    this.rooms = [];
    this.grid = Array.from({ length: gridSize }, () => 
      Array.from({ length: gridSize }, () => null)
    );
  }

  addRoom(room) {
    this.rooms.push(room);
    this.placeRoomOnGrid(room);
    return this;
  }

  // Размещаем комнату на сетке уровня
  placeRoomOnGrid(room) {
    const { posX, posZ, width, height } = room;
    
    for (let z = posZ; z < posZ + height; z++) {
      for (let x = posX; x < posX + width; x++) {
        if (x >= 0 && x < this.gridSize && z >= 0 && z < this.gridSize) {
          this.grid[z][x] = room; // помечаем ячейку как занятую комнатой
        }
      }
    }
  }

  // Объединяет комнаты и возвращает новую комнату
  mergeRooms(...roomsToMerge) {
    if (roomsToMerge.length === 0) {
      // Если комнаты не переданы, объединяем все комнаты уровня
      roomsToMerge = this.rooms;
    }

    if (roomsToMerge.length === 0) {
      return null; // Нет комнат для объединения
    }

    // Находим общие границы всех комнат
    const bounds = this.calculateMergedBounds(roomsToMerge);
    
    // Создаем новую объединенную комнату
    const mergedRoom = new Room(
      bounds.minX, 
      bounds.minZ, 
      bounds.maxX - bounds.minX + 1, 
      bounds.maxZ - bounds.minZ + 1,
      { isMerged: true }
    );

    // Заполняем полом всю объединенную область
    mergedRoom.fillFloor();

    // Генерируем стены по новому периметру
    mergedRoom.generateWalls();

    return mergedRoom;
  }

  calculateMergedBounds(rooms) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    for (const room of rooms) {
      minX = Math.min(minX, room.posX);
      maxX = Math.max(maxX, room.posX + room.width - 1);
      minZ = Math.min(minZ, room.posZ);
      maxZ = Math.max(maxZ, room.posZ + room.height - 1);
    }
    
    return { minX, maxX, minZ, maxZ };
  }

  // Получить данные уровня для рендеринга
  getLevelData() {
    return {
      level: this.levelIndex,
      gridSize: this.gridSize,
      rooms: this.rooms,
      bounds: this.calculateLevelBounds()
    };
  }

  calculateLevelBounds() {
    if (this.rooms.length === 0) {
      return { minX: 0, maxX: this.gridSize - 1, minZ: 0, maxZ: this.gridSize - 1 };
    }
    return this.calculateMergedBounds(this.rooms);
  }
}
import { Room } from "./room.js";
import { BSPGenerator } from "./BSPGenerator.js";

export class Level {
  constructor(levelIndex, gridSize) {
    this.levelIndex = levelIndex;
    this.gridSize = gridSize;
    this.rooms = [];
  }

  generateRooms() {
    console.log(`🏗️ Generating rooms for level ${this.levelIndex}...`);
    
    const generator = new BSPGenerator(this.levelIndex, this.gridSize);
    const generatedRooms = generator.generate();
    
    // Добавляем сгенерированные комнаты
    generatedRooms.forEach(room => {
      this.addRoom(room);
    });
    
    // Заполняем комнаты полом, стенами и декором
    this.generateRoomContents();
    
    console.log(`✅ Level generation complete: ${this.rooms.length} rooms`);
  }

  // Генерация содержимого комнат
  generateRoomContents() {
    this.rooms.forEach(room => {
      room.fillFloor();
      room.generateWalls();
      room.generateDecor();
    });
  }

  addRoom(room) {
    this.rooms.push(room);
    return this;
  }

  mergeRooms(...subrooms) {
  if (subrooms.length === 0) {
    return null;
  }

  const bounds = this.calculateMergedBounds(subrooms);
  
  // Создаем новую объединенную комнату
  const mergedRoom = new Room(
    bounds.minX, 
    bounds.minZ, 
    bounds.maxX - bounds.minX + 1, 
    bounds.maxZ - bounds.minZ + 1,
    { isMerged: true }
  );

  // Объединяем пол из всех подкомнат
  this.mergeFloors(mergedRoom, subrooms);

  // Сохраняем специальные тайлы из подкомнат
  this.preserveSpecialTiles(mergedRoom, subrooms);

  // Генерируем стены вокруг КАЖДОГО тайла пола
  mergedRoom.generateWalls();

  // ДОБАВЛЯЕМ: Добавляем недостающие стены в углах
  this.addMissingCornerWalls(mergedRoom, subrooms);

  return mergedRoom;
}

// НОВЫЙ МЕТОД: Добавляем недостающие стены в углах соединения комнат
addMissingCornerWalls(mergedRoom, subrooms) {
  // Собираем все позиции пола для быстрой проверки
  const floorPositions = new Set();
  for (const tile of mergedRoom.tiles.values()) {
    if (tile.type === 'floor') {
      floorPositions.add(`${tile.x},${tile.z}`);
    }
  }

  // Находим все позиции, где могут быть углы (границы объединенной комнаты)
  for (let x = mergedRoom.posX - 1; x <= mergedRoom.posX + mergedRoom.width; x++) {
    for (let z = mergedRoom.posZ - 1; z <= mergedRoom.posZ + mergedRoom.height; z++) {
      const currentKey = `${x},${z}`;
      
      // Пропускаем позиции с полом
      if (floorPositions.has(currentKey)) continue;
      
      // Проверяем, есть ли полы по горизонтали и вертикали от этой позиции
      const hasLeftFloor = floorPositions.has(`${x-1},${z}`);
      const hasRightFloor = floorPositions.has(`${x+1},${z}`);
      const hasTopFloor = floorPositions.has(`${x},${z-1}`);
      const hasBottomFloor = floorPositions.has(`${x},${z+1}`);
      
      // Если есть полы и по горизонтали и по вертикали - это угловая позиция
      const isHorizontalEdge = hasLeftFloor || hasRightFloor;
      const isVerticalEdge = hasTopFloor || hasBottomFloor;
      
      if (isHorizontalEdge && isVerticalEdge) {
        // Добавляем стены для всех направлений, где есть полы
        if (hasLeftFloor) this.placeWallIfMissing(mergedRoom, x, z, 'east');
        if (hasRightFloor) this.placeWallIfMissing(mergedRoom, x, z, 'west');
        if (hasTopFloor) this.placeWallIfMissing(mergedRoom, x, z, 'south');
        if (hasBottomFloor) this.placeWallIfMissing(mergedRoom, x, z, 'north');
      }
    }
  }
}

// Вспомогательный метод: ставим стену, если ее еще нет с таким side
placeWallIfMissing(mergedRoom, x, z, side) {
  const key = `${x},${z}`;
  const existingTile = mergedRoom.tiles.get(key);
  
  // Не перезаписываем специальные тайлы
  if (existingTile && (existingTile.type === 'door' || existingTile.type === 'wall_to_tunnel')) {
    return;
  }
  
  // Проверяем, есть ли уже стена с таким side
  if (existingTile && existingTile.type === 'wall' && existingTile.side === side) {
    return; // Стена с таким side уже есть
  }
  
  // Ставим новую стену
  mergedRoom.tiles.set(key, {
    type: 'wall',
    x: x,
    z: z,
    rotation: mergedRoom.getWallRotation(side),
    side: side
  });
}

  mergeFloors(mergedRoom, subrooms) {
    // Собираем все уникальные тайлы пола
    for (const room of subrooms) {
      const roomData = room.getRoomData();
      for (const tile of roomData.tiles) {
        if (tile.type === 'floor') {
          const key = `${tile.x},${tile.z}`;
          mergedRoom.tiles.set(key, {
            type: 'floor',
            x: tile.x,
            z: tile.z,
            rotation: 0
          });
        }
      }
    }
  }

  preserveSpecialTiles(mergedRoom, subrooms) {
    // Собираем все специальные тайлы
    for (const room of subrooms) {
      const roomData = room.getRoomData();
      for (const tile of roomData.tiles) {
        if (tile.type === 'door' || tile.type === 'wall_to_tunnel') {
          const key = `${tile.x},${tile.z}`;
          // Сохраняем специальный тайл
          mergedRoom.tiles.set(key, {
            type: tile.type,
            x: tile.x,
            z: tile.z,
            rotation: tile.rotation,
            side: tile.side
          });
        }
      }
    }
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
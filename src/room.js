import { DECOR_TYPES } from "./decor.js";

export class Room {
  constructor(posX, posZ, width, height, config = {}) {
    this.posX = posX;
    this.posZ = posZ;
    this.width = width;
    this.height = height;
    this.config = config;
    this.tiles = new Map();
    this.decor = [];
  }

  fillFloor() {
    for (let z = this.posZ; z < this.posZ + this.height; z++) {
      for (let x = this.posX; x < this.posX + this.width; x++) {
        const key = `${x},${z}`;
        this.tiles.set(key, {
          type: 'floor',
          x: x,
          z: z,
          rotation: 0
        });
      }
    }
  }

  generateWalls() {
    this.generateBoundaryWalls();
    this.applySpecialTiles();
  }

  generateBoundaryWalls() {
    // Проверяем каждую ячейку пола на границы
    for (let z = this.posZ; z < this.posZ + this.height; z++) {
      for (let x = this.posX; x < this.posX + this.width; x++) {
        const currentKey = `${x},${z}`;
        const currentTile = this.tiles.get(currentKey);
        
        // Пропускаем ячейки без пола
        if (!currentTile || currentTile.type !== 'floor') {
          continue;
        }

        this.checkAndPlaceWall(x, z, 1, 0, 'east');
        this.checkAndPlaceWall(x, z, -1, 0, 'west');
        this.checkAndPlaceWall(x, z, 0, 1, 'south');
        this.checkAndPlaceWall(x, z, 0, -1, 'north');
      }
    }
  }

  checkAndPlaceWall(x, z, dx, dz, side) {
    const neighborX = x + dx;
    const neighborZ = z + dz;
    const neighborKey = `${neighborX},${neighborZ}`;

    // Если соседняя ячейка НЕ содержит пол - ставим стену
    const hasFloor = this.tiles.has(neighborKey) && 
                    this.tiles.get(neighborKey).type === 'floor';
    
    // Ставим стену если: нет пола И (нет тайла ИЛИ там уже стена которую можно перезаписать)
    if (!hasFloor && (!this.tiles.has(neighborKey) || this.tiles.get(neighborKey).type === 'wall')) {
      this.tiles.set(neighborKey, {
        type: 'wall',
        x: neighborX,
        z: neighborZ,
        rotation: this.getWallRotation(side),
        side: side
      });
    }
  }

  placeSpecialTile(tileType, side) {
    let x, z;
    
    switch (side) {
      case 'north':
        x = this.posX + Math.floor(this.width / 2);
        z = this.posZ - 1;
        break;
      case 'south':
        x = this.posX + Math.floor(this.width / 2);
        z = this.posZ + this.height;
        break;
      case 'west':
        x = this.posX - 1;
        z = this.posZ + Math.floor(this.height / 2);
        break;
      case 'east':
        x = this.posX + this.width;
        z = this.posZ + Math.floor(this.height / 2);
        break;
    }
    
    const key = `${x},${z}`;
    
    // Заменяем существующую стену на специальный тайл
    if (this.tiles.has(key)) {
      const tile = this.tiles.get(key);
      tile.type = tileType;
      tile.side = side;
    } else {
      // Если стены нет - создаем специальный тайл
      this.tiles.set(key, {
        type: tileType,
        x: x,
        z: z,
        rotation: this.getWallRotation(side),
        side: side
      });
    }
  }

  applySpecialTiles() {
    // Дверь
    if (this.config.doorSide) {
      this.placeSpecialTile('door', this.config.doorSide);
    }
    
    // Туннель
    if (this.config.tunnelSide) {
      this.placeSpecialTile('wall_to_tunnel', this.config.tunnelSide);
    }
  }

  getWallRotation(side) {
    // Если это объединенная комната - ИНВЕРТИРУЕМ повороты
    if (this.config.isMerged) {
      // Для объединенных комнат: восток/запад - 0°, север/юг - 90°
      return (side === 'east' || side === 'west') ? Math.PI / 2 : 0;
    } else {
      // Для обычных комнат: восток/запад - 90°, север/юг - 0°
      return (side === 'east' || side === 'west') ? Math.PI / 2 : 0;
    }
  }

generateDecor() {
    const floorTiles = this.getFloorTiles();
    
    // Если комната - сокровищница, генерируем сундук
    if (this.config.isTreasureRoom) {
      this.placeTreasureChest(floorTiles);
    }

    // Генерируем обычные декоративные предметы
    this.placeRegularDecor(floorTiles);
  }

  getFloorTiles() {
    const floors = [];
    for (const tile of this.tiles.values()) {
      if (tile.type === 'floor') {
        floors.push({ x: tile.x, z: tile.z });
      }
    }
    return floors;
  }

  placeTreasureChest(floorTiles) {
    if (floorTiles.length === 0) return;

    // Выбираем случайный тайл пола для сундука
    const randomIndex = Math.floor(Math.random() * floorTiles.length);
    const tile = floorTiles[randomIndex];
    
    const chest = DECOR_TYPES.CHEST;
    const randomRotation = chest.rotations[Math.floor(Math.random() * chest.rotations.length)];
    
    this.decor.push({
      type: 'CHEST',
      x: tile.x,
      z: tile.z,
      rotation: randomRotation,
      asset: chest.file
    });

    // Убираем этот тайл из доступных для других предметов
    floorTiles.splice(randomIndex, 1);
  }

  placeRegularDecor(floorTiles) {
    if (floorTiles.length === 0) return;

    // Получаем крайние тайлы (рядом со стенами)
    const edgeTiles = this.getEdgeTiles(floorTiles);
    const centerTiles = this.getCenterTiles(floorTiles);

    // Размещаем предметы на крайних тайлах
    for (const tile of edgeTiles) {
      for (const [decorType, decorDef] of Object.entries(DECOR_TYPES)) {
        if (decorType === 'CHEST') continue; // Сундуки уже обработаны
        
        if (decorDef.tags.includes('edge') && Math.random() < decorDef.probability) {
          const randomRotation = decorDef.rotations[Math.floor(Math.random() * decorDef.rotations.length)];
          
          this.decor.push({
            type: decorType,
            x: tile.x,
            z: tile.z,
            rotation: randomRotation,
            asset: decorDef.file
          });
          break; // Только один предмет на тайл
        }
      }
    }

    // Размещаем предметы в центре
    for (const tile of centerTiles) {
      for (const [decorType, decorDef] of Object.entries(DECOR_TYPES)) {
        if (decorType === 'CHEST') continue;
        
        if (decorDef.tags.includes('center') && Math.random() < decorDef.probability) {
          const randomRotation = decorDef.rotations[Math.floor(Math.random() * decorDef.rotations.length)];
          
          this.decor.push({
            type: decorType,
            x: tile.x,
            z: tile.z,
            rotation: randomRotation,
            asset: decorDef.file
          });
          break; // Только один предмет на тайл
        }
      }
    }
  }

  getEdgeTiles(floorTiles) {
    return floorTiles.filter(tile => {
      // Тайл считается крайним, если у него есть сосед-стена
      const neighbors = [
        { x: tile.x - 1, z: tile.z },
        { x: tile.x + 1, z: tile.z },
        { x: tile.x, z: tile.z - 1 },
        { x: tile.x, z: tile.z + 1 }
      ];
      
      return neighbors.some(neighbor => {
        const neighborTile = this.tiles.get(`${neighbor.x},${neighbor.z}`);
        return neighborTile && neighborTile.type === 'wall';
      });
    });
  }

  getCenterTiles(floorTiles) {
    return floorTiles.filter(tile => {
      // Тайл считается центральным, если все соседи - пол
      const neighbors = [
        { x: tile.x - 1, z: tile.z },
        { x: tile.x + 1, z: tile.z },
        { x: tile.x, z: tile.z - 1 },
        { x: tile.x, z: tile.z + 1 }
      ];
      
      return neighbors.every(neighbor => {
        const neighborTile = this.tiles.get(`${neighbor.x},${neighbor.z}`);
        return neighborTile && neighborTile.type === 'floor';
      });
    });
  }

  getRoomData() {
    return {
      posX: this.posX,
      posZ: this.posZ,
      width: this.width,
      height: this.height,
      config: this.config,
      tiles: Array.from(this.tiles.values()),
      decor: this.decor // Добавляем декоративные предметы
    };
  }
}
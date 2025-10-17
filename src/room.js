export class Room {
  constructor(posX, posZ, width, height, config = {}) {
    this.posX = posX;
    this.posZ = posZ;
    this.width = width;
    this.height = height;
    this.config = config;
    this.tiles = new Map();
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
    // Генерируем стены ТОЛЬКО там, где граница пол/пустота
    this.generateBoundaryWalls();
    this.applySpecialTiles();
  }

  generateBoundaryWalls() {
    // Проверяем каждую ячейку пола на границы
    for (let z = this.posZ; z < this.posZ + this.height; z++) {
      for (let x = this.posX; x < this.posX + this.width; x++) {
        this.checkAndPlaceWall(x, z, 1, 0, 'east');   // справа
        this.checkAndPlaceWall(x, z, -1, 0, 'west');  // слева
        this.checkAndPlaceWall(x, z, 0, 1, 'south');  // снизу
        this.checkAndPlaceWall(x, z, 0, -1, 'north'); // сверху
      }
    }
  }

// В методах generateBoundaryWalls и placeSpecialTile:
checkAndPlaceWall(x, z, dx, dz, side) {
  const neighborX = x + dx;
  const neighborZ = z + dz;
  const neighborKey = `${neighborX},${neighborZ}`;

  const isOutsideRoom = neighborX < this.posX || 
                       neighborX >= this.posX + this.width ||
                       neighborZ < this.posZ || 
                       neighborZ >= this.posZ + this.height;

  if (isOutsideRoom && !this.tiles.has(neighborKey)) {
    this.tiles.set(neighborKey, {
      type: 'wall',
      x: neighborX,
      z: neighborZ,
      rotation: this.getWallRotation(side),
      side: side // ← ДОБАВЛЯЕМ
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
  if (this.tiles.has(key)) {
    const tile = this.tiles.get(key);
    tile.type = tileType;
    tile.side = side; // ← ДОБАВЛЯЕМ
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
    return (side === 'east' || side === 'west') ? Math.PI / 2 : 0;
  }

  getRoomData() {
    return {
      posX: this.posX,
      posZ: this.posZ,
      width: this.width,
      height: this.height,
      config: this.config,
      tiles: Array.from(this.tiles.values())
    };
  }
}
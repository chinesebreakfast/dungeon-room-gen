export function generateWalls(room, renderer) {
  const size = renderer.tileSize;

  // Получаем специальные тайлы из комнаты
  const specials = room.getSpecialWallPositions();
  const specialTiles = new Map();
  
  console.log("Special tiles:", specials);

  for (const special of specials) {
    const pos = calculateWallPosition(special, size);
    const key = `${pos.wallX},${pos.wallZ}`;
    specialTiles.set(key, {
      type: special.type,
      rotation: pos.rotation
    });
    console.log(`Special ${special.type} at (${pos.wallX}, ${pos.wallZ}) rotation: ${pos.rotation}`);
  }

  // Генерируем стены по периметру комнаты
  for (let z = 0; z < room.height; z++) {
    for (let x = 0; x < room.width; x++) {
      if (room.getTile(x, z) !== "floor") continue;

      const neighbors = [
        { dx: 1, dz: 0 },  // восток
        { dx: -1, dz: 0 }, // запад
        { dx: 0, dz: 1 },  // юг
        { dx: 0, dz: -1 }  // север
      ];

      for (const { dx, dz } of neighbors) {
        const nx = x + dx;
        const nz = z + dz;

        // Если вышли за границы - ставим стену/специальный тайл
        if (nx < 0 || nx >= room.width || nz < 0 || nz >= room.height) {
          let wallX, wallZ, rotation;

          if (dx !== 0) {
            // Вертикальные стены
            wallX = x * size + (dx > 0 ? size : 0);
            wallZ = z * size + size / 2;
            rotation = Math.PI / 2;
          } else {
            // Горизонтальные стены
            wallX = x * size + size / 2;
            wallZ = z * size + (dz > 0 ? size : 0);
            rotation = 0;
          }

          const key = `${wallX},${wallZ}`;
          console.log(`Wall at (${wallX}, ${wallZ}) - key: ${key}`);
          
          if (specialTiles.has(key)) {
            const special = specialTiles.get(key);
            console.log(`→ Placing ${special.type} with rotation ${rotation}`);
            renderer.setWall(wallX, wallZ, rotation, special.type);
          } else {
            console.log(`→ Placing wall with rotation ${rotation}`);
            renderer.setWall(wallX, wallZ, rotation, "wall");
          }
        }
      }
    }
  }
}

function calculateWallPosition(special, tileSize) {
  const { wall, index, roomWidth, roomHeight } = special;
  let wallX, wallZ, rotation;

  switch (wall) {
    case 'north':
      wallX = index * tileSize + tileSize / 2;
      wallZ = 0;
      rotation = 0;
      break;
    case 'south':
      wallX = index * tileSize + tileSize / 2;
      wallZ = roomHeight * tileSize;
      rotation = 0;
      break;
    case 'west':
      wallX = 0;
      wallZ = index * tileSize + tileSize / 2;
      rotation = Math.PI / 2;
      break;
    case 'east':
      wallX = roomWidth * tileSize;
      wallZ = index * tileSize + tileSize / 2;
      rotation = Math.PI / 2;
      break;
  }

  return { wallX, wallZ, rotation };
}
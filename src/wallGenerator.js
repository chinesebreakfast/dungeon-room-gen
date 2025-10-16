export function generateWalls(mergedRoom, renderer) {
  const size = renderer.tileSize;
  const floorCells = mergedRoom.getAllFloorCells();
  const bounds = mergedRoom.getBounds();

  // Создаем сетку для быстрой проверки
  const floorGrid = new Set();
  for (const cell of floorCells) {
    floorGrid.add(`${cell.x},${cell.z}`);
  }

  // Функция проверки - является ли ячейка полом
  const isFloor = (x, z) => floorGrid.has(`${x},${z}`);

  // Генерируем стены вокруг всех ячеек пола
  for (const cell of floorCells) {
    const { x, z } = cell;

    // Проверяем всех соседей
    const neighbors = [
      { dx: 1, dz: 0 },   // справа
      { dx: -1, dz: 0 },  // слева
      { dx: 0, dz: 1 },   // сверху
      { dx: 0, dz: -1 }   // снизу
    ];

    for (const { dx, dz } of neighbors) {
      const nx = x + dx;
      const nz = z + dz;

      // Если соседняя клетка НЕ пол - ставим стену
      if (!isFloor(nx, nz)) {
        let wallX, wallZ, rotation;

        if (dx !== 0) {
          // Вертикальная стена (по оси X)
          wallX = x * size + (dx > 0 ? size : 0);
          wallZ = z * size + size / 2;
          rotation = Math.PI / 2; // поворот на 90°
        } else {
          // Горизонтальная стена (по оси Z)
          wallX = x * size + size / 2;
          wallZ = z * size + (dz > 0 ? size : 0);
          rotation = 0; // без поворота
        }

        renderer.setWall(wallX, wallZ, rotation);
      }
    }
  }
}
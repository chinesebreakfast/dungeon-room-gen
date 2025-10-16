export function generateWalls(room, renderer) {
  const size = renderer.tileSize;

  // Передняя и задняя стены (по оси Z) - БЕЗ поворота
  for (let x = 0; x < room.width; x++) {
    // Задняя стена (z = 0) - без поворота
    renderer.setWall(x * size + size / 2, 0, 0);
    
    // Передняя стена (z = room.height) - без поворота
    renderer.setWall(x * size + size / 2, room.height * size, 0);
  }

  // Боковые стены (по оси X) - с поворотом на 90 градусов
  for (let z = 0; z < room.height; z++) {
    // Левая стена (x = 0) - поворот на 90°
    renderer.setWall(0, z * size + size / 2, Math.PI / 2);
    
    // Правая стена (x = room.width) - поворот на 90°
    renderer.setWall(room.width * size, z * size + size / 2, Math.PI / 2);
  }
}
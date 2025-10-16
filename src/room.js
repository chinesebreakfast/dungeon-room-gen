export class Room {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => Array(width).fill(null));
  }

  setTile(x, y, type) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.grid[y][x] = type;
  }

  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.grid[y][x];
  }

  fillWithFloor() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setTile(x, y, "floor");
      }
    }
  }

  // Получить все занятые ячейки с глобальными координатами
  getAllFloorCells(offsetX = 0, offsetZ = 0) {
    const cells = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === "floor") {
          cells.push({
            x: x + offsetX,
            z: y + offsetZ
          });
        }
      }
    }
    return cells;
  }
}
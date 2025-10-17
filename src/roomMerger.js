import { Room } from "./room.js";

export class RoomMerger {
  constructor() {
    this.rooms = []; // храним { room, offsetX, offsetZ }
    this.mergedFloorCells = new Set();
  }

  addRoom(room, offsetX = 0, offsetZ = 0) {
    this.rooms.push({ room, offsetX, offsetZ });
    return this;
  }

  mergeRooms() {
    this.mergedFloorCells.clear();
    
    for (const { room, offsetX, offsetZ } of this.rooms) {
      const floorCells = room.getAllFloorCells(offsetX, offsetZ);
      for (const cell of floorCells) {
        const key = `${cell.x},${cell.z}`;
        this.mergedFloorCells.add(key);
      }
    }

    return {
      getAllFloorCells: () => Array.from(this.mergedFloorCells).map(key => {
        const [x, z] = key.split(',').map(Number);
        return { x, z };
      }),
      isFloor: (x, z) => this.mergedFloorCells.has(`${x},${z}`),
      getBounds: () => this.calculateBounds(),
      getRooms: () => this.rooms // ← ДОБАВЛЯЕМ ЭТОТ МЕТОД
    };
  }

  calculateBounds() {
    if (this.mergedFloorCells.size === 0) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    for (const key of this.mergedFloorCells) {
      const [x, z] = key.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    
    return { minX, maxX, minZ, maxZ };
  }
}
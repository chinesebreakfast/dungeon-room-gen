import { ROOM_TYPES, WALL_SIDES } from "./roomTypes.js";

export class RoomConfig {
  constructor(options = {}) {
    this.type = options.type || ROOM_TYPES.NORMAL;
    this.hasDoor = options.hasDoor ?? false;
    this.doorSide = options.doorSide || null; // WALL_SIDES.NORTH etc
    this.hasTunnel = options.hasTunnel ?? false;
    this.tunnelSide = options.tunnelSide || null; // если null - случайная сторона
    this.isMerged = options.isMerged ?? false;
    this.mergedRooms = options.mergedRooms || [];
  }
}
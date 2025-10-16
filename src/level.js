// src/level.js
import { Room } from "./room.js";
import { randomInt, distance } from "./utils.js";

export class Level {
  constructor(index, params = {}) {
    this.index = index;
    this.rooms = [];
    this.params = params;
    this.edges = []; // связи между комнатами
  }
  generateRooms() {
    this.rooms = [];

    const count = this.params.roomCount || 8;
    const maxAttempts = 500;
    const minSize = 10;  // увеличиваем минимальный размер
    const maxSize = 20;  // увеличиваем максимальный размер
    const areaSize = 100; // чуть больше диапазон координат для больших комнат

    let attempts = 0;

    while (this.rooms.length < count && attempts < maxAttempts) {
      attempts++;

      const w = randomInt(minSize, maxSize);
      const h = randomInt(minSize, maxSize);
      const x = randomInt(-areaSize, areaSize);
      const y = randomInt(-areaSize, areaSize);

      const newRoom = new Room(`L${this.index}_R${this.rooms.length}`, x, y, w, h, "normal");

      // Проверка пересечений с другими комнатами
      const overlap = this.rooms.some(room =>
        Math.abs(room.x - newRoom.x) < (room.w + newRoom.w) / 1.5 &&
        Math.abs(room.y - newRoom.y) < (room.h + newRoom.h) / 1.5
      );

      if (!overlap) {
        this.rooms.push(newRoom);
      }
    }

    // Расставим типы комнат
    this.assignRoomTypes();
  }

  assignRoomTypes() {
    if (this.rooms.length === 0) return;

    if (this.index === 0) {
      this.rooms[0].type = "start";
    } else {
      this.rooms[0].type = "lift";
    }

    if (this.index < (this.params.totalLevels - 1)) {
      this.rooms[this.rooms.length - 1].type = "lift";
    } else {
      this.rooms[this.rooms.length - 1].type = "exit";
    }

    // Одна сокровищница
    if (this.rooms.length > 3) {
      const treasureRoom = this.rooms[randomInt(1, this.rooms.length - 2)];
      treasureRoom.type = "treasure";
    }

    // Одна босс-комната
    if (this.index > 0 && this.rooms.length > 4) {
      const bossRoom = this.rooms[randomInt(1, this.rooms.length - 2)];
      bossRoom.type = "boss";
    }
  }



  assignRoomTypes() {
    if (this.rooms.length === 0) return;

    // Первая комната — старт или лифт (если не верхний уровень)
    if (this.index === 0) {
      this.rooms[0].type = "start";
    } else {
      this.rooms[0].type = "lift"; // вход сверху
    }

    // Последняя комната — либо лифт вниз, либо выход
    if (this.index < (this.params.totalLevels - 1)) {
      this.rooms[this.rooms.length - 1].type = "lift";
    } else {
      this.rooms[this.rooms.length - 1].type = "exit";
    }

    // Одна сокровищница
    if (this.rooms.length > 3) {
      const treasureRoom = this.rooms[randomInt(1, this.rooms.length - 2)];
      treasureRoom.type = "treasure";
    }

    // И одна комната с боссом (кроме стартового уровня)
    if (this.index > 0 && this.rooms.length > 4) {
      const bossRoom = this.rooms[randomInt(1, this.rooms.length - 2)];
      bossRoom.type = "boss";
    }
  }
}

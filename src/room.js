// src/room.js
export class Room {
  constructor(id, x, y, w, h, type = "normal", mobs = 0, event = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.mobs = mobs;
    this.event = event;
  }

  get center() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }
}

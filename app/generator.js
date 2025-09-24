import { CONFIG } from "./config.js";

function splitRoom(x, z, width, depth, rooms = []) {
  if (rooms.length >= CONFIG.MAX_SUBROOMS) return rooms;

  // если область слишком маленькая — создаём комнату
  if (width <= CONFIG.MIN_ROOM_SIZE * 2 || depth <= CONFIG.MIN_ROOM_SIZE * 2) {
    rooms.push({ x, z, width, depth });
    return rooms;
  }

  const splitHorizontally = Math.random() > 0.5;

  if (splitHorizontally && width > CONFIG.MIN_ROOM_SIZE * 2) {
    const split = CONFIG.MIN_ROOM_SIZE + Math.random() * (width - CONFIG.MIN_ROOM_SIZE*2);
    splitRoom(x - width/2 + split/2, z, split, depth, rooms);
    splitRoom(x + split/2, z, width - split, depth, rooms);
  } else if (!splitHorizontally && depth > CONFIG.MIN_ROOM_SIZE * 2) {
    const split = CONFIG.MIN_ROOM_SIZE + Math.random() * (depth - CONFIG.MIN_ROOM_SIZE*2);
    splitRoom(x, z - depth/2 + split/2, width, split, rooms);
    splitRoom(x, z + split/2, width, depth - split, rooms);
  } else {
    rooms.push({ x, z, width, depth });
  }

  return rooms;
}

// Утилита для выбора случайного элемента
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

  if (rooms.length >= CONFIG.MAX_SUBROOMS) return rooms;

  // если область слишком маленькая — создаём комнату
  if (width <= CONFIG.MIN_ROOM_SIZE * 2 || depth <= CONFIG.MIN_ROOM_SIZE * 2) {
    rooms.push({ x, z, width, depth });
    return rooms;
  }

  const splitHorizontally = Math.random() > 0.5;

  if (splitHorizontally && width > CONFIG.MIN_ROOM_SIZE * 2) {
    const split = CONFIG.MIN_ROOM_SIZE + Math.random() * (width - CONFIG.MIN_ROOM_SIZE*2);
    splitRoom(x - width/2 + split/2, z, split, depth, rooms);
    splitRoom(x + split/2, z, width - split, depth, rooms);
  } else if (!splitHorizontally && depth > CONFIG.MIN_ROOM_SIZE * 2) {
    const split = CONFIG.MIN_ROOM_SIZE + Math.random() * (depth - CONFIG.MIN_ROOM_SIZE*2);
    splitRoom(x, z - depth/2 + split/2, width, split, rooms);
    splitRoom(x, z + split/2, width, depth - split, rooms);
  } else {
    rooms.push({ x, z, width, depth });
  }

  return rooms;}

export function generateRoom() {
  const { FLOOR_SIZE, N_CELLS, PERLIN } = CONFIG;
  const cellSizeX = FLOOR_SIZE.x / N_CELLS;
  const cellSizeY = FLOOR_SIZE.y / N_CELLS;

  // --- 1. Пол ---
  const floor = {
    type: "plane",
    size: FLOOR_SIZE,
    subdivisions: N_CELLS,
    material: "floor",
    perlin: {...PERLIN}
  };

  // --- 2. Двери ---
  // Пока возьмем две случайные стороны (xMin/xMax или yMin/yMax)
  const sides = ["xMin", "xMax", "yMin", "yMax"];
  const doorSides = [randomChoice(sides), randomChoice(sides)];
  
  const doors = doorSides.map(side => {
    // середина двери в координатах
    let position = { x: 0, y: 0, z: 0 };
    if (side === "xMin") position.x = -FLOOR_SIZE.x / 2;
    if (side === "xMax") position.x = FLOOR_SIZE.x / 2;
    if (side === "yMin") position.z = -FLOOR_SIZE.y / 2;
    if (side === "yMax") position.z = FLOOR_SIZE.y / 2;

    return {
      side,
      center: position,
      width: cellSizeX * 2 // дверь занимает 2 клетки
    };
  });

  // --- 3. Стены ---
  // пока упрощенно: описываем прямоугольник по периметру, кроме дырок под двери
  const walls = sides.map(side => ({
    side,
    height: 3,
    material: "wall",
    skipDoors: doors.filter(d => d.side === side)
  }));

  let subRooms = [];
  if (FLOOR_SIZE.x > 30 || FLOOR_SIZE.y > 20) {
    subRooms = splitRoom(0, 0, FLOOR_SIZE.x, FLOOR_SIZE.y, []);
  }
  console.log("SubRooms:", subRooms);

  return {
    floor,
    walls,
    doors,
    subRooms
  };
}

// Создание разнообразного уровня
const level = new Level(0, 25);

// Входная комната
const entrance = new Room(5, 5, 4, 4, {
  type: 'entrance',
  doorSide: 'east'
});

// Комната с сокровищем
const treasure = new Room(10, 5, 6, 6, {
  type: 'treasure', 
  doorSide: 'west',
  tunnelSide: 'south'
});

// Комната босса
const bossRoom = new Room(8, 12, 8, 8, {
  type: 'boss',
  tunnelSide: 'north'
});

level.addRoom(entrance).addRoom(treasure).addRoom(bossRoom);
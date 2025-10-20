// DUNGEONCONFIG.js
export const DUNGEON_CONFIG = {
  // Настройки для разных уровней
  LEVELS: {
    0: { // Верхний уровень
      minRooms: 5,
      maxRooms: 8,
      roomMinSize: 4,
      roomMaxSize: 8,
      requiredRooms: {
        ENTRANCE: 1,  // Комната входа
        LIFT: 1       // Лифт на следующий уровень
      }
    },
    '-1': { // Средний уровень  
      minRooms: 6,
      maxRooms: 10,
      roomMinSize: 4,
      roomMaxSize: 7,
      requiredRooms: {
        LIFT: 1,      // Лифты на верхний и нижний уровни
        TREASURE: 1   // Сокровищница
      }
    },
    '-2': { // Нижний уровень
      minRooms: 4,
      maxRooms: 7,
      roomMinSize: 5,
      roomMaxSize: 9,
      requiredRooms: {
        EXIT: 1,      // Выход
        BOSS: 1       // Комната босса
      }
    }
  },

  // Настройки BSP алгоритма
  BSP: {
    minLeafSize: 8,    // Минимальный размер листа
    maxLeafSize: 20,   // Максимальный размер листа
    splitChance: 0.8,  // Вероятность разделения
    minRoomPadding: 1  // Отступ от стен
  },

  // Настройки комнат
  ROOMS: {
    // Типы специальных комнат
    ENTRANCE: {
      config: { doorSide: 'south', isEntrance: true },
      decorProbability: 0.3,
      enemyProbability: 0.1
    },
    EXIT: {
      config: { doorSide: 'north', isExit: true },
      decorProbability: 0.8,
      enemyProbability: 0.0
    },
    LIFT: {
      config: { tunnelSide: 'east', isLift: true },
      decorProbability: 0.2,
      enemyProbability: 0.2
    },
    TREASURE: {
      config: { isTreasureRoom: true },
      decorProbability: 0.9,
      enemyProbability: 0.7
    },
    BOSS: {
      config: { isBossRoom: true },
      decorProbability: 0.6,
      enemyProbability: 0.0  // Босс будет отдельно
    },
    NORMAL: {
      config: {},
      decorProbability: 0.5,
      enemyProbability: 0.4
    }
  }
};
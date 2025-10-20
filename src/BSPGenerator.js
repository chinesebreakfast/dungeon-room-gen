// BSPGenerator.js
import { DUNGEON_CONFIG } from "./DUNGEONCONFIG.js";
import { Room } from "./room.js";

export class BSPGenerator {
    constructor(levelIndex, gridSize){
        this.levelIndex = levelIndex;
        this.gridSize = gridSize;
        this.config = DUNGEON_CONFIG.LEVELS[levelIndex];
        this.bspConfig = DUNGEON_CONFIG.BSP;
        this.leaves = [];
        this.rooms = [];
        this.roomCache = new Map(); // Кэш для проверки пересечений
    }

    generate(){
        console.log(`⚡ FAST Generating BSP for level ${this.levelIndex}...`);
        const startTime = performance.now();

        const rootLeaf = {
            x: 1, // Сдвигаем от краев для гарантии отступов
            z: 1,
            width: this.gridSize - 2,
            height: this.gridSize - 2,
            left: null, 
            right: null
        };

        this.splitLeaf(rootLeaf);
        this.createRoomsInLeaves();
        this.addRequiredRooms();

        const endTime = performance.now();
        console.log(`✅ FAST: Generated ${this.rooms.length} rooms in ${(endTime - startTime).toFixed(2)}ms`);
        return this.rooms;
    }

    splitLeaf(leaf) {
        // РАННИЙ ВЫХОД: проверяем условия до сложных вычислений
        if (!leaf) return;
        
        const minSplitSize = this.bspConfig.minLeafSize * 2; // Увеличили минимальный размер для разделения
        const canSplitWidth = leaf.width > minSplitSize;
        const canSplitHeight = leaf.height > minSplitSize;
        
        // Быстрая проверка без вызова random если нельзя сплитить
        if (!canSplitWidth && !canSplitHeight) {
            this.leaves.push(leaf);
            return;
        }

        // ОДИН вызов random для всех условий
        const randomVal = Math.random();
        const shouldSplit = randomVal < this.bspConfig.splitChance;
        
        if (!shouldSplit) {
            this.leaves.push(leaf);
            return;
        }

        // ОПТИМИЗИРОВАННАЯ логика направления разделения
        const splitHorizontally = canSplitWidth && (!canSplitHeight || randomVal > 0.5);

        if (splitHorizontally) {
            // ПРЕДВЫЧИСЛЕННЫЕ границы для сплита
            const minX = leaf.x + this.bspConfig.minLeafSize;
            const maxX = leaf.x + leaf.width - this.bspConfig.minLeafSize;
            
            if (minX >= maxX) {
                this.leaves.push(leaf);
                return;
            }

            const splitX = minX + Math.floor(Math.random() * (maxX - minX));
            
            leaf.left = {
                x: leaf.x,
                z: leaf.z,
                width: splitX - leaf.x,
                height: leaf.height
            };
            
            leaf.right = {
                x: splitX,
                z: leaf.z,
                width: leaf.x + leaf.width - splitX,
                height: leaf.height
            };
        } else {
            // ПРЕДВЫЧИСЛЕННЫЕ границы для сплита
            const minZ = leaf.z + this.bspConfig.minLeafSize;
            const maxZ = leaf.z + leaf.height - this.bspConfig.minLeafSize;
            
            if (minZ >= maxZ) {
                this.leaves.push(leaf);
                return;
            }

            const splitZ = minZ + Math.floor(Math.random() * (maxZ - minZ));
            
            leaf.left = {
                x: leaf.x,
                z: leaf.z,
                width: leaf.width,
                height: splitZ - leaf.z
            };
            
            leaf.right = {
                x: leaf.x,
                z: splitZ,
                width: leaf.width,
                height: leaf.z + leaf.height - splitZ
            };
        }

        // Рекурсивно разделяем дочерние листья
        this.splitLeaf(leaf.left);
        this.splitLeaf(leaf.right);
    }

    // Создание комнат в листьях - ОПТИМИЗИРОВАННОЕ
    createRoomsInLeaves() {
        const minRoomSize = this.config.roomMinSize;
        
        for (let i = 0; i < this.leaves.length; i++) {
            const leaf = this.leaves[i];
            
            // БЫСТРАЯ проверка размера
            if (leaf.width >= minRoomSize && leaf.height >= minRoomSize) {
                const room = this.createRoomInLeafOptimized(leaf);
                if (room) {
                    this.rooms.push(room);
                    // Кэшируем позицию для быстрой проверки пересечений
                    this.roomCache.set(`${room.posX},${room.posZ}`, room);
                }
            }
        }
    }

    // ОПТИМИЗИРОВАННОЕ создание комнаты
    createRoomInLeafOptimized(leaf) {
        const padding = 1; // Фиксированный отступ вместо minRoomPadding
        
        // ПРЕДВЫЧИСЛЕННЫЕ максимальные размеры
        const maxRoomWidth = leaf.width - padding * 2;
        const maxRoomHeight = leaf.height - padding * 2;
        
        // БЫСТРЫЙ выход если не помещается
        if (maxRoomWidth < this.config.roomMinSize || maxRoomHeight < this.config.roomMinSize) {
            return null;
        }
        
        // ФИКСИРОВАННЫЕ размеры комнат для скорости (меньше random)
        const roomWidth = Math.min(
            this.config.roomMinSize + Math.floor(Math.random() * 2), // +0-2 вместо полного диапазона
            maxRoomWidth
        );
        const roomHeight = Math.min(
            this.config.roomMinSize + Math.floor(Math.random() * 2),
            maxRoomHeight
        );
        
        // БЫСТРОЕ позиционирование
        const roomX = leaf.x + padding + Math.floor(Math.random() * (maxRoomWidth - roomWidth + 1));
        const roomZ = leaf.z + padding + Math.floor(Math.random() * (maxRoomHeight - roomHeight + 1));
        
        return new Room(roomX, roomZ, roomWidth, roomHeight, {});
    }

    // ОПТИМИЗИРОВАННОЕ добавление обязательных комнат
    addRequiredRooms() {
        const requiredRooms = this.config.requiredRooms;
        const roomTypes = Object.keys(requiredRooms);
        
        for (let i = 0; i < roomTypes.length; i++) {
            const roomType = roomTypes[i];
            const count = requiredRooms[roomType];
            
            for (let j = 0; j < count; j++) {
                this.addSpecialRoomOptimized(roomType);
            }
        }
    }

    // ОПТИМИЗИРОВАННОЕ добавление специальной комнаты
    addSpecialRoomOptimized(roomType) {
        const roomConfig = DUNGEON_CONFIG.ROOMS[roomType];
        const position = this.findPositionForSpecialRoomOptimized();
        
        if (!position) {
            console.warn(`⚠️ Could not find position for ${roomType} room`);
            return;
        }
        
        // ФИКСИРОВАННЫЙ размер для специальных комнат
        const roomSize = 4;
        const specialRoom = new Room(
            position.x, 
            position.z, 
            roomSize, 
            roomSize, 
            roomConfig.config
        );
        
        this.rooms.push(specialRoom);
        this.roomCache.set(`${position.x},${position.z}`, specialRoom);
    }

    // ОПТИМИЗИРОВАННЫЙ поиск позиции
    findPositionForSpecialRoomOptimized() {
        const roomSize = 4;
        const maxPos = this.gridSize - roomSize - 1;
        
        // ПРОВЕРЯЕМ ЗАРАНЕЕ ИЗВЕСТНЫЕ ХОРОШИЕ ПОЗИЦИИ
        const predefinedPositions = [
            { x: 2, z: 2 },
            { x: 2, z: maxPos },
            { x: maxPos, z: 2 },
            { x: maxPos, z: maxPos },
            { x: Math.floor(this.gridSize / 2) - 2, z: 2 },
            { x: 2, z: Math.floor(this.gridSize / 2) - 2 }
        ];
        
        for (let i = 0; i < predefinedPositions.length; i++) {
            const pos = predefinedPositions[i];
            if (this.isPositionAvailableOptimized(pos.x, pos.z, roomSize, roomSize)) {
                return pos;
            }
        }
        
        // Если predefined не нашли, быстрый random поиск
        for (let attempt = 0; attempt < 10; attempt++) { // Уменьшили попытки с 50 до 10
            const x = 2 + Math.floor(Math.random() * (maxPos - 2));
            const z = 2 + Math.floor(Math.random() * (maxPos - 2));
            
            if (this.isPositionAvailableOptimized(x, z, roomSize, roomSize)) {
                return { x, z };
            }
        }
        
        return null;
    }

    // СУПЕР БЫСТРАЯ проверка доступности позиции
    isPositionAvailableOptimized(x, z, width, height) {
        const checkPositions = [
            `${x},${z}`,
            `${x + width - 1},${z}`,
            `${x},${z + height - 1}`,
            `${x + width - 1},${z + height - 1}`
        ];
        
        // Быстрая проверка по кэшу
        for (let i = 0; i < checkPositions.length; i++) {
            if (this.roomCache.has(checkPositions[i])) {
                return false;
            }
        }
        
        // Детальная проверка только если в кэше нет совпадений
        for (let i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            if (this.roomsOverlapOptimized(x, z, width, height, room)) {
                // Добавляем в кэш для будущих быстрых проверок
                this.roomCache.set(`${x},${z}`, true);
                return false;
            }
        }
        
        return true;
    }

    // ОПТИМИЗИРОВАННАЯ проверка пересечения
    roomsOverlapOptimized(x1, z1, w1, h1, room2) {
        return x1 < room2.posX + room2.width && 
               x1 + w1 > room2.posX &&
               z1 < room2.posZ + room2.height && 
               z1 + h1 > room2.posZ;
    }

    // Убрал getRandomSplitPoint и getRandomRoomSize - inline для скорости
}
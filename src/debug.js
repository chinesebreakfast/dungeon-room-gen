export class DebugMode {
  constructor(renderer, level) {
    this.renderer = renderer;
    this.level = level;
    this.isEnabled = false;
    this.debugMeshes = [];
    
    this.setupEventListeners();
  }

  enable() {
    this.isEnabled = true;
    console.log("🔧 Debug mode ENABLED - click on cells to see coordinates");
    this.addDebugGrid();
  }

  disable() {
    this.isEnabled = false;
    console.log("🔧 Debug mode DISABLED");
    this.removeDebugGrid();
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  setupEventListeners() {
    // Клик по canvas для получения координат
    this.renderer.canvas.addEventListener('click', (event) => {
      if (!this.isEnabled) return;
      
      this.handleCanvasClick(event);
    });

    // Клавиша D для включения/выключения дебага
    document.addEventListener('keydown', (event) => {
      if (event.key === 'd' || event.key === 'D') {
        this.toggle();
      }
    });
  }

  handleCanvasClick(event) {
    // Получаем координаты клика
    const rect = this.renderer.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Конвертируем в мировые координаты
    const pickResult = this.renderer.scene.pick(x, y);
    
    if (pickResult.hit) {
      const worldPos = pickResult.pickedPoint;
      this.getCellCoordinates(worldPos);
    }
  }

  getCellCoordinates(worldPos) {
    const tileSize = this.renderer.tileSize;
    
    // Конвертируем мировые координаты в координаты сетки
    const gridX = Math.floor(worldPos.x / tileSize);
    const gridZ = Math.floor(worldPos.z / tileSize);
    
    console.log(`📍 Cell coordinates: (${gridX}, ${gridZ})`);
    
    // Показываем информацию о тайле на этой позиции
    this.showTileInfo(gridX, gridZ);
    
    // Визуально выделяем ячейку
    this.highlightCell(gridX, gridZ);
  }

  showTileInfo(x, z) {
    // Ищем тайл в комнатах уровня
    let tileInfo = null;
    
    for (const room of this.level.rooms) {
      const roomData = room.getRoomData();
      for (const tile of roomData.tiles) {
        if (tile.x === x && tile.z === z) {
          tileInfo = tile;
          break;
        }
      }
      if (tileInfo) break;
    }
    
    if (tileInfo) {
      console.log(`🎯 Tile info:`, {
        type: tileInfo.type,
        rotation: `${tileInfo.rotation}rad (${(tileInfo.rotation * 180/Math.PI).toFixed(1)}°)`,
        side: tileInfo.side,
        room: `(${tileInfo.x}, ${tileInfo.z})`
      });
    } else {
      console.log(`❌ No tile at (${x}, ${z}) - empty cell`);
    }
  }

  highlightCell(x, z) {
    // Убираем предыдущие выделения
    this.removeDebugGrid();
    
    // Создаем красную рамку вокруг ячейки
    const tileSize = this.renderer.tileSize;
    const color = new BABYLON.Color3(1, 0, 0); // Красный
    
    const points = [
      new BABYLON.Vector3(x * tileSize, 0.1, z * tileSize),
      new BABYLON.Vector3((x + 1) * tileSize, 0.1, z * tileSize),
      new BABYLON.Vector3((x + 1) * tileSize, 0.1, (z + 1) * tileSize),
      new BABYLON.Vector3(x * tileSize, 0.1, (z + 1) * tileSize),
      new BABYLON.Vector3(x * tileSize, 0.1, z * tileSize) // Замыкаем
    ];
    
    const highlight = BABYLON.MeshBuilder.CreateLines("debugHighlight", {
      points: points,
      colors: [color, color, color, color, color]
    }, this.renderer.scene);
    
    this.debugMeshes.push(highlight);
    
    // Автоматическое удаление через 2 секунды
    setTimeout(() => {
      const index = this.debugMeshes.indexOf(highlight);
      if (index > -1) {
        highlight.dispose();
        this.debugMeshes.splice(index, 1);
      }
    }, 2000);
  }

  addDebugGrid() {
    // Добавляем полупрозрачную сетку для дебага
    const color = new BABYLON.Color3(0, 1, 0); // Зеленый
    const alpha = 0.3;
    
    for (let x = 0; x <= this.level.gridSize; x++) {
      for (let z = 0; z <= this.level.gridSize; z++) {
        const points = [
          new BABYLON.Vector3(x * this.renderer.tileSize, 0.05, z * this.renderer.tileSize),
          new BABYLON.Vector3((x + 1) * this.renderer.tileSize, 0.05, z * this.renderer.tileSize),
          new BABYLON.Vector3((x + 1) * this.renderer.tileSize, 0.05, (z + 1) * this.renderer.tileSize),
          new BABYLON.Vector3(x * this.renderer.tileSize, 0.05, (z + 1) * this.renderer.tileSize)
        ];
        
        const cell = BABYLON.MeshBuilder.CreateLines(`debugGrid_${x}_${z}`, {
          points: points
        }, this.renderer.scene);
        
        cell.color = color;
        this.debugMeshes.push(cell);
      }
    }
    
    console.log(`📐 Debug grid added for ${this.level.gridSize}x${this.level.gridSize} level`);
  }

  removeDebugGrid() {
    // Убираем все дебаг-меши
    this.debugMeshes.forEach(mesh => {
      mesh.dispose();
    });
    this.debugMeshes = [];
  }
}
// debug.js
export class DebugMode {
  constructor(renderer, level) {
    this.renderer = renderer;
    this.level = level;
    this.isEnabled = false;
    this.debugMeshes = [];
    this.enemyNavigation = null;
    
    this.setupEventListeners();
  }

  setEnemyNavigation(navigation) {
    this.enemyNavigation = navigation;
  }

  enable() {
    this.isEnabled = true;
    console.log("🔧 Debug mode ENABLED - click on cells to see coordinates");
    this.removeDebugGrid(); // Сначала очищаем
    this.highlightWalkableCells(); // ТОЛЬКО заливаем проходимые клетки
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
    this.renderer.canvas.addEventListener('click', (event) => {
      if (!this.isEnabled) return;
      this.handleCanvasClick(event);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'd' || event.key === 'D') {
        this.toggle();
      }
    });
  }

  handleCanvasClick(event) {
    const rect = this.renderer.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const pickResult = this.renderer.scene.pick(x, y);
    
    if (pickResult.hit) {
      const worldPos = pickResult.pickedPoint;
      this.getCellCoordinates(worldPos);
    }
  }

  getCellCoordinates(worldPos) {
    const tileSize = this.renderer.tileSize;
    const gridX = Math.floor(worldPos.x / tileSize);
    const gridZ = Math.floor(worldPos.z / tileSize);
    
    console.log(`📍 Cell coordinates: (${gridX}, ${gridZ})`);
    
    this.showTileInfo(gridX, gridZ);
    this.highlightCell(gridX, gridZ);
  }

  showTileInfo(x, z) {
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

    if (this.enemyNavigation) {
      const isWalkable = this.enemyNavigation.isWalkable(x, z);
      console.log(`🚶 Walkable: ${isWalkable ? 'YES 🟢' : 'NO 🔴'}`);
    }
  }

  highlightCell(x, z) {
    // Удаляем только временные выделения, но не проходимые клетки
    const tempMeshes = this.debugMeshes.filter(mesh => mesh.name === "debugHighlight");
    tempMeshes.forEach(mesh => mesh.dispose());
    this.debugMeshes = this.debugMeshes.filter(mesh => mesh.name !== "debugHighlight");
    
    const tileSize = this.renderer.tileSize;
    const color = new BABYLON.Color3(1, 0, 0);
    
    const points = [
      new BABYLON.Vector3(x * tileSize, 0.1, z * tileSize),
      new BABYLON.Vector3((x + 1) * tileSize, 0.1, z * tileSize),
      new BABYLON.Vector3((x + 1) * tileSize, 0.1, (z + 1) * tileSize),
      new BABYLON.Vector3(x * tileSize, 0.1, (z + 1) * tileSize),
      new BABYLON.Vector3(x * tileSize, 0.1, z * tileSize)
    ];
    
    const highlight = BABYLON.MeshBuilder.CreateLines("debugHighlight", {
      points: points,
      colors: [color, color, color, color, color]
    }, this.renderer.scene);
    
    this.debugMeshes.push(highlight);
    
    setTimeout(() => {
      const index = this.debugMeshes.indexOf(highlight);
      if (index > -1) {
        highlight.dispose();
        this.debugMeshes.splice(index, 1);
      }
    }, 2000);
  }

  highlightWalkableCells() {
    if (!this.enemyNavigation) {
      console.warn("⚠️ EnemyNavigation not set for debug mode");
      return;
    }

    const walkableCells = this.enemyNavigation.getWalkableCells();
    const tileSize = this.renderer.tileSize;
    
    walkableCells.forEach(cell => {
      // Создаем ЗАЛИТЫЙ квадрат вместо линий
      const plane = BABYLON.MeshBuilder.CreatePlane(`walkable_${cell.x}_${cell.z}`, {
        size: tileSize * 0.9 // Чуть меньше чем клетка
      }, this.renderer.scene);
      
      plane.position.x = cell.x * tileSize + tileSize / 2;
      plane.position.z = cell.z * tileSize + tileSize / 2;
      plane.position.y = 0.01;
      plane.rotation.x = Math.PI / 2; // Горизонтально
      
      // Зеленый материал с прозрачностью
      const material = new BABYLON.StandardMaterial("walkable_mat", this.renderer.scene);
      material.diffuseColor = new BABYLON.Color3(0, 1, 0);
      material.alpha = 0.3;
      material.specularColor = new BABYLON.Color3(0, 0, 0);
      
      plane.material = material;
      this.debugMeshes.push(plane);
    });

    console.log(`🟢 Highlighted ${walkableCells.length} walkable cells`);
  }

  removeDebugGrid() {
    this.debugMeshes.forEach(mesh => {
      mesh.dispose();
    });
    this.debugMeshes = [];
  }
}
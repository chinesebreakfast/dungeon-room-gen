import { TILE_TYPES } from "./tile.js";

export class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.assetsPath = "./assets/";
    this.tileSize = 4;
    this.tileMeshes = [];

    // Базовая камера
    this.camera = new BABYLON.ArcRotateCamera(
      "Camera",
      -Math.PI / 2,
      Math.PI / 3,
      50,
      new BABYLON.Vector3(0, 0, 0),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    new BABYLON.HemisphericLight("Light", new BABYLON.Vector3(0, 1, 0), this.scene);
    
    this.engine.runRenderLoop(() => this.scene.render());
  }

  clearScene() {
    this.scene.meshes.slice().forEach((m) => {
      m.dispose();
    });
    this.tileMeshes = [];
  }

  // Рендерим весь уровень
  async renderLevel(level) {
    this.clearScene();
    
    // Обновляем камеру под размер уровня
    this.updateCamera(level.gridSize);
    
    // Рендерим все комнаты уровня
    for (const room of level.rooms) {
      const roomData = room.getRoomData();
      for (const tile of roomData.tiles) {
        await this.setTile(tile.x, tile.z, tile.type, tile.rotation, tile.side);
      }
    }

    // Рисуем сетку уровня
    this.updateGrid(level);
  }

    updateCamera(gridSize) {
    const center = (gridSize * this.tileSize) / 2;
    const cameraDistance = Math.max(gridSize * this.tileSize * 0.8, 30);
    
    this.camera.position = new BABYLON.Vector3(
      center,
      cameraDistance * 0.5,
      -cameraDistance
    );
    this.camera.setTarget(new BABYLON.Vector3(center, 0, center));
  }

updateGrid(level) {
    this.scene.meshes.slice().forEach((m) => {
      if (m.name.startsWith("grid")) m.dispose();
    });

    // Рисуем фиксированную сетку уровня
    this.drawGrid(level.gridSize, level.gridSize, 0, 0);
  }

  drawGrid(width, height, offsetX = 0, offsetZ = 0) {
    const color = new BABYLON.Color3(0.4, 0.4, 0.4);
    const size = this.tileSize;

    for (let x = 0; x <= width; x++) {
      const p1 = new BABYLON.Vector3((offsetX + x) * size, 0, offsetZ * size);
      const p2 = new BABYLON.Vector3((offsetX + x) * size, 0, (offsetZ + height) * size);
      BABYLON.MeshBuilder.CreateLines("gridV" + x, { points: [p1, p2], color }, this.scene);
    }

    for (let z = 0; z <= height; z++) {
      const p1 = new BABYLON.Vector3(offsetX * size, 0, (offsetZ + z) * size);
      const p2 = new BABYLON.Vector3((offsetX + width) * size, 0, (offsetZ + z) * size);
      BABYLON.MeshBuilder.CreateLines("gridH" + z, { points: [p1, p2], color }, this.scene);
    }
  }

  async setTile(x, z, type, rotation = 0, side = null) {
    const tileDef = TILE_TYPES[type];
    if (!tileDef) return;

    try {
      const mesh = await this.loadTile(tileDef.file);
      
      let posX = x * this.tileSize + this.tileSize / 2;
      let posZ = z * this.tileSize + this.tileSize / 2;

      // ВАРИАНТ 3 - СМЕЩЕНИЕ СТЕН В НАПРАВЛЕНИИ К КОМНАТЕ
      if ((type === 'wall' || type === 'door') && side) {
        const edgeOffset = this.tileSize*0.05; // Начни с 0.1, потом подбери
        
        switch (side) {
          case 'north':
            // Северная стена - смещаем ВВЕРХ (к комнате снизу)
            posZ = z * this.tileSize + this.tileSize - edgeOffset;
            break;
          case 'south':
            // Южная стена - смещаем ВНИЗ (к комнате сверху)
            posZ = z * this.tileSize + edgeOffset;
            break;
          case 'west':
            // Западная стена - смещаем ВПРАВО (к комнате слева)
            posX = x * this.tileSize + this.tileSize - edgeOffset;
            break;
          case 'east':
            // Восточная стена - смещаем ВЛЕВО (к комнате справа)
            posX = x * this.tileSize + edgeOffset;
            break;
        }
      }
      // ДОПОЛНИТЕЛЬНЫЙ ПОВОРОТ ДЛЯ WALL_TO_TUNNEL
    let finalRotation = rotation;
    if (type === 'wall_to_tunnel' && side) {
      switch (side) {
        case 'south':
        case 'east':
          // Поворачиваем на 180 градусов для южной и восточной сторон
          finalRotation = rotation + Math.PI;
          break;
        // north и west остаются с обычным rotation
      }
    }

      const container = new BABYLON.TransformNode("tileContainer", this.scene);
      container.position = new BABYLON.Vector3(posX, 0, posZ);
      container.rotation.y = finalRotation;
      
      mesh.parent = container;
      mesh.position = BABYLON.Vector3.Zero();
      
      this.tileMeshes.push(container);
      
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      if (type === 'wall_to_tunnel') {
        await this.setTile(x, z, 'door', rotation, side);
      }
    }
  }

  async loadTile(filename) {
    return new Promise((resolve, reject) => {
      BABYLON.SceneLoader.ImportMesh("", this.assetsPath, filename, this.scene, (meshes) => {
        if (meshes.length > 0) resolve(meshes[0]);
        else reject("Не удалось загрузить " + filename);
      });
    });
  }
}
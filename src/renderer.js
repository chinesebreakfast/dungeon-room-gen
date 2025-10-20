// renderer.js
import { TILE_TYPES } from "./tile.js";
import { DECOR_TYPES } from "./decor.js";

export class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.assetsPath = "./assets/";
    this.propsPath = "./assets/props/";
    this.tileSize = 4;
    this.tileMeshes = [];
    this.decorMeshes = [];

    // 🔥 ОПТИМИЗАЦИИ BABYLON
    this.scene.autoClear = false;
    this.scene.autoClearDepthAndStencil = false;
    this.engine.setHardwareScalingLevel(0.8);
    
    // 🔥 КЭШ МОДЕЛЕЙ
    this.tileCache = new Map();
    this.propCache = new Map();
    this.pendingLoads = new Map();

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
    
    const light = new BABYLON.HemisphericLight("Light", new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    
    this.engine.runRenderLoop(() => this.scene.render());
  }

  clearScene() {
    this.scene.meshes.forEach((m) => {
      if (!m.name.startsWith("grid")) {
        m.dispose();
      }
    });
    this.tileMeshes = [];
    this.decorMeshes = [];
  }

  async renderLevel(level) {
    console.log("⚡ FAST RENDERING level...");
    const startTime = performance.now();
    
    this.clearScene();
    this.updateCamera(level.gridSize);
    
    await this.preloadAllModels(level);
    
    const roomPromises = level.rooms.map(room => this.renderRoomBatch(room));
    await Promise.all(roomPromises);

    this.updateGrid(level);
    
    const endTime = performance.now();
    console.log(`✅ FAST RENDERING completed in ${(endTime - startTime).toFixed(2)}ms`);
  }

  async preloadAllModels(level) {
    const loadPromises = [];
    
    Object.values(TILE_TYPES).forEach(tileDef => {
      if (!this.tileCache.has(tileDef.file)) {
        loadPromises.push(this.cacheTileModel(tileDef.file));
      }
    });
    
    const decorTypes = new Set();
    level.rooms.forEach(room => {
      room.getRoomData().decor.forEach(decor => {
        decorTypes.add(decor.asset);
      });
    });
    
    decorTypes.forEach(assetFile => {
      if (!this.propCache.has(assetFile)) {
        loadPromises.push(this.cachePropModel(assetFile));
      }
    });
    
    await Promise.all(loadPromises);
  }

  async cacheTileModel(filename) {
    if (this.tileCache.has(filename)) return this.tileCache.get(filename);
    
    if (this.pendingLoads.has(filename)) {
      return this.pendingLoads.get(filename);
    }
    
    const loadPromise = new Promise((resolve, reject) => {
      BABYLON.SceneLoader.ImportMesh("", this.assetsPath, filename, this.scene, (meshes) => {
        if (meshes.length > 0) {
          const mesh = meshes[0];
          mesh.setEnabled(false);
          
          // 🔥 СОЗДАЕМ TRANSFORM NODE ДЛЯ ПРАВИЛЬНЫХ ПОВОРОТОВ
          const container = new BABYLON.TransformNode(`cache_${filename}`, this.scene);
          mesh.parent = container;
          mesh.position = BABYLON.Vector3.Zero();
          mesh.rotation = BABYLON.Vector3.Zero();
          
          this.tileCache.set(filename, { mesh, container });
          this.pendingLoads.delete(filename);
          resolve({ mesh, container });
        } else {
          reject("Не удалось загрузить " + filename);
        }
      });
    });
    
    this.pendingLoads.set(filename, loadPromise);
    return loadPromise;
  }

  async cachePropModel(filename) {
    if (this.propCache.has(filename)) return this.propCache.get(filename);
    
    if (this.pendingLoads.has(filename)) {
      return this.pendingLoads.get(filename);
    }
    
    const loadPromise = new Promise((resolve, reject) => {
      BABYLON.SceneLoader.ImportMesh("", this.propsPath, filename, this.scene, (meshes) => {
        if (meshes.length > 0) {
          const mesh = meshes[0];
          mesh.setEnabled(false);
          mesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
          
          const container = new BABYLON.TransformNode(`cache_prop_${filename}`, this.scene);
          mesh.parent = container;
          mesh.position = BABYLON.Vector3.Zero();
          mesh.rotation = BABYLON.Vector3.Zero();
          
          this.propCache.set(filename, { mesh, container });
          this.pendingLoads.delete(filename);
          resolve({ mesh, container });
        } else {
          reject("Не удалось загрузить декоративный предмет: " + filename);
        }
      });
    });
    
    this.pendingLoads.set(filename, loadPromise);
    return loadPromise;
  }

  async renderRoomBatch(room) {
    const roomData = room.getRoomData();
    const tilePromises = [];
    const decorPromises = [];
    
    roomData.tiles.forEach(tile => {
      tilePromises.push(this.setTileFast(tile.x, tile.z, tile.type, tile.rotation, tile.side));
    });
    
    roomData.decor.forEach(decor => {
      decorPromises.push(this.setDecorFast(decor.x, decor.z, decor.type, decor.rotation, decor.asset));
    });
    
    await Promise.all([...tilePromises, ...decorPromises]);
  }

  // 🔥 ИСПРАВЛЕННЫЙ ПОВОРОТ ДЕКОРА
  async setDecorFast(x, z, decorType, rotation = 0, assetFile) {
    try {
      const cached = this.propCache.get(assetFile);
      if (!cached) {
        await this.cachePropModel(assetFile);
        return this.setDecorFast(x, z, decorType, rotation, assetFile);
      }
      
      const { mesh: originalMesh, container: originalContainer } = cached;
      
      // 🔥 КЛОНИРУЕМ КОНТЕЙНЕР ВМЕСТО МЕША
      const newContainer = originalContainer.clone(`decor_container_${x}_${z}`, null);
      if (!newContainer) return;
      
      // 🔥 КЛОНИРУЕМ МЕШ И ДОБАВЛЯЕМ В НОВЫЙ КОНТЕЙНЕР
      const mesh = originalMesh.clone(`decor_${x}_${z}`, newContainer);
      if (!mesh) return;
      
      newContainer.setEnabled(true);
      mesh.setEnabled(true);
      
      const posX = x * this.tileSize + this.tileSize / 2;
      const posZ = z * this.tileSize + this.tileSize / 2;
      
      // 🔥 ПОВОРАЧИВАЕМ КОНТЕЙНЕР, А НЕ МЕШ
      newContainer.position = new BABYLON.Vector3(posX, 0, posZ);
      newContainer.rotation.y = rotation;
      
      // Меш остается с нулевым поворотом внутри контейнера
      mesh.position = BABYLON.Vector3.Zero();
      mesh.rotation = BABYLON.Vector3.Zero();
      
      this.decorMeshes.push(newContainer);
      
    } catch (error) {
      console.error(`Failed to load decor ${decorType}:`, error);
    }
  }

  // 🔥 ИСПРАВЛЕННЫЙ ПОВОРОТ ТАЙЛОВ
  async setTileFast(x, z, type, rotation = 0, side = null) {
    const tileDef = TILE_TYPES[type];
    if (!tileDef) return;

    try {
      const cached = this.tileCache.get(tileDef.file);
      if (!cached) {
        await this.cacheTileModel(tileDef.file);
        return this.setTileFast(x, z, type, rotation, side);
      }
      
      const { mesh: originalMesh, container: originalContainer } = cached;
      
      // 🔥 КЛОНИРУЕМ КОНТЕЙНЕР
      const newContainer = originalContainer.clone(`tile_container_${x}_${z}`, null);
      if (!newContainer) return;
      
      // 🔥 КЛОНИРУЕМ МЕШ В КОНТЕЙНЕР
      const mesh = originalMesh.clone(`tile_${x}_${z}`, newContainer);
      if (!mesh) return;
      
      newContainer.setEnabled(true);
      mesh.setEnabled(true);
      
      let posX = x * this.tileSize + this.tileSize / 2;
      let posZ = z * this.tileSize + this.tileSize / 2;

      // СМЕЩЕНИЕ СТЕН
      if ((type === 'wall' || type === 'door') && side) {
        const edgeOffset = this.tileSize * 0.05;
        
        switch (side) {
          case 'north': posZ = z * this.tileSize + this.tileSize - edgeOffset; break;
          case 'south': posZ = z * this.tileSize + edgeOffset; break;
          case 'west': posX = x * this.tileSize + this.tileSize - edgeOffset; break;
          case 'east': posX = x * this.tileSize + edgeOffset; break;
        }
      }

      // 🔥 ВЫЧИСЛЯЕМ ФИНАЛЬНЫЙ ПОВОРОТ
      let finalRotation = rotation;
      if (type === 'wall_to_tunnel' && side) {
        if (side === 'north' || side === 'west') {
          finalRotation = rotation + Math.PI;
        }
      }

      // 🔥 ПРИМЕНЯЕМ ПОВОРОТ К КОНТЕЙНЕРУ
      newContainer.position = new BABYLON.Vector3(posX, 0, posZ);
      newContainer.rotation.y = finalRotation;
      
      // Меш остается с нулевым поворотом
      mesh.position = BABYLON.Vector3.Zero();
      mesh.rotation = BABYLON.Vector3.Zero();
      
      this.tileMeshes.push(newContainer);
      
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      if (type === 'wall_to_tunnel') {
        await this.setTileFast(x, z, 'door', rotation, side);
      }
    }
  }

  // Старые методы для совместимости
  async setDecor(x, z, decorType, rotation = 0, assetFile) {
    return this.setDecorFast(x, z, decorType, rotation, assetFile);
  }

  async setTile(x, z, type, rotation = 0, side = null) {
    return this.setTileFast(x, z, type, rotation, side);
  }

  async loadProp(filename) {
    const cached = await this.cachePropModel(filename);
    return cached.mesh;
  }

  async loadTile(filename) {
    const cached = await this.cacheTileModel(filename);
    return cached.mesh;
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
    this.scene.meshes.forEach((m) => {
      if (m.name.startsWith("grid")) m.dispose();
    });

    this.drawGrid(level.gridSize, level.gridSize, 0, 0);
  }

  drawGrid(width, height, offsetX = 0, offsetZ = 0) {
    const color = new BABYLON.Color3(0.4, 0.4, 0.4);
    const size = this.tileSize;

    for (let x = 0; x <= width; x += 2) {
      const p1 = new BABYLON.Vector3((offsetX + x) * size, 0, offsetZ * size);
      const p2 = new BABYLON.Vector3((offsetX + x) * size, 0, (offsetZ + height) * size);
      BABYLON.MeshBuilder.CreateLines("gridV" + x, { points: [p1, p2], color }, this.scene);
    }

    for (let z = 0; z <= height; z += 2) {
      const p1 = new BABYLON.Vector3(offsetX * size, 0, (offsetZ + z) * size);
      const p2 = new BABYLON.Vector3((offsetX + width) * size, 0, (offsetZ + z) * size);
      BABYLON.MeshBuilder.CreateLines("gridH" + z, { points: [p1, p2], color }, this.scene);
    }
  }
}
import { TILE_TYPES } from "./tile.js";

export class Renderer {
  constructor(canvasId, room = null) {
    this.canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.room = room;
    this.assetsPath = "./assets/";
    this.tileSize = 4;
    this.tileMeshes = [];

    // Если комната не передана, используем значения по умолчанию для камеры
    const roomWidth = room ? room.width : 10;
    const roomHeight = room ? room.height : 10;

    const camera = new BABYLON.ArcRotateCamera(
      "Camera",
      -Math.PI / 2,
      Math.PI / 3,
      60,
      new BABYLON.Vector3(
        (roomWidth * this.tileSize) / 2,
        0,
        (roomHeight * this.tileSize) / 2
      ),
      this.scene
    );
    camera.attachControl(this.canvas, true);
    new BABYLON.HemisphericLight("Light", new BABYLON.Vector3(0, 1, 0), this.scene);

    // Рисуем сетку только если есть комната
    if (room) {
      this.drawGrid();
    }
    
    this.engine.runRenderLoop(() => this.scene.render());
  }

  clearScene() {
    this.scene.meshes.slice().forEach((m) => {
      if (!m.name.startsWith("grid")) m.dispose();
    });
  }

  drawGrid() {
    if (!this.room) return;
    
    const color = new BABYLON.Color3(0.4, 0.4, 0.4);
    const size = this.tileSize;

    for (let x = 0; x <= this.room.width; x++) {
      const p1 = new BABYLON.Vector3(x * size, 0, 0);
      const p2 = new BABYLON.Vector3(x * size, 0, this.room.height * size);
      BABYLON.MeshBuilder.CreateLines("gridV" + x, { points: [p1, p2], color }, this.scene);
    }

    for (let y = 0; y <= this.room.height; y++) {
      const p1 = new BABYLON.Vector3(0, 0, y * size);
      const p2 = new BABYLON.Vector3(this.room.width * size, 0, y * size);
      BABYLON.MeshBuilder.CreateLines("gridH" + y, { points: [p1, p2], color }, this.scene);
    }
  }

  async fillRoom() {
    if (!this.room) return;
    
    for (let y = 0; y < this.room.height; y++) {
      for (let x = 0; x < this.room.width; x++) {
        await this.setTile(x, y, "floor");
      }
    }
  }

  async setTile(x, y, type) {
    const tileDef = TILE_TYPES[type];
    if (!tileDef) return;

    const mesh = await this.loadTile(tileDef.file);
    mesh.position = new BABYLON.Vector3(
      x * this.tileSize + this.tileSize / 2,
      0,
      y * this.tileSize + this.tileSize / 2
    );
    this.tileMeshes.push(mesh);
  }

  async setWall(wx, wz, rotationY) {
    const tileDef = TILE_TYPES["wall"];
    if (!tileDef) return;

    const mesh = await this.loadTile(tileDef.file);
    
    // Создаем родительский контейнер
    const container = new BABYLON.TransformNode("wallContainer", this.scene);
    container.position = new BABYLON.Vector3(wx, 0, wz);
    container.rotation.y = rotationY;
    
    // Присоединяем mesh к контейнеру
    mesh.parent = container;
    mesh.position = BABYLON.Vector3.Zero();
    
    this.tileMeshes.push(container);
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
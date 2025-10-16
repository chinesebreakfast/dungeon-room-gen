// src/render.js
export class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);

    // Камера сверху и под углом
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2.5,
      150,
      new BABYLON.Vector3(0, 0, 0),
      this.scene
    );
    camera.attachControl(this.canvas, true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 300;

    // Свет
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(1, 1, 0),
      this.scene
    );
  }

  renderDungeon(dungeon) {
    this.clearScene();

    const levelHeight = 15; // смещение по высоте между уровнями

    dungeon.levels.forEach((level, index) => {
      const yOffset = -index * levelHeight; // верхний уровень 0, ниже уровни -1, -2

      level.rooms.forEach(room => {
        const color = this._getRoomColor(room.type);
        const box = BABYLON.MeshBuilder.CreateBox(room.id, {
          width: room.w,
          height: 4, // увеличенная высота для визуального эффекта
          depth: room.h,
        }, this.scene);

        box.position = new BABYLON.Vector3(room.x, yOffset + 2, room.y); // 2 = половина высоты куба
        const mat = new BABYLON.StandardMaterial(room.id + "_mat", this.scene);
        mat.diffuseColor = color;
        box.material = mat;
      });
    });
  }

  clearScene() {
    this.scene.meshes
      .filter(m => m.name !== "camera" && m.name !== "light")
      .forEach(m => m.dispose());
  }

  _getRoomColor(type) {
    const c = BABYLON.Color3;
    switch (type) {
      case "start": return c.Green();
      case "lift": return c.Blue();
      case "treasure": return c.Yellow();
      case "boss": return c.Red();
      case "exit": return c.Purple();
      default: return new c(0.5, 0.5, 0.5);
    }
  }

  run() {
    this.engine.runRenderLoop(() => this.scene.render());
  }
}

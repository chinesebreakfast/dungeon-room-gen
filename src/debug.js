// debug.js
export class DebugMode {
  constructor(renderer, level) {
    this.renderer = renderer;
    this.level = level;
    this.isEnabled = false;
    this.debugMeshes = [];
    this.enemyNavigation = null;
    this.enemyManager = null;
    
    this.setupEventListeners();
  }

  setEnemyNavigation(navigation) {
    this.enemyNavigation = navigation;
  }

  setEnemyManager(manager) {
    this.enemyManager = manager;
  }

  enable() {
    this.isEnabled = true;
    console.log("🔧 Debug mode ENABLED - showing all AI decisions");
    this.removeDebugGrid();
    this.highlightAllAIDecisions(); // Показываем ВСЕ решения ИИ сразу
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
    document.addEventListener('keydown', (event) => {
      if (event.key === 'd' || event.key === 'D') {
        this.toggle();
      }
    });
  }

  highlightAllAIDecisions() {
    if (!this.enemyNavigation || !this.enemyManager) {
      console.warn("⚠️ EnemyNavigation or EnemyManager not set for debug mode");
      return;
    }

    const tileSize = this.renderer.tileSize;
    let walkableCount = 0;
    let targetCount = 0;

    // 1. Подсвечиваем ВСЕ доступные клетки (ЗЕЛЕНЫЙ)
    const walkableCells = this.enemyNavigation.getWalkableCells();
    walkableCells.forEach(cell => {
      const plane = BABYLON.MeshBuilder.CreatePlane(`walkable_${cell.x}_${cell.z}`, {
        size: tileSize * 0.9
      }, this.renderer.scene);
      
      plane.position.x = cell.x * tileSize + tileSize / 2;
      plane.position.z = cell.z * tileSize + tileSize / 2;
      plane.position.y = 0.01;
      plane.rotation.x = Math.PI / 2;
      
      const material = new BABYLON.StandardMaterial("walkable_mat", this.renderer.scene);
      material.diffuseColor = new BABYLON.Color3(0, 1, 0); // ЗЕЛЕНЫЙ
      material.alpha = 0.3;
      material.specularColor = new BABYLON.Color3(0, 0, 0);
      
      plane.material = material;
      this.debugMeshes.push(plane);
      walkableCount++;
    });

    // 2. Подсвечиваем ВСЕ целевые клетки врагов (СИНИЙ)
    const enemies = this.enemyManager.getAllEnemiesForRender();
    enemies.forEach(enemy => {
      const aiInfo = this.enemyManager.getEnemyAIDebugInfo(enemy.id);
      if (aiInfo && aiInfo.targetCell) {
        const targetPlane = BABYLON.MeshBuilder.CreatePlane(`enemy_target_${aiInfo.targetCell.x}_${aiInfo.targetCell.z}`, {
          size: tileSize * 0.7
        }, this.renderer.scene);
        
        targetPlane.position.x = aiInfo.targetCell.x * tileSize + tileSize / 2;
        targetPlane.position.z = aiInfo.targetCell.z * tileSize + tileSize / 2;
        targetPlane.position.y = 0.02;
        targetPlane.rotation.x = Math.PI / 2;
        
        const targetMaterial = new BABYLON.StandardMaterial("enemy_target_mat", this.renderer.scene);
        targetMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // СИНИЙ
        targetMaterial.alpha = 0.7;
        targetMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        
        targetPlane.material = targetMaterial;
        this.debugMeshes.push(targetPlane);
        targetCount++;

        //console.log(`🎯 Enemy ${enemy.type} at (${enemy.x},${enemy.z}) → Target: (${aiInfo.targetCell.x},${aiInfo.targetCell.z})`);
      }
    });

    console.log(`📊 AI Debug Summary:`);
    console.log(`🟢 Walkable cells: ${walkableCount}`);
    console.log(`🔵 Enemy targets: ${targetCount}/${enemies.length}`);
    console.log(`👁️ Click on enemies for detailed info`);
  }

  removeDebugGrid() {
    this.debugMeshes.forEach(mesh => {
      mesh.dispose();
    });
    this.debugMeshes = [];
  }
}
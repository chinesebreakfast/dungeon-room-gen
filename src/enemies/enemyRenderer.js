// enemies/enemyRenderer.js
export class EnemyRenderer {
  constructor(scene, assetsPath) {
    this.scene = scene;
    this.assetsPath = assetsPath;
    this.enemyMeshes = new Map(); // enemyId -> { mesh, animationGroups }
  }

  // Рендеринг всех врагов
  async renderEnemies(enemiesData, enemyManager) {
    
    for (const enemyData of enemiesData) {
      await this.renderEnemy(enemyData, enemyManager);
    }
    
    console.log(`✅ Finished rendering enemies`);
  }

  // Рендеринг одного врага
  async renderEnemy(enemyData, enemyManager) {
    try {
      const { id, type, x, z, config } = enemyData;
      
      const result = await this.loadEnemyModel(config.file, id);
      if (!result) {
        console.error(`❌ Failed to load model for ${type}`);
        return;
      }

      const { mesh, animationGroups } = result;

      // Позиционирование
      const tileSize = 4;
      mesh.position = new BABYLON.Vector3(
        x * tileSize + tileSize / 2,
        0,
        z * tileSize + tileSize / 2
      );
      
      // Масштабирование
      mesh.scaling = new BABYLON.Vector3(config.scale, config.scale, config.scale);
      mesh.name = `enemy_${id}`;
      
      // Сохраняем меш и анимации
      this.enemyMeshes.set(id, { mesh, animationGroups });
      
      // Передаем анимации врагу
      const enemy = enemyManager.getEnemyById(id);
      if (enemy) {
        enemy.setAnimationGroups(animationGroups);
      }
      
    } catch (error) {
      console.error(`❌ Error rendering enemy:`, error);
    }
  }

  // Загрузка модели врага с анимациями
  async loadEnemyModel(filename, enemyId) {
    return new Promise((resolve, reject) => {
      BABYLON.SceneLoader.ImportMesh("", this.assetsPath, filename, this.scene, 
        (meshes, particleSystems, skeletons, animationGroups) => {
          if (meshes.length > 0) {
            const mesh = meshes[0];    
            resolve({ 
              mesh, 
              animationGroups: animationGroups || [] 
            });
          } else {
            reject(new Error(`No meshes in file: ${filename}`));
          }
        },
        null,
        (scene, message) => {
          reject(new Error(`Load error: ${message}`));
        }
      );
    });
  }

  // Логирование анимаций
  logAnimations(animationGroups, filename) {
    console.log(`🎭 Animations for ${filename}:`);
    
    if (animationGroups && animationGroups.length > 0) {
      animationGroups.forEach((group, index) => {
        console.log(`   ${index}. "${group.name}"`);
      });
    } else {
      console.log(`   No animation groups found`);
    }
  }

  // Очистка всех мешей врагов
  clearAllMeshes() {
    this.enemyMeshes.forEach(({ mesh, animationGroups }) => {
      mesh.dispose();
      // Анимационные группы автоматически удаляются при dispose сцены
    });
    this.enemyMeshes.clear();
    console.log('🧹 Cleared all enemy meshes');
  }
}
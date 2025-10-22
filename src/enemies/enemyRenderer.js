// enemies/enemyRenderer.js
import { ENEMY_TYPES } from './enemyTypes.js';

export class EnemyRenderer {
  constructor(scene, assetsPath) {
    this.scene = scene;
    this.assetsPath = assetsPath;
    this.enemyMeshes = new Map();
    this.modelPool = new Map();
  }

  async preloadEnemyTypes() {
    const types = Object.keys(ENEMY_TYPES);
    console.log(`🔄 Preloading ${types.length} enemy types...`);

    // Parallel preloading
    const preloadPromises = types.map(async (type) => {
      if (!this.modelPool.has(type)) {
        const file = ENEMY_TYPES[type].file;
        this.modelPool.set(type, { 
          filename: file,
          animationNames: ENEMY_TYPES[type].animations 
        });
      }
    });

    await Promise.all(preloadPromises);
    console.log(`✅ Preloaded ${this.modelPool.size} enemy types`);
  }

  async renderEnemies(enemiesData, enemyManager) {
    // Parallel rendering with limited concurrency
    const batchSize = 5;
    let successCount = 0;

    for (let i = 0; i < enemiesData.length; i += batchSize) {
      const batch = enemiesData.slice(i, i + batchSize);
      const batchPromises = batch.map(enemyData => 
        this.renderEnemy(enemyData, enemyManager)
      );
      
      const results = await Promise.allSettled(batchPromises);
      successCount += results.filter(result => result.value).length;
    }

    console.log(`✅ Rendered ${successCount}/${enemiesData.length} enemies`);
  }

  async renderEnemy(enemyData, enemyManager) {
    const { id, type, x, z, config } = enemyData;
    
    try {
      const instanceData = await this.loadEnemyModel(config.file, id);
      
      if (!instanceData?.rootMesh) {
        return false;
      }

      this.setupEnemyMesh(instanceData.rootMesh, x, z, config);
      this.enemyMeshes.set(id, instanceData);

      const enemy = enemyManager.getEnemyById(id);
      if (enemy && instanceData.animationGroups) {
        enemy.setAnimationGroups(instanceData.animationGroups);
      }

      return true;

    } catch (error) {
      console.error(`❌ ${type} at (${x},${z}):`, error.message);
      return false;
    }
  }

  setupEnemyMesh(mesh, x, z, config) {
    const tileSize = 4;
    const worldX = x * tileSize + tileSize / 2;
    const worldZ = z * tileSize + tileSize / 2;
    
    mesh.position.set(worldX, 0, worldZ);
    mesh.scaling.set(config.scale, config.scale, config.scale);
  }

  async loadEnemyModel(filename, enemyId) {
    return new Promise((resolve, reject) => {
      BABYLON.SceneLoader.ImportMesh(
        "", 
        this.assetsPath, 
        filename, 
        this.scene,
        (meshes, particleSystems, skeletons, animationGroups) => {
          if (meshes.length === 0) {
            reject(new Error('No meshes'));
            return;
          }

          const rootMesh = meshes[0];
          
          // Fast animation group processing
          const renamedAnimationGroups = this.processAnimationGroups(animationGroups, enemyId);
          
          // Batch mesh renaming
          this.renameMeshes(meshes, enemyId);

          resolve({
            rootMesh,
            allMeshes: meshes,
            animationGroups: renamedAnimationGroups,
            skeletons: skeletons || []
          });
        },
        null,
        (_, message) => reject(new Error(message))
      );
    });
  }

  processAnimationGroups(animationGroups, enemyId) {
    if (!animationGroups) return [];

    const groups = [];
    for (let i = 0; i < animationGroups.length; i++) {
      const originalGroup = animationGroups[i];
      const renamedGroup = new BABYLON.AnimationGroup(originalGroup.name, this.scene);
      
      // Fast copy of targeted animations
      const animations = originalGroup.targetedAnimations;
      for (let j = 0; j < animations.length; j++) {
        renamedGroup.addTargetedAnimation(animations[j].animation, animations[j].target);
      }
      
      groups.push(renamedGroup);
    }
    
    return groups;
  }

  renameMeshes(meshes, enemyId) {
    for (let i = 0; i < meshes.length; i++) {
      meshes[i].name = `${meshes[i].name}_${enemyId}`;
    }
  }

  clearAllMeshes() {
    this.enemyMeshes.forEach(({ allMeshes, animationGroups }) => {
      // Fast disposal
      allMeshes.forEach(mesh => mesh.dispose());
      animationGroups.forEach(ag => ag.dispose());
    });
    this.enemyMeshes.clear();
  }

  // Debug method kept but simplified
  debugEnemyDetails() {
    let totalMeshes = 0;
    this.enemyMeshes.forEach((instanceData) => {
      totalMeshes += instanceData.allMeshes.length;
    });
    console.log(`Enemies: ${this.enemyMeshes.size}, Total meshes: ${totalMeshes}`);
  }
}
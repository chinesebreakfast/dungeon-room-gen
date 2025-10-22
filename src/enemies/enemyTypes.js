// enemies/enemyTypes.js
export const ENEMY_TYPES = {
  GHOUL: {
    file: 'ghoul.glb',
    scale: 1,
    speed: 0.1,
    patrolChance: 0.7,
    floorRange: [-2, 0],
    spawnProbability: 0.3,
    animations: {
        'IDLE':'Creature_armature|idle',
        'PATROL':'Creature_armature|walk',
        'ATTACK':'Creature_armature|attack_1',
        'DAMAGE':'Creature_armature|hit_1',
        'DEATH':'Creature_armature|death_1'
    }
  },
  MANIAC: {
    file: 'maniac.glb', 
    scale: 1,
    speed: 0.2,
    patrolChance: 0.4,
    floorRange: [-1, 0],
    spawnProbability: 0.4,
    animations: {
        'IDLE':'Idle01',
        'PATROL':'WalkAxeDown',
        'ATTACK':'',
        'DAMAGE':'',
        'DEATH':''
    }
  }
};
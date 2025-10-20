// decor.js
export const DECOR_TYPES = {
  CHEST: { 
    file: 'chest.glb', 
    probability: 0.3,
    tags: ['treasure', 'center'],
    navmesh: false,
    rotations: [0, Math.PI/4, Math.PI/2] // 0°, 45°, 90°
  },
  BARREL: { 
    file: 'barrel.glb', 
    probability: 0.15,
    tags: ['prop', 'edge'],
    navmesh: false,
    rotations: [0, Math.PI/2, Math.PI, 3*Math.PI/2] // 0°, 90°, 180°, 270°
  },
  BED: { 
    file: 'bed.glb', 
    probability: 0.1,
    tags: ['furniture', 'edge'],
    navmesh: false,
    rotations: [0, Math.PI/2] // 0°, 90°
  },
  CLOSET: { 
    file: 'closet.glb', 
    probability: 0.08,
    tags: ['furniture', 'edge'], 
    navmesh: false,
    rotations: [0, Math.PI/2] // 0°, 90°
  },
  TABLE: { 
    file: 'table.glb', 
    probability: 0.12,
    tags: ['furniture', 'center'],
    navmesh: false,
    rotations: [0, Math.PI/4, Math.PI/2] // 0°, 45°, 90°
  },
  BLOCKS: { 
    file: 'blocks.glb', 
    probability: 0.2,
    tags: ['prop', 'edge'],
    navmesh: true,
    rotations: [0] // только 0°
  }
};
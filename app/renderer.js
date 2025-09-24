import { CONFIG } from "./config.js";

function renderSubRooms(scene, subRooms) {
  subRooms.forEach((room, i) => {
    const mesh = BABYLON.MeshBuilder.CreateBox(`subRoom-${i}`, {
      width: room.width,
      depth: room.depth,
      height: CONFIG.WALL_HEIGHT
    }, scene);
    mesh.position.set(room.x, CONFIG.WALL_HEIGHT / 2, room.z);

    const mat = new BABYLON.StandardMaterial(`subRoomMat-${i}`, scene);
    mat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    mat.alpha = 0.5;
    mesh.material = mat;
  });
}

export function renderRoom(canvas, roomJson) {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 20, 
    BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // Материалы
  const materials = {};
  for (const [name, def] of Object.entries(CONFIG.MATERIALS)) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(def.color);
    materials[name] = mat;
  }

    // --- Пол ---
  const floorMesh = BABYLON.MeshBuilder.CreateGround("floor", {
      width: roomJson.floor.size.x,
      height: roomJson.floor.size.y,
      subdivisions: roomJson.floor.subdivisions,
      updatable: true
  }, scene);
  floorMesh.material = materials[roomJson.floor.material];

  // Берём вершины
  let positions = floorMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

  // Применяем шум Перлина
  const { sizeX, sizeY, sizeZ } = roomJson.floor.perlin;
  for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] / roomJson.floor.size.x * sizeX;
      const z = positions[i + 2] / roomJson.floor.size.y * sizeY;
      const noise = perlin2d(x, z, perm);
      positions[i + 1] = noise * sizeZ; // Y = вверх
  }

  // Обновляем меш
  floorMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true);
  floorMesh.refreshBoundingInfo();


  // --- Создаём сетку линий поверх деформированного пола ---
  function createCellGrid(floorMesh, N_CELLS) {
      const positions = floorMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      const lines = [];
      const vertsPerRow = N_CELLS + 1; // кол-во вершин по строке

      for (let i = 0; i < N_CELLS; i++) {       // по Z
          for (let j = 0; j < N_CELLS; j++) {   // по X
              // Индексы вершин углов клетки
              const tl = (i * vertsPerRow + j) * 3;         // top-left
              const tr = tl + 3;                            // top-right
              const bl = ((i + 1) * vertsPerRow + j) * 3;  // bottom-left
              const br = bl + 3;                            // bottom-right

              lines.push([
                  new BABYLON.Vector3(positions[tl], positions[tl + 1], positions[tl + 2]),
                  new BABYLON.Vector3(positions[tr], positions[tr + 1], positions[tr + 2]),
                  new BABYLON.Vector3(positions[br], positions[br + 1], positions[br + 2]),
                  new BABYLON.Vector3(positions[bl], positions[bl + 1], positions[bl + 2]),
                  new BABYLON.Vector3(positions[tl], positions[tl + 1], positions[tl + 2])
              ]);
          }
      }

      const grid = BABYLON.MeshBuilder.CreateLineSystem("cellGrid", { lines }, floorMesh.getScene());
      const gridMat = new BABYLON.StandardMaterial("gridMat", floorMesh.getScene());
      gridMat.emissiveColor = new BABYLON.Color3(0, 0, 0); // цвет сетки
      grid.material = gridMat;
  }

  createCellGrid(floorMesh, roomJson.floor.subdivisions);


  // --- Стены ---

  function createWallWithDoor(side, floorSize, wallHeight, doors, material, scene) {
  const wallDepth = side === "xMin" || side === "xMax" ? floorSize.y : floorSize.x;
  const wallWidth = 0.2;

  // перебираем двери на этой стене
  const doorPositions = doors.map(d => ({
    center: side === "xMin" || side === "xMax" ? d.center.z : d.center.x,
    width: d.width
  }));

  let start = -wallDepth / 2;

  doorPositions.forEach(door => {
    const doorStart = door.center - door.width / 2;
    const doorEnd = door.center + door.width / 2;

    if (doorStart > start) {
      // сегмент перед дверью
      const len = doorStart - start;
      const mesh = BABYLON.MeshBuilder.CreateBox("wallSeg", {
        width: side === "xMin" || side === "xMax" ? wallWidth : len,
        height: wallHeight,
        depth: side === "xMin" || side === "xMax" ? len : wallWidth
      }, scene);

      mesh.position.y = wallHeight / 2;
      if (side === "xMin") mesh.position.x = -floorSize.x / 2;
      if (side === "xMax") mesh.position.x = floorSize.x / 2;
      if (side === "xMin" || side === "xMax") mesh.position.z = start + len / 2;
      if (side === "yMin" || side === "yMax") mesh.position.x = start + len / 2;
      if (side === "yMin") mesh.position.z = -floorSize.y / 2;
      if (side === "yMax") mesh.position.z = floorSize.y / 2;

      mesh.material = material;
    }

    start = doorEnd;
  });

  // сегмент после последней двери
  if (start < wallDepth / 2) {
    const len = wallDepth / 2 - start;
    const mesh = BABYLON.MeshBuilder.CreateBox("wallSeg", {
      width: side === "xMin" || side === "xMax" ? wallWidth : len,
      height: wallHeight,
      depth: side === "xMin" || side === "xMax" ? len : wallWidth
    }, scene);

    mesh.position.y = wallHeight / 2;
    if (side === "xMin") mesh.position.x = -floorSize.x / 2;
    if (side === "xMax") mesh.position.x = floorSize.x / 2;
    if (side === "xMin" || side === "xMax") mesh.position.z = start + len / 2;
    if (side === "yMin" || side === "yMax") mesh.position.x = start + len / 2;
    if (side === "yMin") mesh.position.z = -floorSize.y / 2;
    if (side === "yMax") mesh.position.z = floorSize.y / 2;

    mesh.material = material;
  }
}



  roomJson.walls.forEach(wall => {
    createWallWithDoor(
      wall.side,
      CONFIG.FLOOR_SIZE,
      CONFIG.WALL_HEIGHT,
      wall.skipDoors,
      materials[wall.material],
      scene
    );
  });


  // --- Двери (синие сферы) ---
  roomJson.doors.forEach((door, i) => {
    const sphere = BABYLON.MeshBuilder.CreateSphere(`door-marker-${i}`, { diameter: 0.5 }, scene);
    sphere.position = new BABYLON.Vector3(door.center.x, 0.25, door.center.z);
    sphere.material = materials.doorMarker;
  });

  if (roomJson.subRooms && roomJson.subRooms.length > 0) {
      renderSubRooms(scene, roomJson.subRooms);
  }

  engine.runRenderLoop(() => scene.render());

  return { engine, scene };
}

// --- PERLIN NOISE --- //

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
  return a + t * (b - a);
}
function grad(hash, x, y) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
function perlin2d(x, y, perm) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const topRight = perm[(X + 1 + perm[(Y + 1) & 255]) & 255];
  const topLeft = perm[(X + perm[(Y + 1) & 255]) & 255];
  const bottomRight = perm[(X + 1 + perm[Y & 255]) & 255];
  const bottomLeft = perm[(X + perm[Y & 255]) & 255];

  const valTopRight = grad(topRight, xf - 1, yf - 1);
  const valTopLeft = grad(topLeft, xf, yf - 1);
  const valBottomRight = grad(bottomRight, xf - 1, yf);
  const valBottomLeft = grad(bottomLeft, xf, yf);

  const u = fade(xf);
  const v = fade(yf);

  return lerp(
    lerp(valBottomLeft, valBottomRight, u),
    lerp(valTopLeft, valTopRight, u),
    v
  );
}
function makePermutation() {
  const p = new Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p.concat(p);
}
const perm = makePermutation();




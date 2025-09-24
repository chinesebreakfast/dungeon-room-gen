export const CONFIG = {
    FLOOR_SIZE: 
    {
         x: 35, y: 25 // размеры пола
    },   
    N_CELLS: 10,                    // количество ячеек по каждой стороне
    MIN_ROOM_SIZE: 5,
    MAX_SUBROOMS: 6,
    MATERIALS: 
    {
        floor: { color: "#888888" },
        wall: { color: "#444444" },
        doorMarker: { color: "blue" }
    },
    WALL_HEIGHT: 3,
    PERLIN: 
    {
        sizeX: 1.0,  // масштаб шума по X
        sizeY: 1.0,  // масштаб шума по Z (наш Y на плоскости)
        sizeZ: 1.0   // максимальная высота смещения
    }
};

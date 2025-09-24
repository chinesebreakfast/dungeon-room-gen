import { generateRoom } from "./app/generator.js";
import { renderRoom } from "./app/renderer.js";

const canvas = document.getElementById("renderCanvas");
const roomJson = generateRoom();
renderRoom(canvas, roomJson);

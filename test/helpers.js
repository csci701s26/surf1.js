import { Mesh } from "../src/mesh";
import { readFile } from "fs/promises";

/**
 * Read a mesh from a file.
 * @param {String} path to .obj or .off file.
 * @returns {Mesh} with vertices and elements extracted from the file.
 */
const readMesh = async (path) => {
  const ext = path.split(".").pop().toLowerCase();
  let mesh = new Mesh();
  const text = await readFile(path, "utf-8");
  await mesh.loadModelText(ext, text);
  return mesh;
};

export { readMesh };

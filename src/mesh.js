import { loadModel, parseModelText } from "./io";

/**
 * Local triangle vertices along each face (edge).
 * Fi is opposite vertex Vi (local index i = 0, 1, 2).
 *
 * (V2) |\
 *      |  \
 * F1   |    \   F0
 *      |      \
 * (V0) ---------\ (V1)
 *         F2
 */
const TRIANGLE_FACE_NODES = [
  [1, 2],
  [2, 0],
  [0, 1],
];

/**
 * Local quad face vertices along each face (edge).
 * Edges and vertices are ordered CCW around the quad.
 * Fi starts at vertex Vi (local index i = 0, 1, 2, 3).
 *
 *         F2
 *  (V3) -------- (V2)
 *    |            |
 *    |            |
 * F3 |            | F1
 *    |            |
 *  (V0) -------- (V1)
 *         F0
 */
const QUAD_FACE_NODES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

class Mesh {
  /**
   * Initializes the mesh arrays.
   */
  constructor() {
    this.vertices = []; // Vertex coordinates (length = 3 x # vertices).
    this.lines = []; // Line indices (length = 2 x # lines).
    this.triangles = []; // Triangle indices (length = 3 x # triangles).
    this.quads = []; // Quad indices (length = 4 x # quads).
    this.polygons = {
      first: [], // Index of first polygon vertex in indices (length = # polygons).
      indices: [], // Flattened polygon indices (length = \sum size[i]).
      size: [], // Number of vertices per polygon (length = # polygons).
      length: 0, // Number of polygons (integer).
    };
  }

  /**
   * Load a mesh, with an option to duplicate vertices with different texcoords.
   */
  async load(path, duplicate = false) {
    const data = await loadModel(path, duplicate);
    this.extractModelData(data);
  }

  /**
   * Load and parse a text description of a mesh (.obj or .off).
   */
  loadModelText(ext, text, duplicate = false) {
    const data = parseModelText(ext, text, duplicate);
    this.extractModelData(data);
  }

  /**
   * Extract the arrays from the extracted data (from a .obj or .off).
   */
  extractModelData(data) {
    this.vertices = data.vertices;
    this.lines = data.lines;
    for (let face of data.faces) {
      if (face.length === 3) {
        this.triangles.push(face[0], face[1], face[2]);
      } else if (face.length === 4) {
        this.quads.push(face[0], face[1], face[2], face[3]);
      } else {
        this.polygons.first.push(this.polygons.indices.length);
        this.polygons.size.push(face.length);
        this.polygons.length++;
        for (let vertex of face) {
          this.polygons.indices.push(vertex);
        }
      }
    }
    console.log(
      `Extracted ${this.polygons.length} polygons, ${this.quads.length / 4} quads, ${this.triangles.length / 3} triangles.`,
    );
  }

  /**
   * Number of vertices in the mesh.
   */
  nVertices() {
    return this.vertices.length / 3;
  }

  /**
   * Retrieve vertex i.
   * @returns Array with the 3 coordinates of vertex i.
   */
  getVertex(i) {
    return this.vertices.slice(3 * i, 3 * i + 3);
  }

  /**
   * Number of triangles in the mesh.
   */
  nTriangles() {
    return this.triangles.length / 3;
  }

  /**
   * Retrieve vertex indices of triangle i.
   * @returns Array with the 3 vertex indices of triangle i.
   */
  getTriangle(i) {
    return this.triangles.slice(3 * i, 3 * i + 3);
  }

  /**
   * Retrieve vertex indices of face (edge) j in triangle i.
   * @returns Array with the 2 vertex indices of face j in triangle i.
   */
  getTriangleFace(i, j) {
    return [
      this.triangles[3 * i + TRIANGLE_FACE_NODES[j][0]],
      this.triangles[3 * i + TRIANGLE_FACE_NODES[j][1]],
    ];
  }

  /**
   * Number of triangles in the mesh.
   */
  nQuads() {
    return this.quads.length / 4;
  }

  /**
   * Retrieve vertex indices of quad i.
   * @returns Array with the 4 vertex indices of quad i.
   */
  getQuad(i) {
    return this.quads.slice(4 * i, 4 * i + 4);
  }

  /**
   * Retrieve vertex indices of face (edge) j in quad i.
   * @returns Array with the 2 vertex indices of face j in quad i.
   */
  getQuadFace(i, j) {
    return [
      this.quads[4 * i + QUAD_FACE_NODES[j][0]],
      this.quads[4 * i + QUAD_FACE_NODES[j][1]],
    ];
  }

  /**
   * Number of polygons in the mesh.
   */
  nPolygons() {
    return this.polygons.first.length;
  }

  /**
   * Adds a polygon to the mesh.
   * @param {Array[Integer]} polygon indices of the vertices defining the polygon.
   */
  addPolygon(polygon) {
    this.polygons.first.push(this.polygons.indices.length);
    this.polygons.indices.push(...polygon);
    this.polygons.size.push(polygon.length);
    this.polygons.length++;
  }

  /**
   * Retrieve vertex indices of polygon i.
   * @returns Array with the vertex indices of polygon i.
   */
  getPolygon(i) {
    return this.polygons.indices.slice(
      this.polygons.first[i],
      this.polygons.first[i] + this.polygons.size[i],
    );
  }
}

export { Mesh, TRIANGLE_FACE_NODES, QUAD_FACE_NODES };

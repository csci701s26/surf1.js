import { TRIANGLE_FACE_NODES, QUAD_FACE_NODES } from "./mesh";

/**
 * Represents triangle-to-triangle adjacencies.
 */
class TriangleAdjacencies {
  constructor(triangles) {
    this.build(triangles);
  }

  /**
   * Retrieves the index of the neighbor at a given face index for a triangle.
   * @param {Integer} triangle triangle index.
   * @param {Integer} faceIndex local face index (0, 1, 2).
   * @returns {Integer} index of neighbor.
   */
  getNeighbor(triangle, faceIndex) {
    return this.data[3 * triangle + faceIndex];
  }

  /**
   * Sets the index of the neighbor at a given face index for a triangle.
   * @param {Integer} triangle triangle index.
   * @param {Integer} faceIndex local face index (0, 1, 2).
   * @param {Integer} neighbor index of neighbor to set.
   */
  set(triangle, faceIndex, neighbor) {
    this.data[3 * triangle + faceIndex] = neighbor;
  }

  build(triangles) {
    this.data = new Array(triangles.length).fill(-1);
    const nTriangles = triangles.length / 3;
    let edges = new Map();
    for (let elem = 0; elem < nTriangles; elem++) {
      for (let face = 0; face < 3; face++) {
        const p = triangles[3 * elem + TRIANGLE_FACE_NODES[face][0]];
        const q = triangles[3 * elem + TRIANGLE_FACE_NODES[face][1]];
        const edgeId = JSON.stringify([p, q]);
        const twinId = JSON.stringify([q, p]);
        if (edges.has(twinId)) {
          const twinInfo = edges.get(twinId);
          const twinElem = twinInfo[0];
          const twinFace = twinInfo[1];
          this.data[3 * twinElem + twinFace] = elem;
          this.data[3 * elem + face] = twinElem;
          edges.delete(twinId);
        } else {
          edges.set(edgeId, [elem, face]);
        }
      }
    }
  }
}

/**
 * Represents encoded triangle adjacencies, so that face indices can be retrieved directly.
 * The encoding is: a = 4 * triangleIndex + localFaceIndex.
 * Although 3 could be used in the encoding, 4 enables the use of bitwise operators.
 */
class EncodedTriangleAdjacencies {
  static encode(k, j) {
    return (k << 2) + j;
  }

  static decode(a) {
    const j = a & 3;
    return [a >> 2, j];
  }

  static buildFrom(triangles) {
    let adj = new Array(triangles.length).fill(-1);
    const nTriangles = triangles.length / 3;
    let edges = new Map();
    for (let elem = 0; elem < nTriangles; elem++) {
      for (let face = 0; face < 3; face++) {
        const p = triangles[3 * elem + TRIANGLE_FACE_NODES[face][0]];
        const q = triangles[3 * elem + TRIANGLE_FACE_NODES[face][1]];
        const edgeId = JSON.stringify([p, q]);
        const twinId = JSON.stringify([q, p]);
        const a = this.encode(elem, face);
        if (edges.has(twinId)) {
          const b = edges.get(twinId);
          adj[b] = a;
          adj[a] = b;
          edges.delete(twinId);
        } else {
          edges.set(edgeId, a);
        }
      }
    }
    return adj;
  }
}

/**
 * Retrieves vertex-to-vertex information from a mesh.
 * @param {Mesh} mesh
 * @returns Array[Array[Integer]] list of vertices surrounding each vertex.
 */
const getVertex2Vertex = (mesh) => {
  let edges = new Set();
  for (let i = 0; i < mesh.triangles.length / 3; i++) {
    for (let j = 0; j < 3; j++) {
      const p = mesh.triangles[3 * i + TRIANGLE_FACE_NODES[j][0]];
      const q = mesh.triangles[3 * i + TRIANGLE_FACE_NODES[j][1]];
      let edge = JSON.stringify([Math.min(p, q), Math.max(p, q)]);
      edges.add(edge);
    }
  }

  for (let i = 0; i < mesh.quads.length / 4; i++) {
    for (let j = 0; j < 4; j++) {
      const p = mesh.quads[4 * i + QUAD_FACE_NODES[j][0]];
      const q = mesh.quads[4 * i + QUAD_FACE_NODES[j][1]];
      let edge = JSON.stringify([Math.min(p, q), Math.max(p, q)]);
      edges.add(edge);
    }
  }

  const nVertices = mesh.vertices.length / 3;
  let v2v = new Array(nVertices);
  for (let i = 0; i < nVertices; i++) v2v[i] = new Array();
  for (const edge of edges) {
    let [p, q] = JSON.parse(edge);
    if (p >= mesh.nVertices() || q > mesh.nVertices()) continue;
    v2v[p].push(q);
    v2v[q].push(p);
  }
  return v2v;
};

export { TriangleAdjacencies, EncodedTriangleAdjacencies, getVertex2Vertex };

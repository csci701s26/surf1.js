import { expect, assert, test } from "vitest";
import { TRIANGLE_FACE_NODES } from "../src/mesh";
import {
  TriangleAdjacencies,
  EncodedTriangleAdjacencies,
  getVertex2Vertex,
} from "../src/adjacency";
import { Grid } from "../src/library";

test("Grid (Triangle, 2x2) Adjacencies", () => {
  let mesh = new Grid("triangle", 2, 2);
  const adj = new TriangleAdjacencies(mesh.triangles);
  expect(adj.data.length).toBe(24);
  expect(adj.data[0]).toBe(3);
  expect(adj.data[1]).toBe(1);
  expect(adj.data[2]).toBe(-1);
  console.log(adj);
});

test("Grid (Triangle, 2x2) Encoded Adjacencies", () => {
  let mesh = new Grid("triangle", 2, 2);
  const adj = new EncodedTriangleAdjacencies(mesh.triangles);
  expect(adj.data.length).toBe(32);

  let edges = new Map();
  for (let elem = 0; elem < mesh.triangles.length / 3; elem++) {
    for (let face = 0; face < 3; face++) {
      const p = mesh.triangles[3 * elem + TRIANGLE_FACE_NODES[face][0]];
      const q = mesh.triangles[3 * elem + TRIANGLE_FACE_NODES[face][1]];
      const edgeId = JSON.stringify([p, q]);
      const twinId = JSON.stringify([q, p]);
      if (edges.has(twinId)) {
        let info = edges.get(twinId);
        assert(!info.right);
        info.right = [elem, face];
        edges.set(twinId, info);
      } else {
        edges.set(edgeId, { left: [elem, face], right: null });
      }
    }
  }

  for (let [_, edge] of edges) {
    const elemL = edge.left[0];
    const faceL = edge.left[1];
    if (!edge.right) continue;
    const elemR = edge.right[0];
    const faceR = edge.right[1];

    const aL = EncodedTriangleAdjacencies.encode(elemL, faceL);
    const aR = EncodedTriangleAdjacencies.encode(elemR, faceR);
    expect(adj.data[aL]).toBe(aR);
    expect(adj.data[aR]).toBe(aL);
    expect(adj.getNeighbor(elemL, faceL)).toBe(elemR);
    expect(adj.getNeighbor(elemR, faceR)).toBe(elemL);

    const pL = mesh.triangles[3 * elemL + TRIANGLE_FACE_NODES[faceL][0]];
    const qL = mesh.triangles[3 * elemL + TRIANGLE_FACE_NODES[faceL][1]];
    const pR = mesh.triangles[3 * elemR + TRIANGLE_FACE_NODES[faceR][0]];
    const qR = mesh.triangles[3 * elemR + TRIANGLE_FACE_NODES[faceR][1]];
    expect(pL).toBe(qR);
    expect(qL).toBe(pR);
  }
});

test("Grid (Triangle, 2x2) Vertex2Vertex", () => {
  let mesh = new Grid("triangle", 2, 2);
  const v2v = getVertex2Vertex(mesh);
  expect(v2v[0]).toContain(1);
  expect(v2v[0]).toContain(3);
  expect(v2v[0]).toContain(4);
  expect(v2v[1]).toContain(0);
  expect(v2v[1]).toContain(2);
  expect(v2v[1]).toContain(4);
  expect(v2v[1]).toContain(5);
  expect(v2v[2]).toContain(1);
  expect(v2v[2]).toContain(5);
  expect(v2v[3]).toContain(0);
  expect(v2v[3]).toContain(4);
  expect(v2v[3]).toContain(6);
  expect(v2v[3]).toContain(7);
  expect(v2v[4]).toContain(0);
  expect(v2v[4]).toContain(1);
  expect(v2v[4]).toContain(3);
  expect(v2v[4]).toContain(5);
  expect(v2v[4]).toContain(7);
  expect(v2v[4]).toContain(8);
  expect(v2v[5]).toContain(1);
  expect(v2v[5]).toContain(2);
  expect(v2v[5]).toContain(4);
  expect(v2v[5]).toContain(8);
  expect(v2v[6]).toContain(3);
  expect(v2v[6]).toContain(7);
  expect(v2v[7]).toContain(3);
  expect(v2v[7]).toContain(4);
  expect(v2v[7]).toContain(6);
  expect(v2v[7]).toContain(8);
  expect(v2v[8]).toContain(4);
  expect(v2v[8]).toContain(5);
  expect(v2v[8]).toContain(7);
});

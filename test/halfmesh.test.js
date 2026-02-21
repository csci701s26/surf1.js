import { assert, expect, test } from "vitest";
import { HalfMesh } from "../src/halfmesh";
import { Grid } from "../src/library";
import { writeObj } from "../src/io";
import { Mesh } from "../src/mesh";
import { getVertex2Vertex } from "../src/adjacency";
import { readMesh } from "./helpers";

test("Grid (Triangle, 2x2) HalfMesh", () => {
  let mesh = new Grid("triangle", 2, 2);
  const hmesh = new HalfMesh(mesh);
  expect(hmesh.nodes.length).toBe(9);
  expect(hmesh.edges.length).toBe(32); // 24 + 8 bnd
  expect(hmesh.faces.length).toBe(8);

  // count number of boundary edges
  let edge = null;
  for (edge of hmesh.edges) {
    if (edge.face == null) break;
  }
  assert(edge.face == null);
  let n_bnd = 0;
  let root = edge;
  do {
    edge = edge.next;
    n_bnd++;
  } while (edge != root);
  expect(n_bnd).toBe(8);

  mesh = hmesh.extract();
  expect(mesh.lines.length).toBe(16);
  expect(mesh.vertices.length).toBe(27);
  expect(mesh.triangles.length).toBe(24);
  writeObj(mesh, "public/test/test.obj");
});

test("Check Onering", async () => {
  let mesh = await readMesh("public/models/spot_triangulated.obj");
  let hmesh = new HalfMesh(mesh);
  const v2v = getVertex2Vertex(mesh);

  expect(v2v.length).toBe(hmesh.nodes.length);
  for (let i = 0; i < v2v.length; i++) {
    let vertices = new Set(v2v[i]);
    let nodes = hmesh.nodes[i].getNodeOnering();
    for (let node of nodes) {
      assert(vertices.has(node.index));
    }
  }

  mesh = hmesh.extract();
  writeObj(mesh, "public/test/test.obj");
});

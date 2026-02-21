import { assert, expect, test } from "vitest";
import { TriangleAdjacencies, getVertex2Vertex } from "../src/adjacency";
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

test("Grid (Triangle, 2x2) Vertex2Vertex", () => {
  let mesh = new Grid("triangle", 2, 2);
  const v2v = getVertex2Vertex(mesh);
  console.log(v2v);
});

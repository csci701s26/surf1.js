import { test } from "vitest";
import { Grid } from "../src/library";
import { writeObj } from "../src/io";
import { readMesh } from "./helpers";
import { HalfMesh } from "../src/halfmesh";

const flip = (edge) => {
  let twin = edge.twin;
  let p = edge.node;
  let q = twin.node;
  // TODO implement the flip
};

test("Flip Edge Test", async () => {
  let mesh = await readMesh("public/models/spot_triangulated.obj");
  //mesh = new Grid("triangle", 10, 10); // uncomment to use a grid

  let hmesh = new HalfMesh(mesh);

  let node = hmesh.nodes[50];
  let edge = node.edge; // select edge to flip

  flip(edge);
  mesh = hmesh.extract();
  mesh.lines = [edge.node.index, edge.twin.node.index]; // to visually locate the flip
  writeObj(mesh, "public/test/test.obj");
});

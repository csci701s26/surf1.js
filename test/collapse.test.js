import { test } from "vitest";
import { Grid } from "../src/library";
import { writeObj } from "../src/io";
import { readMesh } from "./helpers";
import { HalfMesh } from "../src/halfmesh";

const collapse = (edge) => {
  let twin = edge.twin;
  let p = edge.node;
  let q = twin.node;
  // TODO implement the collapse
};

test("Collapse Edge Test", async () => {
  let mesh = await readMesh("public/models/spot_triangulated.obj");
  //mesh = new Grid("triangle", 10, 10); // uncomment to use a grid

  let hmesh = new HalfMesh(mesh);

  let node = hmesh.nodes[50]; // select node to remove
  let edge = node.edge;
  collapse(edge);

  mesh = hmesh.extract();
  writeObj(mesh, "public/test/test.obj");
});

import { test } from "vitest";
import { writeObj } from "../src/io";
import { readMesh } from "../test/helpers";
import { getCircumcenter } from "../src/utils";
import { HalfMesh } from "../src/halfmesh";

test("Polygons Test", async () => {
  let mesh = await readMesh("public/assets/delaunay100.obj");
  let hmesh = new HalfMesh(mesh);

  // TODO calculate all triangle circumcenters (getCircumcenter) and then
  // create polygons by using getFaceOnering() for each node.
  // Note that each HalfFace has an "index" field which corresponds
  // to the index of the Delaunay triangle, which can be used to determine
  // the index of the circumcenter.

  mesh.triangles = []; // clear triangles to visualize polygons
  writeObj(mesh, "public/test/test.obj");
});

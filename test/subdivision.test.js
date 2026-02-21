import { test } from "vitest";
import { writeObj } from "../src/io";
import { getMidpoint, projectToSphere } from "../src/utils";
import { Icosahedron } from "../src/library";
import { readMesh } from "./helpers";

const subdivideSphere = (mesh) => {
  let edgeMap = {};
  let edgeIndices = new Array(3);
  let newTriangles = new Array();
  const nVertices = mesh.nVertices();
  let nEdges = 0;

  for (let i = 0; i < mesh.nTriangles(); i++) {
    for (let j = 0; j < 3; j++) {
      let p = mesh.triangles[3 * i + j]; // first edge vertex
      let q = mesh.triangles[3 * i + ((j + 1) % 3)]; // second edge vertex
      let edge = [Math.min(p, q), Math.max(p, q)]; // edge with sorted vertex indices
      let key = JSON.stringify(edge); // unique key associated with this edge

      // TODO determine the index of the point on this edge,
      // possibly creating a new point which will get pushed to mesh.vertices.
      // Use the midpointOnSphere function defined above.
    }

    // TODO define four new triangles (and push to newTriangles)
  }

  mesh.triangles = newTriangles;
};

test("Subdivision Test", async () => {
  //let mesh = await readMesh("public/models/spot_triangulated.obj");
  let mesh = new Icosahedron();

  subdivideSphere(mesh);

  writeObj(mesh, "public/test/test.obj");
});

import { test } from "vitest";
import { TriangleAdjacencies, getVertex2Vertex } from "../src/adjacency";
import { Grid } from "../src/library";
import { inTriangle2d, orient2d, getCentroid } from "../src/utils";
import { writeObj } from "../src/io";
import { readMesh } from "../test/helpers";

test("Find Triangle", async () => {
  let mesh = await readMesh("public/assets/delaunay1000.obj");
  //mesh = new Grid("triangle", 10, 10); // uncomment to use a grid
  const adj = new TriangleAdjacencies(mesh.triangles);

  // add centroids to store the path in mesh.lines
  let numVertices = mesh.vertices.length / 3;
  for (let k = 0; k < mesh.triangles.length / 3; k++) {
    let centroid = getCentroid(mesh.vertices, mesh.getTriangle(k));
    mesh.vertices.push(centroid[0], centroid[1], centroid[2]);
  }
  mesh.lines = []; // initialize the lines to store the path

  // TODO: Complete the function below to find the triangle
  // containing the 'query' point defined below (feel free to change it).
  // You may want to use "inTriangle2d" to determine if the
  // query point is inside the triangle.
  // The "orient2d" function can also be used to determine
  // if three points are in clockwise or counterclockwise order.
  let query = [0.625, 0.74, 0.0];
  let stepInto = (triangle) => {
    return -1;
  };
  let start = 0;
  let result = stepInto(start);
  console.log(`Found triangle ${result}.`);

  writeObj(mesh, "public/test/test.obj");
});

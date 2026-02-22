import { vec3 } from "gl-matrix";
import { orient2d, incircle } from "robust-predicates";

/**
 * Retrieves the centroid of an element.
 * @param {Array[Float]} vertices array of vertices in the mesh.
 * @param {Array[Integer]} indices vertex indices describing the element.
 * @returns {vec3} centroid coordinates.
 */
const getCentroid = (vertices, indices) => {
  let centroid = vec3.create();
  for (let j = 0; j < indices.length; j++) {
    for (let d = 0; d < 3; d++) {
      centroid[d] += vertices[3 * indices[j] + d] / indices.length;
    }
  }
  return centroid;
};

/**
 * Retrieves the midpoint of an edge p - q.
 * @param {Array[Float]} vertices array of vertices in the mesh.
 * @param {Integer} p index of first vertex on the edge.
 * @param {Integer} q index of second vertex on the edge.
 * @returns {vec3} midpoint coordinates.
 */
const getMidpoint = (vertices, p, q) => {
  return getCentroid(vertices, [p, q]);
};

/**
 * Projects a 3d point to the unit sphere centered at the origin.
 * @param {vec3} x point to project.
 * @returns {vec3} closest point on the unit sphere.
 */
const projectToSphere = (x) => {
  return vec3.normalize(vec3.create, x);
};

/**
 * Determines if a point with index i is in the circumcircle of triangle t.
 * @param {Array[Float]} vertices array of vertex coordinates in the mesh.
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Integer} triangleIndex
 * @param {Integer} pointIndex
 * @returns true if the vertex with pointIndex is in the circumcircle of triangle triangleIndex.
 */
const inCircle = (vertices, triangles, triangleIndex, pointIndex) => {
  const ax = vertices[3 * triangles[3 * triangleIndex]];
  const ay = vertices[3 * triangles[3 * triangleIndex] + 1];
  const bx = vertices[3 * triangles[3 * triangleIndex + 1]];
  const by = vertices[3 * triangles[3 * triangleIndex + 1] + 1];
  const cx = vertices[3 * triangles[3 * triangleIndex + 2]];
  const cy = vertices[3 * triangles[3 * triangleIndex + 2] + 1];
  const dx = vertices[3 * pointIndex];
  const dy = vertices[3 * pointIndex + 1];
  return incircle(ax, ay, bx, by, cx, cy, dx, dy) > 0;
};

/**
 * Determines if a point with index "point" is inside triangle "triangleIndex".
 * @param {Array[Float]} vertices array of vertex coordinates in the mesh.
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Integer} triangleIndex triangle index
 * @param {Array[Float]} point 2d vertex coordinates
 * @returns true if the point is contained in triangle triangleIndex.
 */
const inTriangle2d = (vertices, triangles, triangleIndex, point) => {
  const i = triangles[3 * triangleIndex];
  const j = triangles[3 * triangleIndex + 1];
  const k = triangles[3 * triangleIndex + 2];

  const ax = vertices[3 * i];
  const ay = vertices[3 * i + 1];
  const bx = vertices[3 * j];
  const by = vertices[3 * j + 1];
  const cx = vertices[3 * k];
  const cy = vertices[3 * k + 1];

  const aijx = orient2d(ax, ay, bx, by, point[0], point[1]);
  if (aijx > 0) return false;
  const ajkx = orient2d(bx, by, cx, cy, point[0], point[1]);
  if (ajkx > 0) return false;
  const akix = orient2d(cx, cy, ax, ay, point[0], point[1]);
  if (akix > 0) return false;
  return true;
};

/**
 * Returns the area of a 2d triangle.
 * @param {Array[Float]} vertices array of vertex coordinates in the mesh.
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Integer} triangleIndex triangle index
 */
const areaTriangle2d = (vertices, triangles, triangleIndex) => {
  const ti = triangles[3 * triangleIndex];
  const tj = triangles[3 * triangleIndex + 1];
  const tk = triangles[3 * triangleIndex + 2];

  const ax = vertices[3 * ti];
  const ay = vertices[3 * ti + 1];
  const bx = vertices[3 * tj];
  const by = vertices[3 * tj + 1];
  const cx = vertices[3 * tk];
  const cy = vertices[3 * tk + 1];

  return -0.5 * orient2d(ax, ay, bx, by, cx, cy);
};

/**
 * Returns the center of the circumcircle of a triangle.
 * @param {Array[Float]} vertices array of vertex coordinates in the mesh.
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Integer} triangleIndex.
 * @return {vec3} circumcenter coordinates.
 */
const getCircumcenter = (vertices, triangles, triangleIndex) => {
  const ti = triangles[3 * triangleIndex];
  const tj = triangles[3 * triangleIndex + 1];
  const tk = triangles[3 * triangleIndex + 2];

  const pi = vertices.slice(3 * ti, 3 * ti + 3);
  const pj = vertices.slice(3 * tj, 3 * tj + 3);
  const pk = vertices.slice(3 * tk, 3 * tk + 3);

  const la = vec3.distance(pj, pk);
  const lb = vec3.distance(pi, pk);
  const lc = vec3.distance(pi, pj);

  const alpha = vec3.fromValues(
    la * la * (-la * la + lb * lb + lc * lc),
    lb * lb * (la * la - lb * lb + lc * lc),
    lc * lc * (la * la + lb * lb - lc * lc),
  );

  const c = vec3.create();
  for (let dim = 0; dim < 3; dim++) {
    c[dim] += alpha[0] * pi[dim] + alpha[1] * pj[dim] + alpha[2] * pk[dim];
  }
  return vec3.scale(vec3.create(), c, 1.0 / (alpha[0] + alpha[1] + alpha[2]));
};

export {
  getCentroid,
  getMidpoint,
  projectToSphere,
  inCircle,
  inTriangle2d,
  areaTriangle2d,
  getCircumcenter,
  orient2d,
};

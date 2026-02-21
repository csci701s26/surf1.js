import { vec3 } from "gl-matrix";
import { orient2d, incircle } from "robust-predicates";

/**
 * Retrieves the centroid of an element.
 * @param {Array[Integer]} indices vertex indices describing the element.
 * @param {Array[Float]} vertices array of vertices in the mesh.
 * @returns {vec3} centroid coordinates.
 */
const getCentroid = (indices, vertices) => {
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
 * @param {Integer} p first vertex on the edge.
 * @param {Integer} q second vertex on the edge.
 * @returns {vec3} midpoint coordinates.
 */
const getMidpoint = (vertices, p, q) => {
  return getCentroid([p, q], vertices);
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
 * @param {Array[Integer]} tris array of triangle indices in the mesh.
 * @param {Array[Float]} pts array of vertex coordinates in the mesh.
 * @param {Integer} t triangle index
 * @param {Integer} i vertex index.
 * @returns true if vertex i is in the circumcircle of triangle t.
 */
const inCircle = (tris, pts, t, i) => {
  const ax = pts[3 * tris[3 * t]];
  const ay = pts[3 * tris[3 * t] + 1];
  const bx = pts[3 * tris[3 * t + 1]];
  const by = pts[3 * tris[3 * t + 1] + 1];
  const cx = pts[3 * tris[3 * t + 2]];
  const cy = pts[3 * tris[3 * t + 2] + 1];
  const dx = pts[3 * i];
  const dy = pts[3 * i + 1];
  return incircle(ax, ay, bx, by, cx, cy, dx, dy) > 0;
};

/**
 * Determines if a point with index "point" is inside triangle "triangleIndex".
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Array[Float]} points array of vertex coordinates in the mesh.
 * @param {Integer} triangleIndex triangle index
 * @param {Integer} point vertex index.
 * @returns true if vertex i is contained in triangle triangleIndex.
 */
const inTriangle2d = (triangles, points, triangleIndex, point) => {
  const i = triangles[3 * triangleIndex];
  const j = triangles[3 * triangleIndex + 1];
  const k = triangles[3 * triangleIndex + 2];

  const ax = points[3 * i];
  const ay = points[3 * i + 1];
  const bx = points[3 * j];
  const by = points[3 * j + 1];
  const cx = points[3 * k];
  const cy = points[3 * k + 1];

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
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Array[Float]} points array of vertex coordinates in the mesh.
 * @param {Integer} triangleIndex triangle index
 */
const areaTriangle2d = (triangles, points, triangleIndex) => {
  const i = triangles[3 * triangleIndex];
  const j = triangles[3 * triangleIndex + 1];
  const k = triangles[3 * triangleIndex + 2];

  const ax = points[3 * i];
  const ay = points[3 * i + 1];
  const bx = points[3 * j];
  const by = points[3 * j + 1];
  const cx = points[3 * k];
  const cy = points[3 * k + 1];

  return -0.5 * orient2d(ax, ay, bx, by, cx, cy);
};

/**
 * Returns the center of the circumcircle of a triangle.
 * @param {Array[Integer]} triangles array of triangle indices in the mesh.
 * @param {Array[Float]} points array of vertex coordinates in the mesh.
 * @param {Integer} t triangle index.
 * @return {vec3} circumcenter coordinates.
 */
const getCircumcenter = (points, triangles, t) => {
  const ti = triangles[3 * t];
  const tj = triangles[3 * t + 1];
  const tk = triangles[3 * t + 2];

  const pi = points.slice(3 * ti, 3 * ti + 3);
  const pj = points.slice(3 * tj, 3 * tj + 3);
  const pk = points.slice(3 * tk, 3 * tk + 3);

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

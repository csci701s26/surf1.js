## About

`surf.js` is a framework for exploring surface meshing, primarily for teaching. This library provides an interface to array-based (with element-element and vertex-vertex adjacencies) and halfedge mesh data structures to represent a mix of triangle, quadrilateral and general polygonal meshes. Various predicates (orientation, area, point-in-triangle, point-in-circumcircle) are implemented to facilitate algorithm development, and a renderer is also provided to visualize meshes.

The visualizer is currently available at: https://philipclaude.github.io/surf.js/

## Quickstart

1. Clone the repository. Forking is suggested if this will be used to explore the projects listed below.
2. `npm install`
3. `npm run dev` and open the link.

Note that `npm install` (Step 2) will also download various models from:

1. https://github.com/alecjacobson/common-3d-test-models 
2. https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository
3. https://github.com/libigl/libigl-tutorial-data/

and will add them to `public/models`, creating `public/models.json` so the visualizer can load them.

A few sample meshes are also provided in `public/assets`, some of which are in the Public Domain and downloaded from https://casual-effects.com/data/.

Use `npm run cleanup` to delete the downloaded meshes. Re-download them with `npm run setup`.

## Running a test

Individual tests can be run with `npx vitest run filename.test.js`. For example,

```sh
npx vitest run test/halfmesh.test.js`
```

The visualizer is configured to load a mesh in `test/test.obj`, so if a test writes a mesh file with this name, then it will be available in the visualizer after clicking the `Load` button (in the `Test` option of the dropdown).

## Exercises

The following are some exercises for practicing with the `surf.js` data structures.

1. Subdividing a mesh of an icosahedron to create a more refined mesh of a sphere (`test/subdivision.test.js`).
2. Finding an element containing a point in a 2d triangle mesh (`test/searching.test.js`).
3. Implementing the edge flip (swap) operator using the half-edge data structure (`test/flip.test.js`)
4. Extract the dual Voronoi diagram from the Delaunay triangulation (`test/polygons.test.js`).
5. Implementing the edge collapse (point removal) operator using the half-edge data structure (`test/collapse.test.js`).

## Suggested projects

1. Delaunay Triangulation. Start by searching the entire mesh for triangles violating the in-circle property. Then implement the optimized version that searches for the first cavity triangle using depth-first search from a previously inserted triangle and then breadth-first search to expand the cavity. This will require updating the adjacencies. It would also be best to insert points according to some spatial ordering.
2. Voronoi Diagrams using halfspace clipping. Start with a few sites (maybe 10) and sort all sites to each site by distance in order to traverse the neighbors and apply the radius of security theorem. Then use a kdtree (possibly using [this library](https://github.com/ubilabs/kd-tree-javascript) to retrieve nearest neighbors) and increase the number of sites.
3. Mesh Simplification with half-edges. Implement the edge collapse operator and use `gl-matrix` (included as a dependency) to calculate error metrics. See [this paper](https://www.cs.cmu.edu/~garland/Papers/quadrics.pdf) for more information. The `surf.js` installation includes a priority queue from [datastructures-js](https://datastructures-js.info/).
4. Loop and/or Catmull-Clark Subdivision Surfaces with either half-edges or arrays. Some of the meshes downloaded during `npm install` have a control mesh which can be used to test the subdivision. Other shapes for testing can be found in the [header files in Pixar's OpenSubdiv regression tests](https://github.com/PixarAnimationStudios/OpenSubdiv/tree/release/regression/shapes).
5. Mesh Adaptation with half-edges, possibly using an image to define a sizing field. See [here](https://drive.google.com/file/d/10Ftb5hTFoj2ajg7BSnafwFl28Afbzsp7/view?usp=sharing) for an example. This will require implementing all mesh modification operators (split, collapse, swap, smoothing) and determining an appropriate schedule for the operators.

### MIT License

Copyright (c) 2026 Philip Claude Caplan

See the `LICENSE` file for details.
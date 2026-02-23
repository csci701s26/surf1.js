import { Mesh } from "./mesh.js";

class HalfNode {
  /**
   * Constructs a half-node.
   * @param {vec3} point 3d coordinates of the point.
   * @param {HalfEdge} edge one edge emanating from this node.
   */
  constructor(point, edge) {
    this.point = point.slice();
    this.edge = edge;
    this.index = -1; // Set to -1 to deactivate.
  }

  /**
   * @returns {Array[HalfNode]} nodes adjacent to this node.
   */
  getNodeOnering() {
    let nodes = [];
    let root = this.edge;
    let edge = root;
    do {
      console.assert(edge.twin != null);
      nodes.push(edge.twin.node);
      edge = edge.twin.next;
    } while (edge != root);
    return nodes;
  }

  /**
   * @returns {Array[HalfEdge]} edges originating from this node.
   */
  getEdgeOnering() {
    let edges = [];
    let root = this.edge;
    let edge = root;
    do {
      edges.push(edge);
      edge = edge.twin.next;
    } while (edge != root);
    return edges;
  }

  /**
   * @returns {Array[HalfFace]} faces with this node as a vertex.
   */
  getFaceOnering() {
    let faces = [];
    let root = this.edge;
    let edge = root;
    do {
      if (edge.face != null) faces.push(edge.face);
      edge = edge.twin.next;
    } while (edge != root);
    return faces;
  }
}

class HalfEdge {
  /**
   * Creates a half-edge.
   * @param {HalfNode} node origin node of the directed edge.
   * @param {HalfFace} face corresponding to the face this edge is in.
   * @param {HalfEdge} twin the edge directed in the opposite direction on an adjacent face.
   */
  constructor(node, face, twin) {
    this.node = node;
    this.face = face;
    this.twin = twin;
    this.next = null;
  }
}

class HalfFace {
  /**
   * Creates a half-frace.
   * @param {HalfEdge} edge one edge in the linked list around the face.
   */
  constructor(edge) {
    this.edge = edge;
    this.index = -1; // Set to -1 to deactivate.
  }

  /**
   * @returns {Array[HalfNode]} nodes on this face.
   */
  getNodes() {
    let nodes = [];
    let root = this.edge;
    let edge = root;
    do {
      nodes.push(edge.node);
      edge = edge.next;
    } while (edge != root);
    return nodes;
  }
}

/**
 * A container for all the half-nodes (.nodes), half-edges (.edges)
 * and half-faces (.faces) in a mesh.
 */
class HalfMesh {
  /**
   * Constructs the half-edge representation of the mesh.
   * @param {Mesh} mesh
   */
  constructor(mesh) {
    this.build(mesh);
  }

  /**
   * Builds the half-edge representation of the mesh.
   * @param {Mesh} mesh
   */
  build(mesh) {
    // create all nodes
    const vertices = mesh.vertices;

    this.nodes = new Array(vertices.length / 3);
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i] = new HalfNode(vertices.slice(3 * i, 3 * i + 3), null);
      this.nodes[i].index = i;
    }

    let edgeMap = new Map();
    this.edges = [];
    this.faces = [];
    const addFaces = (n, get) => {
      for (let i = 0; i < n; i++) {
        let index = this.faces.length;
        this.faces.push(new HalfFace(null));
        this.faces[index].index = i;
        const face = get(i);
        let prev = null;
        let root = null;
        for (let j = 0; j < face.length; j++) {
          const p = face[j];
          const q = face[j + 1 == face.length ? 0 : j + 1];
          let edge = new HalfEdge(this.nodes[p], this.faces[i], null);
          this.nodes[p].edge = edge;
          this.edges.push(edge);
          const edgeId = JSON.stringify([p, q]);
          const twinId = JSON.stringify([q, p]);
          if (edgeMap.has(twinId)) {
            const twin = edgeMap.get(twinId);
            twin.twin = edge;
            edge.twin = twin;
            edgeMap.delete(twinId);
          } else {
            edgeMap.set(edgeId, edge);
          }
          edge.prev = prev;
          if (prev != null) prev.next = edge;
          if (j === 0) root = edge;
          prev = edge;
        }
        root.prev = prev;
        prev.next = root;
        this.faces[index].edge = root;
      }
    };

    addFaces(mesh.nTriangles(), (i) => mesh.getTriangle(i));
    addFaces(mesh.nQuads(), (i) => mesh.getQuad(i));
    addFaces(mesh.nPolygons(), (i) => mesh.getPolygon(i));
    console.log(`Number of leftover (boundary) edges: ${edgeMap.size}`);

    // go back through the edges and find those that do not have a twin
    let n_boundary = 0;
    for (let edge of this.edges) {
      if (edge.twin != null) continue; // not a boundary
      n_boundary++;
      let bnd_edge = new HalfEdge();
      this.edges.push(bnd_edge);
      bnd_edge.node = edge.next.node;
      bnd_edge.twin = edge;
      edge.twin = bnd_edge;
      bnd_edge.face = null;
      bnd_edge.next = null;
      bnd_edge.prev = null;
    }
    console.log(`Detected ${n_boundary} boundary edges`);

    // construct the next and prev for the boundary edges
    for (let edge of this.edges) {
      if (edge.face != null) continue; // not a boundary
      console.assert(edge.next == null);

      let next = edge.twin;
      while (next.face != null) {
        next = next.prev.twin;
      }
      edge.next = next;
      next.prev = edge;
    }
  }

  /**
   * @returns {Mesh} a new array-based mesh extracted from the half-edge representation.
   */
  extract() {
    let mesh = new Mesh();
    // extract vertices
    mesh.vertices = new Array();
    let nodeId = 0;
    let nodeMap = new Map();
    for (let node of this.nodes) {
      if (node.index < 0) continue; // node is deactivated
      for (let dim = 0; dim < 3; dim++) mesh.vertices.push(node.point[dim]);
      nodeMap.set(node, nodeId);
      nodeId++;
    }

    // extract faces
    for (let face of this.faces) {
      if (face.index < 0) continue; // face is deactivated
      let nodes = face.getNodes();
      let indices = [];
      for (let j = 0; j < nodes.length; j++) indices[j] = nodeMap.get(nodes[j]);
      if (nodes.length === 3) {
        mesh.triangles.push(...indices);
      } else if (nodes.length === 4) {
        mesh.quads.push(...indices);
      } else {
        mesh.polygons.push(...indices);
      }
    }

    // extract lines
    for (let edge of this.edges) {
      if (edge.face != null) continue;
      mesh.lines.push(nodeMap.get(edge.node), nodeMap.get(edge.twin.node));
    }
    return mesh;
  }
}

export { HalfMesh, HalfFace, HalfEdge, HalfNode };

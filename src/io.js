/**
 * Write a mesh to a .obj file, primarily meant for writing meshes from tests.
 * @param {Mesh} mesh
 * @param {String} path (relative to root, e.g. public/test/test.obj)
 */
const writeObj = (mesh, path) => {
  let txt = writeObjText(mesh);
  const fs = require("node:fs");
  fs.writeFile(path, txt, (err) => {
    if (err) console.log(err);
  });
};

const writeObjText = (mesh) => {
  let data = "";
  for (let i = 0; i < mesh.vertices.length / 3; i++) {
    data += `v ${mesh.vertices[3 * i]} ${mesh.vertices[3 * i + 1]} ${mesh.vertices[3 * i + 2]}\n`;
  }

  for (let i = 0; i < mesh.triangles.length / 3; i++) {
    data += `f ${mesh.triangles[3 * i] + 1} ${mesh.triangles[3 * i + 1] + 1} ${mesh.triangles[3 * i + 2] + 1}\n`;
  }

  for (let i = 0; i < mesh.quads.length / 4; i++) {
    data += `f ${mesh.quads[4 * i] + 1} ${mesh.quads[4 * i + 1] + 1} ${mesh.quads[4 * i + 2] + 1} ${mesh.quads[4 * i + 3] + 1}\n`;
  }

  //console.log(mesh.nPolygons());
  for (let i = 0; i < mesh.nPolygons(); i++) {
    data += "f ";
    const polygon = mesh.getPolygon(i);
    for (let j = 0; j < polygon.length; j++) {
      data += `${polygon[j] + 1} `;
    }
    data += "\n";
  }

  for (let i = 0; i < mesh.lines.length / 2; i++) {
    data += `l ${mesh.lines[2 * i] + 1} ${mesh.lines[2 * i + 1] + 1}\n`;
  }
  return data;
};

const loadModel = async (path, duplicate = false) => {
  let ext = path.split(".").pop().toLowerCase();
  if (ext === "obj") {
    return await loadObj(path, duplicate);
  } else if (ext === "off") {
    return await loadOff(path);
  }
  throw "Error: unknown file format: " + ext;
};

const parseModelText = (ext, text, duplicate = false) => {
  if (ext.toLowerCase() === "obj") {
    return parseObjText(text, duplicate);
  } else if (ext.toLowerCase() === "off") {
    return parseOffText(text);
  }
  throw "Error: unknown file format: " + ext;
};

const loadOff = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw "Unable to load " + path;
  }
  const text = await response.text();
  return parseOffText(text);
};

const parseOffText = (text) => {
  let vertices = [];
  let faces = [];
  let edges = []; // ignore nEdges (it's probably not lines and can be extracted)
  let lines = text.split("\n");
  let lineNumber = 0;
  let nVertices, nFaces, nEdges;
  for (let line of lines) {
    line = line.trim();
    if (line === "OFF") {
      lineNumber++;
      continue;
    }
    let data = line.split(" ").filter((x) => {
      return x != "";
    });
    if (data[0] === "#") continue;
    if (lineNumber == 1) {
      nVertices = parseInt(data[0]);
      nFaces = parseInt(data[1]);
      nEdges = parseInt(data[2]);
      console.log(
        `Detected ${nVertices} vertices, ${nFaces} faces, ${nEdges} edges`,
      );
    } else if (lineNumber <= nVertices + 1) {
      const x = parseFloat(data[0]);
      const y = parseFloat(data[1]);
      const z = data.length === 4 ? 0.0 : parseFloat(data[2]);
      vertices.push(x, y, z);
    } else if (lineNumber <= nVertices + nFaces + 1) {
      let face = [];
      for (let v = 1; v < data.length; v++) {
        face.push(parseInt(data[v].trim()));
      }
      faces.push(face);
    }
    lineNumber++;
  }
  return {
    vertices: vertices,
    lines: edges,
    texcoords: [],
    faces: faces,
  };
};

const loadObj = async (path, duplicate = false) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw "Unable to load " + path;
  }
  const text = await response.text();
  return parseObjText(text, duplicate);
};

const parseObjText = (text, duplicate) => {
  let vertices = [];
  let texcoords = [];
  let faces = [];
  let edges = [];
  let lines = text.split("\n");
  for (let line of lines) {
    let data = line.trim().split(" ");
    if (data[0] === "v") {
      const x = parseFloat(data[1]);
      const y = parseFloat(data[2]);
      const z = data.length === 3 ? 0.0 : parseFloat(data[3]);
      vertices.push(x, y, z);
    } else if (data[0] == "vt") {
      const u = parseFloat(data[1]);
      const v = parseFloat(data[2]);
      texcoords.push(u, v);
    } else if (data[0] === "f") {
      let faceData = data.slice(1);
      let face = [];
      for (let vertexText of faceData) {
        // TODO hash vertexData and duplicate vertices if necessary (if allowed)
        if (duplicate) console.warning("Not implemented");
        let vertexData = vertexText.split("/");
        face.push(parseInt(vertexData[0] - 1));
      }
      faces.push(face);
    } else if (data[0] === "l") {
      let lineData = data.slice(1);
      edges.push(parseInt(lineData[0]) - 1, parseInt(lineData[1]) - 1);
    }
  }
  console.log(
    `Loaded ${vertices.length / 3} vertices and ${faces.length} faces`,
  );
  return {
    vertices: vertices,
    lines: edges,
    texcoords: texcoords,
    faces: faces,
  };
};

export { loadModel, parseModelText, writeObj, writeObjText };

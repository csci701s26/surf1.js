import { vec3, mat4 } from "gl-matrix";

const vertexShaderSource = `
  precision highp float;
  precision highp int;

  attribute vec3 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_TexCoord;

  uniform mat4 u_ModelViewMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ModelViewProjectionMatrix;
  uniform int u_mode;
  uniform float u_PointSize;

  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoord;

  void main() {
    float scale = (u_mode < 0) ? 1.001 : 1.0;
    gl_Position  = u_ModelViewProjectionMatrix * vec4(scale * a_Position, 1.0);
    v_Normal = mat3(u_NormalMatrix) * a_Normal;
    v_Position = (u_ModelViewMatrix * vec4(a_Position, 1.0)).xyz;
    v_TexCoord = a_TexCoord;
    gl_PointSize = u_PointSize / gl_Position.w;

  }`;

const fragmentShaderSource = `
precision highp float;
precision highp int;

varying vec3 v_Normal;
varying vec3 v_Position;
varying vec2 v_TexCoord;

uniform int u_mode;
uniform float u_diffuse;
uniform float u_specular;
uniform sampler2D tex_Image;

void main() {
  if (u_mode == -1) { // edges
    gl_FragColor = vec4(0, 0, 0, 1);
    return;
  }
  if (u_mode == -2) { // lines
    gl_FragColor = vec4(0, 0, 1, 1);
    return;
  }
  if (u_mode == 0) { // points
    if (length(gl_PointCoord - vec2(0.5, 0.5)) < 0.5) {
      gl_FragColor = vec4(0, 0, 0, 1);
      return;
    } else {
      discard;
    }
  }
  vec3 p = v_Position;
  vec3 n = normalize(v_Normal);
  vec3 km = vec3(0.5);
  if (u_mode == 2) { // textured
    km = texture2D(tex_Image, v_TexCoord).rgb;
  }
  vec3 ca = vec3(0.4);
  vec3 cl = vec3(1);
  vec3 l = normalize(-p);
  vec3 r = reflect(-l, n);
  vec3 color = ca * km + u_diffuse * km * cl * abs(dot(n, l)) + u_specular * km * cl * pow(abs(dot(r, l)), 64.0);

  gl_FragColor = vec4(color, 1);
}`;

const compileShader = (gl, shaderSource, type) => {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw (
      "Unable to compile " +
      (type === gl.VERTEX_SHADER ? "vertex" : "fragment") +
      " shader: " +
      error
    );
  }

  return shader;
};

const compileProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
  let vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  let fragmentShader = compileShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER,
  );

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw (
      "Unable to compile the shader program: " + gl.getProgramInfoLog(program)
    );
  }

  gl.useProgram(program);
  return program;
};

const rotation = (dx, dy) => {
  const speed = 4;
  const R = mat4.fromYRotation(mat4.create(), speed * dx);
  return mat4.multiply(
    mat4.create(),
    mat4.fromXRotation(mat4.create(), speed * dy),
    R,
  );
};

const mouseMove = (event, renderer) => {
  if (!renderer.dragging) return;
  let R = rotation(
    (event.pageX - renderer.lastX) / renderer.canvas.width,
    (event.pageY - renderer.lastY) / renderer.canvas.height,
  );
  mat4.multiply(renderer.modelMatrix, R, renderer.modelMatrix);
  renderer.draw();
  renderer.lastX = event.pageX;
  renderer.lastY = event.pageY;
};

const mouseDown = (event, renderer) => {
  renderer.dragging = true;
  renderer.lastX = event.pageX;
  renderer.lastY = event.pageY;
};

const mouseUp = (event, renderer) => {
  renderer.dragging = false;
};

const mouseWheel = (event, renderer) => {
  event.preventDefault();

  let scale = 1.0;
  if (event.deltaY > 0) scale = 0.9;
  else if (event.deltaY < 0) scale = 1.1;
  let direction = vec3.create();
  vec3.subtract(direction, renderer.eye, renderer.center);
  vec3.scaleAndAdd(renderer.eye, renderer.center, direction, scale);

  mat4.lookAt(
    renderer.viewMatrix,
    renderer.eye,
    renderer.center,
    vec3.fromValues(0, 1, 0),
  );
  renderer.draw();
};

const scaleAndCenterVertices = (points) => {
  // find the bounding box and center of the mesh
  let xmin = [Infinity, Infinity, Infinity];
  let xmax = [-Infinity, -Infinity, -Infinity];
  let center = vec3.create();
  for (let k = 0; k < points.length / 3; k++) {
    for (let d = 0; d < 3; d++) {
      const x = points[3 * k + d];
      if (x < xmin[d]) xmin[d] = x;
      if (x > xmax[d]) xmax[d] = x;
      center[d] += x;
    }
  }
  // scale and center the mesh on the origin
  const length = vec3.subtract(vec3.create(), xmax, xmin);
  const lmax = Math.max.apply(Math, length);
  for (let d = 0; d < 3; d++) center[d] *= 3 / points.length;
  for (let k = 0; k < points.length / 3; k++) {
    for (let d = 0; d < 3; d++)
      points[3 * k + d] = (points[3 * k + d] - center[d]) / lmax;
  }
};

const computeNormals = (vertices, triangles) => {
  const np = vertices.length / 3;
  const nt = triangles.length / 3;

  // allocate the arrays
  let valency = new Uint8Array(np);
  let normals = new Float32Array(vertices.length);

  // add the contribution of every triangle to the vertex normals
  for (let i = 0; i < nt; i++) {
    const t0 = triangles[3 * i];
    const t1 = triangles[3 * i + 1];
    const t2 = triangles[3 * i + 2];

    // retrieve the coordinates of the points
    const p0 = vertices.slice(3 * t0, 3 * t0 + 3);
    const p1 = vertices.slice(3 * t1, 3 * t1 + 3);
    const p2 = vertices.slice(3 * t2, 3 * t2 + 3);

    // compute triangle normal
    const u = vec3.subtract(vec3.create(), p1, p0);
    const v = vec3.subtract(vec3.create(), p2, p0);
    const n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), u, v));

    // add the contribution to every vertex
    for (let j of [t0, t1, t2]) {
      for (let d = 0; d < 3; d++) normals[3 * j + d] += n[d];
      valency[j]++;
    }
  }

  // average the vertex normals
  for (let i = 0; i < np; i++) {
    let normal = normals.slice(3 * i, 3 * i + 3);
    for (let d = 0; d < 3; d++) normal[d] /= valency[i];
    normal = vec3.normalize(vec3.create(), normal);
    for (let d = 0; d < 3; d++) normals[3 * i + d] = normal[d];
  }
  return normals;
};

const triangulate = (mesh) => {
  let triangles = mesh.triangles.slice();
  let n = triangles.length / 3;
  let cells = Array.from({ length: n }, (_, i) => i);
  let edges = new Set();

  const addEdge = (p, q) => {
    edges.add(JSON.stringify([Math.min(p, q), Math.max(p, q)]));
  };

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      let p = triangles[3 * i + j];
      let q = triangles[3 * i + ((j + 1) % 3)];
      addEdge(p, q);
    }
  }

  const polygons = mesh.polygons;
  for (let i = 0; i < polygons.length; i++) {
    const m = polygons.indices[polygons.first[i]];
    const k = polygons.indices[polygons.first[i] + 1];
    addEdge(k, m);
    const l = polygons.indices[polygons.first[i] + polygons.size[i] - 1];
    addEdge(l, m);

    for (let j = 2; j < mesh.polygons.size[i]; j++) {
      const p = mesh.polygons.indices[mesh.polygons.first[i] + j - 1];
      const q = mesh.polygons.indices[mesh.polygons.first[i] + j];
      triangles.push(m, p, q);
      cells.push(n + i);
      addEdge(p, q);
    }
  }
  n += mesh.polygons.length;
  const quads = mesh.quads;
  for (let i = 0; i < quads.length / 4; i++) {
    const idx = 4 * i;
    triangles.push(quads[idx], quads[idx + 1], quads[idx + 2]);
    triangles.push(quads[idx], quads[idx + 2], quads[idx + 3]);
    for (let j = 0; j < 4; j++) {
      addEdge(quads[idx + j], quads[idx + ((j + 1) % 4)]);
    }
    cells.push(n + i, n + i);
  }
  return {
    triangles: triangles,
    cells: cells,
    edges: Array.from(edges, (edge) => JSON.parse(edge)).flat(),
  };
};

export class Renderer {
  constructor(canvasId) {
    // initialize webgl
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = window.innerWidth;
    this.gl = this.canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // create the shader program
    this.program = compileProgram(
      this.gl,
      vertexShaderSource,
      fragmentShaderSource,
    );

    this.eye = vec3.fromValues(0, 0, 2);
    this.center = vec3.create();
    this.viewMatrix = mat4.create();
    mat4.lookAt(
      this.viewMatrix,
      this.eye,
      this.center,
      vec3.fromValues(0, 1, 0),
    );

    this.projectionMatrix = mat4.create();
    this.modelMatrix = mat4.create();
    mat4.perspective(
      this.projectionMatrix,
      Math.PI / 4.0,
      this.canvas.width / this.canvas.height,
      0.1,
      1000.0,
    );

    // setup the callbacks
    this.dragging = false;
    let renderer = this;
    this.canvas.addEventListener("mousemove", (event) => {
      mouseMove(event, renderer);
    });
    this.canvas.addEventListener("mousedown", (event) => {
      mouseDown(event, renderer);
    });
    this.canvas.addEventListener("mouseup", (event) => {
      mouseUp(event, renderer);
    });
    this.canvas.addEventListener("wheel", (event) => {
      mouseWheel(event, renderer);
    });
  }

  write(mesh) {
    let gl = this.gl;

    scaleAndCenterVertices(mesh.vertices);
    this.modelMatrix = mat4.create();

    // create a buffer for the vertices
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(mesh.vertices),
      gl.STATIC_DRAW,
    );
    this.nVertices = mesh.vertices.length / 3;

    let { triangles, cells, edges } = triangulate(mesh);

    // create a buffer for the normals
    const normals = computeNormals(mesh.vertices, triangles);
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // create a buffer for the texcoords
    this.texcoordBuffer = null;
    if (mesh.texcoords) {
      this.texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(mesh.texcoords),
        gl.STATIC_DRAW,
      );
    }

    // create a buffer for the triangles
    this.triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(triangles),
      gl.STATIC_DRAW,
    );
    this.nTriangles = triangles.length / 3;

    this.edgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(edges),
      gl.STATIC_DRAW,
    );
    this.nEdges = edges.length / 2;

    this.lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(mesh.lines),
      gl.STATIC_DRAW,
    );
    this.nLines = mesh.lines.length / 2;
  }

  draw() {
    let gl = this.gl;

    // clear the canvas and set gl parameters
    gl.useProgram(this.program);
    gl.clearColor(1, 1, 1, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2, 3);
    //gl.lineWidth(10);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set the uniforms
    let mv = mat4.multiply(mat4.create(), this.viewMatrix, this.modelMatrix);
    let mvp = mat4.multiply(mat4.create(), this.projectionMatrix, mv);
    let n = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), mv));
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "u_ModelViewProjectionMatrix"),
      false,
      mvp,
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "u_ModelViewMatrix"),
      false,
      mv,
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "u_NormalMatrix"),
      false,
      n,
    );

    // enable the position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    const aPosition = gl.getAttribLocation(this.program, "a_Position");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // enable the normal attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    const aNormal = gl.getAttribLocation(this.program, "a_Normal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    let u_pointsize = gl.getUniformLocation(this.program, "u_PointSize");
    const pointSize = document.getElementById("range-point-size").value;
    gl.uniform1f(u_pointsize, pointSize);

    let u_diffuse = gl.getUniformLocation(this.program, "u_diffuse");
    const diffuse = document.getElementById("checkbox-diffuse").checked;
    gl.uniform1f(u_diffuse, diffuse ? 1 : 0);
    let u_specular = gl.getUniformLocation(this.program, "u_specular");
    const specular = document.getElementById("checkbox-specular").checked;
    gl.uniform1f(u_specular, specular ? 1 : 0);

    // enable texcoord attribute
    const aTexCoord = gl.getAttribLocation(this.program, "a_TexCoord");
    if (this.texcoordBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aTexCoord);
    } else {
      gl.disableVertexAttribArray(aTexCoord);
    }

    // draw the triangles
    const u_mode = gl.getUniformLocation(this.program, "u_mode");
    if (document.getElementById("checkbox-faces").checked) {
      const textured = document.getElementById("checkbox-texture").checked;
      if (this.texcoordBuffer && textured) {
        gl.uniform1i(u_mode, 2);
        gl.uniform1i(gl.getUniformLocation(this.program, "tex_Image"), 0);
      } else {
        gl.uniform1i(u_mode, 1);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
      gl.drawElements(gl.TRIANGLES, this.nTriangles * 3, gl.UNSIGNED_INT, 0);
    }

    // draw the edges
    if (document.getElementById("checkbox-edges").checked) {
      gl.uniform1i(u_mode, -1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeBuffer);
      gl.drawElements(gl.LINES, this.nEdges * 2, gl.UNSIGNED_INT, 0);
    }

    // draw the lines
    if (document.getElementById("checkbox-lines").checked) {
      gl.uniform1i(u_mode, -2);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineBuffer);
      gl.drawElements(gl.LINES, this.nLines * 2, gl.UNSIGNED_INT, 0);
    }

    // draw the vertices
    if (document.getElementById("checkbox-vertices").checked) {
      gl.uniform1i(u_mode, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.drawArrays(gl.POINTS, 0, this.nVertices);
    }
  }
}

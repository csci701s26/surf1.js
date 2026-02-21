import { Mesh } from "./mesh";
import { OBJ } from "webgl-obj-loader";

class Grid extends Mesh {
  /**
   * Creates a structured grid.
   * @param {String} type element type (either "quad" or "triangle")
   * @param {Integer} nx number of elements in the x-direction.
   * @param {Integer} ny  number of element in the y-direction
   */
  constructor(type, nx, ny) {
    super();

    const dx = 1.0 / nx;
    const dy = 1.0 / ny;
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        this.vertices.push(i * dx, j * dy, 0.0);
      }
    }

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let k = j * (nx + 1) + i;
        if (type === "quad") {
          this.quads.push(k, k + 1, k + nx + 2, k + nx + 1);
        } else if (type == "triangle") {
          this.triangles.push(k, k + 1, k + nx + 2);
          this.triangles.push(k, k + nx + 2, k + nx + 1);
        }
      }
    }
  }
}

class Icosahedron extends Mesh {
  /**
   * Creates a mesh of an icosahedron.
   */
  constructor() {
    super();
    this.build();
  }

  build() {
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const a = Math.sqrt(1 + t * t);
    // prettier-ignore
    this.vertices = [
      t / a, 1 / a, 0,
      -t / a, 1 / a, 0,
      t / a, -1 / a, 0,
      -t / a, -1 / a, 0,
      1 / a, 0, t / a,
      1 / a, 0, -t / a,
      -1 / a, 0, t / a,
      -1 / a, 0, -t / a,
      0, t / a, 1 / a,
      0, -t / a, 1 / a,
      0, t / a, -1 / a,
      0, -t / a, -1 / a,
    ];
    this.triangles = [
      0, 8, 4, 0, 5, 10, 2, 4, 9, 2, 11, 5, 1, 6, 8, 1, 10, 7, 3, 9, 6, 3, 7,
      11, 0, 10, 8, 1, 8, 10, 2, 9, 11, 3, 11, 9, 4, 2, 0, 5, 0, 2, 6, 1, 3, 7,
      3, 1, 8, 6, 4, 9, 4, 6, 10, 5, 7, 11, 7, 5,
    ];
  }
}

class Texture {
  constructor(gl, path, flip) {
    let img = new Image();
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip ? 1 : 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    img.onload = () => {
      document.body.appendChild(img);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    };
    img.src = path;
    img.hidden = true;
  }
}

class MeshLibrary {
  constructor() {
    this.entry = {};
  }

  addEntry(name, path, imgPath, imgFlip, builder, from) {
    this.entry[name] = {
      path: path,
      imgPath: imgPath,
      imgFlip: imgFlip,
      builder: builder,
      from: from,
    };
  }

  async build() {
    // the first two meshes are from the "Geodesics" section at: https://casual-effects.com/data/ (Public Domain)
    this.addEntry("Sphere (triangles)", "assets/geodesic_classI_3.obj");
    this.addEntry("Sphere (polygons)", "assets/geodesic_dual_classI_3.obj");
    this.addEntry("Icosahedron", null, null, null, () => new Icosahedron());
    this.addEntry("Tetrahedron", "assets/tetrahedron.obj");
    this.addEntry("delaunay10.obj", "assets/delaunay10.obj");
    this.addEntry("delaunay100.obj", "assets/delaunay100.obj");
    this.addEntry("delaunay1000.obj", "assets/delaunay1000.obj");
    this.addEntry(
      "Grid (Triangle, 2x2)",
      null,
      null,
      null,
      () => new Grid("triangle", 2, 2),
    );
    this.addEntry(
      "Grid (Triangle, 10x10)",
      null,
      null,
      null,
      () => new Grid("triangle", 10, 10),
    );
    this.addEntry("Grid (Quad, 2x2)", null, null, () => new Grid("quad", 2, 2));
    this.addEntry(
      "Grid (Quad, 10x10)",
      null,
      null,
      null,
      () => new Grid("quad", 10, 10),
    );
    this.addEntry(
      "Voronoi (Earth)",
      "assets/voronoi-earth.obj",
      null,
      null,
      null,
      "https://drive.google.com/file/d/1X6Zq9wseFYUyDfVLrsTYnO24fO_eET-F/view?usp=sharing",
    );
    this.addEntry(
      "Airfoil",
      "assets/airfoil.obj",
      null,
      null,
      null,
      "https://drive.google.com/file/d/1MLLcmJzevrjv6XU-xU4OaF8cItDGnc1M/view?usp=sharing",
    );
    this.addEntry("Test", "test/test.obj");

    const response = await fetch("models.json");
    const text = await response.text();
    const models = JSON.parse(text);
    for (let model of models) {
      this.addEntry(model.name, model.path, model.imgPath, model.imgFlip);
    }
  }

  async load(name, gl) {
    console.assert(name in this.entry);
    const entry = this.entry[name];
    let mesh = new Mesh();
    let loader = document.getElementById("select-loader");
    try {
      if (entry.builder) {
        mesh = entry.builder();
      } else if (loader.value === "Basic") {
        await mesh.load(entry.path);
      } else {
        const response = await fetch(entry.path);
        const text = await response.text();
        let obj = new OBJ.Mesh(text);
        mesh.vertices = obj.vertices;
        mesh.triangles = [...obj.indices];
        mesh.texcoords =
          obj.textures && obj.textures.length > 0 ? obj.textures : null;
        mesh.texture = new Texture(gl, entry.imgPath, entry.imgFlip);
      }
    } catch (error) {
      const msg =
        "Unable to load mesh. Click OK to download, and then put in public/assets.";
      if (window.confirm(msg)) {
        if (entry.from) window.open(entry.from);
      }
      return undefined;
    }
    return mesh;
  }
}

export { MeshLibrary, Grid, Icosahedron };

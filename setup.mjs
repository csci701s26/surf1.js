import { unzipSync } from "fflate";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DESTINATION = "public/models";
const PREFIX = "models";

async function downloadAndUnzip(url) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const files = unzipSync(buffer);

  for (const [filename, data] of Object.entries(files)) {
    const asset = filename.split("/").pop();
    if (!asset || asset[0] === "." || asset[0] === "_") continue;
    const path = join(DESTINATION, asset);
    writeFileSync(path, data);
  }
}

const downloadAsset = async (url, path) => {
  const response = await fetch(url);
  const content = await response.text();
  writeFileSync(path, content);
};

const MODELS = [
  {
    zip: "https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository/spot.zip",
    img: "spot_texture.png",
    obj: [
      "spot_control_mesh.obj",
      "spot_quadrangulated.obj",
      "spot_triangulated.obj",
    ],
    flip: true,
  },
  {
    zip: "https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository/bob.zip",
    img: "bob_diffuse.png",
    obj: [
      "bob_controlmesh.obj",
      "bob_tri.obj",
      "bob_quad.obj",
      "bob_isotropic.obj",
    ],
    flip: true,
  },
  {
    zip: "https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository/blub.zip",
    img: "blub_texture.png",
    obj: [
      "blub_control_mesh.obj",
      "blub_triangulated.obj",
      "blub_quadrangulated.obj",
    ],
    flip: true,
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/stanford-bunny.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/suzanne.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/teapot.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/xyzrgb_dragon.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/horse.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/beetle.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/refs/heads/master/data/cow.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/libigl/libigl-tutorial-data/refs/heads/master/bunny.off",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/libigl/libigl-tutorial-data/refs/heads/master/lion.off",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/libigl/libigl-tutorial-data/refs/heads/master/fandisk.off",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/libigl/libigl-tutorial-data/refs/heads/master/cow.off",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/libigl/libigl-tutorial-data/refs/heads/master/elephant.obj",
  },
  {
    zip: undefined,
    img: undefined,
    obj: "https://raw.githubusercontent.com/libigl/libigl-tutorial-data/refs/heads/master/armadillo.obj",
  },
];

const setup = async () => {
  console.log("Downloading models...");

  if (!existsSync(DESTINATION)) {
    mkdirSync(DESTINATION, { recursive: true });
  }

  let library = [];
  for (let model of MODELS) {
    if (model.zip) {
      downloadAndUnzip(model.zip);
      for (let obj of model.obj) {
        library.push({
          name: obj,
          path: join(PREFIX, obj),
          imgPath: model.img ? join(PREFIX, model.img) : undefined,
          imgFlip: model.flip,
          builder: undefined,
        });
      }
    } else {
      console.assert(model.obj);
      const obj = model.obj.split("/").pop();
      downloadAsset(model.obj, `${DESTINATION}/${obj}`);
      if (model.img) {
        const img = model.img.split("/").pop();
        downloadAsset(model.img, `${DESTINATION}/${img}`);
      }
      library.push({
        name: obj,
        path: join(PREFIX, obj),
        imgPath: model.img ? join(PREFIX, model.img) : "",
        imgFlip: model.flip ? model.flip : "false",
        builder: undefined,
      });
    }
  }
  writeFileSync("public/models.json", JSON.stringify(library, undefined, 2));
};
setup();

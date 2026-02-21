import "github-markdown-css";
import { Renderer } from "./renderer.js";
import { MeshLibrary } from "./library.js";

const DRAW_LISTENER_IDS = [
  "checkbox-faces",
  "checkbox-lines",
  "checkbox-edges",
  "checkbox-vertices",
  "checkbox-diffuse",
  "checkbox-specular",
  "checkbox-texture",
  "range-point-size",
];

let renderer = new Renderer("renderer-canvas");
let library = new MeshLibrary();
const selectMesh = async () => {
  const meshName = document.getElementById("select-mesh").value;
  const mesh = await library.load(meshName, renderer.gl);
  if (!mesh) return;
  renderer.write(mesh);
  renderer.draw();
};

library.build().then(() => {
  let select = document.getElementById("select-mesh");
  for (let name in library.entry) {
    let option = document.createElement("option");
    option.innerHTML = name;
    select.appendChild(option);
  }
  select.addEventListener("change", selectMesh);

  let loader = document.getElementById("button-load");
  loader.addEventListener("click", selectMesh);

  for (let listener of DRAW_LISTENER_IDS) {
    document.getElementById(listener).addEventListener("change", () => {
      renderer.draw();
    });
  }
  loader.click();
});

import { rmSync } from "fs";

rmSync("public/models", { recursive: true, force: true });
rmSync("public/models.json", { force: true });
rmSync("public/assets/airfoil.obj", { force: true });
rmSync("public/assets/voronoi-sphere.obj", { force: true });
rmSync("public/assets/voronoi-earth.obj", { force: true });
rmSync("public/test/test.obj", { force: true });

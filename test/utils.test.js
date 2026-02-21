import { expect, test } from "vitest";
import { inTriangle2d, areaTriangle2d } from "../src/utils";

test("inTriangle2d Test", () => {
  const points = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  const triangles = [0, 1, 2];
  expect(inTriangle2d(triangles, points, 0, [0.25, 0.25, 0])).toBe(true);
  expect(inTriangle2d(triangles, points, 0, [0.5, 0.5, 0])).toBe(true);
  expect(inTriangle2d(triangles, points, 0, [1, 1, 0])).toBe(false);
});

test("areaTriangle2d Test", () => {
  const points = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  expect(areaTriangle2d([0, 1, 2], points, 0)).toBe(0.5);
  expect(areaTriangle2d([0, 2, 1], points, 0)).toBe(-0.5);
  expect(Math.abs(areaTriangle2d([0, 1, 1], points, 0))).toBe(0);
});

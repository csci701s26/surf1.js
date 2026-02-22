import { expect, test } from "vitest";
import {
  inTriangle2d,
  areaTriangle2d,
  getCentroid,
  getMidpoint,
  getCircumcenter,
} from "../src/utils";

test("inTriangle2d Test", () => {
  const points = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  const triangles = [0, 1, 2];
  expect(inTriangle2d(points, triangles, 0, [0.25, 0.25, 0])).toBe(true);
  expect(inTriangle2d(points, triangles, 0, [0.5, 0.5, 0])).toBe(true);
  expect(inTriangle2d(points, triangles, 0, [1, 1, 0])).toBe(false);
});

test("areaTriangle2d Test", () => {
  const points = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  expect(areaTriangle2d(points, [0, 1, 2], 0)).toBe(0.5);
  expect(areaTriangle2d(points, [0, 2, 1], 0)).toBe(-0.5);
  expect(Math.abs(areaTriangle2d(points, [0, 1, 1], 0))).toBe(0);
});

test("getCentroid Test", () => {
  const points = [0, 0, 0, 3, 0, 0, 0, 3, 0];
  let c = getCentroid(points, [0, 1, 2], 0);
  expect(c[0]).toBe(1);
  expect(c[1]).toBe(1);
  expect(c[2]).toBe(0.0);
});

test("getMidpoint Test", () => {
  const points = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  let c = getMidpoint(points, 0, 1);
  expect(c[0]).toBe(0.5);
  expect(c[1]).toBe(0.0);
  expect(c[2]).toBe(0.0);
});

test("getCircumcenter Test", () => {
  const points = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  let c = getCircumcenter(points, [0, 1, 2], 0);
  expect(c[0]).toBe(0.5);
  expect(c[1]).toBe(0.5);
  expect(c[2]).toBe(0.0);
});

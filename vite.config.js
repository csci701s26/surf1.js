export default {
  base: "/surf.js/",
  test: {
    exclude: [
      ...(process.env.CI
        ? [
            "test/subdivision.*",
            "test/collapse.*",
            "test/flip.*",
            "test/searching.*",
            "test/polygons.*",
          ]
        : []),
    ],
  },
};

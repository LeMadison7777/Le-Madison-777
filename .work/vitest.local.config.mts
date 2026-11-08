export default {
  root: "C:/Users/Le MADISON/OneDrive/Desktop/Le Madison 777",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["C:/Users/Le MADISON/OneDrive/Desktop/Le Madison 777/src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": "C:/Users/Le MADISON/OneDrive/Desktop/Le Madison 777/src",
    },
  },
};

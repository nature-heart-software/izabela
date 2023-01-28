var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// package.json
var require_package = __commonJS({
  "package.json"(exports, module) {
    module.exports = {
      name: "@packages/animalese",
      private: true,
      version: "0.0.0",
      type: "module",
      files: [
        "./dist"
      ],
      main: "./dist/main.cjs",
      module: "./dist/main.es.js",
      types: "./dist/animalese.d.ts",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview"
      },
      devDependencies: {
        typescript: "^4.9.3",
        vite: "^4.0.0"
      },
      dependencies: {
        "vite-plugin-dts": "^1.7.1"
      }
    };
  }
});

// vite.config.ts
import { defineConfig } from "file:///C:/Users/Wuriko/Desktop/dev/nhs/izabela/packages/animalese/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///C:/Users/Wuriko/Desktop/dev/nhs/izabela/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\Wuriko\\Desktop\\dev\\nhs\\izabela\\packages\\animalese";
var pkg = require_package();
var externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
];
var externals = externalPackages.map(
  (packageName) => new RegExp(`^${packageName}(/.*)?`)
);
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    dts()
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/main.ts"),
      name: "main",
      formats: ["cjs", "es"],
      fileName: (format) => `main.${{
        cjs: "cjs",
        es: "es.js"
      }[format]}`
    },
    rollupOptions: {
      external: externals
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZS5qc29uIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XG4gIFwibmFtZVwiOiBcIkBwYWNrYWdlcy9hbmltYWxlc2VcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwidmVyc2lvblwiOiBcIjAuMC4wXCIsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcImZpbGVzXCI6IFtcbiAgICBcIi4vZGlzdFwiXG4gIF0sXG4gIFwibWFpblwiOiBcIi4vZGlzdC9tYWluLmNqc1wiLFxuICBcIm1vZHVsZVwiOiBcIi4vZGlzdC9tYWluLmVzLmpzXCIsXG4gIFwidHlwZXNcIjogXCIuL2Rpc3QvYW5pbWFsZXNlLmQudHNcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImRldlwiOiBcInZpdGVcIixcbiAgICBcImJ1aWxkXCI6IFwidHNjICYmIHZpdGUgYnVpbGRcIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjQuOS4zXCIsXG4gICAgXCJ2aXRlXCI6IFwiXjQuMC4wXCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwidml0ZS1wbHVnaW4tZHRzXCI6IFwiXjEuNy4xXCJcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxXdXJpa29cXFxcRGVza3RvcFxcXFxkZXZcXFxcbmhzXFxcXGl6YWJlbGFcXFxccGFja2FnZXNcXFxcYW5pbWFsZXNlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxXdXJpa29cXFxcRGVza3RvcFxcXFxkZXZcXFxcbmhzXFxcXGl6YWJlbGFcXFxccGFja2FnZXNcXFxcYW5pbWFsZXNlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9XdXJpa28vRGVza3RvcC9kZXYvbmhzL2l6YWJlbGEvcGFja2FnZXMvYW5pbWFsZXNlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXG5cbmNvbnN0IHBrZyA9IHJlcXVpcmUoJy4vcGFja2FnZS5qc29uJylcblxuY29uc3QgZXh0ZXJuYWxQYWNrYWdlcyA9IFtcbiAgICAuLi5PYmplY3Qua2V5cyhwa2cuZGVwZW5kZW5jaWVzIHx8IHt9KSxcbiAgICAuLi5PYmplY3Qua2V5cyhwa2cucGVlckRlcGVuZGVuY2llcyB8fCB7fSksXG5dXG5jb25zdCBleHRlcm5hbHMgPSBleHRlcm5hbFBhY2thZ2VzLm1hcChcbiAgICAocGFja2FnZU5hbWUpID0+IG5ldyBSZWdFeHAoYF4ke3BhY2thZ2VOYW1lfShcXC8uKik/YCksXG4pXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgZHRzKCksXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOiB7XG4gICAgICAgICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9tYWluLnRzJyksXG4gICAgICAgICAgICBuYW1lOiAnbWFpbicsXG4gICAgICAgICAgICBmb3JtYXRzOiBbJ2NqcycsICdlcyddLFxuICAgICAgICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+XG4gICAgICAgICAgICAgICAgYG1haW4uJHtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2pzOiAnY2pzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzOiAnZXMuanMnLFxuICAgICAgICAgICAgICAgICAgICB9W2Zvcm1hdF1cbiAgICAgICAgICAgICAgICB9YCxcbiAgICAgICAgfSxcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgZXh0ZXJuYWw6IGV4dGVybmFscyxcbiAgICAgICAgfSxcbiAgICB9LFxufSkpXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUNFLE1BQVE7QUFBQSxNQUNSLFNBQVc7QUFBQSxNQUNYLFNBQVc7QUFBQSxNQUNYLE1BQVE7QUFBQSxNQUNSLE9BQVM7QUFBQSxRQUNQO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBUTtBQUFBLE1BQ1IsUUFBVTtBQUFBLE1BQ1YsT0FBUztBQUFBLE1BQ1QsU0FBVztBQUFBLFFBQ1QsS0FBTztBQUFBLFFBQ1AsT0FBUztBQUFBLFFBQ1QsU0FBVztBQUFBLE1BQ2I7QUFBQSxNQUNBLGlCQUFtQjtBQUFBLFFBQ2pCLFlBQWM7QUFBQSxRQUNkLE1BQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxjQUFnQjtBQUFBLFFBQ2QsbUJBQW1CO0FBQUEsTUFDckI7QUFBQSxJQUNGO0FBQUE7QUFBQTs7O0FDdkJrWCxTQUFTLG9CQUFvQjtBQUMvWSxTQUFTLGVBQWU7QUFDeEIsT0FBTyxTQUFTO0FBRmhCLElBQU0sbUNBQW1DO0FBSXpDLElBQU0sTUFBTTtBQUVaLElBQU0sbUJBQW1CO0FBQUEsRUFDckIsR0FBRyxPQUFPLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQUEsRUFDckMsR0FBRyxPQUFPLEtBQUssSUFBSSxvQkFBb0IsQ0FBQyxDQUFDO0FBQzdDO0FBQ0EsSUFBTSxZQUFZLGlCQUFpQjtBQUFBLEVBQy9CLENBQUMsZ0JBQWdCLElBQUksT0FBTyxJQUFJLG1CQUFvQjtBQUN4RDtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDdkMsU0FBUztBQUFBLElBQ0wsSUFBSTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDakM7QUFBQSxFQUNKO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxLQUFLO0FBQUEsTUFDRCxPQUFPLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQ3ZDLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxPQUFPLElBQUk7QUFBQSxNQUNyQixVQUFVLENBQUMsV0FDUCxRQUNJO0FBQUEsUUFDSSxLQUFLO0FBQUEsUUFDTCxJQUFJO0FBQUEsTUFDUixFQUFFLE1BQU07QUFBQSxJQUVwQjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ1gsVUFBVTtBQUFBLElBQ2Q7QUFBQSxFQUNKO0FBQ0osRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K

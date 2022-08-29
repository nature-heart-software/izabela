const { createApp, h } = require("vue");
const { createPinia, defineStore } = require("pinia");
const mitt = require("mitt");
const { watch } = require("@vue-reactivity/watch");

const emitter = mitt();
const stores = new Map();

const plugin = ({ store }) => {
  stores.set(store.$id, store);
  store.$onAction(({ name, store, args }) => {
    if (store.$id === "main") {
      console.log(
        `[${store.$id}] Start "${name}" with params [${args.join(", ")}].`
      );
      emitter.emit("action", {
        name,
        storeId: store.$id,
        args
      });
    } else {
      console.log(
        `[${store.$id}] Start "${name}" with params [${args
          .map(JSON.stringify)
          .join(", ")}].`
      );
    }
  });
}

createApp(h({})).use(createPinia().use(plugin));

const storeState = {
  state: () => ({ count: 0, name: "Eduardo" }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++;
    }
  }
};

// Both must be in sync
const useMainStore = defineStore("main", storeState);
const useRendererStore = defineStore("renderer", storeState);

const mainStore = useMainStore();
const rendererStore = useRendererStore();

setInterval(() => {
  console.log("-------------------");
  console.log("[main]", mainStore.count);
  console.log("[renderer]", rendererStore.count);
}, 1000);

setInterval(() => {
  mainStore.increment();
}, 1000);

emitter.on("action", ({ name, storeId, args }) => {
  // in other process
  // const store = stores.get(storeId);
  const store = stores.get("renderer");
  if (store && store[name] && typeof store[name] === "function") {
    store[name](...args, { trigger: "sync" });
  }
});

watch(
  () => rendererStore.doubleCount,
  () => {
    console.log("Reactivity still works");
  }
);

// Homepage motion entry: register scenes, then start the shared clock.
import { runScenes, scene, startMotion } from "./core";
import "./scenes";
import "./hero-gl";
import "./skyline";

// Phone-only libraries are loaded on phones and nowhere else.
scene(async () => {
  if (matchMedia("(max-width: 720px)").matches) (await import("./phone")).setup();
});

startMotion();
void runScenes();

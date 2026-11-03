// Homepage motion entry: register scenes, then start the shared clock.
import { coarsePointer, runScenes, scene, startMotion, touchLayout } from "./core";
import "./scenes";
import "./hero-gl";
import "./skyline";

// Touch libraries are loaded on touch screens and nowhere else.
scene(async () => {
  if (touchLayout || coarsePointer) (await import("./phone")).setup();
});

startMotion();
void runScenes();

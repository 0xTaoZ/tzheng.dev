// Homepage motion entry: register scenes, then start the shared clock.
import { runScenes, startMotion } from "./core";
import "./scenes";
import "./hero-gl";
import "./skyline";

startMotion();
void runScenes();

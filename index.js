import Scene from "./src/css/Scene";
import {EASE, EASE_IN, EASE_OUT, EASE_IN_OUT} from "./src/consts";
import cubicBezier from "./src/cubicBezier";

Scene.EASE = EASE;
Scene.EASE_IN = EASE_IN;
Scene.EASE_OUT = EASE_OUT;
Scene.EASE_IN_OUT = EASE_IN_OUT;
Scene.cubicBezier = cubicBezier;

module.exports = Scene;

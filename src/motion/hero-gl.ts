// Hero backdrop in a fragment shader: the Earth photograph drifts slowly,
// the pointer lights up the city lights beneath it like a torch, and stars
// twinkle in the dark sky. Raw WebGL, no library; the CSS background stays
// in place if WebGL is unavailable.
import { finePointer, reducedMotion, scene } from "./core";

const vertex = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uTime;
uniform float uScroll;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 coverUv(vec2 uv) {
  float screen = uResolution.x / uResolution.y;
  float image = uImageSize.x / uImageSize.y;
  vec2 scale = screen > image ? vec2(1.0, image / screen) : vec2(screen / image, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

  // Slow drift plus a gentle push-in while the page scrolls.
  float zoom = 1.04 + uScroll * 0.12;
  vec2 drift = vec2(sin(uTime * 0.03) * 0.012, cos(uTime * 0.021) * 0.006);
  vec2 imageUv = coverUv((uv - 0.5) / zoom + 0.5 + drift);
  imageUv.y = 1.0 - imageUv.y;
  vec3 earth = texture2D(uImage, imageUv).rgb;

  // Torch: city lights brighten within a soft radius around the pointer.
  float distanceToPointer = length((uv - uPointer) * aspect);
  float torch = smoothstep(0.38, 0.0, distanceToPointer) * uPointerStrength;
  float lights = smoothstep(0.18, 0.7, max(earth.r, max(earth.g, earth.b)));
  vec3 color = earth * (0.95 + torch * 0.8) + vec3(1.0, 0.82, 0.5) * lights * torch * 0.9;

  // Stars in the dark sky above the horizon.
  vec2 grid = uv * aspect * 140.0;
  vec2 cell = floor(grid);
  float star = step(0.9965, hash(cell));
  float twinkle = 0.5 + 0.5 * sin(uTime * (1.0 + hash(cell + 3.1) * 3.0) + hash(cell) * 6.2831);
  float core = smoothstep(0.38, 0.0, length(fract(grid) - 0.5));
  float sky = smoothstep(0.08, 0.0, dot(earth, vec3(0.3333)));
  color += vec3(0.9, 0.95, 1.0) * star * twinkle * core * sky * 1.2;

  // Vignette and fine grain keep it photographic rather than flat.
  float vignette = smoothstep(1.25, 0.25, length((uv - vec2(0.55, 0.5)) * vec2(1.1, 1.3)));
  color *= mix(0.55, 1.0, vignette);
  color += (hash(uv * uResolution + uTime) - 0.5) * 0.025;

  gl_FragColor = vec4(color, 1.0);
}`;

scene(async () => {
  const backdrop = document.querySelector<HTMLElement>(".hero-backdrop");
  if (!backdrop || reducedMotion) return;
  const canvas = document.createElement("canvas");
  canvas.className = "hero-gl";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const image = new Image();
  image.decoding = "async";
  image.src = innerWidth > 1200 ? "/img/earth-2200.jpg" : "/img/earth-1100.jpg";
  await image.decode();

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    resolution: uniform("uResolution"),
    imageSize: uniform("uImageSize"),
    pointer: uniform("uPointer"),
    strength: uniform("uPointerStrength"),
    time: uniform("uTime"),
    scroll: uniform("uScroll"),
  };
  gl.uniform2f(u.imageSize, image.naturalWidth, image.naturalHeight);

  const pointer = { x: 0.62, y: 0.42, tx: 0.62, ty: 0.42, strength: 0, target: finePointer ? 0 : 0.35 };
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(backdrop.clientWidth * ratio);
    canvas.height = Math.round(backdrop.clientHeight * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  const hero = backdrop.closest<HTMLElement>(".hero")!;
  if (finePointer) {
    hero.addEventListener("pointermove", (event) => {
      const rect = backdrop.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
      pointer.target = 1;
    });
    hero.addEventListener("pointerleave", () => (pointer.target = 0));
  }

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestAnimationFrame(frame);
  }).observe(hero);

  const start = performance.now();
  function frame(now: number) {
    if (!visible || document.hidden) return;
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    pointer.strength += (pointer.target - pointer.strength) * 0.05;
    gl!.uniform2f(u.pointer, pointer.x, pointer.y);
    gl!.uniform1f(u.strength, pointer.strength);
    gl!.uniform1f(u.time, (now - start) / 1000);
    gl!.uniform1f(u.scroll, Math.min(1, scrollY / innerHeight));
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => !document.hidden && requestAnimationFrame(frame));

  backdrop.prepend(canvas);
  requestAnimationFrame((now) => {
    frame(now);
    backdrop.classList.add("has-gl");
  });
});

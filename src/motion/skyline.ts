// Contribution skyline: a year of public GitHub contributions as instanced
// 3D bars. Three.js is imported only when the section approaches the
// viewport; the server-rendered heatmap stays visible as the fallback.
import { finePointer, gsap, lowPower, reducedMotion, scene, whenNear } from "./core";

type Day = { date: string; count: number };

scene(() => {
  const host = document.querySelector<HTMLElement>("[data-skyline]");
  if (!host) return;
  const days: Day[] = JSON.parse(host.dataset.days ?? "[]");
  if (!days.length || lowPower) return;
  whenNear(host, () => void mount(host, days).catch((error) => console.warn("skyline", error)));
});

async function mount(host: HTMLElement, days: Day[]) {
  const THREE = await import("three");
  const stage = host.querySelector<HTMLElement>(".skyline-stage")!;
  const tooltip = host.querySelector<HTMLElement>(".skyline-tip")!;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");

  const scene3d = new THREE.Scene();
  scene3d.fog = new THREE.Fog(0x07090c, 38, 90);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  // Layout: weeks run along x, weekdays along z, like the calendar on GitHub.
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const offset = first.getUTCDay();
  const weeks = Math.ceil((days.length + offset) / 7);
  const max = Math.max(1, ...days.map((day) => day.count));
  const size = 0.82;
  const geometry = new THREE.BoxGeometry(size, 1, size);
  geometry.translate(0, 0.5, 0);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 });
  const mesh = new THREE.InstancedMesh(geometry, material, days.length);
  const base = new THREE.Color(0x15201b);
  const low = new THREE.Color(0x1e6b43);
  const high = new THREE.Color(0x39ff88);
  const matrix = new THREE.Matrix4();
  const heights: number[] = [];
  days.forEach((day, index) => {
    const slot = index + offset;
    const x = Math.floor(slot / 7) - weeks / 2;
    const z = (slot % 7) - 3;
    const height = day.count ? 0.4 + Math.log2(day.count + 1) * 1.15 : 0.12;
    heights.push(height);
    matrix.makeScale(1, height, 1).setPosition(x, 0, z);
    mesh.setMatrixAt(index, matrix);
    const t = day.count / max;
    mesh.setColorAt(index, day.count ? low.clone().lerp(high, Math.sqrt(t)) : base);
  });
  scene3d.add(mesh);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(weeks + 6, 14),
    new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene3d.add(floor);

  scene3d.add(new THREE.HemisphereLight(0xbfd9ff, 0x07090c, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-18, 30, 22);
  scene3d.add(sun);
  const rim = new THREE.DirectionalLight(0x39ff88, 0.6);
  rim.position.set(20, 8, -20);
  scene3d.add(rim);

  // Camera orbits the skyline; pointer drag turns it, idle time turns it slowly.
  const view = { angle: -0.42, tilt: 0.5, targetAngle: -0.42, targetTilt: 0.5, grow: reducedMotion ? 1 : 0 };
  const radius = weeks * 0.6;
  const resize = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize, { passive: true });
  stage.append(canvas);
  host.classList.add("has-webgl");

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idle = 0;
  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", () => (dragging = false));
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    tooltip.style.transform = `translate(${event.clientX - rect.left + 14}px, ${event.clientY - rect.top - 10}px)`;
    if (!dragging) return;
    idle = 0;
    view.targetAngle -= (event.clientX - lastX) * 0.006;
    view.targetTilt = gsap.utils.clamp(0.18, 0.9, view.targetTilt + (event.clientY - lastY) * 0.004);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  canvas.addEventListener("pointerleave", () => {
    ndc.set(9, 9);
    tooltip.hidden = true;
  });

  if (!reducedMotion) gsap.to(view, { grow: 1, duration: 2.2, ease: "expo.out" });

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) renderer.setAnimationLoop(render);
    else renderer.setAnimationLoop(null);
  }).observe(host);

  const dummy = new THREE.Matrix4();
  let hovered = -1;
  function render() {
    if (!visible) return;
    idle += 1;
    if (!dragging && idle > 90 && !reducedMotion) view.targetAngle += 0.0009;
    view.angle += (view.targetAngle - view.angle) * 0.06;
    view.tilt += (view.targetTilt - view.tilt) * 0.06;
    camera.position.set(Math.sin(view.angle) * radius, Math.sin(view.tilt) * radius * 0.75, Math.cos(view.angle) * radius);
    camera.lookAt(0, 0.8, 0);

    if (view.grow < 1) {
      days.forEach((_, index) => {
        const slot = index + offset;
        const delay = (Math.floor(slot / 7) / weeks) * 0.5;
        const progress = gsap.utils.clamp(0, 1, (view.grow - delay) / 0.5);
        dummy.makeScale(1, Math.max(0.001, heights[index] * progress), 1).setPosition(Math.floor(slot / 7) - weeks / 2, 0, (slot % 7) - 3);
        mesh.setMatrixAt(index, dummy);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (finePointer && !dragging) {
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(mesh)[0];
      const index = hit?.instanceId ?? -1;
      if (index !== hovered) {
        hovered = index;
        tooltip.hidden = index < 0;
        if (index >= 0) {
          const day = days[index];
          const label = new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
          tooltip.textContent = `${day.count} contribution${day.count === 1 ? "" : "s"} · ${label}`;
        }
      }
    }
    renderer.render(scene3d, camera);
  }
  renderer.setAnimationLoop(render);
}

import * as THREE from 'three';

// The animated 3D "learning universe" of the home page (same scene as the old client), without React.
// startLearningScene() draws it into a container and returns a function that stops and frees it.

const CAMERA = { fov: 45, near: 0.1, far: 100, y: 0.4, z: 7 } as const;
const MAX_PIXEL_RATIO = 2;
const PARTICLE_COUNT = 120;
const PARTICLE_SPREAD = { x: 7, y: 4.5, z: 3 } as const;
const FRAME_STEP = 0.01;

interface OrbitItem {
  mesh: THREE.Mesh;
  radius: number;
  speed: number;
}

interface FloatingShape {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  speed: number;
}

const glowMaterial = (
  color: number,
  emissive: number,
  intensity: number,
): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.2 });

const addLights = (scene: THREE.Scene): void => {
  const cool = new THREE.PointLight(0x67e8f9, 86, 16);
  cool.position.set(3, 3, 4);
  const warm = new THREE.PointLight(0xffc857, 44, 14);
  warm.position.set(-3, -2, 3);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8), cool, warm);
};

const createCore = (): THREE.Mesh =>
  new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.38, 2),
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.42,
      roughness: 0.16,
      emissive: 0x67e8f9,
      emissiveIntensity: 0.2,
    }),
  );

const createRings = (): THREE.Mesh[] => {
  const material = (): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      color: 0xb6f3ff,
      metalness: 0.22,
      roughness: 0.18,
      transparent: true,
      opacity: 0.86,
    });
  const specs = [
    { radius: 2.35, tube: 0.028, x: Math.PI / 2.8, y: 0, z: 0 },
    { radius: 3.05, tube: 0.02, x: Math.PI / 2.15, y: Math.PI / 7, z: 0 },
    { radius: 3.55, tube: 0.016, x: Math.PI / 1.8, y: 0, z: Math.PI / 8 },
  ];
  return specs.map((spec) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 12, 160),
      material(),
    );
    ring.rotation.set(spec.x, spec.y, spec.z);
    return ring;
  });
};

const createOrbitItems = (): OrbitItem[] =>
  [
    { color: 0x67e8f9, radius: 2.35, size: 0.18, speed: 0.82 },
    { color: 0xfb7185, radius: 3.05, size: 0.15, speed: -0.62 },
    { color: 0xbef264, radius: 3.55, size: 0.14, speed: 0.5 },
    { color: 0xffc857, radius: 2.7, size: 0.12, speed: -0.9 },
  ].map((item) => ({
    mesh: new THREE.Mesh(
      new THREE.SphereGeometry(item.size, 24, 24),
      glowMaterial(item.color, item.color, 0.35),
    ),
    radius: item.radius,
    speed: item.speed,
  }));

const createFloatingShapes = (): FloatingShape[] => [
  {
    mesh: new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.34, 0.34),
      glowMaterial(0xbef264, 0x84cc16, 0.16),
    ),
    base: new THREE.Vector3(-3.6, 1.25, -0.35),
    speed: 0.85,
  },
  {
    mesh: new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      glowMaterial(0xffc857, 0xfb7185, 0.18),
    ),
    base: new THREE.Vector3(3.45, 1.05, -0.25),
    speed: 0.72,
  },
  {
    mesh: new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.2, 0.055, 64, 10),
      glowMaterial(0x67e8f9, 0xbef264, 0.12),
    ),
    base: new THREE.Vector3(-2.95, -1.35, 0.1),
    speed: 0.95,
  },
];

const createParticles = (): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * PARTICLE_SPREAD.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * PARTICLE_SPREAD.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.03, transparent: true, opacity: 0.78 }),
  );
};

/** Frees the GPU memory of every mesh and point cloud in the scene. */
const disposeScene = (scene: THREE.Scene): void => {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      const drawable = object as THREE.Mesh;
      drawable.geometry.dispose();
      const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
      materials.forEach((material) => {
        material.dispose();
      });
    }
  });
};

interface SceneParts {
  core: THREE.Mesh;
  rings: THREE.Mesh[];
  orbit: OrbitItem[];
  shapes: FloatingShape[];
  particles: THREE.Points;
}

/** Moves everything one frame further. */
const step = (parts: SceneParts, frame: number): void => {
  parts.core.rotation.x += 0.004;
  parts.core.rotation.y += 0.006;
  const ringSpeeds = [0.003, -0.0024, 0.0018];
  parts.rings.forEach((ring, index) => {
    ring.rotation.z += ringSpeeds[index] ?? 0;
  });
  parts.particles.rotation.y += 0.0009;
  parts.shapes.forEach((item, index) => {
    item.mesh.position.set(
      item.base.x,
      item.base.y + Math.sin(frame * item.speed + index) * 0.18,
      item.base.z,
    );
    item.mesh.rotation.x += 0.006 + index * 0.001;
    item.mesh.rotation.y += 0.008 + index * 0.001;
  });
  parts.orbit.forEach((item, index) => {
    const angle = frame * item.speed + index * 1.7;
    item.mesh.position.set(
      Math.cos(angle) * item.radius,
      Math.sin(angle * 1.1) * 0.58,
      Math.sin(angle) * item.radius * 0.36,
    );
  });
};

const createRenderer = (): THREE.WebGLRenderer | null => {
  try {
    return new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
};

/** Draws the animated scene into `mount` (sized to it); returns the cleanup function. */
export const startLearningScene = (mount: HTMLElement): (() => void) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.set(0, CAMERA.y, CAMERA.z);
  const renderer = createRenderer();
  // No WebGL (old device, disabled GPU): the scene is decorative, so simply leave it out
  if (!renderer) return () => undefined;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  addLights(scene);
  const parts: SceneParts = {
    core: createCore(),
    rings: createRings(),
    orbit: createOrbitItems(),
    shapes: createFloatingShapes(),
    particles: createParticles(),
  };
  scene.add(
    parts.core,
    parts.particles,
    ...parts.rings,
    ...parts.orbit.map((o) => o.mesh),
    ...parts.shapes.map((s) => s.mesh),
  );

  const resize = (): void => {
    const { width, height } = mount.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();

  let frame = 0;
  let animationId = 0;
  const animate = (): void => {
    frame += FRAME_STEP;
    step(parts, frame);
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };
  animate();

  return () => {
    cancelAnimationFrame(animationId);
    observer.disconnect();
    mount.removeChild(renderer.domElement);
    disposeScene(scene);
    renderer.dispose();
  };
};

import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const SNAP_W = 512;
const SNAP_H = 512;

/** Matches the cream placeholder card */
const BG = 0xfaf9f6;

const CACHE_VER = 'head-circle-v1';
const cache = new Map<string, string>();

function cacheKey(glbUrl: string) {
  return `${glbUrl}#${CACHE_VER}`;
}

/**
 * Renders one frame of a GLB into a PNG data URL (tight head framing for circular crop).
 * Cached per URL so repeat mounts are instant.
 */
export async function getGlbSnapshotDataUrl(glbUrl: string): Promise<string | null> {
  const snapshotKey = cacheKey(glbUrl);
  const hit = cache.get(snapshotKey);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = SNAP_W;
  canvas.height = SNAP_H;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(SNAP_W, SNAP_H, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(0.4, 1.2, 0.9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8e4dc, 0.35);
  fill.position.set(-0.8, 0.3, 0.5);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(26, SNAP_W / SNAP_H, 0.02, 50);

  try {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      new GLTFLoader().load(glbUrl, resolve, undefined, reject);
    });

    const root = gltf.scene;
    scene.add(root);

    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    if (!size.lengthSq()) {
      renderer.dispose();
      return null;
    }

    // Head portrait — center on the face (upper third of model bounds)
    const target = new THREE.Vector3(center.x, center.y + size.y * 0.38, center.z);
    const dist = Math.max(size.x, size.z) * 0.88;
    camera.position.set(target.x, target.y - size.y * 0.02, target.z + dist);
    camera.near = Math.max(0.01, dist / 200);
    camera.far = dist * 10;
    camera.updateProjectionMatrix();
    camera.lookAt(target);

    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL("image/png");

    root.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach(disposeMat);
        else disposeMat(m);
      }
    });

    cache.set(snapshotKey, dataUrl);
    return dataUrl;
  } catch {
    return null;
  } finally {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
}

function disposeMat(mat: THREE.Material) {
  mat.dispose?.();
  const m = mat as THREE.MeshStandardMaterial;
  m.map?.dispose();
  m.normalMap?.dispose();
  m.roughnessMap?.dispose();
  m.metalnessMap?.dispose();
  m.emissiveMap?.dispose();
}

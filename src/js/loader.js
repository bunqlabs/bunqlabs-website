import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function preloadAssets(urls = [], onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    if (urls.length === 0) { onProgress(1); return resolve(); }

    const manager = new THREE.LoadingManager();
    const gltfLoader = new GLTFLoader(manager);
    const texLoader  = new THREE.TextureLoader(manager);

    manager.onProgress = (_url, loaded, total) => onProgress(loaded / total);
    manager.onLoad = resolve;
    manager.onError = reject;

    urls.forEach(url => {
      if (url.match(/\.gl[tb]f$/i)) gltfLoader.load(url, () => {});
      else texLoader.load(url, () => {});
    });
  });
}

import * as THREE from 'three';
import { animateCamera } from './transition.js';

export default class SceneManager {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera   = camera;
    this.scene    = new THREE.Scene();
    this.pages    = {};
    this._lookTarget = new THREE.Vector3();
  }
  addPage(name, group, position) {
    group.position.copy(position);
    this.pages[name] = group;
    this.scene.add(group);
  }
  goTo(page, duration = 1.2) {
    const target = this.pages[page];
    if (!target) return console.warn(`missing page ${page}`);
    const fromPos  = this.camera.position.clone();
    const toPos    = target.position.clone().add(new THREE.Vector3(0, 0, 15));
    const fromLook = this._lookTarget.clone();
    const toLook   = target.position.clone();
    animateCamera(this.camera, this._lookTarget, { fromPos, toPos, fromLook, toLook, duration });
  }
  start() {
    const loop = () => {
      this.camera.lookAt(this._lookTarget);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    loop();
  }
}

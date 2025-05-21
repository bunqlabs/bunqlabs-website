import * as THREE from 'three';
import { animateCamera } from './transition.js';

export default class SceneManager {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera   = camera;
    this.scene    = new THREE.Scene();
    this.pages    = {};
    this._lookTarget = new THREE.Vector3();

    // ─── persistent floor / wire‑box ───────────────────────────────
    const size = 30;           // half extent of the box
    const divisions = 6;       // grid density

    // ground grid
    const grid = new THREE.GridHelper(size * 2, divisions, 0x333333, 0x333333);
    grid.material.opacity = 0.6;
    grid.material.transparent = true;
    this.scene.add(grid);

    // 3 wireframe walls
    const wallGeo = new THREE.PlaneGeometry(size * 2, size * 2, divisions, divisions);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });
    const makeWall = () => new THREE.LineSegments(new THREE.WireframeGeometry(wallGeo), wireMat);

    const back = makeWall();
    back.position.set(0, size, -size);
    back.rotation.x = Math.PI / 2;

    const left = makeWall();
    left.position.set(-size, size, 0);
    left.rotation.set(Math.PI / 2, Math.PI / 2, 0);

    const right = makeWall();
    right.position.set(size, size, 0);
    right.rotation.set(Math.PI / 2, -Math.PI / 2, 0);

    this.scene.add(back, left, right);
    // ───────────────────────────────────────────────────────────────
  }

  addPage(name, group, position) {
    group.position.copy(position);
    this.pages[name] = group;
    this.scene.add(group);
  }

  goTo(page, duration = 1.2) {
    const target = this.pages[page];
    if (!target) { console.warn(`missing page ${page}`); return; }

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


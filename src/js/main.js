import * as THREE from 'three';
import LoaderScreen from './components/LoaderScreen.js';
import { initThree } from './engine/index.js';
import SceneManager from './engine/sceneManager.js';
import Router from './router.js';

// page factories
import createHome    from './pages/home.js';
import createAbout   from './pages/about.js';
import createContact from './pages/contact.js';

(async function bootstrap() {
  /* 1. Show loader overlay */
  const loaderUI = new LoaderScreen();
  
  /* 5. Hide loader once everything is ready */
await new Promise(r => setTimeout(r, 1000));   // 0.5 s “breathing” room
loaderUI.hide();


  /* 2. Set up Three & SceneManager immediately (canvas hidden under overlay) */
  const { renderer, camera } = initThree();
  const manager = new SceneManager(renderer, camera);

  /* 3. Build page scenes in the background and update a simple counter‑based progress */
  const pages = [
    { name: 'home',    factory: createHome,    pos: new THREE.Vector3(0, 0, 0) },
    { name: 'about',   factory: createAbout,   pos: new THREE.Vector3(25, 0, 0) },
    { name: 'contact', factory: createContact, pos: new THREE.Vector3(50, 0, 0) }
  ];

  let loaded = 0;
  const total = pages.length;

  for (const p of pages) {
    // If a factory is async (e.g. loads GLTF), await it; else it's immediate
    const group = await Promise.resolve(p.factory());
    manager.addPage(p.name, group, p.pos);
    loaded++; loaderUI.setProgress(loaded / total);
  }

  /* 4. Global lights & start the render loop (still behind overlay) */
  manager.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(5, 10, 8); manager.scene.add(d);
  manager.start();

  /* 5. Hide loader once everything is ready */
  loaderUI.hide();

  /* 6. Wire up raycast navigation */
  let currentPage = 'home';
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  window.addEventListener('pointerdown', e => {
    pointer.x =  (e.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(manager.pages[currentPage].children, true);
    if (hits.length) {
      const target = hits[0].object.userData.target;
      if (target) Router.navigate(target);
    }
  });

  Router.addEventListener('navigate', ({ detail: { page } }) => {
    if (page !== currentPage) {
      manager.goTo(page);
      currentPage = page;
    }
  });

  Router.refresh();
})();

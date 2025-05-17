import * as THREE from 'three';

export default function createAbout() {
  const group = new THREE.Group();

  // two cylinders
  const cylA = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 4, 32),
    new THREE.MeshStandardMaterial({ color: 0xff8800 })
  );
  cylA.position.set(-3, 0, 0);

  const cylB = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 4, 32),
    new THREE.MeshStandardMaterial({ color: 0x00ccff })
  );
  cylB.position.set(3, 0, 0);

  // common sphere → Home
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  sphere.position.set(0, 4, 0);
  sphere.userData.target = 'home';

  group.add(cylA, cylB, sphere);
  return group;
}

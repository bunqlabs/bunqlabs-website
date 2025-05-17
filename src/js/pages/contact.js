import * as THREE from 'three';

export default function createContact() {
  const group = new THREE.Group();

  // single cone
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3, 6, 32),
    new THREE.MeshStandardMaterial({ color: 0x88ff88 })
  );
  cone.position.set(0, 0, 0);

  // common sphere → Home
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  sphere.position.set(0, 4, 0);
  sphere.userData.target = 'home';

  group.add(cone, sphere);
  return group;
}

import * as THREE from 'three';

export default function createHome() {
  const group = new THREE.Group();

  // - left cube → About
  const cubeLeft = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0xff5555 })
  );
  cubeLeft.position.set(-5, 0, 0);
  cubeLeft.userData.target = 'about';

  // - right cube → Contact
  const cubeRight = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0x5555ff })
  );
  cubeRight.position.set(5, 0, 0);
  cubeRight.userData.target = 'contact';

  // - common sphere → stays Home
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  sphere.position.set(0, 4, 0);
  sphere.userData.target = 'home';

  group.add(cubeLeft, cubeRight, sphere);
  return group;
}

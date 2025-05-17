import { gsap } from 'gsap';
import * as THREE from 'three';

/**
 * Animate camera position & look‑at.
 * Cancels any ongoing tweens on the same targets so that
 * rapid page switches still produce the latest motion.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Vector3} lookTarget – mutable vector updated each frame
 * @param {Object} opts
 * @param {THREE.Vector3} opts.fromPos
 * @param {THREE.Vector3} opts.toPos
 * @param {THREE.Vector3} [opts.fromLook]
 * @param {THREE.Vector3} [opts.toLook]
 * @param {number}        [opts.duration]
 */
export function animateCamera(camera, lookTarget, {
  fromPos,
  toPos,
  fromLook = lookTarget.clone(),
  toLook   = lookTarget.clone(),
  duration = 1.2
} = {}) {
  // cancel any tweens currently acting on these objects
  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(lookTarget);

  // set starting state
  camera.position.copy(fromPos);
  lookTarget.copy(fromLook);

  // tween camera position
  gsap.to(camera.position, {
    x: toPos.x,
    y: toPos.y,
    z: toPos.z,
    duration,
    ease: 'power2.inOut'
  });

  // tween look‑at target
  const tmp = fromLook.clone();
  gsap.to(tmp, {
    x: toLook.x,
    y: toLook.y,
    z: toLook.z,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => lookTarget.copy(tmp)
  });
}

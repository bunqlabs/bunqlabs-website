/****************************************************
 *                                                  *
 *                CONFIGURATION                     *
 *                                                  *
 ****************************************************/
const CONFIG = {
  // Scene and Animation Settings
  radius: 1.343,
  bendAmount: 1,
  scrollSpeed: 0.0007,
  scrollLerp: 0.07,
  initialSpinDelaySec: 0.5,
  slowDownDurationSec: 3.5,
  initialSpinSpeedRPM: 480,
  finalSpinSpeedRPM: 3,
  planeAnimationDuration: 3,
  fadeDuration: 0.5,
  wheelRevealThreshold: 0.7,
  initialLoaderDelaySec: 1,
  zIndexDelaySec: 2,

  // Rotation Settings
  rotationSpeedX: 0.001,
  rotationSpeedY: 0.0,
  rotationSpeedZ: 0.0,

  // Light Settings
  lightPosition: [2, 1, 3],
  lightColor: [1, 1, 1],
  lightIntensity: 1.5,
  lightDistance: 10,

  // Material Configuration
  materials: {
    image: {
      color: [1, 1, 1],
      roughness: 0.5,
      metalness: 0.0,
      emissive: [0, 0, 0],
      emissiveIntensity: 0.0,
      opacity: 1.0,
      bodyColor: "#f0f0f0",
      ambientColor: [1, 1, 1],
      ambientIntensity: 0.5,
      pointLightIntensity: 1.1,
    },
    black: {
      texture:
        "https://cdn.prod.website-files.com/68773efc3c39d3498c55c910/68db7d7600fac148200e072a_dark.jpg",
      color: [1, 1, 1],
      roughness: 0.7,
      metalness: 0.1,
      emissive: [0, 0, 0],
      emissiveIntensity: 0.0,
      opacity: 1.0,
      bodyColor: "#000000",
      ambientColor: [0.2, 0.2, 0.2],
      ambientIntensity: 0.3,
      pointLightIntensity: 1.5,
    },
    white: {
      texture:
        "https://cdn.prod.website-files.com/68773efc3c39d3498c55c910/68db80665651ac8758b130f4_white.jpg",
      color: [1, 1, 1],
      roughness: 0.7,
      metalness: 0.1,
      emissive: [0, 0, 0],
      emissiveIntensity: 0.0,
      opacity: 1.0,
      bodyColor: "#ffffff",
      ambientColor: [1, 1, 1],
      ambientIntensity: 0.8,
      pointLightIntensity: 0.5,
    },
    red: {
      texture:
        "https://cdn.prod.website-files.com/68773efc3c39d3498c55c910/68dbb8c003f60271d2610ad1_04e4ecdfcd133584ca6b4f7932d8e661_red.jpg",
      color: [1, 1, 1],
      roughness: 0.3,
      metalness: 0.2,
      emissive: [0, 0, 0],
      emissiveIntensity: 0,
      opacity: 1.0,
      bodyColor: "#ffffff",
      ambientColor: [1, 1, 1],
      ambientIntensity: 0.7,
      pointLightIntensity: 0.5,
    },
  },

  // Transition Settings
  transitionDuration: 1,
  transitionEase: "power2.inOut",

  smoothing: {
    minHoldMs: 180, // section must remain active for this long
    overwrite: "auto", // GSAP will smoothly retarget in-flight tweens
  },
};

/****************************************************
 *                                                  *
 *                   HELPERS                        *
 *                                                  *
 ****************************************************/
const RPM_TO_RAD = (r) => (r * 2 * Math.PI) / 60;

// Create a solid color texture for fallback
function createSolidColorTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${Math.floor(color[0] * 255)}, ${Math.floor(
    color[1] * 255
  )}, ${Math.floor(color[2] * 255)})`;
  ctx.fillRect(0, 0, 1, 1);
  return new THREE.CanvasTexture(canvas);
}

/****************************************************
 *                                                  *
 *                CORE OBJECTS                      *
 *                                                  *
 ****************************************************/
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  90,
  innerWidth / innerHeight,
  0.1,
  100
);
camera.position.z = 3.3;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
if ("outputColorSpace" in renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const wrapper = document.getElementById("home-hero-3d");
renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
wrapper.appendChild(renderer.domElement);

const pointLight = new THREE.PointLight(
  new THREE.Color(...CONFIG.lightColor),
  CONFIG.lightIntensity,
  CONFIG.lightDistance
);
pointLight.position.set(...CONFIG.lightPosition);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(
  new THREE.Color(...CONFIG.materials.image.ambientColor),
  CONFIG.materials.image.ambientIntensity
);
scene.add(ambientLight);

/****************************************************
 *                                                  *
 *                   SHADERS                        *
 *                                                  *
 ****************************************************/
const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

const fragmentShader = `
        uniform sampler2D uTexture;
        uniform sampler2D uSecondaryTexture;
        uniform float uTextureMix;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform float uLightIntensity;
        uniform vec3 uAmbientColor;
        uniform float uAmbientIntensity;
        uniform float uRoughness;
        uniform float uMetalness;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec4 texColor = texture2D(uTexture, vUv);
          vec4 secondaryTexColor = texture2D(uSecondaryTexture, vUv);
          vec4 baseColor = mix(texColor, secondaryTexColor, uTextureMix);

          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(uLightPosition - vWorldPosition);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 halfDir = normalize(lightDir + viewDir);

          // Ambient lighting
          vec3 ambient = uAmbientColor * uAmbientIntensity * baseColor.rgb;

          // Diffuse lighting
          float diff = max(dot(normal, lightDir), 0.0);
          vec3 diffuse = uLightColor * uLightIntensity * diff * baseColor.rgb;

          // Specular lighting (Blinn-Phong)
          float shininess = (1.0 - uRoughness) * 128.0;
          float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
          vec3 specular = uLightColor * uLightIntensity * spec * uMetalness;

          // Emissive
          vec3 emissive = uEmissive * uEmissiveIntensity;

          vec3 finalColor = (ambient + diffuse + specular) * uColor + emissive;
          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `;

const loaderFragmentShader = `
        uniform float uOpacity;
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, uOpacity);
        }
      `;

/****************************************************
 *                                                  *
 *                  PROJECTS                        *
 *                                                  *
 ****************************************************/
const projects = [
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687fbe1b25ff901ea5c51fef_logo-mark-black.svg",
  },
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687ff5afce31195813335658_2.jpg",
  },
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687ff5af0fed80048155048c_67a28c59d89784a17d541df8d17e4dcf_1.jpg",
  },
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687ff5af10804731f2d337bd_3.jpg",
  },
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687ff5afef2cccdbeceffeb7_4.jpg",
  },
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687ff5afbbcfaddc5b321949_5.jpg",
  },
  {
    project_image:
      "https://cdn.prod.website-files.com/687fa9a9ef1fc58421fe7f28/687ff5af4fc5d072ee86677b_6.jpg",
  },
];

/****************************************************
 *                                                  *
 *                CAMERA FRUSTUM                    *
 *                                                  *
 ****************************************************/
const targetZ = 3;
const cameraDir = new THREE.Vector3();
camera.getWorldDirection(cameraDir);
const camToPlane = (targetZ - camera.position.z) / cameraDir.z;

const ndcCorners = {
  topLeft: new THREE.Vector3(-1, 1, 0),
  topRight: new THREE.Vector3(1, 1, 0),
  bottomLeft: new THREE.Vector3(-1, -1, 0),
  bottomRight: new THREE.Vector3(1, -1, 0),
};

const cornerPoints = {};
for (const key in ndcCorners) {
  const ndc = ndcCorners[key].clone().unproject(camera);
  const dir = ndc.sub(camera.position).normalize();
  cornerPoints[key] = camera.position
    .clone()
    .add(dir.multiplyScalar(camToPlane));
}

/****************************************************
 *                                                  *
 *                   CURVES                         *
 *                                                  *
 ****************************************************/
const curves = {
  topLeft: new THREE.CatmullRomCurve3(
    [
      cornerPoints.topLeft.clone(),
      new THREE.Vector3(-CONFIG.radius / 2.3, 1.25, -0.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 0, -CONFIG.radius),
      new THREE.Vector3(-CONFIG.radius / 2.3, -CONFIG.radius + 0.1, -0.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, -1, CONFIG.radius / 1.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 0, CONFIG.radius),
      new THREE.Vector3(-CONFIG.radius / 2.3, 1, CONFIG.radius / 1.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 1.28, -0.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, -0.5, -CONFIG.radius - 0.5),
    ],
    false
  ),
  topRight: new THREE.CatmullRomCurve3(
    [
      cornerPoints.topRight.clone(),
      new THREE.Vector3(CONFIG.radius / 2.3, 1.25, -0.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 0, -CONFIG.radius),
      new THREE.Vector3(CONFIG.radius / 2.3, -CONFIG.radius + 0.1, -0.5),
      new THREE.Vector3(CONFIG.radius / 2.3, -1, CONFIG.radius / 1.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 0, CONFIG.radius),
      new THREE.Vector3(CONFIG.radius / 2.3, 1, CONFIG.radius / 1.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 1.28, -0.5),
      new THREE.Vector3(CONFIG.radius / 2.3, -0.5, -CONFIG.radius - 0.5),
    ],
    false
  ),
  bottomLeft: new THREE.CatmullRomCurve3(
    [
      cornerPoints.bottomLeft.clone(),
      new THREE.Vector3(-CONFIG.radius / 2.3, 1.25, -0.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 0, -CONFIG.radius),
      new THREE.Vector3(-CONFIG.radius / 2.3, -CONFIG.radius + 0.1, -0.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, -1, CONFIG.radius / 1.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 0, CONFIG.radius),
      new THREE.Vector3(-CONFIG.radius / 2.3, 1, CONFIG.radius / 1.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 1.28, -0.5),
      new THREE.Vector3(-CONFIG.radius / 2.3, 0.5, -CONFIG.radius - 0.5),
    ],
    false
  ),
  bottomRight: new THREE.CatmullRomCurve3(
    [
      cornerPoints.bottomRight.clone(),
      new THREE.Vector3(CONFIG.radius / 2.3, 1.25, -0.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 0, -CONFIG.radius),
      new THREE.Vector3(CONFIG.radius / 2.3, -CONFIG.radius + 0.1, -0.5),
      new THREE.Vector3(CONFIG.radius / 2.3, -1, CONFIG.radius / 1.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 0, CONFIG.radius),
      new THREE.Vector3(CONFIG.radius / 2.3, 1, CONFIG.radius / 1.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 1.28, -0.5),
      new THREE.Vector3(CONFIG.radius / 2.3, 0.5, -CONFIG.radius - 0.5),
    ],
    false
  ),
};

/****************************************************
 *                                                  *
 *                LOADER PLANE                      *
 *                                                  *
 ****************************************************/
const { topLeft, topRight, bottomLeft, bottomRight } = cornerPoints;
const loaderPlaneGeometry = new THREE.BufferGeometry();
loaderPlaneGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    [
      ...topLeft.toArray(),
      ...bottomLeft.toArray(),
      ...bottomRight.toArray(),
      ...topLeft.toArray(),
      ...bottomRight.toArray(),
      ...topRight.toArray(),
    ],
    3
  )
);
const loaderPlaneMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: loaderFragmentShader,
  uniforms: { uOpacity: { value: 1.0 } },
  transparent: true,
  side: THREE.DoubleSide,
});
const loaderPlane = new THREE.Mesh(loaderPlaneGeometry, loaderPlaneMaterial);
loaderPlane.visible = false; // default hidden; startEverything will decide
loaderPlaneMaterial.uniforms.uOpacity.value = 0.0;

scene.add(loaderPlane);

/****************************************************
 *                                                  *
 *                 HOLY WHEEL                       *
 *                                                  *
 ****************************************************/
const holyWheel = new THREE.Group();
holyWheel.renderOrder = 1;
scene.add(holyWheel);

const bendGeo = new THREE.PlaneGeometry(1.2, 1.5, 1, 8);
const tmpV3 = new THREE.Vector3();
function bendGeometry(geo) {
  const pos = geo.attributes.position;
  for (let i = 0, l = pos.count; i < l; i++) {
    tmpV3.fromBufferAttribute(pos, i);
    const a = tmpV3.y * CONFIG.bendAmount;
    pos.setXYZ(i, tmpV3.x, Math.sin(a) * 0.85, Math.cos(a) * 0.5 - 0.5);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}
bendGeometry(bendGeo);

// ---- Texture loader & helpers
const texLoader = new THREE.TextureLoader();
const setTexDefaults = (t) => {
  if (!t) return t;
  // sRGB for UI images; avoid mips for faster loads on non-power-of-two svgs/jpgs
  if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace; // r149+
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
};

// Preload mode textures
const blackTexture = setTexDefaults(
  texLoader.load(CONFIG.materials.black.texture)
);
const whiteTexture = setTexDefaults(
  texLoader.load(CONFIG.materials.white.texture)
);
const redTexture = setTexDefaults(texLoader.load(CONFIG.materials.red.texture));

// Preload ALL project textures ONCE
const projectTextures = projects.map((p) =>
  setTexDefaults(texLoader.load(p.project_image))
);

const planes = projects.map((p, i) => {
  const texture = projectTextures[i]; // cached & loading already
  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTexture: { value: texture },
      uSecondaryTexture: { value: texture },
      uTextureMix: { value: 0.0 },
      uColor: { value: new THREE.Color(...CONFIG.materials.image.color) },
      uOpacity: { value: 0.0 },
      uLightPosition: { value: pointLight.position },
      uLightColor: { value: new THREE.Color(...CONFIG.lightColor) },
      uLightIntensity: {
        value: CONFIG.materials.image.pointLightIntensity,
      },
      uAmbientColor: {
        value: new THREE.Color(...CONFIG.materials.image.ambientColor),
      },
      uAmbientIntensity: {
        value: CONFIG.materials.image.ambientIntensity,
      },
      uRoughness: { value: CONFIG.materials.image.roughness },
      uMetalness: { value: CONFIG.materials.image.metalness },
      uEmissive: {
        value: new THREE.Color(...CONFIG.materials.image.emissive),
      },
      uEmissiveIntensity: {
        value: CONFIG.materials.image.emissiveIntensity,
      },
    },
    transparent: true,
    //   side: THREE.DoubleSide,
  });
  mat.userData = { mode: "image" };

  const mesh = new THREE.Mesh(bendGeo.clone(), mat);
  const angle = (i / projects.length) * Math.PI * 2;
  mesh.position.set(
    0,
    CONFIG.radius * Math.sin(angle),
    CONFIG.radius * Math.cos(angle)
  );
  mesh.rotation.x = -angle;

  // keep a handle to the image texture for this slot
  mesh.userData.imageTexture = texture;

  holyWheel.add(mesh);
  return mesh;
});

/****************************************************
 *                                                  *
 *                SCROLL STATE                      *
 *                                                  *
 ****************************************************/
let scrollOffset = 0;
let targetScroll = 0;
let currentRPM = RPM_TO_RAD(CONFIG.initialSpinSpeedRPM);
let wheelRevealed = false;

/****************************************************
 *                                                  *
 *                SCROLL EVENTS                     *
 *                                                  *
 ****************************************************/
addEventListener(
  "wheel",
  (e) => {
    targetScroll += e.deltaY * CONFIG.scrollSpeed;
  },
  { passive: true }
);

let touchStart = null;
addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length !== 1) return;
    touchStart = e.touches[0].clientY;
  },
  { passive: true }
);
addEventListener(
  "touchmove",
  (e) => {
    if (touchStart === null) return;
    targetScroll += (touchStart - e.touches[0].clientY) * CONFIG.scrollSpeed;
    touchStart = e.touches[0].clientY;
  },
  { passive: true }
);
addEventListener("touchend", () => (touchStart = null), {
  passive: true,
});

addEventListener(
  "resize",
  () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
  },
  { passive: true }
);

/****************************************************
 *                                                  *
 *                 MAIN LOOP                        *
 *                                                  *
 ****************************************************/
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  scrollOffset += (targetScroll - scrollOffset) * CONFIG.scrollLerp;
  holyWheel.rotation.x -= currentRPM * dt;
  planes.forEach((pl, i) => {
    const angle = (i / projects.length + scrollOffset) * Math.PI * 2;
    pl.position.set(
      0,
      CONFIG.radius * Math.sin(angle),
      CONFIG.radius * Math.cos(angle)
    );
    pl.rotation.x = -angle;
  });
  renderer.render(scene, camera);
}

/****************************************************
 *                                                  *
 *             MATERIAL TRANSITIONS                 *
 *                                                  *
 ****************************************************/
const sectionModes = {
  "section-1": "image",
  "section-2": "black",
  "section-3": "black",
  "section-4": "black",
  "section-5": "white",
  "section-6": "white",
  cta: "red",
};

function getCurrentSection() {
  const sections = document.querySelectorAll('[id^="section-"]');
  const scrollY = window.scrollY;
  for (let section of sections) {
    const rect = section.getBoundingClientRect();
    if (
      rect.top <= window.innerHeight / 2 &&
      rect.bottom >= window.innerHeight / 2
    ) {
      return section.id;
    }
  }
  return "section-1";
}

function textureReady(t) {
  return t && (t.isCanvasTexture || (t.image && t.image.width > 0));
}

function applyMode(mode) {
  const config = CONFIG.materials[mode];

  // Kill any global tweens before starting fresh
  gsap.killTweensOf([document.body, pointLight]);

  planes.forEach((plane) => {
    // Interrupt any in-flight tweens on this material/uniforms
    gsap.killTweensOf([
      plane.material.uniforms.uTextureMix,
      plane.material.uniforms.uRoughness,
      plane.material.uniforms.uMetalness,
      plane.material.uniforms.uEmissiveIntensity,
      plane.material.uniforms.uAmbientIntensity,
      plane.material.uniforms.uLightIntensity,
      plane.material.uniforms.uColor?.value,
      plane.material.uniforms.uEmissive?.value,
      plane.material.uniforms.uAmbientColor?.value,
    ]);

    const targetTexture =
      mode === "image"
        ? plane.userData.imageTexture
        : mode === "black"
        ? blackTexture
        : mode === "white"
        ? whiteTexture
        : redTexture;

    const startBlend = () => {
      // property tweens (use overwrite so rapid mode swaps retarget smoothly)
      gsap.to(plane.material.uniforms.uColor.value, {
        r: config.color[0],
        g: config.color[1],
        b: config.color[2],
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uRoughness, {
        value: config.roughness,
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uMetalness, {
        value: config.metalness,
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uEmissive.value, {
        r: config.emissive[0],
        g: config.emissive[1],
        b: config.emissive[2],
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uEmissiveIntensity, {
        value: config.emissiveIntensity,
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uAmbientColor.value, {
        r: config.ambientColor[0],
        g: config.ambientColor[1],
        b: config.ambientColor[2],
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uAmbientIntensity, {
        value: config.ambientIntensity,
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });
      gsap.to(plane.material.uniforms.uLightIntensity, {
        value: config.pointLightIntensity,
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
      });

      // texture cross-fade
      plane.material.uniforms.uSecondaryTexture.value = targetTexture;
      gsap.to(plane.material.uniforms.uTextureMix, {
        value: 1.0,
        duration: CONFIG.transitionDuration,
        ease: CONFIG.transitionEase,
        overwrite: CONFIG.smoothing.overwrite,
        onComplete() {
          plane.material.uniforms.uTexture.value = targetTexture;
          plane.material.uniforms.uSecondaryTexture.value = targetTexture;
          plane.material.uniforms.uTextureMix.value = 0.0;
          plane.material.userData.mode = mode;
        },
      });
    };

    if (textureReady(targetTexture)) {
      startBlend();
    } else {
      const check = () =>
        textureReady(targetTexture)
          ? startBlend()
          : requestAnimationFrame(check);
      check();
    }
  });

  // global background & light, interrupt-safe
  gsap.to(document.body, {
    background: config.bodyColor,
    duration: CONFIG.transitionDuration,
    ease: CONFIG.transitionEase,
    overwrite: CONFIG.smoothing.overwrite,
  });
  gsap.to(pointLight, {
    intensity: config.pointLightIntensity,
    duration: CONFIG.transitionDuration,
    ease: CONFIG.transitionEase,
    overwrite: CONFIG.smoothing.overwrite,
  });
}

let desiredMode = null;
let lastAppliedMode = null;
let holdTimer = null;

function requestMode(mode) {
  if (mode === desiredMode) return;
  desiredMode = mode;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (desiredMode !== lastAppliedMode) {
      applyMode(desiredMode);
      lastAppliedMode = desiredMode;
    }
  }, CONFIG.smoothing.minHoldMs);
}

function setupTransitionObservers() {
  const sections = document.querySelectorAll('[id^="section-"], #cta');
  const observer = new IntersectionObserver(
    (entries) => {
      // pick the most visible section
      let best = { ratio: 0, id: null };
      entries.forEach((e) => {
        if (e.intersectionRatio > best.ratio)
          best = { ratio: e.intersectionRatio, id: e.target.id };
      });
      if (best.id) {
        const mode = sectionModes[best.id] || "image";
        requestMode(mode);
      }
    },
    {
      threshold: [0.35, 0.6, 0.85], // fewer, higher thresholds reduce flapping
      rootMargin: "0px 0px 0px 0px",
    }
  );
  sections.forEach((s) => observer.observe(s));
}

/****************************************************
 *                                                  *
 *                 KICK-OFF                         *
 *                                                  *
 ****************************************************/
function atTop() {
  return (window.pageYOffset || document.documentElement.scrollTop || 0) <= 0;
}

function startEverything() {
  // show loader only if the user is at the absolute top
  const showLoader = atTop();
  loaderPlane.visible = showLoader;
  loaderPlaneMaterial.uniforms.uOpacity.value = showLoader ? 1.0 : 0.0;

  animate();
  console.log("Starting everything now");
  setTimeout(() => {
    gsap.to(
      { t: 0 },
      {
        t: 1,
        duration: CONFIG.planeAnimationDuration,
        ease: "power2.inOut",
        onUpdate() {
          const t = this.targets()[0].t;
          const positions = loaderPlaneGeometry.attributes.position;
          positions.set(curves.topLeft.getPointAt(t).toArray(), 0);
          positions.set(curves.bottomLeft.getPointAt(t).toArray(), 3);
          positions.set(curves.bottomRight.getPointAt(t).toArray(), 6);
          positions.set(curves.topLeft.getPointAt(t).toArray(), 9);
          positions.set(curves.bottomRight.getPointAt(t).toArray(), 12);
          positions.set(curves.topRight.getPointAt(t).toArray(), 15);
          positions.needsUpdate = true;
          loaderPlaneGeometry.computeVertexNormals();

          if (t >= CONFIG.wheelRevealThreshold && !wheelRevealed) {
            wheelRevealed = true;

            // reveal the wheel as before
            planes.forEach((plane) => {
              gsap.to(plane.material.uniforms.uOpacity, {
                value: CONFIG.materials.image.opacity,
                duration: CONFIG.fadeDuration,
                ease: "power2.out",
              });
            });

            // if loader was visible, fade it out; otherwise remove instantly
            if (loaderPlane.visible) {
              gsap.to(loaderPlaneMaterial.uniforms.uOpacity, {
                value: 0.0,
                duration: CONFIG.fadeDuration,
                ease: "power2.out",
                onComplete() {
                  scene.remove(loaderPlane);
                  loaderPlaneGeometry.dispose();
                  loaderPlaneMaterial.dispose();
                },
              });
            } else {
              scene.remove(loaderPlane);
              loaderPlaneGeometry.dispose();
              loaderPlaneMaterial.dispose();
            }
          }
        },
      }
    );

    gsap.to(
      { v: currentRPM },
      {
        delay: CONFIG.initialSpinDelaySec,
        duration: CONFIG.slowDownDurationSec,
        v: RPM_TO_RAD(CONFIG.finalSpinSpeedRPM),
        ease: "power2.out",
        onUpdate() {
          currentRPM = this.targets()[0].v;
        },
      }
    );
  }, CONFIG.initialLoaderDelaySec * 1000);

  setupTransitionObservers();

  // Initialize material based on current section
  const initialSectionId = getCurrentSection();
  const initialMode = sectionModes[initialSectionId] || "image";
  lastAppliedMode = initialMode; // if you added the debounced flow
  applyMode(initialMode);
}

window.addEventListener("load", () => {
  console.log("Window loaded, starting 3D immediately");
  setTimeout(startEverything, 0);
  setTimeout(() => {
    document.getElementById("home-hero-3d").style.zIndex = "0";
  }, CONFIG.zIndexDelaySec * 1000);
});

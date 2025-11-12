import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const container = document.getElementById('scene-container');
const splashOverlay = document.getElementById('splash');
const startButton = document.getElementById('startButton');
const tutorialOverlay = document.getElementById('tutorial');
const tutorialText = document.getElementById('tutorialText');
const tutorialNext = document.getElementById('tutorialNext');
const rotateLeftBtn = document.getElementById('rotateLeft');
const rotateRightBtn = document.getElementById('rotateRight');
const snapToggle = document.getElementById('snapToggle');
const toastEl = document.getElementById('toast');
const progressPlaced = document.getElementById('placedCount');
const progressTotal = document.getElementById('totalCount');
const diagnosticsPanel = document.getElementById('diagnosticsPanel');
const diagFps = document.getElementById('diagFps');
const diagDrawCalls = document.getElementById('diagDrawCalls');
const diagTriangles = document.getElementById('diagTriangles');
const diagGeometries = document.getElementById('diagGeometries');
const diagTextures = document.getElementById('diagTextures');
const diagGpu = document.getElementById('diagGpu');
const screenshotButton = document.getElementById('screenshotButton');
const profilesModal = document.getElementById('profilesModal');
const settingsModal = document.getElementById('settingsModal');
const creditsModal = document.getElementById('creditsModal');
const profilesButton = document.getElementById('profilesButton');
const settingsButton = document.getElementById('settingsButton');
const tutorialButton = document.getElementById('tutorialButton');
const creditsButton = document.getElementById('creditsButton');
const gridToggleButton = document.getElementById('gridToggle');
const muteButton = document.getElementById('muteButton');
const exportButton = document.getElementById('exportButton');
const importButton = document.getElementById('importButton');
const helpModal = document.getElementById('helpModal');
const importInput = document.getElementById('importInput');
const profileLabel = document.getElementById('currentProfile');
const profileButtons = document.querySelectorAll('.profile-card');
const modalCloseButtons = document.querySelectorAll('[data-close-modal]');
const settingsMuteToggle = document.getElementById('settingsMuteToggle');
const bigUiToggle = document.getElementById('bigUiToggle');
const reducedMotionToggle = document.getElementById('reducedMotionToggle');
const resetRoomButton = document.getElementById('resetRoomButton');
const designButton = document.getElementById('designButton');
const designModal = document.getElementById('designModal');
const resetPaletteButton = document.getElementById('resetPaletteButton');
const swatchButtons = document.querySelectorAll('[data-color-swatch]');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const photoModeButton = document.getElementById('photoModeButton');
const kidsModeButton = document.getElementById('kidsModeButton');
const helpButton = document.getElementById('helpButton');
const randomizeButton = document.getElementById('randomizeButton');
const btnRunner = document.getElementById('btnRunner');
const prefersReducedMotion = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
renderer.domElement.style.touchAction = 'none';
renderer.info.autoReset = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6f3ff);
scene.fog = new THREE.Fog(0xf6f3ff, 22, 40);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(7.5, 6.5, 11);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.8, -1.5);
controls.enableDamping = !prefersReducedMotion;
controls.dampingFactor = prefersReducedMotion ? 0.02 : 0.08;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minPolarAngle = Math.PI / 4;

const clock = new THREE.Clock();
let elapsedTime = 0;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const planeIntersect = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const dragOffset = new THREE.Vector3();
const tempVec3 = new THREE.Vector3();

const draggableItems = [];
const snapTargets = [];
const boxes = [];
const shelves = [];

const STORAGE_NAMESPACE = 'unpack-play-3d';
const STORAGE_VERSION = 1;
const AUTO_SAVE_DELAY = 900;
const profilesConfig = [
  { id: 'suruli', name: 'Suruli', theme: 'bedroom' },
  { id: 'shimmy', name: 'Shimmy', theme: 'kitchen' },
  { id: 'guest', name: 'Guest', theme: 'fantasy' }
];
const profileMap = new Map(profilesConfig.map((profile) => ([profile.id, profile])));
const themePresets = {
  bedroom: {
    floor: 0xfdf2ff,
    wall: 0xfff5dc,
    accentWall: 0xfff0f6,
    fog: 0xf6f3ff,
    baseboard: 0xffd6f8,
    boxColors: [0xffa8d9, 0x9ad9ff, 0xffd58b],
    decorRug: 0xffc9f2,
    decorMat: 0xfff0fd,
    lights: 0xfff2c0
  },
  kitchen: {
    floor: 0xfff3d2,
    wall: 0xffefd6,
    accentWall: 0xfff5e2,
    fog: 0xfff3df,
    baseboard: 0xffcfa1,
    boxColors: [0xff9f68, 0xffcf70, 0xffa98d],
    decorRug: 0xffe0b8,
    decorMat: 0xfff4d6,
    lights: 0xffdca8
  },
  fantasy: {
    floor: 0xf4e6ff,
    wall: 0xeedbff,
    accentWall: 0xded7ff,
    fog: 0xeedcff,
    baseboard: 0xc6b7ff,
    boxColors: [0xa9a1ff, 0xffa8f2, 0x9ad5ff],
    decorRug: 0xdcc9ff,
    decorMat: 0xf3e4ff,
    lights: 0xffe2ff
  }
};
const paletteLabels = {
  wall: 'walls',
  accentWall: 'accent wall',
  floor: 'floor',
  baseboard: 'trim',
  rug: 'primary rug',
  mat: 'accent mat',
  lights: 'string lights'
};
const roomElements = {
  floor: null,
  walls: [],
  baseboards: [],
  accentWall: null,
  decor: {
    rug: null,
    mat: null,
    lights: null
  }
};

const defaultCustomColors = () => ({
  wall: null,
  accentWall: null,
  floor: null,
  baseboard: null,
  rug: null,
  mat: null,
  lights: null
});

const cloneCustomColors = (source = {}) => Object.assign(defaultCustomColors(), source);

const GRID_SIZE = 0.5;
const MAX_PIXEL_RATIO = 1.5;
const roomBounds = {
  minX: -9.4,
  maxX: 9.4,
  minZ: -9.6,
  maxZ: 2.2
};

let snapIdCounter = 0;
let itemIdCounter = 0;
let baselineSnapshot = null;
let baselineCustomColors = defaultCustomColors();
let autosaveTimer = null;
let activeModal = null;
let ambientParticles = null;
let touchHintShown = false;

const selectionRing = createSelectionRing();
scene.add(selectionRing);
selectionRing.visible = false;

const decorGroup = new THREE.Group();
const runnerGroup = new THREE.Group();
runnerGroup.visible = false;
scene.add(decorGroup, runnerGroup);

const state = {
  mode: 'decor',
  gameStarted: false,
  assetsReady: false,
  selectedItem: null,
  snapEnabled: true,
  placedCount: 0,
  totalItems: 0,
  gridSnapEnabled: false,
  audioMuted: false,
  currentProfile: 'guest',
  currentTheme: 'bedroom',
  bigUi: false,
  reducedMotion: prefersReducedMotion,
  customColors: defaultCustomColors()
};

const dragState = {
  item: null,
  isDragging: false,
  startPosition: new THREE.Vector3(),
  startRotation: 0,
  startSnapId: null,
  validPlacement: true
};

const toastState = {
  timeout: null
};

const diagnosticsState = {
  visible: false,
  fps: 60,
  lastUpdate: 0,
  gpuString: null
};

const history = createHistoryManager();
const audio = createAudioManager();

const tutorial = createTutorial();

buildRoom();
setupLighting();
setupGroundDecor();
setupShelves();
setupBoxes();
setupDecorExtras();

const Runner = {
  running: false,
  t: 0,
  speed: 6,
  stars: 0,
  lane: 0,
  y: 0,
  vy: 0,
  gravity: -32,
  onGround: true,
  best: { seconds: 0, stars: 0 },
  lastSpawn: 0,
  obstacles: [],
  collectibles: [],
  enter() { loadBestForActiveProfile(); this.reset(); state.mode = 'runner'; showRunnerUI(true); },
  reset() { this.t = 0; this.speed = 6; this.stars = 0; this.lane = 0; this.y = 0; this.vy = 0; this.onGround = true; this.lastSpawn = 0; this.obstacles.forEach(o => runnerGroup.remove(o)); this.collectibles.forEach(c => runnerGroup.remove(c)); this.obstacles = []; this.collectibles = []; },
  exit() { state.mode = 'decor'; showRunnerUI(false); },
  update(dt) {
    if (!this.running) return;
    this.t += dt; this.speed = Math.min(14, 6 + 0.02 * this.t);
    if (this.t - this.lastSpawn > Math.random() * 0.5 + 0.9) { spawnEntity(); this.lastSpawn = this.t; }
    // vertical
    this.vy += this.gravity * dt; this.y = Math.max(0, this.y + this.vy * dt);
    if (this.y === 0) this.onGround = true;

    // placeholder for move world back
    this.obstacles.forEach(o => o.position.z += this.speed * dt);
    this.collectibles.forEach(c => c.position.z += this.speed * dt);

    updateRunnerHUD();
    if (this.t >= 30 && !isDone('runner_30s')) awardMilestone('runner_30s');
    if (this.stars >= 3 && !isDone('runner_3stars')) awardMilestone('runner_3stars');
  },
  endRun() {
    let improved = false;
    if (this.t > this.best.seconds) { this.best.seconds = this.t; improved = true; }
    if (this.stars > this.best.stars) { this.best.stars = this.stars; improved = true; }
    saveBestForActiveProfile(this.best);
    if (improved && !isDone('runner_best_update')) awardMilestone('runner_best_update');
    showRunnerFinish(this.t, this.stars, this.best);
    this.running = false;
  }
};

setupRunnerScene();

const itemsConfig = [
  {
    name: 'Retro Console',
    url: 'assets/svg/console.svg',
    scale: 0.018,
    depth: 0.5,
    boxIndex: 0,
    dropHeight: 0.6,
    tint: 0xff8fb1
  },
  {
    name: 'Robot Toy',
    url: 'assets/svg/robot.svg',
    scale: 0.022,
    depth: 0.55,
    boxIndex: 0,
    dropHeight: 0.65,
    tint: 0x8fdcff
  },
  {
    name: 'Story Books',
    url: 'assets/svg/books.svg',
    scale: 0.02,
    depth: 0.45,
    boxIndex: 1,
    dropHeight: 0.55,
    tint: 0xffd482
  },
  {
    name: 'Mini Plant',
    url: 'assets/svg/plant.svg',
    scale: 0.024,
    depth: 0.42,
    boxIndex: 1,
    dropHeight: 0.58,
    tint: 0xb5f58b
  },
  {
    name: 'Toy Rocket',
    url: 'assets/svg/rocket.svg',
    scale: 0.02,
    depth: 0.55,
    boxIndex: 2,
    dropHeight: 0.62,
    tint: 0xffa6a6
  },
  {
    name: 'Board Game',
    url: 'assets/svg/boardgame.svg',
    scale: 0.018,
    depth: 0.4,
    boxIndex: 2,
    dropHeight: 0.54,
    tint: 0x9a8fff
  }
];

startButton.disabled = true;
startButton.textContent = 'Loading assets...';

loadAllItems(itemsConfig)
  .then((loadedItems) => {
    placeItemsInBoxes(loadedItems);
    state.totalItems = loadedItems.length;
    progressTotal.textContent = loadedItems.length.toString();
    updateProgress();
    state.assetsReady = true;
    history.reset('initial');
    baselineSnapshot = JSON.parse(JSON.stringify(captureSnapshot()));
    baselineCustomColors = cloneCustomColors(state.customColors);
    setActiveProfile(state.currentProfile);
    syncAudioUi();
    applyUiScale();
    applyReducedMotionSettings();
    syncSettingsUi();
    syncSnapUi();
    startButton.disabled = false;
    startButton.textContent = 'Play';
  })
  .catch((error) => {
    console.error(error);
    startButton.textContent = 'Reload to retry';
    showToast('Failed to load assets. Check the console.', 4000);
  });

renderer.setAnimationLoop(update);

window.addEventListener('resize', handleResize);
renderer.domElement.addEventListener('pointerdown', handlePointerDown);
renderer.domElement.addEventListener('pointermove', handlePointerMove);
renderer.domElement.addEventListener('pointerup', handlePointerUp);
renderer.domElement.addEventListener('pointerleave', handlePointerUp);
renderer.domElement.addEventListener('pointercancel', handlePointerUp);
renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
window.addEventListener('keydown', handleKeyDown);

startButton.addEventListener('click', () => {
  if (!state.assetsReady) {
    return;
  }
  audio.unlock();
  closeModal();
  state.gameStarted = true;
  splashOverlay.classList.remove('visible');
  splashOverlay.classList.add('hidden');
  tutorial.restart();
});

tutorialNext.addEventListener('click', () => {
  tutorial.hideOverlay();
  tutorial.onOverlayAccepted();
});

rotateLeftBtn.addEventListener('click', () => rotateSelected(-1));
rotateRightBtn.addEventListener('click', () => rotateSelected(1));

snapToggle.addEventListener('change', () => {
  state.snapEnabled = snapToggle.checked;
  showToast(state.snapEnabled ? 'Snapping enabled' : 'Snapping disabled');
  syncSnapUi();
  scheduleAutosave();
});

if (gridToggleButton) {
  gridToggleButton.addEventListener('click', () => {
    state.gridSnapEnabled = !state.gridSnapEnabled;
    gridToggleButton.setAttribute('aria-pressed', state.gridSnapEnabled ? 'true' : 'false');
    showToast(state.gridSnapEnabled ? 'Grid snap enabled (G).' : 'Grid snap disabled.', 1400);
    scheduleAutosave();
  });
}

if (screenshotButton) {
  screenshotButton.addEventListener('click', handleScreenshot);
}

if (exportButton) {
  exportButton.addEventListener('click', exportCurrentProfile);
}

if (importButton && importInput) {
  importButton.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', handleImportFile);
}

if (muteButton) {
  muteButton.addEventListener('click', () => {
    setAudioMuted(!state.audioMuted);
  });
}

if (settingsMuteToggle) {
  settingsMuteToggle.addEventListener('change', () => {
    setAudioMuted(settingsMuteToggle.checked);
  });
}

if (profilesButton && profilesModal) {
  profilesButton.addEventListener('click', () => openModal(profilesModal));
}

if (settingsButton && settingsModal) {
  settingsButton.addEventListener('click', () => {
    syncSettingsUi();
    syncSnapUi();
    openModal(settingsModal);
  });
}

if (designButton && designModal) {
  designButton.addEventListener('click', () => {
    syncDesignUi();
    openModal(designModal);
  });
}

if (resetPaletteButton) {
  resetPaletteButton.addEventListener('click', () => {
    resetCustomColors();
    showToast('Theme colors restored.', 1500);
  });
}

if (swatchButtons.length) {
  swatchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      const color = button.dataset.color;
      if (!target || !color) {
        return;
      }
      setCustomColor(target, color);
      syncDesignUi();
    });
  });
}

if (resetRoomButton) {
  resetRoomButton.addEventListener('click', () => {
    if (window.confirm('Reset this room to its freshly-unpacked state?')) {
      resetCurrentProfile();
    }
  });
}

if (tutorialButton) {
  tutorialButton.addEventListener('click', () => {
    if (!state.gameStarted) {
      startButton.focus();
    }
    tutorial.restart();
    splashOverlay.classList.add('hidden');
  });
}

if (creditsButton && creditsModal) {
  creditsButton.addEventListener('click', () => openModal(creditsModal));
}

if (bigUiToggle) {
  bigUiToggle.addEventListener('change', () => {
    state.bigUi = bigUiToggle.checked;
    applyUiScale();
    scheduleAutosave();
  });
}

if (reducedMotionToggle) {
  reducedMotionToggle.addEventListener('change', () => {
    state.reducedMotion = reducedMotionToggle.checked;
    applyReducedMotionSettings();
    scheduleAutosave();
  });
}

profileButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const profileId = button.dataset.profile;
    if (profileId) {
      setActiveProfile(profileId);
      closeModal();
    }
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', () => closeModal());
});

document.addEventListener('keydown', handleGlobalKeyDown);
window.addEventListener('beforeunload', saveCurrentProfile);
window.__gameDebug = {
  state,
  tutorial,
  setCustomColor,
  resetCustomColors,
  applyTheme
};

undoButton.addEventListener('click', () => history.undo());
redoButton.addEventListener('click', () => history.redo());

btnRunner.onclick = () => enterRunner();

document.addEventListener('keydown', (e) => {
  if (state.mode !== 'runner') return;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    Runner.lane = Math.max(-1, Runner.lane - 1);
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    Runner.lane = Math.min(1, Runner.lane + 1);
  }
  if (e.code === 'Space' && Runner.onGround) { Runner.vy = 12; Runner.onGround = false; }
  if (e.code === 'KeyP') toggleRunnerPause();
});

photoModeButton.addEventListener('click', () => {
  document.body.classList.toggle('photo-mode');
  showToast('Photo mode ' + (document.body.classList.contains('photo-mode') ? 'enabled' : 'disabled'), 1500);
});

kidsModeButton.addEventListener('click', () => {
  document.body.classList.toggle('kids-mode');
  const isKidsMode = document.body.classList.contains('kids-mode');
  state.snapEnabled = isKidsMode;
  snapToggle.checked = isKidsMode;
  showToast('Kids mode ' + (isKidsMode ? 'enabled' : 'disabled'), 1500);

  draggableItems.forEach(item => {
    const catalogItem = itemsConfig.find(c => c.name === item.name);
    if (isKidsMode) {
      item.visible = catalogItem && catalogItem.category === 'Decor';
    } else {
      item.visible = true;
    }
  });
});

randomizeButton.addEventListener('click', () => {
  randomizeCozy();
  showToast('Cozy room randomized!', 1500);
});

helpButton.addEventListener('click', () => {
  openModal(helpModal);
});

refreshProfileLabel();
const initialProfile = profileMap.get(state.currentProfile);
if (initialProfile) {
  applyTheme(initialProfile.theme);
}
syncProfileButtons();
syncAudioUi();
applyUiScale();
applyReducedMotionSettings();
syncSettingsUi();
syncSnapUi();

function buildRoom() {
  const roomGroup = new THREE.Group();

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xfdf2ff,
    roughness: 0.9,
    metalness: 0
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  roomGroup.add(floor);
  roomElements.floor = floor;

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff5dc,
    roughness: 0.95,
    metalness: 0
  });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 9), wallMaterial);
  backWall.position.set(0, 4.5, -10);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);
  roomElements.walls.push(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 9), wallMaterial);
  leftWall.position.set(-10, 4.5, 0);
  leftWall.rotation.y = Math.PI / 2;
  roomGroup.add(leftWall);
  roomElements.walls.push(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 9), wallMaterial);
  rightWall.position.set(10, 4.5, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.material = wallMaterial.clone();
  rightWall.material.color.set(0xfff0f6);
  roomGroup.add(rightWall);
  roomElements.accentWall = rightWall;

  const baseboardMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd6f8,
    roughness: 0.6
  });
  const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 0.2), baseboardMaterial);
  baseboardBack.position.set(0, 0.18, -9.9);
  roomGroup.add(baseboardBack);
  roomElements.baseboards.push(baseboardBack);

  const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 20), baseboardMaterial);
  baseboardLeft.position.set(-9.9, 0.18, 0);
  roomGroup.add(baseboardLeft);
  roomElements.baseboards.push(baseboardLeft);

  const baseboardRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 20), baseboardMaterial);
  baseboardRight.position.set(9.9, 0.18, 0);
  roomGroup.add(baseboardRight);
  roomElements.baseboards.push(baseboardRight);

  decorGroup.add(roomGroup);
}

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffefd5, 0.85);
  hemi.position.set(0, 12, 0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(6, 12, 8);
  sun.target.position.set(0, 0, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  const fill = new THREE.SpotLight(0xffb7d5, 0.6, 30, Math.PI / 4, 0.35, 1);
  fill.position.set(-8, 7, 6);
  fill.castShadow = false;
  scene.add(fill);
}

function setupGroundDecor() {
  const rugGeometry = new THREE.CircleGeometry(2.3, 48);
  const rugMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc9f2,
    roughness: 0.8,
    metalness: 0
  });
  const rug = new THREE.Mesh(rugGeometry, rugMaterial);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-1.5, 0.01, -3.5);
  rug.receiveShadow = true;
  decorGroup.add(rug);
  roomElements.decor.rug = rug;

  const matGeometry = new THREE.RingGeometry(1.4, 1.8, 32);
  const matMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff0fd,
    roughness: 0.7
  });
  const mat = new THREE.Mesh(matGeometry, matMaterial);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(3.6, 0.011, -2.8);
  mat.receiveShadow = true;
  decorGroup.add(mat);
  roomElements.decor.mat = mat;
}

function setupShelves() {
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: 0xffccf2,
    roughness: 0.5,
    metalness: 0
  });

  const shelfPositions = [
    new THREE.Vector3(-2.8, 2.2, -6.2),
    new THREE.Vector3(1.2, 1.4, -6.5),
    new THREE.Vector3(4.4, 2.6, -6.2)
  ];

  const shelfSizes = [
    { width: 3.8, depth: 0.9 },
    { width: 3.2, depth: 0.75 },
    { width: 2.5, depth: 0.8 }
  ];

  shelfPositions.forEach((position, index) => {
    const size = shelfSizes[index];
    const shelfGeo = new THREE.BoxGeometry(size.width, 0.25, size.depth);
    const shelf = new THREE.Mesh(shelfGeo, shelfMaterial.clone());
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    shelf.position.copy(position);
    decorGroup.add(shelf);
    shelves.push({
      mesh: shelf,
      width: size.width,
      depth: size.depth,
      center: position.clone(),
      topY: position.y + 0.125
    });

    const bracketGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
    for (let i = -1; i <= 1; i += 2) {
      const bracket = new THREE.Mesh(bracketGeo, shelf.material.clone());
      bracket.position.set(
        position.x + (size.width / 2 - 0.4) * i,
        position.y - 0.45,
        position.z + size.depth / 2 - 0.1
      );
      decorGroup.add(bracket);
    }

    const snapsPerShelf = Math.max(3, Math.round(size.width / 1.2));
    const spacing = size.width / (snapsPerShelf + 1);
    for (let i = 1; i <= snapsPerShelf; i += 1) {
      const snapPosition = new THREE.Vector3(
        position.x - size.width / 2 + spacing * i,
        position.y + 0.15,
        position.z
      );
      registerSnapPoint(snapPosition, 'shelf');
    }
  });

  // Floor snap targets
  const floorSnaps = [
    new THREE.Vector3(-1.6, 0.6, -3.2),
    new THREE.Vector3(2.8, 0.6, -2.4),
    new THREE.Vector3(0.2, 0.6, -4.6)
  ];

  floorSnaps.forEach((position) => registerSnapPoint(position, 'floor'));
}

function setupBoxes() {
  const positions = [new THREE.Vector3(-3.6, 0.5, -2.8), new THREE.Vector3(0.4, 0.5, -3.2), new THREE.Vector3(3.6, 0.5, -2.4)];
  const initialColors = themePresets[state.currentTheme]?.boxColors || [0xffa8d9, 0x9ad9ff, 0xffd58b];
  positions.forEach((position, index) => {
    const color = initialColors[index % initialColors.length];
    const box = createDecorBox(position, color);
    box.colorIndex = index;
    boxes.push(box);
    decorGroup.add(box.group);
  });
}

function setupDecorExtras() {
  ambientParticles = createAmbientParticles();
  const stringLights = createStringLights();
  roomElements.decor.lights = stringLights;
  decorGroup.add(stringLights);
}

function createAmbientParticles() {
  const count = 180;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(14);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(1.5, 5.5);
    positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(10);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.14,
    transparent: true,
    opacity: state.reducedMotion ? 0.1 : 0.32,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.position.y = 0.4;
  decorGroup.add(points);
  return points;
}

function createStringLights() {
  const group = new THREE.Group();
  const anchorLeft = new THREE.Vector3(-5.5, 4.7, -5.6);
  const anchorMid = new THREE.Vector3(0, 5.4, -6.4);
  const anchorRight = new THREE.Vector3(5.5, 4.7, -5.6);
  const curve = new THREE.CatmullRomCurve3([anchorLeft, anchorMid, anchorRight], false, 'centripetal');
  const curvePoints = curve.getPoints(32);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x70527a });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  group.add(line);

  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff2c0,
    emissive: 0xffd18f,
    emissiveIntensity: 0.8,
    roughness: 0.3
  });
  const bulbGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const bulbs = [];
  for (let t = 0.05; t <= 0.95; t += 0.1) {
    const point = curve.getPoint(t);
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.copy(point);
    bulbs.push(bulb);
    group.add(bulb);
  }
  group.userData = { bulbs, bulbMaterial, line };
  return group;
}

function createDecorBox(position, color) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.userData = { type: 'box' };

  const baseMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).offsetHSL(0, 0, -0.1),
    roughness: 0.6
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 1.4), baseMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  base.position.y = 0.35;
  base.userData = { parent: group };
  group.add(base);

  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.16), accentMaterial);
  ribbon.position.set(0, 0.42, 0);
  ribbon.castShadow = true;
  group.add(ribbon);

  const lidHinge = new THREE.Group();
  lidHinge.position.set(0, 0.7, -0.7);
  group.add(lidHinge);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.12, 1.45), baseMaterial.clone());
  lid.position.set(0, 0, 0.72);
  lid.castShadow = true;
  lidHinge.add(lid);

  const glow = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 1.6), new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.0
  }));
  glow.position.y = 0.3;
  group.add(glow);

  return {
    group,
    base,
    baseMaterial,
    lid,
    lidHinge,
    glow,
    accentMaterial,
    openProgress: 0,
    targetOpen: 0,
    hasOpened: false,
    highlight: false,
    items: [],
    spawnPositions: [
      new THREE.Vector3(0, 0.42, -0.15),
      new THREE.Vector3(0.35, 0.42, 0.15),
      new THREE.Vector3(-0.35, 0.42, 0.15)
    ],
    nextSpawnIndex: 0
  };
}

function registerSnapPoint(position, kind) {
  const indicatorGeometry = new THREE.CircleGeometry(0.25, 32);
  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: kind === 'shelf' ? 0xff93f7 : 0x93ffe1,
    transparent: true,
    opacity: 0.12
  });
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  indicator.rotation.x = -Math.PI / 2;
  indicator.position.copy(position);
  indicator.position.y -= kind === 'shelf' ? 0.08 : 0.55;
  indicator.visible = false;
  decorGroup.add(indicator);

  snapTargets.push({
    id: snapIdCounter++,
    position: position.clone(),
    kind,
    radius: kind === 'shelf' ? 0.6 : 0.8,
    occupiedBy: null,
    helper: indicator,
    highlight: false
  });
}

function createSelectionRing() {
  const geometry = new THREE.RingGeometry(0.55, 0.65, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff7ce2,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 999;
  return ring;
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handlePointerDown(event) {
  if (event.pointerType === 'touch' && !touchHintShown) {
    showToast('Use two fingers to orbit, pinch to zoom.', 2200);
    touchHintShown = true;
  }
  if (!state.gameStarted) {
    return;
  }
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  const item = pickDraggableFromRay();
  if (item) {
    beginDrag(item);
    return;
  }

  const box = pickBoxFromRay();
  if (box) {
    attemptOpenBox(box);
  } else {
    clearSelection();
  }
}

function handlePointerMove(event) {
  if (!dragState.isDragging || !dragState.item) {
    return;
  }
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
    const desired = planeIntersect.sub(dragOffset);
    constrainPosition(desired);
    if (state.gridSnapEnabled) {
      applyGridSnap(desired);
    }
    dragState.item.position.lerp(desired, 0.35);
    dragState.item.userData.lastDragged = performance.now();
    const collision = checkCollision(dragState.item);
    dragState.validPlacement = evaluatePlacement(dragState.item) && !collision;
    applyPlacementHighlight(dragState.item, dragState.validPlacement);
  }
}

function handlePointerUp() {
  if (!dragState.isDragging || !dragState.item) {
    return;
  }
  controls.enabled = true;

  const item = dragState.item;
  const startPosition = dragState.startPosition.clone();
  const startRotation = dragState.startRotation;
  const startSnapId = dragState.startSnapId;

  dragState.item = null;
  dragState.isDragging = false;

  const placementValid = evaluatePlacement(item);
  clearPlacementHighlight(item);

  if (!placementValid) {
    restoreItemToStart(item, startPosition, startRotation, startSnapId);
    updateSelection(item);
    showToast('Try placing items fully on shelves or rugs.');
    return;
  }

  let snapped = false;
  if (state.snapEnabled) {
    snapped = trySnapItem(item);
  }
  if (!snapped) {
    if (state.gridSnapEnabled) {
      applyGridSnap(item.position);
    }
    gentlyDrop(item);
  } else {
    tutorial.notify('itemSnapped');
  }

  updateSelection(item);
  if (!snapped) {
    showToast('Items like to rest on shelves or the rug.');
  }
  updateProgress();

  const snapIdNow = item.userData.snapSlot ? item.userData.snapSlot.id : null;
  const moved =
    startPosition.distanceTo(item.position) > 0.01 ||
    Math.abs(item.rotation.y - startRotation) > 0.01 ||
    snapIdNow !== startSnapId;

  if (moved) {
    commitHistory('move');
  }
}

function handleWheel(event) {
  if (!state.gameStarted || !state.selectedItem) {
    return;
  }
  if (event.altKey) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    rotateSelected(direction, THREE.MathUtils.degToRad(5), { showFeedback: false, commit: false });
    commitHistory('rotate-fine');
  }
}

function toggleDiagnostics() {
  if (!diagnosticsPanel) {
    return;
  }
  diagnosticsState.visible = !diagnosticsState.visible;
  diagnosticsPanel.classList.toggle('hidden', !diagnosticsState.visible);
  if (diagnosticsState.visible) {
    ensureGpuInfo();
    diagnosticsState.lastUpdate = 0;
    showToast('Diagnostics enabled. Press D to hide.', 1500);
  } else {
    showToast('Diagnostics hidden.', 1200);
  }
}

function setGridSnapEnabled(enabled, options = {}) {
  const { silent = false, skipAutosave = false } = options;
  state.gridSnapEnabled = enabled;
  if (gridToggleButton) {
    gridToggleButton.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }
  if (!silent) {
    showToast(enabled ? 'Grid snap enabled (G).' : 'Grid snap disabled.', 1400);
  }
  if (!skipAutosave) {
    scheduleAutosave();
  }
}

function toggleGridSnap() {
  setGridSnapEnabled(!state.gridSnapEnabled);
}

function handleScreenshot() {
  const { domElement } = renderer;
  const link = document.createElement('a');
  link.href = domElement.toDataURL('image/png');
  link.download = `unpack-and-play-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Screenshot saved to downloads.', 1500);
}

function ensureGpuInfo() {
  if (diagnosticsState.gpuString) {
    return;
  }
  const gl = renderer.getContext();
  let gpu = 'Unknown GPU';
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } else {
      gpu = gl.getParameter(gl.RENDERER) || gpu;
    }
  }
  diagnosticsState.gpuString = gpu;
  if (diagGpu) {
    diagGpu.textContent = gpu;
  }
}

function updateDiagnostics(delta) {
  const fpsInstant = 1 / Math.max(delta, 0.0001);
  diagnosticsState.fps = THREE.MathUtils.lerp(diagnosticsState.fps, fpsInstant, 0.1);
  if (!diagnosticsState.visible || !diagnosticsPanel) {
    return;
  }
  const now = performance.now();
  if (now - diagnosticsState.lastUpdate < 300) {
    return;
  }
  diagnosticsState.lastUpdate = now;
  if (diagFps) {
    diagFps.textContent = diagnosticsState.fps.toFixed(0);
  }
  if (diagDrawCalls) {
    diagDrawCalls.textContent = renderer.info.render.calls.toString();
  }
  if (diagTriangles) {
    diagTriangles.textContent = renderer.info.render.triangles.toString();
  }
  if (diagGeometries) {
    diagGeometries.textContent = renderer.info.memory.geometries.toString();
  }
  if (diagTextures) {
    diagTextures.textContent = renderer.info.memory.textures.toString();
  }
  if (diagGpu && diagnosticsState.gpuString) {
    diagGpu.textContent = diagnosticsState.gpuString;
  }
}

function performUndo() {
  if (history.undo()) {
    showToast('Undid last action.', 1100);
  } else {
    showToast('Nothing to undo.', 1000);
  }
}

function performRedo() {
  if (history.redo()) {
    showToast('Redid action.', 1100);
  } else {
    showToast('Nothing to redo.', 1000);
  }
}

function handleKeyDown(event) {
  const isMeta = event.ctrlKey || event.metaKey;

  if (event.code === 'KeyD' && !event.repeat) {
    toggleDiagnostics();
    event.preventDefault();
    return;
  }

  if (event.code === 'KeyG' && !event.repeat) {
    toggleGridSnap();
    event.preventDefault();
    return;
  }

  if (isMeta && event.code === 'KeyZ') {
    event.preventDefault();
    if (event.shiftKey) {
      performRedo();
    } else {
      performUndo();
    }
    return;
  }

  if (isMeta && event.code === 'KeyY') {
    event.preventDefault();
    performRedo();
    return;
  }

  if (!state.gameStarted || !state.selectedItem) {
    return;
  }

  if (event.code === 'KeyQ') {
    rotateSelected(-1);
    event.preventDefault();
    return;
  }

  if (event.code === 'KeyE') {
    rotateSelected(1);
    event.preventDefault();
    return;
  }

  if ((event.code === 'Delete' || event.code === 'Backspace') && !event.repeat) {
    event.preventDefault();
    deleteSelected();
  }
}

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickDraggableFromRay() {
  const intersections = raycaster.intersectObjects(draggableItems, true);
  for (const hit of intersections) {
    const root = getDraggableRoot(hit.object);
    if (root) {
      return root;
    }
  }
  return null;
}

function pickBoxFromRay() {
  const boxMeshes = boxes.map((box) => box.base);
  const intersections = raycaster.intersectObjects(boxMeshes, true);
  if (intersections.length > 0) {
    return boxes.find((box) => box.base === intersections[0].object);
  }
  return null;
}

function getDraggableRoot(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.isDraggable) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function beginDrag(item) {
  dragState.item = item;
  dragState.isDragging = true;
  controls.enabled = false;
  dragState.startPosition.copy(item.position);
  dragState.startRotation = item.rotation.y;
  dragState.startSnapId = item.userData.snapSlot ? item.userData.snapSlot.id : null;
  dragState.validPlacement = true;
  clearPlacementHighlight(item);

  planeNormal.copy(camera.getWorldDirection(tempVec3)).normalize();
  dragPlane.setFromNormalAndCoplanarPoint(planeNormal, item.position);

  if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
    dragOffset.copy(planeIntersect).sub(item.position);
  } else {
    dragOffset.set(0, 0, 0);
  }

  if (item.userData.snapSlot) {
    item.userData.snapSlot.occupiedBy = null;
    item.userData.snapSlot = null;
  }

  updateSelection(item);
  showToast('Drag an item anywhere. Scroll the mouse wheel to zoom.', 2000);
  tutorial.notify('itemDragged');
}

function updateSelection(item) {
  state.selectedItem = item;
  rotateLeftBtn.disabled = false;
  rotateRightBtn.disabled = false;
  selectionRing.visible = true;
  selectionRing.material.color.setHex(0xff7ce2);
  selectionRing.position.set(item.position.x, 0.02, item.position.z);
  selectionRing.scale.setScalar(Math.max(0.8, item.userData.boundingRadius * 0.95));
}

function clearSelection() {
  state.selectedItem = null;
  selectionRing.visible = false;
  rotateLeftBtn.disabled = true;
  rotateRightBtn.disabled = true;
}

function deleteSelected() {
  const item = state.selectedItem;
  if (!item) {
    return;
  }
  if (item.userData.snapSlot) {
    item.userData.snapSlot.occupiedBy = null;
    item.userData.snapSlot = null;
  }
  item.visible = false;
  clearSelection();
  updateProgress();
  commitHistory('delete');
  showToast('Item removed. Undo with Ctrl+Z.', 1600);
}

function rotateSelected(direction, angle = THREE.MathUtils.degToRad(15), options = {}) {
  if (!state.selectedItem) {
    return;
  }
  const { showFeedback = true, commit = true } = options;
  const rotationStep = angle * direction;
  state.selectedItem.rotation.y += rotationStep;
  if (commit) {
    commitHistory('rotate');
  }
  if (showFeedback) {
    showToast(direction < 0 ? 'Spun left' : 'Spun right', 1200);
    tutorial.notify('itemRotated');
  }
}

function gentlyDrop(item) {
  item.position.y = Math.max(0.5, item.position.y);
}

function constrainPosition(position) {
  position.x = THREE.MathUtils.clamp(position.x, roomBounds.minX, roomBounds.maxX);
  position.y = THREE.MathUtils.clamp(position.y, 0.4, 4.8);
  position.z = THREE.MathUtils.clamp(position.z, roomBounds.minZ, roomBounds.maxZ);
}

function applyGridSnap(position) {
  position.x = Math.round(position.x / GRID_SIZE) * GRID_SIZE;
  position.z = Math.round(position.z / GRID_SIZE) * GRID_SIZE;
}

function checkCollision(item) {
  const itemBox = new THREE.Box3().setFromObject(item);
  for (const otherItem of draggableItems) {
    if (item === otherItem) continue;
    const otherBox = new THREE.Box3().setFromObject(otherItem);
    if (itemBox.intersectsBox(otherBox)) {
      return true;
    }
  }
  return false;
}

function evaluatePlacement(item) {
  const radius = item.userData.boundingRadius || 0.5;
  const withinBounds =
    item.position.x - radius >= roomBounds.minX &&
    item.position.x + radius <= roomBounds.maxX &&
    item.position.z - radius >= roomBounds.minZ &&
    item.position.z + radius <= roomBounds.maxZ;
  if (!withinBounds) {
    return false;
  }

  // Floor placements are valid if near ground.
  if (item.position.y <= 0.6) {
    return true;
  }

  let onShelf = false;
  for (const shelf of shelves) {
    const verticalAlignment = Math.abs(item.position.y - shelf.topY) <= 0.55;
    const depthAlignment = Math.abs(item.position.z - shelf.center.z) <= shelf.depth / 2 + radius * 0.6;
    if (verticalAlignment && depthAlignment) {
      onShelf = true;
      const horizontalClearance = shelf.width / 2 - radius * 0.8;
      if (Math.abs(item.position.x - shelf.center.x) > horizontalClearance) {
        return false;
      }
    }
  }

  return onShelf;
}

function applyPlacementHighlight(item, isValid) {
  const color = isValid ? 0x5fffc8 : 0xff5f79;
  const intensity = isValid ? 0.4 : 0.5;
  item.traverse((child) => {
    if (!child.isMesh || !child.material || !('emissive' in child.material)) {
      return;
    }
    child.material.emissive.setHex(color);
    child.material.emissiveIntensity = intensity;
  });
  if (selectionRing.visible && state.selectedItem === item) {
    selectionRing.material.color.setHex(isValid ? 0x9afcc9 : 0xff7ca3);
  }
}

function clearPlacementHighlight(item) {
  item.traverse((child) => {
    if (!child.isMesh || !child.material || !('emissive' in child.material)) {
      return;
    }
    child.material.emissiveIntensity = 0;
  });
  selectionRing.material.color.setHex(0xff7ce2);
}

function restoreItemToStart(item, position, rotation, snapId) {
  if (item.userData.snapSlot) {
    item.userData.snapSlot.occupiedBy = null;
    item.userData.snapSlot = null;
  }
  item.position.copy(position);
  item.rotation.y = rotation;
  if (snapId !== null && snapId !== undefined) {
    const slot = findSnapById(snapId);
    if (slot) {
      slot.occupiedBy = item;
      item.userData.snapSlot = slot;
      item.position.copy(slot.position);
      if (slot.kind === 'floor') {
        item.position.y = 0.58;
      }
    }
  }
}

function findSnapById(id) {
  if (id === null || id === undefined) {
    return null;
  }
  return snapTargets.find((target) => target.id === id) || null;
}

function commitHistory(label) {
  if (state.assetsReady === false) {
    return;
  }
  history.push(label);
  scheduleAutosave();
}

function trySnapItem(item) {
  let bestTarget = null;
  let bestDistance = Infinity;
  for (const target of snapTargets) {
    if (target.occupiedBy && target.occupiedBy !== item) {
      continue;
    }
    const distance = target.position.distanceTo(item.position);
    if (distance < target.radius && distance < bestDistance) {
      bestDistance = distance;
      bestTarget = target;
    }
  }

  if (bestTarget) {
    bestTarget.occupiedBy = item;
    item.position.copy(bestTarget.position);
    if (bestTarget.kind === 'floor') {
      item.position.y = 0.58;
    }
    item.userData.snapSlot = bestTarget;
    playSound('place');
    showToast('Snapped into place!', 1300);
    return true;
  }
  return false;
}

function updateProgress() {
  let placed = 0;
  for (const item of draggableItems) {
    if (item.userData.snapSlot) {
      placed += 1;
    }
  }
  state.placedCount = placed;
  progressPlaced.textContent = placed.toString();
}

function attemptOpenBox(box) {
  box.targetOpen = 1;
  if (!box.hasOpened) {
    box.hasOpened = true;
    playSound('unbox');
    tutorial.notify('boxOpened');
    showToast('Box opened! Drag items out and place them around.');
    box.items.forEach((item, index) => {
      item.visible = true;
      item.userData.isPacked = false;
      item.userData.popProgress = 0;
      item.userData.popDelay = index * 0.12;
      item.position.y = box.group.position.y + 0.2;
    });
  }
}

function updateBoxes(delta, elapsed) {
  const easing = 6 * delta;
  boxes.forEach((box) => {
    box.openProgress = THREE.MathUtils.lerp(box.openProgress, box.targetOpen, easing);
    const angle = THREE.MathUtils.lerp(0, Math.PI * 0.7, box.openProgress);
    box.lidHinge.rotation.x = -angle;
    const glowOpacity = box.highlight ? 0.4 + Math.sin(elapsed * 6) * 0.18 : Math.max(0, (1 - box.openProgress) * 0.25);
    box.glow.material.opacity = glowOpacity;
    box.glow.visible = box.highlight || box.openProgress < 0.99;

    box.items.forEach((item) => {
      if (item.userData.popProgress === undefined) {
        return;
      }
      if (item.userData.popDelay > 0) {
        item.userData.popDelay -= delta;
        return;
      }
      item.userData.popProgress += delta * 2.5;
      const progress = THREE.MathUtils.clamp(item.userData.popProgress, 0, 1);
      item.position.y = THREE.MathUtils.lerp(box.group.position.y + 0.2, box.group.position.y + item.userData.dropHeight, progress);
      if (progress >= 1) {
        delete item.userData.popProgress;
      }
    });
  });
}

function updateSnapHighlights(elapsed) {
  const highlighting = tutorial.highlightSnapTargets || false;
  snapTargets.forEach((target) => {
    if (highlighting) {
      target.helper.visible = true;
      target.helper.material.opacity = 0.35 + Math.sin(elapsed * 4) * 0.15;
    } else if (!target.occupiedBy) {
      target.helper.visible = false;
    }
  });
}

function animateSelectionRing(delta, elapsed) {
  if (!selectionRing.visible || !state.selectedItem) {
    return;
  }
  selectionRing.position.set(state.selectedItem.position.x, 0.02, state.selectedItem.position.z);
  const pulse = state.reducedMotion ? 1 : 1 + Math.sin(elapsed * 4) * 0.04;
  selectionRing.scale.setScalar(Math.max(0.8, state.selectedItem.userData.boundingRadius * 0.95) * pulse);
}

function showToast(message, duration = 2000) {
  if (toastState.timeout) {
    clearTimeout(toastState.timeout);
  }
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastEl.classList.add('visible');
  toastState.timeout = setTimeout(() => {
    toastEl.classList.remove('visible');
    toastState.timeout = null;
  }, duration);
}

function createHistoryManager() {
  const entries = [];
  let index = -1;

  return {
    push(label) {
      if (draggableItems.length === 0) {
        return;
      }
      const snapshot = {
        label,
        timestamp: performance.now(),
        items: captureSnapshot()
      };
      entries.splice(index + 1);
      entries.push(snapshot);
      index = entries.length - 1;
    },
    undo() {
      if (index <= 0) {
        return false;
      }
      index -= 1;
      applySnapshot(entries[index].items);
      return true;
    },
    redo() {
      if (index >= entries.length - 1) {
        return false;
      }
      index += 1;
      applySnapshot(entries[index].items);
      return true;
    },
    reset(label) {
      entries.length = 0;
      index = -1;
      this.push(label);
    }
  };
}

function captureSnapshot() {
  return draggableItems.map((item) => ({
    id: item.userData.id,
    position: item.position.toArray(),
    rotationY: item.rotation.y,
    visible: item.visible,
    snapId: item.userData.snapSlot ? item.userData.snapSlot.id : null
  }));
}

function applySnapshot(itemsSnapshot) {
  snapTargets.forEach((target) => {
    target.occupiedBy = null;
  });
  const itemMap = new Map();
  for (const item of draggableItems) {
    itemMap.set(item.userData.id, item);
  }
  for (const entry of itemsSnapshot) {
    const item = itemMap.get(entry.id);
    if (!item) {
      continue;
    }
    item.visible = entry.visible;
    item.position.fromArray(entry.position);
    item.rotation.y = entry.rotationY;
    item.userData.snapSlot = null;
    if (entry.snapId !== null && entry.snapId !== undefined) {
      const slot = findSnapById(entry.snapId);
      if (slot) {
        slot.occupiedBy = item;
        item.userData.snapSlot = slot;
        item.position.copy(slot.position);
        if (slot.kind === 'floor') {
          item.position.y = 0.58;
        }
      }
    }
  }
  updateProgress();
  if (state.selectedItem && !state.selectedItem.visible) {
    clearSelection();
  } else if (state.selectedItem) {
    updateSelection(state.selectedItem);
  }
}

function scheduleAutosave() {
  if (!state.assetsReady) {
    return;
  }
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  autosaveTimer = setTimeout(() => {
    saveCurrentProfile();
  }, AUTO_SAVE_DELAY);
}

function saveCurrentProfile() {
  if (!state.assetsReady) {
    return;
  }
  saveProfile(state.currentProfile);
}

function saveProfile(profileId) {
  if (!state.assetsReady || typeof localStorage === 'undefined') {
    return;
  }
  try {
    const payload = {
      version: STORAGE_VERSION,
      profile: profileId,
      snapshot: captureSnapshot(),
      savedAt: Date.now(),
      gridSnapEnabled: state.gridSnapEnabled,
      snapEnabled: state.snapEnabled,
      audioMuted: state.audioMuted,
      bigUi: state.bigUi,
      reducedMotion: state.reducedMotion,
      theme: state.currentTheme,
      customColors: cloneCustomColors(state.customColors)
    };
    localStorage.setItem(getStorageKey(profileId), JSON.stringify(payload));
  } catch (error) {
    console.warn('Autosave failed', error);
  }
}

function loadProfile(profileId) {
  if (!state.assetsReady) {
    return;
  }
  const payload = readProfile(profileId);
  if (payload && payload.snapshot) {
    applySnapshot(payload.snapshot);
    setGridSnapEnabled(Boolean(payload.gridSnapEnabled), { silent: true, skipAutosave: true });
    state.snapEnabled = payload.snapEnabled !== false;
    const mutedSetting =
      typeof payload.audioMuted === 'boolean' ? payload.audioMuted : state.audioMuted;
    setAudioMuted(mutedSetting, { silent: true, skipAutosave: true });
    state.bigUi = Boolean(payload.bigUi);
    state.reducedMotion = payload.reducedMotion ?? state.reducedMotion;
    applyUiScale();
    applyReducedMotionSettings();
    state.customColors = cloneCustomColors(payload.customColors);
    const nextTheme = payload.theme || state.currentTheme;
    applyTheme(nextTheme);
  } else if (baselineSnapshot) {
    applySnapshot(JSON.parse(JSON.stringify(baselineSnapshot)));
    state.customColors = cloneCustomColors(baselineCustomColors);
    applyTheme(state.currentTheme);
    setGridSnapEnabled(false, { silent: true, skipAutosave: true });
    state.snapEnabled = true;
  }
  applyAllCustomColors();
  updateBodyPaletteAttributes();
  syncSnapUi();
  syncAudioUi();
  syncSettingsUi();
  syncDesignUi();
  history.reset(`profile:${profileId}`);
}

function exportCurrentProfile() {
  if (!state.assetsReady) {
    showToast('Load the scene before exporting.', 1400);
    return;
  }
  const payload = {
    version: STORAGE_VERSION,
    profile: state.currentProfile,
    savedAt: Date.now(),
    gridSnapEnabled: state.gridSnapEnabled,
    snapEnabled: state.snapEnabled,
    audioMuted: state.audioMuted,
    bigUi: state.bigUi,
    reducedMotion: state.reducedMotion,
    theme: state.currentTheme,
    customColors: cloneCustomColors(state.customColors),
    snapshot: captureSnapshot()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `unpack-play-${state.currentProfile}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Exported room snapshot.', 1600);
}

function handleImportFile(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!payload.snapshot) {
        throw new Error('Invalid save file');
      }
      applySnapshot(payload.snapshot);
      setGridSnapEnabled(Boolean(payload.gridSnapEnabled), { silent: true, skipAutosave: true });
      state.snapEnabled = payload.snapEnabled !== false;
      const mutedSetting =
        typeof payload.audioMuted === 'boolean' ? payload.audioMuted : state.audioMuted;
      setAudioMuted(mutedSetting, { silent: true, skipAutosave: true });
      state.bigUi = Boolean(payload.bigUi);
      state.reducedMotion = payload.reducedMotion ?? state.reducedMotion;
      applyUiScale();
      applyReducedMotionSettings();
      state.customColors = cloneCustomColors(payload.customColors);
      applyTheme(payload.theme || state.currentTheme);
      applyAllCustomColors();
      updateBodyPaletteAttributes();
      syncSnapUi();
      syncAudioUi();
      syncSettingsUi();
      syncDesignUi();
      history.reset(`import:${state.currentProfile}`);
      saveProfile(state.currentProfile);
      showToast('Import complete!', 1600);
    } catch (error) {
      console.error(error);
      showToast('Import failed. Please use a valid file.', 2000);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function getStorageKey(profileId) {
  return `${STORAGE_NAMESPACE}:${profileId}`;
}

function readProfile(profileId) {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(getStorageKey(profileId));
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) {
      return null;
    }
    return data;
  } catch (error) {
    console.warn('Failed to read profile', error);
    return null;
  }
}

function setActiveProfile(profileId) {
  const profile = profileMap.get(profileId) || profileMap.get('guest');
  if (!profile) {
    return;
  }
  state.currentProfile = profile.id;
  state.customColors = defaultCustomColors();
  applyTheme(profile.theme);
  refreshProfileLabel();
  syncProfileButtons();
  syncDesignUi();
  if (state.assetsReady) {
    loadProfile(profile.id);
    showToast(`${profile.name} room ready.`, 1500);
  }
}

function resetCurrentProfile() {
  if (!baselineSnapshot) {
    return;
  }
  applySnapshot(JSON.parse(JSON.stringify(baselineSnapshot)));
  state.customColors = cloneCustomColors(baselineCustomColors);
  applyTheme(state.currentTheme);
  applyAllCustomColors();
  updateBodyPaletteAttributes();
  setGridSnapEnabled(false, { silent: true, skipAutosave: true });
  state.snapEnabled = true;
  syncSnapUi();
  syncDesignUi();
  history.reset(`reset:${state.currentProfile}`);
  saveProfile(state.currentProfile);
  showToast('Room reset. Fresh boxes await!', 1800);
}

function setBoxColor(box, color) {
  box.baseMaterial.color.set(color);
  box.base.material.color.set(color);
  box.lid.material.color.set(color);
  box.glow.material.color.set(color);
  const accentColor = new THREE.Color(color).offsetHSL(0, 0, -0.1);
  box.accentMaterial.color.set(accentColor);
}

function syncProfileButtons() {
  profileButtons.forEach((button) => {
    const isActive = button.dataset.profile === state.currentProfile;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function refreshProfileLabel() {
  if (profileLabel) {
    const profile = profileMap.get(state.currentProfile);
    profileLabel.textContent = `Profile: ${profile ? profile.name : 'Guest'}`;
  }
}

function applyTheme(themeId) {
  const theme = themePresets[themeId] || themePresets.bedroom;
  state.currentTheme = themeId;
  document.body.dataset.theme = themeId;
  if (roomElements.floor) {
    roomElements.floor.material.color.set(theme.floor);
  }
  roomElements.walls.forEach((wall) => {
    wall.material.color.set(theme.wall);
  });
  if (roomElements.accentWall) {
    roomElements.accentWall.material.color.set(theme.accentWall);
  }
  roomElements.baseboards.forEach((board) => {
    board.material.color.set(theme.baseboard);
  });
  if (roomElements.decor.rug) {
    roomElements.decor.rug.material.color.set(theme.decorRug);
  }
  if (roomElements.decor.mat) {
    roomElements.decor.mat.material.color.set(theme.decorMat);
  }
  if (ambientParticles) {
    ambientParticles.material.color.set(theme.accentWall);
  }
  if (roomElements.decor.lights) {
    tintStringLights(theme.lights || theme.accentWall);
  }
  scene.background.set(theme.fog);
  scene.fog.color.set(theme.fog);
  const boxColors = theme.boxColors || [];
  boxes.forEach((box, index) => {
    const color = boxColors[index % boxColors.length] || 0xffffff;
    setBoxColor(box, color);
  });
  applyAllCustomColors();
  updateBodyPaletteAttributes();
}

function tintStringLights(color) {
  const lights = roomElements.decor.lights;
  if (!lights || !color) {
    return;
  }
  const colorObj = new THREE.Color(color);
  lights.userData.bulbMaterial.color.copy(colorObj);
  lights.userData.bulbMaterial.emissive.copy(colorObj).offsetHSL(0, 0, 0.2);
  lights.userData.bulbMaterial.emissiveIntensity = state.reducedMotion ? 0.4 : 0.8;
  if (lights.userData.line) {
    lights.userData.line.material.color.copy(colorObj.clone().offsetHSL(0, 0, -0.35));
  }
}

function setCustomColor(target, color) {
  const normalized = color.toLowerCase();
  if (state.customColors[target] === normalized) {
    return;
  }
  state.customColors[target] = normalized;
  applyCustomColor(target, normalized);
  updateBodyPaletteAttributes();
  const label = paletteLabels[target] || target;
  showToast(`Updated ${label}.`, 1300);
  scheduleAutosave();
}

function applyCustomColor(target, color) {
  if (!color) {
    return;
  }
  const tone = new THREE.Color(color);
  switch (target) {
    case 'wall':
      roomElements.walls.forEach((wall) => {
        wall.material.color.copy(tone);
      });
      break;
    case 'accentWall':
      if (roomElements.accentWall) {
        roomElements.accentWall.material.color.copy(tone);
      }
      break;
    case 'floor':
      if (roomElements.floor) {
        roomElements.floor.material.color.copy(tone);
      }
      break;
    case 'baseboard':
      roomElements.baseboards.forEach((board) => {
        board.material.color.copy(tone);
      });
      break;
    case 'rug':
      if (roomElements.decor.rug) {
        roomElements.decor.rug.material.color.copy(tone);
      }
      break;
    case 'mat':
      if (roomElements.decor.mat) {
        roomElements.decor.mat.material.color.copy(tone);
      }
      break;
    case 'lights':
      tintStringLights(color);
      break;
    default:
      break;
  }
}

function applyAllCustomColors() {
  Object.entries(state.customColors).forEach(([target, value]) => {
    if (value) {
      applyCustomColor(target, value);
    }
  });
}

function resetCustomColors() {
  state.customColors = defaultCustomColors();
  applyTheme(state.currentTheme);
  scheduleAutosave();
  syncDesignUi();
}

function updateBodyPaletteAttributes() {
  const targets = Object.keys(defaultCustomColors());
  targets.forEach((target) => {
    const key = `color${target.charAt(0).toUpperCase()}${target.slice(1)}`;
    const value = state.customColors[target];
    if (value) {
      document.body.dataset[key] = value;
    } else {
      delete document.body.dataset[key];
    }
  });
}

function syncDesignUi() {
  if (!swatchButtons.length) {
    return;
  }
  swatchButtons.forEach((button) => {
    const target = button.dataset.target;
    const color = button.dataset.color?.toLowerCase();
    const isActive = target && color && state.customColors[target] && state.customColors[target].toLowerCase() === color;
    button.classList.toggle('active', Boolean(isActive));
  });
  if (resetPaletteButton) {
    const anyCustom = Object.values(state.customColors).some((value) => Boolean(value));
    resetPaletteButton.disabled = !anyCustom;
  }
}

function syncSnapUi() {
  if (snapToggle) {
    snapToggle.checked = state.snapEnabled;
  }
  if (gridToggleButton) {
    gridToggleButton.setAttribute('aria-pressed', state.gridSnapEnabled ? 'true' : 'false');
  }
}

function setAudioMuted(muted, options = {}) {
  const { silent = false, skipAutosave = false } = options;
  state.audioMuted = muted;
  audio.setMuted(muted);
  syncAudioUi();
  if (!silent) {
    showToast(muted ? 'Sound muted.' : 'Sound on.', 1200);
  }
  if (!skipAutosave) {
    scheduleAutosave();
  }
}

function syncAudioUi() {
  if (muteButton) {
    muteButton.textContent = state.audioMuted ? '🔇 Sound Off' : '🔈 Sound On';
    muteButton.setAttribute('aria-pressed', state.audioMuted ? 'true' : 'false');
  }
  if (settingsMuteToggle) {
    settingsMuteToggle.checked = state.audioMuted;
  }
}

function applyUiScale() {
  document.body.dataset.ui = state.bigUi ? 'big' : 'default';
}

function applyReducedMotionSettings() {
  document.body.dataset.reducedMotion = state.reducedMotion ? 'true' : 'false';
  controls.enableDamping = !state.reducedMotion;
  controls.dampingFactor = state.reducedMotion ? 0.02 : 0.08;
  if (ambientParticles) {
    ambientParticles.material.opacity = state.reducedMotion ? 0.1 : 0.32;
  }
  if (roomElements.decor.lights) {
    roomElements.decor.lights.userData.bulbMaterial.emissiveIntensity = state.reducedMotion ? 0.4 : 0.8;
  }
}

function syncSettingsUi() {
  if (bigUiToggle) {
    bigUiToggle.checked = state.bigUi;
  }
  if (settingsMuteToggle) {
    settingsMuteToggle.checked = state.audioMuted;
  }
  if (reducedMotionToggle) {
    reducedMotionToggle.checked = state.reducedMotion;
  }
  syncDesignUi();
}

function openModal(modal) {
  if (activeModal === modal) {
    return;
  }
  closeModal();
  if (!modal) {
    return;
  }
  modal.classList.remove('hidden');
  modal.classList.add('visible');
  activeModal = modal;
  focusFirstInteractive(modal);
}

function closeModal() {
  if (!activeModal) {
    return;
  }
  activeModal.classList.add('hidden');
  activeModal.classList.remove('visible');
  activeModal = null;
}

function focusFirstInteractive(modal) {
  if (!modal) {
    return;
  }
  const focusable = modal.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) {
    focusable.focus();
  }
}

function handleGlobalKeyDown(event) {
  if (event.code === 'Escape' && activeModal) {
    event.preventDefault();
    closeModal();
  }
}

function createTutorial() {
  const steps = [
    {
      id: 'welcome',
      text: 'Welcome to Unpack & Play 3D! We\'ll help you decorate this cozy room.',
      waitFor: null,
      highlight: null
    },
    {
      id: 'openBox',
      text: 'Start by clicking the glowing box to open it up.',
      waitFor: 'boxOpened',
      highlight: 'box'
    },
    {
      id: 'dragItem',
      text: 'Drag an item out of the box and explore the room.',
      waitFor: 'itemDragged',
      highlight: null
    },
    {
      id: 'snapItem',
      text: 'Place the item on a glowing spot to snap it into place.',
      waitFor: 'itemSnapped',
      highlight: 'snap'
    },
    {
      id: 'rotateItem',
      text: 'Use Q/E keys or the rotate buttons to angle your items just right.',
      waitFor: 'itemRotated',
      highlight: 'rotate'
    },
    {
      id: 'freePlay',
      text: 'All set! Keep unpacking and make the room yours.',
      waitFor: null,
      highlight: null
    }
  ];

  let index = -1;
  let awaitingEvent = null;

  function setHighlights(step) {
    boxes.forEach((box) => {
      box.highlight = step.highlight === 'box' && !box.hasOpened;
    });
    tutorial.highlightSnapTargets = step.highlight === 'snap';
    const rotateHighlight = step.highlight === 'rotate';
    rotateLeftBtn.classList.toggle('pulse', rotateHighlight);
    rotateRightBtn.classList.toggle('pulse', rotateHighlight);
  }

  return {
    highlightSnapTargets: false,
    start() {
      this.restart();
    },
    advance() {
      index += 1;
      if (index >= steps.length) {
        tutorialOverlay.classList.add('hidden');
        return;
      }
      const step = steps[index];
      awaitingEvent = step.waitFor;
      tutorialText.textContent = step.text;
      tutorialOverlay.classList.remove('hidden');
      tutorialOverlay.classList.add('visible');
      setHighlights(step);
      if (!awaitingEvent && step.id === 'freePlay') {
        setTimeout(() => {
          this.hideOverlay();
        }, 2800);
      }
    },
    hideOverlay() {
      tutorialOverlay.classList.remove('visible');
      tutorialOverlay.classList.add('hidden');
    },
    onOverlayAccepted() {
      const step = steps[index];
      if (!awaitingEvent) {
        this.advance();
      } else if (step.highlight === 'box') {
        boxes.forEach((box) => {
          box.highlight = !box.hasOpened;
        });
      }
    },
    notify(eventId) {
      if (awaitingEvent && awaitingEvent === eventId) {
        awaitingEvent = null;
        this.advance();
      }
    },
    restart() {
      index = -1;
      awaitingEvent = null;
      this.advance();
    }
  };
}

async function loadAllItems(configs) {
  const loader = new SVGLoader();
  const promises = configs.map((config) => {
    return new Promise((resolve, reject) => {
      loader.load(
        config.url,
        (data) => {
          const group = createItemFromSvg(data, config);
          resolve({ group, config });
        },
        undefined,
        (error) => reject(error)
      );
    });
  });
  return Promise.all(promises);
}

function createItemFromSvg(data, config) {
  const itemId = `item-${itemIdCounter++}`;
  const group = new THREE.Group();
  group.userData = {
    name: config.name,
    isDraggable: true,
    snapSlot: null,
    isPacked: true,
    dropHeight: config.dropHeight || 0.6,
    boundingRadius: 1,
    id: itemId
  };
  group.name = config.name || itemId;

  const paths = data.paths;
  const depth = config.depth ?? 0.3;
  const extrudeSettings = {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.12,
    bevelSize: depth * 0.18,
    bevelSegments: 2,
    steps: 1
  };

  paths.forEach((path) => {
    if (path.userData.style.fill === undefined || path.userData.style.fill === 'none') {
      return;
    }
    const shapes = path.toShapes(true);
    shapes.forEach((shape) => {
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.center();
      const fillColor = path.color !== undefined ? path.color : config.tint || 0xffffff;
      const material = new THREE.MeshToonMaterial({ color: fillColor });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.scale.y *= -1;
      group.add(mesh);
    });
  });

  if (group.children.length === 0) {
    const spriteMaterial = new THREE.SpriteMaterial({ color: config.tint || 0xffffff });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.center.set(0.5, 0.5);
    sprite.scale.set(80, 80, 1);
    group.add(sprite);
  }

  const scale = config.scale || 0.02;
  group.scale.set(scale, scale, scale);
  group.rotation.x = Math.PI;
  group.userData.isDraggable = true;
  draggableItems.push(group);

  const boundingBox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  group.userData.boundingRadius = Math.max(size.x, size.z) * 0.5;
  group.userData.boundingHeight = size.y;

  group.visible = false;
  decorGroup.add(group);
  return group;
}

function placeItemsInBoxes(items) {
  items.forEach(({ group, config }) => {
    const box = boxes[config.boxIndex % boxes.length];
    const spawnIndex = box.nextSpawnIndex % box.spawnPositions.length;
    box.nextSpawnIndex += 1;
    const spawn = box.spawnPositions[spawnIndex].clone();
    const worldPosition = spawn.add(box.group.position);
    group.position.copy(worldPosition);
    group.rotation.y = Math.random() * Math.PI * 2;
    group.userData.boxIndex = config.boxIndex;
    box.items.push(group);
  });
}

function createAudioManager() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return {
      unlock() {},
      play() {},
      setMuted() {}
    };
  }

  const context = new AudioContextClass();
  let unlocked = false;
  const buffers = new Map();

  function ensureBuffers() {
    if (buffers.size > 0) {
      return;
    }
    buffers.set('unbox', buildBuffer(520, 0.32, 2.2));
    buffers.set('place', buildBuffer(820, 0.18, 3.1));
    buffers.set('delete', buildBuffer(440, 0.2, 2.5));
    buffers.set('rotate', buildBuffer(1200, 0.1, 4.0));
  }

  function buildBuffer(frequency, duration, decay) {
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const t = i / context.sampleRate;
      const envelope = Math.exp(-decay * t);
      channel[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }
    return buffer;
  }

  function play(name) {
    if (!unlocked || state.audioMuted) {
      return;
    }
    ensureBuffers();
    const buffer = buffers.get(name);
    if (!buffer) {
      return;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
  }

  return {
    unlock() {
      if (unlocked) {
        return;
      }
      ensureBuffers();
      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }
      unlocked = true;
    },
    play,
    setMuted(muted) {
      state.audioMuted = muted;
    }
  };
}

function playSound(name) {
  audio.play(name);
}

const MILESTONE_KEY = 'family.milestones.v2';

function getMilestonesV2() {
  try {
    const data = localStorage.getItem(MILESTONE_KEY);
    return new Set(data ? JSON.parse(data) : []);
  } catch (e) {
    return new Set();
  }
}

function isDone(id) {
  return getMilestonesV2().has(id);
}

function awardMilestone(id) {
  const milestones = getMilestonesV2();
  if (!milestones.has(id)) {
    milestones.add(id);
    localStorage.setItem(MILESTONE_KEY, JSON.stringify([...milestones]));
    window.dispatchEvent(new CustomEvent('milestone', { detail: { id } }));
  }
}

function enterRunner() {
  decorGroup.visible = false;
  runnerGroup.visible = true;
  Runner.enter();
}

function showRunnerUI(show) {
  document.getElementById('runnerHud').style.display = show ? 'flex' : 'none';
}

function updateRunnerHUD() {
  document.getElementById('runnerTime').textContent = Runner.t.toFixed(1) + 's';
  document.getElementById('runnerStars').textContent = '★ ' + Runner.stars;
  document.getElementById('runnerBest').textContent = `Best: ${Runner.best.seconds.toFixed(1)}s / ★${Runner.best.stars}`;
}

function toggleRunnerPause() {
  Runner.running = !Runner.running;
  document.getElementById('runnerPause').style.display = Runner.running ? 'none' : 'grid';
}

function showRunnerFinish(t, stars) {
  document.getElementById('runnerFinish').style.display = 'grid';
  document.getElementById('runnerSummaryText').textContent = `Time: ${t.toFixed(1)}s, Stars: ${stars}`;
}

function loadBestForActiveProfile() {
  const slot = state.currentProfile;
  const key = `family.runner.best.${slot}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      Runner.best = JSON.parse(data);
    } else {
      Runner.best = { seconds: 0, stars: 0 };
    }
  } catch (e) {
    Runner.best = { seconds: 0, stars: 0 };
  }
}

function saveBestForActiveProfile(best) {
  const slot = state.currentProfile;
  const key = `family.runner.best.${slot}`;
  localStorage.setItem(key, JSON.stringify(best));
}

function spawnEntity() {
  const isObstacle = Math.random() > 0.5;
  const lane = Math.floor(Math.random() * 3) - 1;
  const geometry = isObstacle ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.5, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: isObstacle ? 0xff0000 : 0xffff00 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(lane * 1.6, 0.5, -20);
  runnerGroup.add(mesh);
  if (isObstacle) {
    Runner.obstacles.push(mesh);
  } else {
    Runner.collectibles.push(mesh);
  }
}

function setupRunnerScene() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 200), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
  ground.rotation.x = -Math.PI / 2;
  runnerGroup.add(ground);

  const player = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
  player.position.y = 0.5;
  runnerGroup.add(player);
  Runner.player = player;
}

function randomizeCozy() {
  // Clear existing items
  draggableItems.forEach(item => decorGroup.remove(item));
  draggableItems.length = 0;

  loadAllItems(itemsConfig.slice(0, 5)).then(loadedItems => {
    loadedItems.forEach(({ group }) => {
      group.visible = true;
      const shelf = shelves[Math.floor(Math.random() * shelves.length)];
      const x = shelf.center.x + (Math.random() - 0.5) * shelf.width;
      const z = shelf.center.z + (Math.random() - 0.5) * shelf.depth;
      group.position.set(x, shelf.topY, z);
    });
    updateProgress();
  });
}

function update() {
  const delta = clock.getDelta();
  elapsedTime += delta;
  renderer.info.reset();
  controls.update();

  if (state.mode === 'runner') {
    Runner.update(delta);
  } else {
    updateBoxes(delta, elapsedTime);
    updateSnapHighlights(elapsedTime);
    animateSelectionRing(delta, elapsedTime);
    if (ambientParticles) {
      const swirlSpeed = state.reducedMotion ? 0.03 : 0.09;
      ambientParticles.rotation.y += delta * swirlSpeed;
    }
  }

  const ringOpacity = state.reducedMotion ? 0.55 : 0.5 + Math.sin(elapsedTime * 4) * 0.1;
  selectionRing.material.opacity = ringOpacity;

  renderer.render(scene, camera);
  updateDiagnostics(delta);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

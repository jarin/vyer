import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Norwegian railway network data - comprehensive topological representation
// Coordinates based on approximate geographical positions, adjusted for 3D visualization
const railwayData = {
  stations: {
    // Oslo and vicinity
    'Oslo S': { x: 0, y: 0, z: 0, elevation: 0.1 },
    'Nationaltheatret': { x: -1, y: 0, z: 0.5, elevation: 0.1 },
    'Skøyen': { x: -2, y: 0, z: -0.5, elevation: 0.1 },
    'Lysaker': { x: -3, y: 0, z: -1, elevation: 0.1 },
    'Sandvika': { x: -5, y: 0, z: -2, elevation: 0.1 },
    'Asker': { x: -7, y: 0, z: -1, elevation: 0.15 },

    // Østfold line (southeast - vestre linje via Moss)
    'Loenga': { x: 1, y: 0, z: 2, elevation: 0.05 },
    'Ski': { x: 3, y: 0, z: 8, elevation: 0.2 },
    'Ås': { x: 3.5, y: 0, z: 10, elevation: 0.25 },
    'Vestby': { x: 4, y: 0, z: 14, elevation: 0.2 },
    'Moss': { x: 5, y: 0, z: 20, elevation: 0.05 },
    'Rygge': { x: 6, y: 0, z: 23, elevation: 0.1 },
    'Fredrikstad': { x: 7, y: 0, z: 28, elevation: 0.05 },
    'Sarpsborg': { x: 8, y: 0, z: 32, elevation: 0.1 },
    'Halden': { x: 10, y: 0, z: 40, elevation: 0.15 },
    'Kornsjø': { x: 12, y: 0, z: 48, elevation: 0.3 },

    // Østre linje (eastern line from Ski to Sweden)
    'Spydeberg': { x: 6, y: 0, z: 10, elevation: 0.2 },
    'Askim': { x: 8, y: 0, z: 12, elevation: 0.15 },
    'Mysen': { x: 10, y: 0, z: 14, elevation: 0.15 },
    'Rakkestad': { x: 13, y: 0, z: 18, elevation: 0.2 },

    // Gjøvik line (north from Oslo)
    'Grefsen': { x: 1, y: 0, z: -3, elevation: 0.2 },
    'Nydalen': { x: 0.5, y: 0, z: -1.5, elevation: 0.15 },
    'Roa': { x: -3, y: 0.5, z: -12, elevation: 0.8 },
    'Lunner': { x: -2, y: 0.8, z: -18, elevation: 1.2 },
    'Gjøvik': { x: -1, y: 1, z: -25, elevation: 1.5 },

    // Vestfold line (Drammen to Porsgrunn along coast)
    'Drammen': { x: -10, y: 0, z: 2, elevation: 0.1 },
    'Sande': { x: -9, y: 0, z: 6, elevation: 0.05 },
    'Holmestrand': { x: -8, y: 0, z: 8, elevation: 0.05 },
    'Tønsberg': { x: -7, y: 0, z: 12, elevation: 0.05 },
    'Sandefjord': { x: -6, y: 0, z: 15, elevation: 0.05 },
    'Larvik': { x: -5, y: 0, z: 18, elevation: 0.05 },
    'Porsgrunn': { x: -4, y: 0, z: 22, elevation: 0.1 },
    'Skien': { x: -4.5, y: 0, z: 24, elevation: 0.15 },

    // Bratsberg line (Porsgrunn to Notodden)
    'Notodden': { x: -6, y: 0.5, z: 27, elevation: 0.6 },

    // Bergen line (west from Drammen)
    'Mjøndalen': { x: -11, y: 0, z: 0, elevation: 0.15 },
    'Hokksund': { x: -12, y: 0.3, z: -2, elevation: 0.3 },
    'Vikersund': { x: -13, y: 0.5, z: -4, elevation: 0.5 },
    'Hønefoss': { x: -14, y: 0.8, z: -8, elevation: 1.2 },
    'Nesbyen': { x: -20, y: 2, z: -12, elevation: 2.5 },
    'Gol': { x: -26, y: 3.5, z: -15, elevation: 4 },
    'Ål': { x: -30, y: 4.5, z: -17, elevation: 4.8 },
    'Geilo': { x: -36, y: 6, z: -19, elevation: 6.5 },
    'Ustaoset': { x: -40, y: 7.5, z: -20, elevation: 8 },
    'Haugastøl': { x: -44, y: 8, z: -21, elevation: 8.5 },
    'Finse': { x: -48, y: 9, z: -22, elevation: 9.5 },
    'Hallingskeid': { x: -52, y: 8, z: -23, elevation: 8.8 },
    'Myrdal': { x: -56, y: 6.5, z: -24, elevation: 7 },
    'Voss': { x: -64, y: 3, z: -26, elevation: 2.5 },
    'Dale': { x: -70, y: 1.5, z: -27, elevation: 1.2 },
    'Arna': { x: -76, y: 0.5, z: -28, elevation: 0.5 },
    'Bergen': { x: -80, y: 0, z: -28, elevation: 0.1 },

    // Flåm line (branch from Myrdal)
    'Vatnahalsen': { x: -57, y: 5.5, z: -26, elevation: 6 },
    'Kjosfossen': { x: -58, y: 4, z: -28, elevation: 4.5 },
    'Berekvam': { x: -59, y: 2.5, z: -30, elevation: 3 },
    'Flåm': { x: -60, y: 0, z: -32, elevation: 0.05 },

    // Dovre line (north from Oslo)
    'Lillestrøm': { x: 4, y: 0, z: -4, elevation: 0.15 },
    'Dal': { x: 5, y: 0, z: -7, elevation: 0.2 },
    'Eidsvoll': { x: 6, y: 0, z: -12, elevation: 0.25 },
    'Minnesund': { x: 7, y: 0, z: -16, elevation: 0.3 },
    'Tangen': { x: 8, y: 0, z: -20, elevation: 0.3 },
    'Hamar': { x: 9, y: 0, z: -24, elevation: 0.35 },
    'Brumunddal': { x: 9.5, y: 0.2, z: -28, elevation: 0.5 },
    'Moelv': { x: 10, y: 0.4, z: -31, elevation: 0.7 },
    'Lillehammer': { x: 11, y: 1, z: -36, elevation: 1.5 },
    'Vinstra': { x: 11.5, y: 2, z: -42, elevation: 2.8 },
    'Otta': { x: 12, y: 3, z: -48, elevation: 3.5 },
    'Dombås': { x: 12.5, y: 4.5, z: -54, elevation: 5 },
    'Lesja': { x: 13, y: 5, z: -58, elevation: 5.5 },
    'Bjorli': { x: 13.5, y: 6, z: -62, elevation: 6.2 },
    'Åndalsnes': { x: 14.5, y: 0.5, z: -64, elevation: 0.3 },
    'Oppdal': { x: 13, y: 5.5, z: -68, elevation: 6 },
    'Støren': { x: 14, y: 2, z: -78, elevation: 2.5 },
    'Trondheim S': { x: 15, y: 0, z: -88, elevation: 0.1 },

    // Røros line (east from Oslo)
    'Elverum': { x: 16, y: 0.5, z: -18, elevation: 0.8 },
    'Koppang': { x: 20, y: 1.5, z: -26, elevation: 2 },
    'Tynset': { x: 24, y: 2.5, z: -34, elevation: 3.5 },
    'Røros': { x: 28, y: 3.5, z: -42, elevation: 5 },
    'Os': { x: 26, y: 2, z: -54, elevation: 3 },

    // Nordland line (north from Trondheim)
    'Steinkjer': { x: 16, y: 0, z: -100, elevation: 0.2 },
    'Grong': { x: 17, y: 0.5, z: -115, elevation: 0.8 },
    'Mosjøen': { x: 18, y: 0.3, z: -135, elevation: 0.5 },
    'Mo i Rana': { x: 19, y: 0.5, z: -150, elevation: 0.8 },
    'Rognan': { x: 20, y: 0.3, z: -162, elevation: 0.5 },
    'Fauske': { x: 21, y: 0.2, z: -172, elevation: 0.4 },
    'Bodø': { x: 22, y: 0, z: -185, elevation: 0.05 },

    // Sørland line (southwest from Oslo via Kongsberg)
    'Kongsberg': { x: -14, y: 0.5, z: 4, elevation: 0.8 },
    'Nordagutu': { x: -10, y: 0.3, z: 24, elevation: 0.3 },
    'Bø': { x: -8, y: 0.2, z: 26, elevation: 0.25 },
    'Lunde': { x: -12, y: 0, z: 29, elevation: 0.2 },
    'Kristiansand': { x: -28, y: 0, z: 36, elevation: 0.05 },
    'Vennesla': { x: -30, y: 0, z: 38, elevation: 0.1 },
    'Marnardal': { x: -35, y: 0, z: 40, elevation: 0.15 },
    'Egersund': { x: -48, y: 0, z: 42, elevation: 0.1 },
    'Sandnes': { x: -54, y: 0, z: 44, elevation: 0.1 },
    'Stavanger': { x: -58, y: 0, z: 45, elevation: 0.05 },

    // Meråker line (to Sweden from Trondheim)
    'Hell': { x: 16, y: 0, z: -84, elevation: 0.15 },
    'Hegra': { x: 22, y: 1, z: -80, elevation: 1.5 },
    'Meråker': { x: 30, y: 2.5, z: -78, elevation: 3.5 },
    'Storlien': { x: 38, y: 2, z: -76, elevation: 3 },
  },

  lines: [
    {
      name: 'Bergensbanen',
      color: 0xff4444,
      stations: ['Oslo S', 'Nationaltheatret', 'Skøyen', 'Lysaker', 'Sandvika', 'Asker', 'Drammen',
                'Mjøndalen', 'Hokksund', 'Vikersund', 'Hønefoss', 'Nesbyen', 'Gol', 'Ål', 'Geilo', 'Ustaoset',
                'Haugastøl', 'Finse', 'Hallingskeid', 'Myrdal', 'Voss', 'Dale', 'Arna', 'Bergen']
    },
    {
      name: 'Vestfoldbanen',
      color: 0x00aaff,
      stations: ['Drammen', 'Sande', 'Holmestrand', 'Tønsberg', 'Sandefjord', 'Larvik', 'Porsgrunn', 'Skien']
    },
    {
      name: 'Bratsbergbanen',
      color: 0xaa00ff,
      stations: ['Porsgrunn', 'Notodden']
    },
    {
      name: 'Flåmsbana',
      color: 0xff00ff,
      stations: ['Myrdal', 'Vatnahalsen', 'Kjosfossen', 'Berekvam', 'Flåm']
    },
    {
      name: 'Dovrebanen',
      color: 0x44ff44,
      stations: ['Oslo S', 'Lillestrøm', 'Dal', 'Eidsvoll', 'Minnesund', 'Tangen', 'Hamar',
                'Brumunddal', 'Moelv', 'Lillehammer', 'Vinstra', 'Otta', 'Dombås', 'Lesja',
                'Oppdal', 'Støren', 'Trondheim S']
    },
    {
      name: 'Raumabanen',
      color: 0x00ffff,
      stations: ['Dombås', 'Bjorli', 'Åndalsnes']
    },
    {
      name: 'Nordlandsbanen',
      color: 0xffaa00,
      stations: ['Trondheim S', 'Steinkjer', 'Grong', 'Mosjøen', 'Mo i Rana', 'Rognan', 'Fauske', 'Bodø']
    },
    {
      name: 'Sørlandsbanen',
      color: 0x4444ff,
      stations: ['Oslo S', 'Nationaltheatret', 'Skøyen', 'Lysaker', 'Sandvika', 'Asker', 'Drammen',
                'Mjøndalen', 'Hokksund', 'Kongsberg', 'Nordagutu', 'Bø', 'Lunde', 'Kristiansand',
                'Vennesla', 'Marnardal', 'Egersund', 'Sandnes', 'Stavanger']
    },
    {
      name: 'Østfoldbanen (Vestre)',
      color: 0xff8800,
      stations: ['Oslo S', 'Loenga', 'Ski', 'Ås', 'Vestby', 'Moss', 'Rygge', 'Fredrikstad', 'Sarpsborg', 'Halden', 'Kornsjø']
    },
    {
      name: 'Østfoldbanen (Østre)',
      color: 0xff6600,
      stations: ['Ski', 'Spydeberg', 'Askim', 'Mysen', 'Rakkestad']
    },
    {
      name: 'Gjøvikbanen',
      color: 0x88ff00,
      stations: ['Oslo S', 'Nydalen', 'Grefsen', 'Roa', 'Lunner', 'Gjøvik']
    },
    {
      name: 'Rørosbanen',
      color: 0xff0088,
      stations: ['Hamar', 'Elverum', 'Koppang', 'Tynset', 'Røros', 'Os', 'Trondheim S']
    },
    {
      name: 'Meråkerbanen',
      color: 0x00ff88,
      stations: ['Trondheim S', 'Hell', 'Hegra', 'Meråker', 'Storlien']
    },
    {
      name: 'Jærbanen',
      color: 0x8800ff,
      stations: ['Stavanger', 'Sandnes', 'Egersund']
    }
  ]
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 80, 250);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(50, 60, 50);
camera.lookAt(0, 0, -50);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 200;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0x4488ff, 0.4);
directionalLight2.position.set(-50, 50, -100);
scene.add(directionalLight2);

// Simplex noise-like function for terrain generation
function noise2D(x, z, seed = 0) {
  const X = Math.floor(x) + seed;
  const Z = Math.floor(z) + seed;
  const xf = x - Math.floor(x);
  const zf = z - Math.floor(z);

  // Simple hash function
  const hash = (a, b) => {
    let h = a * 374761393 + b * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) / 2147483648.0;
  };

  const n00 = hash(X, Z);
  const n10 = hash(X + 1, Z);
  const n01 = hash(X, Z + 1);
  const n11 = hash(X + 1, Z + 1);

  // Smoothstep interpolation
  const sx = xf * xf * (3 - 2 * xf);
  const sz = zf * zf * (3 - 2 * zf);

  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;

  return nx0 * (1 - sz) + nx1 * sz;
}

// Fractal noise (multiple octaves)
function fractalNoise(x, z, octaves = 4, persistence = 0.5) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency * 0.05, z * frequency * 0.05, i) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}

// Create base terrain with height map
function createBaseTerrain() {
  const width = 180;
  const depth = 400;
  const widthSegments = 90;
  const depthSegments = 200;

  const geometry = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
  const vertices = geometry.attributes.position.array;

  // Create Norway-like shape with terrain
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 1];

    // Base terrain height from fractal noise
    let height = fractalNoise(x, z, 4, 0.5) * 2;

    // Add mountain regions
    // Western mountains (Bergen line)
    const distWest = Math.sqrt(Math.pow(x + 45, 2) + Math.pow(z + 22, 2));
    if (distWest < 35) {
      height += (1 - distWest / 35) * 8 * fractalNoise(x * 0.5, z * 0.5, 3, 0.6);
    }

    // Central mountains (Dovre/Jotunheimen)
    const distCentral = Math.sqrt(Math.pow(x - 12, 2) + Math.pow(z + 60, 2));
    if (distCentral < 30) {
      height += (1 - distCentral / 30) * 7 * fractalNoise(x * 0.4, z * 0.4, 3, 0.6);
    }

    // Røros mountains
    const distRoros = Math.sqrt(Math.pow(x - 28, 2) + Math.pow(z + 42, 2));
    if (distRoros < 25) {
      height += (1 - distRoros / 25) * 5 * fractalNoise(x * 0.3, z * 0.3, 3, 0.5);
    }

    // Coastal lowlands (Oslo fjord area and south/southeast)
    if (x > -15 && x < 20 && z > -10 && z < 50) {
      height *= 0.25;
    }

    // Northern terrain - more modest
    if (z < -100) {
      height = Math.max(0, height * 0.5 + fractalNoise(x, z, 2, 0.4) * 2);
    }

    vertices[i + 2] = Math.max(-0.5, height); // y coordinate
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    color: 0x4a5c3a,
    flatShading: false,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.5;
  terrain.position.z = -50;

  return terrain;
}

// Create water features (Oslofjorden and coast)
function createWater() {
  const waterGroup = new THREE.Group();

  // Oslofjorden
  const fjordShape = new THREE.Shape();
  fjordShape.moveTo(0, 0);
  fjordShape.lineTo(-3, 8);
  fjordShape.lineTo(-5, 12);
  fjordShape.lineTo(-8, 18);
  fjordShape.lineTo(-10, 22);
  fjordShape.quadraticCurveTo(-12, 26, -8, 30);
  fjordShape.lineTo(-5, 32);
  fjordShape.lineTo(0, 35);
  fjordShape.lineTo(5, 32);
  fjordShape.lineTo(8, 28);
  fjordShape.lineTo(10, 24);
  fjordShape.lineTo(8, 18);
  fjordShape.lineTo(5, 12);
  fjordShape.lineTo(3, 6);
  fjordShape.lineTo(0, 0);

  const fjordGeometry = new THREE.ShapeGeometry(fjordShape);
  const waterMaterial = new THREE.MeshLambertMaterial({
    color: 0x1a4d7a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });

  const fjord = new THREE.Mesh(fjordGeometry, waterMaterial);
  fjord.rotation.x = -Math.PI / 2;
  fjord.position.y = 0.05;
  waterGroup.add(fjord);

  // Western coastline water
  const westCoastShape = new THREE.Shape();
  westCoastShape.moveTo(-80, -30);
  westCoastShape.lineTo(-85, -28);
  westCoastShape.lineTo(-85, 0);
  westCoastShape.lineTo(-70, 10);
  westCoastShape.lineTo(-65, 25);
  westCoastShape.lineTo(-60, 35);
  westCoastShape.lineTo(-62, 45);
  westCoastShape.lineTo(-65, 50);
  westCoastShape.lineTo(-80, 50);
  westCoastShape.lineTo(-80, -30);

  const westCoast = new THREE.Mesh(new THREE.ShapeGeometry(westCoastShape), waterMaterial);
  westCoast.rotation.x = -Math.PI / 2;
  westCoast.position.y = 0.05;
  waterGroup.add(westCoast);

  // Northern coast water
  const northCoastShape = new THREE.Shape();
  northCoastShape.moveTo(10, -90);
  northCoastShape.lineTo(0, -100);
  northCoastShape.lineTo(5, -140);
  northCoastShape.lineTo(10, -180);
  northCoastShape.lineTo(15, -190);
  northCoastShape.lineTo(30, -195);
  northCoastShape.lineTo(30, -90);
  northCoastShape.lineTo(10, -90);

  const northCoast = new THREE.Mesh(new THREE.ShapeGeometry(northCoastShape), waterMaterial);
  northCoast.rotation.x = -Math.PI / 2;
  northCoast.position.y = 0.05;
  waterGroup.add(northCoast);

  // Southeastern coast (Østfold area)
  const eastCoastShape = new THREE.Shape();
  eastCoastShape.moveTo(8, 28);
  eastCoastShape.lineTo(15, 30);
  eastCoastShape.lineTo(18, 40);
  eastCoastShape.lineTo(16, 50);
  eastCoastShape.lineTo(10, 52);
  eastCoastShape.lineTo(8, 45);
  eastCoastShape.lineTo(10, 35);
  eastCoastShape.lineTo(8, 28);

  const eastCoast = new THREE.Mesh(new THREE.ShapeGeometry(eastCoastShape), waterMaterial);
  eastCoast.rotation.x = -Math.PI / 2;
  eastCoast.position.y = 0.05;
  waterGroup.add(eastCoast);

  return waterGroup;
}

// Create terrain/mountains
function createTerrain() {
  const terrainGroup = new THREE.Group();

  // Add base fractal terrain
  terrainGroup.add(createBaseTerrain());

  // Add water features
  terrainGroup.add(createWater());

  return terrainGroup;
}

// Sample terrain height at position
function getTerrainHeight(x, z) {
  // Base terrain height from fractal noise
  let height = fractalNoise(x, z, 4, 0.5) * 2;

  // Add mountain regions (same logic as createBaseTerrain)
  // Western mountains (Bergen line)
  const distWest = Math.sqrt(Math.pow(x + 45, 2) + Math.pow(z + 22, 2));
  if (distWest < 35) {
    height += (1 - distWest / 35) * 8 * fractalNoise(x * 0.5, z * 0.5, 3, 0.6);
  }

  // Central mountains (Dovre/Jotunheimen)
  const distCentral = Math.sqrt(Math.pow(x - 12, 2) + Math.pow(z + 60, 2));
  if (distCentral < 30) {
    height += (1 - distCentral / 30) * 7 * fractalNoise(x * 0.4, z * 0.4, 3, 0.6);
  }

  // Røros mountains
  const distRoros = Math.sqrt(Math.pow(x - 28, 2) + Math.pow(z + 42, 2));
  if (distRoros < 25) {
    height += (1 - distRoros / 25) * 5 * fractalNoise(x * 0.3, z * 0.3, 3, 0.5);
  }

  // Coastal lowlands (Oslo fjord area and south/southeast)
  if (x > -15 && x < 20 && z > -10 && z < 50) {
    height *= 0.25;
  }

  // Northern terrain - more modest
  if (z < -100) {
    height = Math.max(0, height * 0.5 + fractalNoise(x, z, 2, 0.4) * 2);
  }

  return Math.max(-0.5, height);
}

// Store line meshes and curves for API access
const lineMeshes = new Map();
const lineCurves = new Map();

// Create railway lines
function createRailwayLines() {
  const linesGroup = new THREE.Group();
  const lineElevation = 4.0; // Height above terrain to ensure visibility

  railwayData.lines.forEach(line => {
    const points = [];

    line.stations.forEach(stationName => {
      const station = railwayData.stations[stationName];
      // Sample terrain height and elevate above it
      const terrainHeight = getTerrainHeight(station.x, station.z);
      const finalHeight = Math.max(terrainHeight + lineElevation, station.elevation + lineElevation);
      points.push(new THREE.Vector3(station.x, finalHeight, station.z));
    });

    // Create smooth curve
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.35, 8, false);
    const tubeMaterial = new THREE.MeshLambertMaterial({
      color: line.color,
      emissive: line.color,
      emissiveIntensity: 0.5,
      depthTest: true,
      depthWrite: true
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.renderOrder = 1; // Render after terrain
    tube.userData = { lineName: line.name, originalColor: line.color };
    linesGroup.add(tube);

    // Store references for API
    lineMeshes.set(line.name, tube);
    lineCurves.set(line.name, curve);
  });

  return linesGroup;
}

// Create text sprite for station labels
function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = 'Bold 48px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(4, 1, 1);

  return sprite;
}

// Create station markers
function createStations() {
  const stationsGroup = new THREE.Group();
  const lineElevation = 4.0; // Match railway line elevation

  Object.entries(railwayData.stations).forEach(([name, data]) => {
    // Sample terrain height and elevate above it
    const terrainHeight = getTerrainHeight(data.x, data.z);
    const stationHeight = Math.max(terrainHeight + lineElevation, data.elevation + lineElevation);

    // Station sphere
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.6
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(data.x, stationHeight, data.z);
    sphere.renderOrder = 2; // Render on top of lines
    stationsGroup.add(sphere);

    // Station pillar (connecting to terrain below)
    const pillarHeight = stationHeight - terrainHeight;
    if (pillarHeight > 0.5) {
      const pillarGeometry = new THREE.CylinderGeometry(0.08, 0.08, pillarHeight, 8);
      const pillarMaterial = new THREE.MeshLambertMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.4
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(data.x, terrainHeight + pillarHeight / 2, data.z);
      stationsGroup.add(pillar);
    }

    // Station label
    const label = createTextSprite(name);
    label.position.set(data.x, stationHeight + 1.2, data.z);
    label.renderOrder = 3; // Always on top
    stationsGroup.add(label);
  });

  return stationsGroup;
}

// Add everything to scene
scene.add(createTerrain());
scene.add(createRailwayLines());
scene.add(createStations());

// Train animation system
const trains = new Map();
let trainIdCounter = 0;

function createTrain(color = 0xffff00) {
  const geometry = new THREE.SphereGeometry(0.8, 16, 16);
  const material = new THREE.MeshLambertMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.8
  });
  const train = new THREE.Mesh(geometry, material);
  train.renderOrder = 3;
  scene.add(train);
  return train;
}

function animateTrain(trainId, lineName, duration = 10000, loop = false) {
  const curve = lineCurves.get(lineName);
  if (!curve) {
    console.error(`Line ${lineName} not found`);
    return;
  }

  const train = trains.get(trainId);
  if (!train) {
    console.error(`Train ${trainId} not found`);
    return;
  }

  const startTime = Date.now();
  train.userData.animating = true;
  train.userData.lineName = lineName;
  train.userData.duration = duration;
  train.userData.startTime = startTime;
  train.userData.loop = loop;
}

function updateTrains() {
  const now = Date.now();

  trains.forEach((train, trainId) => {
    if (!train.userData.animating) return;

    const elapsed = now - train.userData.startTime;
    const duration = train.userData.duration;
    let t = Math.min(elapsed / duration, 1);

    if (t >= 1) {
      if (train.userData.loop) {
        train.userData.startTime = now;
        t = 0;
      } else {
        train.userData.animating = false;
        return;
      }
    }

    const curve = lineCurves.get(train.userData.lineName);
    if (curve) {
      const point = curve.getPoint(t);
      train.position.copy(point);
      train.position.y += 0.5; // Slightly above the track
    }
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateTrains(); // Update train positions
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Public API for highlighting and changing line colors
window.railwayAPI = {
  // Highlight a specific line (dim others)
  highlightLine: (lineName) => {
    lineMeshes.forEach((mesh, name) => {
      if (name === lineName) {
        mesh.material.emissiveIntensity = 1.0;
        mesh.material.opacity = 1.0;
      } else {
        mesh.material.emissiveIntensity = 0.2;
        mesh.material.transparent = true;
        mesh.material.opacity = 0.3;
      }
    });
  },

  // Reset all lines to normal state
  resetHighlight: () => {
    lineMeshes.forEach((mesh) => {
      mesh.material.emissiveIntensity = 0.5;
      mesh.material.transparent = false;
      mesh.material.opacity = 1.0;
    });
  },

  // Change the color of a specific line
  setLineColor: (lineName, color) => {
    const mesh = lineMeshes.get(lineName);
    if (mesh) {
      const newColor = new THREE.Color(color);
      mesh.material.color.set(newColor);
      mesh.material.emissive.set(newColor);
    }
  },

  // Reset line to original color
  resetLineColor: (lineName) => {
    const mesh = lineMeshes.get(lineName);
    if (mesh) {
      const originalColor = mesh.userData.originalColor;
      mesh.material.color.set(originalColor);
      mesh.material.emissive.set(originalColor);
    }
  },

  // Reset all lines to original colors
  resetAllColors: () => {
    lineMeshes.forEach((mesh) => {
      const originalColor = mesh.userData.originalColor;
      mesh.material.color.set(originalColor);
      mesh.material.emissive.set(originalColor);
    });
  },

  // Get list of all line names
  getLines: () => {
    return Array.from(lineMeshes.keys());
  },

  // Train animation methods
  createTrain: (color = 0xffff00) => {
    const train = createTrain(color);
    const trainId = `train_${trainIdCounter++}`;
    trains.set(trainId, train);
    train.visible = false; // Hide until animated
    return trainId;
  },

  startTrain: (trainId, lineName, duration = 10000, loop = false) => {
    const train = trains.get(trainId);
    if (train) {
      train.visible = true;
      animateTrain(trainId, lineName, duration, loop);
    }
  },

  stopTrain: (trainId) => {
    const train = trains.get(trainId);
    if (train) {
      train.userData.animating = false;
    }
  },

  removeTrain: (trainId) => {
    const train = trains.get(trainId);
    if (train) {
      scene.remove(train);
      trains.delete(trainId);
    }
  },

  hideTrains: () => {
    trains.forEach(train => train.visible = false);
  },

  showTrains: () => {
    trains.forEach(train => train.visible = true);
  }
};

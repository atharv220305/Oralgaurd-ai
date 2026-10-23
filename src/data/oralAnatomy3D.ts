import * as THREE from 'three';
import {
  ALL_TEETH,
  ToothDefinition,
  ToothGeometricProfile,
  getToothDefinition,
  getToothGeometricProfile,
} from './teethData';

export interface Anatomical3DStructure {
  id: string;
  name: string;
  fullName: string;
  category: 'tooth' | 'gingiva' | 'tongue' | 'palate' | 'cheek' | 'lip' | 'throat';
  arch?: 'maxillary' | 'mandibular';
  toothNumber?: string;
  center: THREE.Vector3;
  size: THREE.Vector3;
}

// ---------------------------------------------------------------------------
// 1. ANATOMICALLY ACCURATE U-SHAPED SPLINE ARCH
// Replaces the empirical power curve with a smooth Catmull-Rom spline
// passing through dental anatomical landmarks for maxillary and mandibular arches.
// ---------------------------------------------------------------------------

// Control points for the maxillary (upper) dental arch spline
// Origin (0,0,0) is center of mouth; +X is patient's left, -X is patient's right;
// +Y is superior (maxillary), -Y is inferior (mandibular); +Z is anterior (lips), -Z is posterior (pharynx)
const UPPER_ARCH_LANDMARKS = [
  new THREE.Vector3(-2.45, 0.70, -1.55), // Q1: 18 - 3rd Molar
  new THREE.Vector3(-2.34, 0.69, -0.92), // Q1: 17 - 2nd Molar
  new THREE.Vector3(-2.14, 0.68, -0.26), // Q1: 16 - 1st Molar
  new THREE.Vector3(-1.82, 0.68, 0.35),  // Q1: 15 - 2nd Premolar
  new THREE.Vector3(-1.48, 0.69, 0.82),  // Q1: 14 - 1st Premolar
  new THREE.Vector3(-1.05, 0.70, 1.25),  // Q1: 13 - Canine (arch corner turning point)
  new THREE.Vector3(-0.52, 0.71, 1.54),  // Q1: 12 - Lateral Incisor
  new THREE.Vector3(0.00,  0.72, 1.62),  // Midline contact between 11 & 21
  new THREE.Vector3(0.52,  0.71, 1.54),  // Q2: 22 - Lateral Incisor
  new THREE.Vector3(1.05,  0.70, 1.25),  // Q2: 23 - Canine (arch corner turning point)
  new THREE.Vector3(1.48,  0.69, 0.82),  // Q2: 24 - 1st Premolar
  new THREE.Vector3(1.82,  0.68, 0.35),  // Q2: 25 - 2nd Premolar
  new THREE.Vector3(2.14,  0.68, -0.26), // Q2: 26 - 1st Molar
  new THREE.Vector3(2.34,  0.69, -0.92), // Q2: 27 - 2nd Molar
  new THREE.Vector3(2.45,  0.70, -1.55), // Q2: 28 - 3rd Molar
];

// Control points for the mandibular (lower) dental arch spline
// Form-fitted to Class I dental occlusion: sits slightly lingual to the maxillary arch (~1.5mm overjet/overbite)
const LOWER_ARCH_LANDMARKS = [
  new THREE.Vector3(-2.26, -0.66, -1.52), // Q4: 48 - 3rd Molar
  new THREE.Vector3(-2.16, -0.68, -0.90), // Q4: 47 - 2nd Molar
  new THREE.Vector3(-1.96, -0.71, -0.28), // Q4: 46 - 1st Molar
  new THREE.Vector3(-1.66, -0.73, 0.30),  // Q4: 45 - 2nd Premolar
  new THREE.Vector3(-1.36, -0.72, 0.76),  // Q4: 44 - 1st Premolar
  new THREE.Vector3(-0.95, -0.71, 1.16),  // Q4: 43 - Canine
  new THREE.Vector3(-0.46, -0.70, 1.44),  // Q4: 42 - Lateral Incisor
  new THREE.Vector3(0.00,  -0.70, 1.50),  // Midline contact between 41 & 31
  new THREE.Vector3(0.46,  -0.70, 1.44),  // Q3: 32 - Lateral Incisor
  new THREE.Vector3(0.95,  -0.71, 1.16),  // Q3: 33 - Canine
  new THREE.Vector3(1.36,  -0.72, 0.76),  // Q3: 34 - 1st Premolar
  new THREE.Vector3(1.66,  -0.73, 0.30),  // Q3: 35 - 2nd Premolar
  new THREE.Vector3(1.96,  -0.71, -0.28), // Q3: 36 - 1st Molar
  new THREE.Vector3(2.16,  -0.68, -0.90), // Q3: 37 - 2nd Molar
  new THREE.Vector3(2.26,  -0.66, -1.52), // Q3: 38 - 3rd Molar
];

// Reusable Catmull-Rom spline instances
export const UPPER_ARCH_SPLINE = new THREE.CatmullRomCurve3(UPPER_ARCH_LANDMARKS, false, 'centripetal');
export const LOWER_ARCH_SPLINE = new THREE.CatmullRomCurve3(LOWER_ARCH_LANDMARKS, false, 'centripetal');

export function getArchSpline(isUpper: boolean): THREE.CatmullRomCurve3 {
  return isUpper ? UPPER_ARCH_SPLINE : LOWER_ARCH_SPLINE;
}

// Normalized spline parameter (t in [0, 1]) for each FDI tooth number
// t = 0.5 is anterior midline.
// t < 0.5 is patient's right (quadrant 1 or 4).
// t > 0.5 is patient's left (quadrant 2 or 3).
export function getToothArchSplineParameter(fdi: number, isUpper: boolean): { t: number; toothIndex: number } {
  const index = fdi % 10; // 1 to 8 (central incisor to 3rd molar)
  const isRight = (fdi >= 11 && fdi <= 18) || (fdi >= 41 && fdi <= 48);

  // Calibrated cumulative offsets along spline half-length from midline (0.50)
  // Ensures natural interdental contact points without tooth collision or unnatural gaps
  const offsetsUpper: Record<number, number> = {
    1: 0.038, // Central incisor
    2: 0.098, // Lateral incisor
    3: 0.165, // Canine (cuspid)
    4: 0.232, // 1st Premolar
    5: 0.298, // 2nd Premolar
    6: 0.368, // 1st Molar
    7: 0.432, // 2nd Molar
    8: 0.482, // 3rd Molar (wisdom tooth)
  };

  const offsetsLower: Record<number, number> = {
    1: 0.032, // Central incisor (slender)
    2: 0.088, // Lateral incisor
    3: 0.154, // Canine
    4: 0.222, // 1st Premolar
    5: 0.288, // 2nd Premolar
    6: 0.360, // 1st Molar
    7: 0.428, // 2nd Molar
    8: 0.480, // 3rd Molar
  };

  const offset = (isUpper ? offsetsUpper[index] : offsetsLower[index]) || 0.04;
  const t = isRight ? 0.5 - offset : 0.5 + offset;

  return {
    t: Math.min(0.99, Math.max(0.01, t)),
    toothIndex: index,
  };
}

// ---------------------------------------------------------------------------
// 2. CERVICAL PLACEMENT & COMPOUND ANGULATION
// Accurately positions tooth meshes so that the cervical collar intersects the
// gingival mesh naturally: ZERO floating geometry, and REDUCED excessive mesh overlap.
// ---------------------------------------------------------------------------

export function getTooth3DPlacement(tooth: ToothDefinition): {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  cervicalOffset: number;
} {
  const isUpper = tooth.arch === 'maxillary';
  const profile = tooth.profile || getToothGeometricProfile(tooth);
  const spline = getArchSpline(isUpper);
  const { t, toothIndex } = getToothArchSplineParameter(tooth.fdiNumber, isUpper);

  // Sample exact 3D position and tangent along the anatomical U-shaped spline
  const spinePos = spline.getPointAt(t);
  const tangent = spline.getTangentAt(t).normalize();

  // Tangent horizontal angle in XZ plane
  const tangentAngle = Math.atan2(tangent.x, tangent.z);

  // Outward normal vector facing the facial/buccal surface (lips and cheeks)
  // For patient's left (t > 0.5): tangent flows posterior-to-anterior or anterior-to-posterior
  // We establish consistent outward facial normal:
  const isRight = tooth.quadrant === 1 || tooth.quadrant === 4;
  const facialAngle = isRight ? tangentAngle + Math.PI / 2 : tangentAngle - Math.PI / 2;

  // Cervical insertion depth into gingival cuff:
  // Ensures tooth root collar is embedded by ~0.08 - 0.10 units inside the gingival volume
  // so there is zero gap, while preserving 100% of the visible clinical crown outside.
  const insertionDepth = profile.cervicalOffset || 0.09;

  // The gingival surface margin is offset from the spline bone ridge:
  // Upper gingival surface is at spinePos.y - 0.22
  // Lower gingival surface is at spinePos.y + 0.22
  // The tooth's cervical finish line sits right at the gingival margin, penetrating by insertionDepth.
  const yCervical = isUpper
    ? spinePos.y - 0.22 + insertionDepth * 0.5
    : spinePos.y + 0.22 - insertionDepth * 0.5;

  const position = new THREE.Vector3(spinePos.x, yCervical, spinePos.z);

  // Compound 3D Angulation:
  // 1. Labial/Lingual Torque (facial proclination or lingual tilt)
  const torque = profile.labialTorque || 0;
  // 2. Mesiodistal Tip (axial angulation towards midline)
  const tipSign = isRight ? -1 : 1;
  const tip = tipSign * (profile.mesiodistalTip || 0);
  // 3. Sagittal Curve of Spee alignment
  const speePitch = isUpper ? -(1 - Math.abs(t - 0.5) * 2) * 0.04 : (1 - Math.abs(t - 0.5) * 2) * 0.05;

  // Tooth orientation:
  // Note: For upper teeth, crown extends downward (-Y) towards occlusal plane.
  // We orient rotation so local Z faces facial/buccal and local Y aligns with tooth long axis.
  const rotation = new THREE.Euler(
    speePitch + (isUpper ? -torque : torque) * Math.cos(facialAngle),
    facialAngle,
    tip + (isUpper ? -torque : torque) * Math.sin(facialAngle),
    'YXZ'
  );

  // Scale derived directly from calibrated ToothGeometricProfile
  const scale = new THREE.Vector3(
    profile.mesiodistalWidth * 0.50,
    profile.crownHeight * 0.52,
    profile.labiolingualDepth * 0.50
  );

  return {
    position,
    rotation,
    scale,
    cervicalOffset: insertionDepth,
  };
}

// ---------------------------------------------------------------------------
// 3. DISTINCT PROCEDURAL TOOTH GEOMETRY GENERATORS
// Defines distinct, morphologically accurate profiles for incisors, canines,
// premolars, and molars without bloating polygon count (~120–220 vertices each).
// ---------------------------------------------------------------------------

interface LoftSlice {
  y: number; // Vertical height in normalized tooth space
  rx: number; // Mesiodistal radius
  rz: number; // Labiolingual radius
  zOffset?: number; // Facial/lingual convexity or concavity
  cornerRound?: number; // Superellipse corner curvature (1.0 = oval, 1.8 = flat chisel/box)
}

function loftCrossSections(slices: LoftSlice[], radialSegments: number = 16): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const indices: number[] = [];
  const numSlices = slices.length;

  for (let s = 0; s < numSlices; s++) {
    const sl = slices[s];
    const zOff = sl.zOffset || 0;
    const corner = sl.cornerRound || 1.0;

    for (let r = 0; r < radialSegments; r++) {
      const phi = (r / radialSegments) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const signCos = Math.sign(cosP);
      const signSin = Math.sign(sinP);
      const px = signCos * Math.pow(Math.abs(cosP), corner) * sl.rx;
      const pz = signSin * Math.pow(Math.abs(sinP), corner) * sl.rz + zOff;

      points.push(new THREE.Vector3(px, sl.y, pz));
    }
  }

  // Quads between slice rings
  for (let s = 0; s < numSlices - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const nextR = (r + 1) % radialSegments;
      const p0 = s * radialSegments + r;
      const p1 = s * radialSegments + nextR;
      const p2 = (s + 1) * radialSegments + nextR;
      const p3 = (s + 1) * radialSegments + r;

      indices.push(p0, p1, p2);
      indices.push(p0, p2, p3);
    }
  }

  // Cervical bottom cap (embedded in gingiva)
  const botIdx = points.length;
  points.push(new THREE.Vector3(0, slices[0].y, 0));
  for (let r = 0; r < radialSegments; r++) {
    const nextR = (r + 1) % radialSegments;
    indices.push(botIdx, nextR, r);
  }

  // Incisal/occlusal top cap
  const topIdx = points.length;
  const topStart = (numSlices - 1) * radialSegments;
  points.push(new THREE.Vector3(0, slices[numSlices - 1].y, 0));
  for (let r = 0; r < radialSegments; r++) {
    const nextR = (r + 1) % radialSegments;
    indices.push(topIdx, topStart + r, topStart + nextR);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// 1. INCISOR: Chisel incisal edge, labial convexity, lingual fossa & cervical cingulum
export function createIncisorGeometry(
  profile: ToothGeometricProfile,
  isUpper: boolean,
  isCentral: boolean
): THREE.BufferGeometry {
  const h = isUpper ? (isCentral ? 1.05 : 0.94) : (isCentral ? 0.86 : 0.90);
  const w = isUpper ? (isCentral ? 0.96 : 0.82) : (isCentral ? 0.60 : 0.66);
  const d = 0.66;
  const cingulum = profile.cingulumProminence || 0.6;
  const fossa = profile.fossaDepth || 0.4;

  // In local tooth space:
  // For upper teeth: y = 0.15 is inside gingiva (cervical base), crown extends to y = -h (incisal chisel)
  // For lower teeth: y = -0.15 is inside gingiva, crown extends to y = +h
  const signY = isUpper ? -1 : 1;

  const slices: LoftSlice[] = [
    // 0: Cervical root collar (entering gingiva)
    { y: signY * (-0.18), rx: w * 0.36, rz: d * 0.36, zOffset: 0, cornerRound: 1.0 },
    // 1: Cervical margin (CEJ finish line at gum emergence)
    { y: 0.0,             rx: w * 0.42, rz: d * 0.42, zOffset: 0, cornerRound: 1.05 },
    // 2: Cervical third (prominent lingual cingulum)
    { y: signY * (h * 0.28), rx: w * 0.46, rz: d * (0.44 + cingulum * 0.06), zOffset: -0.05 * cingulum, cornerRound: 1.15 },
    // 3: Middle third (broadening labially, concave lingual fossa)
    { y: signY * (h * 0.68), rx: w * 0.49, rz: d * (0.34 - fossa * 0.08), zOffset: 0.04, cornerRound: 1.35 },
    // 4: Incisal edge (flattened chisel ridge with rounded line angles)
    { y: signY * (h * 0.96), rx: w * 0.50, rz: d * 0.14, zOffset: 0.06, cornerRound: 1.65 },
    // 5: Incisal ridge apex
    { y: signY * (h * 1.00), rx: w * 0.48, rz: d * 0.06, zOffset: 0.06, cornerRound: 1.85 },
  ];

  // If inverted for upper, sort slices by ascending Y
  if (isUpper) {
    slices.sort((a, b) => a.y - b.y);
  }

  return loftCrossSections(slices, 16);
}

// 2. CANINE: Pentagonal crown outline, sharp cusp tip, central labial ridge, robust cingulum
export function createCanineGeometry(
  profile: ToothGeometricProfile,
  isUpper: boolean
): THREE.BufferGeometry {
  const h = isUpper ? 1.15 : 1.08;
  const w = 0.86;
  const d = 0.84;
  const signY = isUpper ? -1 : 1;

  const slices: LoftSlice[] = [
    // Cervical collar (inside gingiva)
    { y: signY * (-0.18), rx: w * 0.38, rz: d * 0.38, zOffset: 0, cornerRound: 1.0 },
    // Cervical margin (CEJ)
    { y: 0.0,             rx: w * 0.44, rz: d * 0.44, zOffset: 0, cornerRound: 1.1 },
    // Robust lingual cingulum
    { y: signY * (h * 0.28), rx: w * 0.48, rz: d * 0.52, zOffset: -0.03, cornerRound: 1.2 },
    // Canine shoulder (widest mesiodistal contact diameter, prominent labial ridge)
    { y: signY * (h * 0.65), rx: w * 0.50, rz: d * 0.45, zOffset: 0.05, cornerRound: 1.35 },
    // Cusp slope narrowing
    { y: signY * (h * 0.90), rx: w * 0.32, rz: d * 0.24, zOffset: 0.05, cornerRound: 1.5 },
    // Pointed cusp tip
    { y: signY * (h * 1.00), rx: w * 0.08, rz: d * 0.08, zOffset: 0.05, cornerRound: 1.0 },
  ];

  if (isUpper) {
    slices.sort((a, b) => a.y - b.y);
  }

  return loftCrossSections(slices, 18);
}

// 3. PREMOLAR: Bicuspid occlusal table with buccal & lingual cusps and developmental central groove
export function createPremolarGeometry(
  profile: ToothGeometricProfile,
  isUpper: boolean
): THREE.BufferGeometry {
  const h = isUpper ? 0.88 : 0.84;
  const w = 0.82;
  const d = 0.92;
  const signY = isUpper ? -1 : 1;

  const geo = new THREE.BufferGeometry();
  const points: THREE.Vector3[] = [];
  const indices: number[] = [];
  const radialSegments = 18;

  // Base trunk slices
  const sliceHeights = [signY * (-0.18), 0.0, signY * (h * 0.35), signY * (h * 0.75)];
  if (isUpper) sliceHeights.sort((a, b) => a - b);

  const sliceRadii = [
    { rx: w * 0.38, rz: d * 0.40 },
    { rx: w * 0.44, rz: d * 0.46 },
    { rx: w * 0.49, rz: d * 0.50 },
    { rx: w * 0.46, rz: d * 0.47 },
  ];

  for (let s = 0; s < sliceHeights.length; s++) {
    const yVal = sliceHeights[s];
    const rad = sliceRadii[s];
    for (let r = 0; r < radialSegments; r++) {
      const phi = (r / radialSegments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(phi) * rad.rx, yVal, Math.sin(phi) * rad.rz));
    }
  }

  // Trunk quads
  for (let s = 0; s < sliceHeights.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const nextR = (r + 1) % radialSegments;
      const p0 = s * radialSegments + r;
      const p1 = s * radialSegments + nextR;
      const p2 = (s + 1) * radialSegments + nextR;
      const p3 = (s + 1) * radialSegments + r;

      if (isUpper) {
        indices.push(p0, p2, p1);
        indices.push(p0, p3, p2);
      } else {
        indices.push(p0, p1, p2);
        indices.push(p0, p2, p3);
      }
    }
  }

  // Cervical bottom cap
  const botCapIdx = points.length;
  points.push(new THREE.Vector3(0, sliceHeights[0], 0));
  for (let r = 0; r < radialSegments; r++) {
    const nextR = (r + 1) % radialSegments;
    indices.push(botCapIdx, isUpper ? r : nextR, isUpper ? nextR : r);
  }

  // Occlusal Bicuspid Sculpting:
  // Buccal cusp apex (taller, on facial side z > 0)
  const buccalCuspIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (h * 0.98), d * 0.22));

  // Lingual cusp apex (slightly shorter, on lingual side z < 0)
  const lingualCuspIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (h * 0.88), -d * 0.22));

  // Central developmental groove fissure (depression)
  const centralGrooveIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (h * 0.72), 0));

  const topRimStart = (sliceHeights.length - 1) * radialSegments;
  for (let r = 0; r < radialSegments; r++) {
    const phi = (r / radialSegments) * Math.PI * 2;
    const nextR = (r + 1) % radialSegments;
    const isBuccal = Math.sin(phi) >= 0;
    const cuspIdx = isBuccal ? buccalCuspIdx : lingualCuspIdx;

    if (isUpper) {
      indices.push(cuspIdx, topRimStart + nextR, topRimStart + r);
    } else {
      indices.push(cuspIdx, topRimStart + r, topRimStart + nextR);
    }
  }

  // Central occlusal bridge triangle
  indices.push(buccalCuspIdx, centralGrooveIdx, lingualCuspIdx);

  geo.setFromPoints(points);
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// 4. MOLAR: Broad rectangular/rhomboidal occlusal table with 4-5 rounded cusps & central fossa
export function createMolarGeometry(
  profile: ToothGeometricProfile,
  isUpper: boolean,
  isFirstMolar: boolean
): THREE.BufferGeometry {
  const h = isUpper ? 0.82 : 0.80;
  const w = isFirstMolar ? 1.15 : 1.05;
  const d = isFirstMolar ? 1.12 : 1.04;
  const signY = isUpper ? -1 : 1;

  const points: THREE.Vector3[] = [];
  const indices: number[] = [];
  const radialSegments = 20;

  const sliceHeights = [signY * (-0.18), 0.0, signY * (h * 0.35), signY * (h * 0.76)];
  if (isUpper) sliceHeights.sort((a, b) => a - b);

  const sliceConfigs = [
    { rx: w * 0.38, rz: d * 0.38, corner: 1.1 },
    { rx: w * 0.44, rz: d * 0.44, corner: 1.15 },
    { rx: w * 0.50, rz: d * 0.50, corner: 1.25 },
    { rx: w * 0.46, rz: d * 0.46, corner: 1.35 },
  ];

  for (let s = 0; s < sliceHeights.length; s++) {
    const yVal = sliceHeights[s];
    const cfg = sliceConfigs[s];
    for (let r = 0; r < radialSegments; r++) {
      const phi = (r / radialSegments) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      const px = Math.sign(cosP) * Math.pow(Math.abs(cosP), cfg.corner) * cfg.rx;
      const pz = Math.sign(sinP) * Math.pow(Math.abs(sinP), cfg.corner) * cfg.rz;
      points.push(new THREE.Vector3(px, yVal, pz));
    }
  }

  for (let s = 0; s < sliceHeights.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const nextR = (r + 1) % radialSegments;
      const p0 = s * radialSegments + r;
      const p1 = s * radialSegments + nextR;
      const p2 = (s + 1) * radialSegments + nextR;
      const p3 = (s + 1) * radialSegments + r;

      if (isUpper) {
        indices.push(p0, p2, p1);
        indices.push(p0, p3, p2);
      } else {
        indices.push(p0, p1, p2);
        indices.push(p0, p2, p3);
      }
    }
  }

  // Bottom root cap inside gingiva
  const botCapIdx = points.length;
  points.push(new THREE.Vector3(0, sliceHeights[0], 0));
  for (let r = 0; r < radialSegments; r++) {
    const nextR = (r + 1) % radialSegments;
    indices.push(botCapIdx, isUpper ? r : nextR, isUpper ? nextR : r);
  }

  // 4 Rounded Molar Cusps + Central Fossa:
  // MB (Mesiobuccal), DB (Distobuccal), ML (Mesiolingual), DL (Distolingual)
  const mbIdx = points.length;
  points.push(new THREE.Vector3(-w * 0.22, signY * (h * 0.96), d * 0.24));
  const dbIdx = points.length;
  points.push(new THREE.Vector3(w * 0.22, signY * (h * 0.94), d * 0.24));
  const mlIdx = points.length;
  points.push(new THREE.Vector3(-w * 0.22, signY * (h * 0.93), -d * 0.24));
  const dlIdx = points.length;
  points.push(new THREE.Vector3(w * 0.22, signY * (h * 0.91), -d * 0.24));

  // Central developmental fossa
  const fossaIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (h * 0.74), 0));

  const topRimStart = (sliceHeights.length - 1) * radialSegments;
  for (let r = 0; r < radialSegments; r++) {
    const phi = (r / radialSegments) * Math.PI * 2;
    const nextR = (r + 1) % radialSegments;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);

    let cusp = mbIdx;
    if (cosP >= 0 && sinP >= 0) cusp = dbIdx;
    else if (cosP < 0 && sinP < 0) cusp = mlIdx;
    else if (cosP >= 0 && sinP < 0) cusp = dlIdx;

    if (isUpper) {
      indices.push(cusp, topRimStart + nextR, topRimStart + r);
    } else {
      indices.push(cusp, topRimStart + r, topRimStart + nextR);
    }
  }

  // Central developmental groove triangles
  if (isUpper) {
    indices.push(mbIdx, fossaIdx, dbIdx);
    indices.push(dbIdx, fossaIdx, dlIdx);
    indices.push(dlIdx, fossaIdx, mlIdx);
    indices.push(mlIdx, fossaIdx, mbIdx);
  } else {
    indices.push(mbIdx, dbIdx, fossaIdx);
    indices.push(dbIdx, dlIdx, fossaIdx);
    indices.push(dlIdx, mlIdx, fossaIdx);
    indices.push(mlIdx, mbIdx, fossaIdx);
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Master geometry factory dispatcher
export function createAnatomicalToothGeometry(
  type: ToothDefinition['type'],
  tooth?: ToothDefinition
): THREE.BufferGeometry {
  const profile = tooth ? (tooth.profile || getToothGeometricProfile(tooth)) : getToothGeometricProfile(11);
  const isUpper = tooth ? tooth.arch === 'maxillary' : true;
  const index = tooth ? tooth.fdiNumber % 10 : 1;

  if (type === 'incisor') {
    return createIncisorGeometry(profile, isUpper, index === 1);
  }
  if (type === 'canine') {
    return createCanineGeometry(profile, isUpper);
  }
  if (type === 'premolar') {
    return createPremolarGeometry(profile, isUpper);
  }
  return createMolarGeometry(profile, isUpper, index === 6);
}

// ---------------------------------------------------------------------------
// 4. GINGIVAL ARCH GEOMETRY
// Follows the EXACT same anatomical Catmull-Rom spline with interdental papillae
// scalloping so teeth emerge naturally at the CEJ without floating or heavy clipping.
// ---------------------------------------------------------------------------

export function createGingivalArchGeometry(isUpper: boolean): THREE.BufferGeometry {
  const spline = getArchSpline(isUpper);
  const numSteps = 64;
  const points: THREE.Vector3[] = [];

  for (let s = 0; s <= numSteps; s++) {
    const t = s / numSteps;
    const p = spline.getPointAt(t);

    // Subtle interdental papilla scalloping (peaks between teeth, apical zeniths at teeth)
    // 16 teeth across the full arch = 16 waves
    const papillaWave = Math.cos(t * Math.PI * 16) * 0.04;
    const yScalloped = isUpper ? p.y - papillaWave : p.y + papillaWave;

    points.push(new THREE.Vector3(p.x, yScalloped, p.z));
  }

  const scallopedCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  // Radius of 0.36 creates a plush, anatomically sound alveolar ridge & gingival margin
  const tubeGeo = new THREE.TubeGeometry(scallopedCurve, 64, 0.36, 12, false);
  return tubeGeo;
}

// ---------------------------------------------------------------------------
// 5. PALATE, TONGUE, CHEEKS & LIPS GEOMETRIES
// Form-fitted to frame the dental spline arches cleanly
// ---------------------------------------------------------------------------

export function createPalateGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.12, 2.38, 1.35, 20, 8, true, -Math.PI / 2, Math.PI);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const rNorm = Math.min(1, Math.abs(x) / 2.38);
    const archRoofHeight = 1.15 + (1 - Math.pow(rNorm, 1.8)) * 0.55 - y * 0.35;
    pos.setY(i, archRoofHeight);
    pos.setZ(i, z * 0.82 - 0.35);
  }

  geo.computeVertexNormals();
  return geo;
}

export function createTongueGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1.5, 24, 20);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const zNorm = (z + 1.5) / 3.0;
    x = x * (0.88 - zNorm * 0.28);
    y = y * 0.42;
    z = z * 1.18 - 0.15;

    // Median sulcus of the tongue (central dorsal midline groove)
    if (y > 0 && Math.abs(x) < 0.35) {
      y -= (0.35 - Math.abs(x)) * 0.22;
    }

    pos.setX(i, x);
    pos.setY(i, y - 0.38);
    pos.setZ(i, z);
  }

  geo.computeVertexNormals();
  return geo;
}

export function createCheekGeometry(isLeft: boolean): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(2.0, 2.0, 2.2, 16, 6, true, 0, Math.PI * 0.65);
  const pos = geo.attributes.position;
  const sign = isLeft ? 1 : -1;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setX(i, sign * (3.15 + Math.abs(x) * 0.3));
    pos.setZ(i, z - 1.15);
    pos.setY(i, y);
  }

  geo.computeVertexNormals();
  return geo;
}

export function createLipGeometry(isUpper: boolean): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const y = isUpper ? 0.68 : -0.68;

  for (let s = 0; s <= 20; s++) {
    const t = (s / 20) * 2 - 1; // -1 to +1
    const x = t * 2.35;
    const z = (1 - Math.pow(t, 2)) * 0.95 + 1.25;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 20, 0.26, 8, false);
}

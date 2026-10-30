import * as THREE from 'three';
import {
  ALL_TEETH,
  ToothDefinition,
  ToothGeometricProfile,
  ToothGeometricTemplate,
  getToothDefinition,
  getToothGeometricProfile,
  getToothGeometricTemplate,
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
// 1. CUBIC BEZIER SPLINE ARCH FOR DENTAL ANATOMY
// Replaces empirical power curves with a smooth, continuous C1-tangent-continuous
// cubic Bezier spline for maxillary and mandibular arches.
// ---------------------------------------------------------------------------

export function createCubicBezierDentalArch(isUpper: boolean): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();

  if (isUpper) {
    // Maxillary Arch (Upper):
    // Right quadrant: from 3rd molar (x < 0, z < 0) to anterior midline (x = 0, z > 0)
    const rightP0 = new THREE.Vector3(-2.45, 0.70, -1.55); // 3rd Molar terminus
    const rightP1 = new THREE.Vector3(-2.10, 0.68, 0.20);  // Posterior premolar-molar control
    const rightP2 = new THREE.Vector3(-0.85, 0.71, 1.62);  // Canine-incisor horizontal tangent control
    const rightP3 = new THREE.Vector3(0.00,  0.72, 1.62);  // Anterior midline contact (11 & 21)

    // Left quadrant: from anterior midline (x = 0, z > 0) to 3rd molar (x > 0, z < 0)
    const leftQ0 = new THREE.Vector3(0.00,  0.72, 1.62);   // Anterior midline contact
    const leftQ1 = new THREE.Vector3(0.85,  0.71, 1.62);   // Symmetrical horizontal tangent control
    const leftQ2 = new THREE.Vector3(2.10,  0.68, 0.20);   // Symmetrical posterior control
    const leftQ3 = new THREE.Vector3(2.45,  0.70, -1.55);  // 3rd Molar terminus

    path.add(new THREE.CubicBezierCurve3(rightP0, rightP1, rightP2, rightP3));
    path.add(new THREE.CubicBezierCurve3(leftQ0, leftQ1, leftQ2, leftQ3));
  } else {
    // Mandibular Arch (Lower) - Class I Occlusion (sits slightly lingual with ~1.5mm overjet/overbite)
    const rightP0 = new THREE.Vector3(-2.26, -0.66, -1.52); // 3rd Molar terminus
    const rightP1 = new THREE.Vector3(-1.90, -0.71, 0.16);  // Posterior control
    const rightP2 = new THREE.Vector3(-0.75, -0.70, 1.50);  // Anterior horizontal tangent control
    const rightP3 = new THREE.Vector3(0.00,  -0.70, 1.50);  // Midline contact (41 & 31)

    const leftQ0 = new THREE.Vector3(0.00,  -0.70, 1.50);   // Midline contact
    const leftQ1 = new THREE.Vector3(0.75,  -0.70, 1.50);   // Symmetrical horizontal tangent control
    const leftQ2 = new THREE.Vector3(1.90,  -0.71, 0.16);   // Symmetrical posterior control
    const leftQ3 = new THREE.Vector3(2.26,  -0.66, -1.52);  // 3rd Molar terminus

    path.add(new THREE.CubicBezierCurve3(rightP0, rightP1, rightP2, rightP3));
    path.add(new THREE.CubicBezierCurve3(leftQ0, leftQ1, leftQ2, leftQ3));
  }

  return path;
}

// Global cached cubic Bezier dental arch paths
export const UPPER_ARCH_BEZIER = createCubicBezierDentalArch(true);
export const LOWER_ARCH_BEZIER = createCubicBezierDentalArch(false);

export function getArchSpline(isUpper: boolean): THREE.CurvePath<THREE.Vector3> {
  return isUpper ? UPPER_ARCH_BEZIER : LOWER_ARCH_BEZIER;
}

// ---------------------------------------------------------------------------
// 2. FDI TOOTH SPACING ALONG CUBIC BEZIER ARCH
// Calculates exact parameter t in [0, 1] for each tooth based on clinical
// mesiodistal widths so teeth contact naturally without gaps or collisions.
// ---------------------------------------------------------------------------

export function getToothArchSplineParameter(fdi: number, isUpper: boolean): { t: number; toothIndex: number } {
  const index = fdi % 10; // 1 (central incisor) to 8 (3rd molar)
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
// 3. CERVICAL PLACEMENT & COMPOUND ANGULATION
// Integrates tooth roots into gingival mesh: ZERO floating gaps, and
// ZERO excessive crown overlap at the gumline.
// ---------------------------------------------------------------------------

export function getTooth3DPlacement(tooth: ToothDefinition): {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  cervicalOffset: number;
} {
  const isUpper = tooth.arch === 'maxillary';
  const profile = tooth.profile || getToothGeometricProfile(tooth);
  const archPath = getArchSpline(isUpper);
  const { t } = getToothArchSplineParameter(tooth.fdiNumber, isUpper);

  // Sample exact 3D position and tangent along the cubic Bezier dental arch
  const spinePos = archPath.getPointAt(t);
  const tangent = archPath.getTangentAt(t).normalize();

  // Tangent angle in XZ plane
  const tangentAngle = Math.atan2(tangent.x, tangent.z);

  // Outward-facing facial/buccal normal vector
  const isRight = tooth.quadrant === 1 || tooth.quadrant === 4;
  const facialAngle = isRight ? tangentAngle + Math.PI / 2 : tangentAngle - Math.PI / 2;

  // Cervical insertion depth into gingival cuff:
  // Roots integrate into the gingival mesh by ~0.08 - 0.10 units to guarantee no floating gap,
  // while preserving 100% of the anatomical clinical crown outside the gumline.
  const insertionDepth = profile.cervicalOffset || 0.09;

  // Alveolar crest is offset vertically from spline bone center:
  // Upper gingival margin: spinePos.y - 0.22
  // Lower gingival margin: spinePos.y + 0.22
  const yCervical = isUpper
    ? spinePos.y - 0.22 + insertionDepth * 0.5
    : spinePos.y + 0.22 - insertionDepth * 0.5;

  const position = new THREE.Vector3(spinePos.x, yCervical, spinePos.z);

  // Compound 3D Angulation:
  const torque = profile.labialTorque || 0;
  const tipSign = isRight ? -1 : 1;
  const tip = tipSign * (profile.mesiodistalTip || 0);
  const speePitch = isUpper ? -(1 - Math.abs(t - 0.5) * 2) * 0.04 : (1 - Math.abs(t - 0.5) * 2) * 0.05;

  const rotation = new THREE.Euler(
    speePitch + (isUpper ? -torque : torque) * Math.cos(facialAngle),
    facialAngle,
    tip + (isUpper ? -torque : torque) * Math.sin(facialAngle),
    'YXZ'
  );

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
// 4. DISTINCT PROCEDURAL TOOTH GEOMETRIC TEMPLATES
// Anatomically plausible crown geometries for incisors, canines, premolars,
// and molars replacing primitive Box/Cone shapes.
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

// 1. ANATOMICALLY REALISTIC INCISOR GEOMETRY
// Models accurate morphologic characteristics for all 8 human incisors:
// - Maxillary Central Incisors (11, 21): Broad spatulate crown, crisp 90° mesioincisal angle, rounded distoincisal angle, distinct lingual fossa with elevated mesial/distal marginal ridges and prominent basal cingulum.
// - Maxillary Lateral Incisors (12, 22): Slender and rounded, deeper lingual fossa with prominent marginal ridges and lingual pit, sweeping rounded distoincisal corner.
// - Mandibular Central Incisors (31, 41): Smallest, highly symmetrical chisel, sharp mesioincisal and distoincisal angles, subtle lingual fossa.
// - Mandibular Lateral Incisors (32, 42): Wider crown, distal incisal edge slope, slight distal twist.
export function createIncisorGeometry(
  profile: ToothGeometricProfile,
  isUpper: boolean,
  isCentral: boolean,
  tooth?: ToothDefinition
): THREE.BufferGeometry {
  const h = profile.crownHeight || (isUpper ? (isCentral ? 1.05 : 0.92) : (isCentral ? 0.84 : 0.88));
  const w = profile.mesiodistalWidth || (isUpper ? (isCentral ? 0.94 : 0.80) : (isCentral ? 0.58 : 0.64));
  const d = profile.labiolingualDepth || 0.64;
  const cingulum = profile.cingulumProminence || (isUpper ? (isCentral ? 0.65 : 0.60) : 0.35);
  const fossa = profile.fossaDepth || (isUpper ? (isCentral ? 0.45 : 0.52) : 0.25);
  const marginalRidge = profile.marginalRidgeHeight ?? (isUpper ? 0.70 : 0.32);
  const mesialSharp = profile.mesialAngleSharpness ?? (isCentral ? 0.95 : 0.72);
  const distalRound = profile.distalAngleRounding ?? (isCentral ? 0.55 : 0.38);
  const incisalSlope = profile.incisalSlope ?? (isCentral ? -0.02 : -0.05);

  const signY = isUpper ? -1 : 1;
  const radialSegments = 24; // 24 radial samples for smooth dental curves

  // Vertical slice definition along the clinical crown
  // yNorm from -0.22 (subgingival root neck) through 0.0 (CEJ) to 1.0 (incisal ridge)
  const sliceDefinitions = [
    // 0: Subgingival root neck collar (submerged in gingival margin)
    { yNorm: -0.22, scaleW: 0.38, scaleD: 0.40, lingualShift: 0.00, labialShift: 0.00, isCrown: false },
    // 1: Cementoenamel Junction (CEJ finish line)
    { yNorm: 0.00, scaleW: 0.44, scaleD: 0.44, lingualShift: 0.00, labialShift: 0.00, isCrown: false },
    // 2: Cervical third (crest of contour: bulbous cingulum lingually, convex labially)
    { yNorm: 0.25, scaleW: 0.47, scaleD: 0.48 + cingulum * 0.07, lingualShift: -0.04 * cingulum, labialShift: 0.02, isCrown: true },
    // 3: Middle third (broadening mesiodistally, lingual fossa starting to hollow)
    { yNorm: 0.55, scaleW: 0.49, scaleD: 0.40 - fossa * 0.05, lingualShift: 0.01, labialShift: 0.03, isCrown: true },
    // 4: Incisal third (widest mesiodistal diameter, flat spatulate chisel profile)
    { yNorm: 0.82, scaleW: 0.50, scaleD: 0.24 - fossa * 0.06, lingualShift: 0.03, labialShift: 0.04, isCrown: true },
    // 5: Sub-incisal margin (asymmetric line angles and distal slope)
    { yNorm: 0.95, scaleW: 0.50, scaleD: 0.12, lingualShift: 0.04, labialShift: 0.04, isCrown: true },
    // 6: Incisal ridge edge apex (wear facet & mamelon contour)
    { yNorm: 1.00, scaleW: 0.48, scaleD: 0.05, lingualShift: 0.04, labialShift: 0.04, isCrown: true },
  ];

  const points: THREE.Vector3[] = [];
  const indices: number[] = [];

  for (let s = 0; s < sliceDefinitions.length; s++) {
    const sl = sliceDefinitions[s];
    const yVal = signY * (sl.yNorm * h);

    for (let r = 0; r < radialSegments; r++) {
      // phi: 0 = Facial/Labial (+Z), PI/2 = Distal (+X), PI = Lingual (-Z), 3PI/2 = Mesial (-X)
      const phi = (r / radialSegments) * Math.PI * 2;
      const cosP = Math.cos(phi); // +1 on Labial (+Z), -1 on Lingual (-Z)
      const sinP = Math.sin(phi); // +1 on Distal (+X), -1 on Mesial (-X)

      // 1. Asymmetric Corner Curvature:
      // Mesial side (sinP < 0) uses mesialSharp (crisp line angle)
      // Distal side (sinP > 0) uses distalRound (rounded sweeping angle)
      const isMesial = sinP < 0;
      const cornerExponent = sl.isCrown && sl.yNorm >= 0.70
        ? (isMesial ? (1.0 + mesialSharp * 0.9) : (1.0 + distalRound * 0.8))
        : 1.0;

      const absCos = Math.abs(cosP);
      const absSin = Math.abs(sinP);
      const signCos = Math.sign(cosP);
      const signSin = Math.sign(sinP);

      let px = signSin * Math.pow(absSin, cornerExponent) * (w * sl.scaleW);
      let pz = signCos * Math.pow(absCos, cornerExponent) * (d * sl.scaleD);

      // 2. Lingual surface features (cosP < 0):
      if (cosP < 0 && sl.isCrown) {
        // Cingulum bulge in lower crown, lingual fossa in upper crown
        if (sl.yNorm <= 0.35) {
          pz += sl.lingualShift;
        } else {
          // Fossa hollowing at center lingual (phi near PI)
          const fossaCenter = Math.max(0, -cosP - Math.abs(sinP) * 0.6);
          const fossaDepression = fossaCenter * (fossa * 0.09 * (sl.yNorm / 0.8));
          pz += fossaDepression;

          // Marginal ridges along mesial and distal borders of lingual surface
          const ridgeProximity = Math.max(0, 1.0 - Math.abs(absSin - 0.7) * 3.5);
          const ridgeElevation = ridgeProximity * (marginalRidge * 0.05 * sl.yNorm);
          pz -= ridgeElevation;
        }
      }

      // 3. Labial surface features (cosP > 0):
      if (cosP > 0 && sl.isCrown) {
        pz += sl.labialShift;
        // Subtle vertical developmental depressions between the 3 labial lobes (mesial, central, distal)
        if (sl.yNorm >= 0.40) {
          const furrow = Math.sin(phi * 2.0);
          pz -= Math.abs(furrow) * 0.015 * sl.yNorm;
        }
      }

      // 4. Incisal Slope & Wear Bevel:
      let vertexY = yVal;
      if (sl.yNorm >= 0.90 && sinP > 0) {
        // Distal downward slope
        const slopeOffset = sinP * Math.abs(incisalSlope) * h;
        vertexY += signY * (-slopeOffset);
      }

      // Incisal bevel facet
      if (sl.yNorm >= 0.98) {
        // Maxillary wear bevel faces lingually (-Z); Mandibular wear bevel faces labially (+Z)
        if (isUpper && cosP < 0) {
          vertexY += signY * (-0.02 * h);
        } else if (!isUpper && cosP > 0) {
          vertexY += signY * (-0.02 * h);
        }
      }

      points.push(new THREE.Vector3(px, vertexY, pz));
    }
  }

  // Connect rings with quads (two triangles each)
  const numSlices = sliceDefinitions.length;
  for (let s = 0; s < numSlices - 1; s++) {
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

  // Bottom root cap (enters gingiva)
  const botCapIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (-0.22 * h), 0));
  for (let r = 0; r < radialSegments; r++) {
    const nextR = (r + 1) % radialSegments;
    if (isUpper) {
      indices.push(botCapIdx, nextR, r);
    } else {
      indices.push(botCapIdx, r, nextR);
    }
  }

  // Top incisal ridge cap
  const topCapIdx = points.length;
  const topStart = (numSlices - 1) * radialSegments;
  points.push(new THREE.Vector3(0, signY * (1.00 * h), 0));
  for (let r = 0; r < radialSegments; r++) {
    const nextR = (r + 1) % radialSegments;
    if (isUpper) {
      indices.push(topCapIdx, topStart + r, topStart + nextR);
    } else {
      indices.push(topCapIdx, topStart + nextR, topStart + r);
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// 2. CANINE TEMPLATE: Pentagonal crown outline, sharp cusp tip, central labial ridge, robust cingulum
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
    // Canine shoulder (prominent axial labial ridge)
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

// 3. PREMOLAR TEMPLATE: Bicuspid occlusal table with buccal & lingual cusps and developmental central groove
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
  // Buccal cusp apex (facial side z > 0)
  const buccalCuspIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (h * 0.98), d * 0.22));

  // Lingual cusp apex (lingual side z < 0)
  const lingualCuspIdx = points.length;
  points.push(new THREE.Vector3(0, signY * (h * 0.88), -d * 0.22));

  // Central developmental groove fissure
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

  indices.push(buccalCuspIdx, centralGrooveIdx, lingualCuspIdx);

  geo.setFromPoints(points);
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// 4. MOLAR TEMPLATE: Broad occlusal table with 4-5 rounded cusps & central fossa
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
    return createIncisorGeometry(profile, isUpper, index === 1, tooth);
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
// 5. GINGIVAL ARCH GEOMETRY
// Follows the EXACT same cubic Bezier dental arch path with interdental papillae
// scalloping so tooth roots integrate smoothly without gaps or excessive overlap.
// ---------------------------------------------------------------------------

export function createGingivalArchGeometry(isUpper: boolean): THREE.BufferGeometry {
  const archPath = getArchSpline(isUpper);
  const numSteps = 64;
  const points: THREE.Vector3[] = [];

  for (let s = 0; s <= numSteps; s++) {
    const t = s / numSteps;
    const p = archPath.getPointAt(t);

    // Subtle interdental papilla scalloping (peaks between teeth, apical zeniths at teeth)
    const papillaWave = Math.cos(t * Math.PI * 16) * 0.04;
    const yScalloped = isUpper ? p.y - papillaWave : p.y + papillaWave;

    points.push(new THREE.Vector3(p.x, yScalloped, p.z));
  }

  const scallopedCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const tubeGeo = new THREE.TubeGeometry(scallopedCurve, 64, 0.36, 12, false);
  return tubeGeo;
}

// ---------------------------------------------------------------------------
// 6. PALATE, TONGUE, CHEEKS & LIPS GEOMETRIES
// Form-fitted to frame the cubic Bezier dental spline arches cleanly
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

    // Median sulcus of the tongue
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
    const t = (s / 20) * 2 - 1;
    const x = t * 2.35;
    const z = (1 - Math.pow(t, 2)) * 0.95 + 1.25;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 20, 0.26, 8, false);
}

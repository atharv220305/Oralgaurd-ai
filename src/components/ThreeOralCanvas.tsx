import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  ALL_TEETH,
  ToothDefinition,
  ToothGeometricProfile,
  getToothDefinition,
  getToothGeometricProfile,
} from '../data/teethData';
import {
  getTooth3DPlacement,
  getArchSpline,
  getToothArchSplineParameter,
  createAnatomicalToothGeometry,
  createIncisorGeometry,
  createCanineGeometry,
  createPremolarGeometry,
  createMolarGeometry,
  createGingivalArchGeometry,
  createPalateGeometry,
  createTongueGeometry,
  createCheekGeometry,
  createLipGeometry,
} from '../data/oralAnatomy3D';

// Re-export generation functions and types for direct modular access
export {
  createAnatomicalToothGeometry,
  createIncisorGeometry,
  createCanineGeometry,
  createPremolarGeometry,
  createMolarGeometry,
  getTooth3DPlacement,
  getArchSpline,
  getToothArchSplineParameter,
  createGingivalArchGeometry,
};
export type { ToothGeometricProfile };

export interface ThreeOralCanvasProps {
  selectedIds: string[];
  hoveredId: string | null;
  onToggleSelection: (id: string) => void;
  onHoverStructure: (id: string | null) => void;
  selectionLocked?: boolean;
  className?: string;
  isCompact?: boolean;
}

export type ViewPreset = 'full' | 'upper' | 'lower' | 'front' | 'left' | 'right' | 'top' | 'bottom';

export const ThreeOralCanvas: React.FC<ThreeOralCanvasProps> = ({
  selectedIds,
  hoveredId,
  onToggleSelection,
  onHoverStructure,
  selectionLocked = false,
  className = '',
  isCompact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fallback state if WebGL is unavailable
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<ViewPreset>('front');
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [opacityLevel, setOpacityLevel] = useState<number>(1.0);
  const [visibleLayers, setVisibleLayers] = useState<{
    teeth: boolean;
    gums: boolean;
    tongue: boolean;
    palate: boolean;
    cheeks: boolean;
  }>({
    teeth: true,
    gums: true,
    tongue: true,
    palate: true,
    cheeks: true,
  });
  const [showLayerControls, setShowLayerControls] = useState<boolean>(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const toothMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const structureMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const upperGroupRef = useRef<THREE.Group | null>(null);
  const lowerGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Camera targets for silky smooth interpolation
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 9.5));
  const cameraTargetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraCurrentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Pointer interaction state
  const isDragging = useRef<boolean>(false);
  const previousPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sphericalCoords = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 9.5,
    theta: 0,
    phi: Math.PI / 2 - 0.05,
  });

  // Materials cache
  const materialsRef = useRef<{
    toothNormal: THREE.MeshStandardMaterial;
    toothHovered: THREE.MeshStandardMaterial;
    toothSelected: THREE.MeshStandardMaterial;
    gingivaNormal: THREE.MeshStandardMaterial;
    gingivaSelected: THREE.MeshStandardMaterial;
    tongueNormal: THREE.MeshStandardMaterial;
    tongueSelected: THREE.MeshStandardMaterial;
    palateNormal: THREE.MeshStandardMaterial;
    palateSelected: THREE.MeshStandardMaterial;
    cheekNormal: THREE.MeshStandardMaterial;
    cheekSelected: THREE.MeshStandardMaterial;
  } | null>(null);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlAvailable(false);
      }
    } catch {
      setWebGlAvailable(false);
    }
  }, []);

  // Set camera preset coordinates
  const applyViewPreset = useCallback((preset: ViewPreset) => {
    setActivePreset(preset);
    let radius = 8.6;
    let theta = 0;
    let phi = Math.PI / 2 - 0.05;
    let lookY = 0;

    switch (preset) {
      case 'front':
        theta = 0;
        phi = Math.PI / 2 - 0.05;
        lookY = 0;
        break;
      case 'upper':
        theta = 0;
        phi = Math.PI / 2 + 0.65;
        lookY = 0.5;
        break;
      case 'lower':
        theta = 0;
        phi = Math.PI / 2 - 0.65;
        lookY = -0.5;
        break;
      case 'left':
        theta = -Math.PI / 2;
        phi = Math.PI / 2 - 0.05;
        lookY = 0;
        break;
      case 'right':
        theta = Math.PI / 2;
        phi = Math.PI / 2 - 0.05;
        lookY = 0;
        break;
      case 'top':
        theta = 0;
        phi = 0.08;
        lookY = 0;
        break;
      case 'bottom':
        theta = 0;
        phi = Math.PI - 0.08;
        lookY = 0;
        break;
      case 'full':
      default:
        theta = 0.28;
        phi = Math.PI / 2 - 0.12;
        radius = 8.9;
        lookY = 0;
        break;
    }

    sphericalCoords.current = { radius, theta, phi };
    cameraTargetLookAt.current.set(0, lookY, 0);

    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi) + lookY;
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraTargetPos.current.set(x, y, z);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !webGlAvailable) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 8.6);
    cameraRef.current = camera;

    // 3. Renderer with Software GL detection
    const isSoftwareGl = (() => {
      try {
        const gl = canvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Balanced Studio Lighting Rig (Warm key + Cool fill + Soft hemisphere ambient)
    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0xe0f2fe, 0.75);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xfff5f5, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xecfeff, 0.7);
    fillLight.position.set(-4, 2, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef2f2, 0.55);
    rimLight.position.set(0, -4, -4);
    scene.add(rimLight);

    // 5. Materials Cache
    // Natural ivory enamel for unselected teeth (refined roughness and clearcoat-like specular)
    const toothNormal = new THREE.MeshStandardMaterial({
      color: 0xfcfbfa,
      roughness: 0.22,
      metalness: 0.02,
    });
    // Sky blue preview on hover
    const toothHovered = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.18,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
    });
    // Cyan-blue vibrant outline glow when selected
    const toothSelected = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.15,
      metalness: 0.05,
      emissive: 0x0891b2,
      emissiveIntensity: 0.75,
    });

    // Gingival gum materials (natural healthy stippled pink)
    const gingivaNormal = new THREE.MeshStandardMaterial({
      color: 0xd9657a,
      roughness: 0.58,
      metalness: 0.01,
    });
    const gingivaSelected = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
    });

    // Tongue mucosal materials (natural warm lingual hue)
    const tongueNormal = new THREE.MeshStandardMaterial({
      color: 0xd65268,
      roughness: 0.62,
      metalness: 0.01,
    });
    const tongueSelected = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.35,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
    });

    // Palate materials (warm hard palate mucosal tone)
    const palateNormal = new THREE.MeshStandardMaterial({
      color: 0xedd5b8,
      roughness: 0.52,
      side: THREE.DoubleSide,
    });
    const palateSelected = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
      side: THREE.DoubleSide,
    });

    // Cheek materials (soft translucent buccal mucosa)
    const cheekNormal = new THREE.MeshStandardMaterial({
      color: 0xfecdd3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const cheekSelected = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.35,
      emissive: 0x0891b2,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    materialsRef.current = {
      toothNormal,
      toothHovered,
      toothSelected,
      gingivaNormal,
      gingivaSelected,
      tongueNormal,
      tongueSelected,
      palateNormal,
      palateSelected,
      cheekNormal,
      cheekSelected,
    };

    // 6. Build Anatomical Model Hierarchy
    const upperGroup = new THREE.Group();
    upperGroup.name = 'upper_maxillary_complex';
    scene.add(upperGroup);
    upperGroupRef.current = upperGroup;

    const lowerGroup = new THREE.Group();
    lowerGroup.name = 'lower_mandibular_complex';
    scene.add(lowerGroup);
    lowerGroupRef.current = lowerGroup;

    // Cache mesh maps
    const toothMeshes = new Map<string, THREE.Mesh>();
    const structureMeshes = new Map<string, THREE.Mesh>();

    // A. 32 Teeth with anatomical morphology, U-shaped spline arch, and natural cervical gingival intersection
    ALL_TEETH.forEach((tooth) => {
      const { position, rotation, scale, cervicalOffset } = getTooth3DPlacement(tooth);
      const geo = createAnatomicalToothGeometry(tooth.type, tooth);
      const mesh = new THREE.Mesh(geo, toothNormal.clone());

      mesh.position.copy(position);
      mesh.rotation.copy(rotation);
      mesh.scale.copy(scale);

      mesh.userData = {
        id: tooth.id,
        toothNumber: tooth.toothNumber,
        name: tooth.fullName,
        type: 'tooth',
        arch: tooth.arch,
        morphology: tooth.type,
        cervicalOffset,
      };

      if (tooth.arch === 'maxillary') {
        upperGroup.add(mesh);
      } else {
        lowerGroup.add(mesh);
      }

      toothMeshes.set(tooth.id, mesh);
      toothMeshes.set(tooth.toothNumber, mesh);
    });

    // B. Upper & Lower Gingival Arches
    const upperGumsGeo = createGingivalArchGeometry(true);
    const upperGumsMesh = new THREE.Mesh(upperGumsGeo, gingivaNormal.clone());
    upperGumsMesh.userData = { id: 'gingiva_upper', name: 'Upper Gums & Jaw Ridge', type: 'gingiva' };
    upperGroup.add(upperGumsMesh);
    structureMeshes.set('gingiva_upper', upperGumsMesh);

    const lowerGumsGeo = createGingivalArchGeometry(false);
    const lowerGumsMesh = new THREE.Mesh(lowerGumsGeo, gingivaNormal.clone());
    lowerGumsMesh.userData = { id: 'gingiva_lower', name: 'Lower Gums & Jaw Ridge', type: 'gingiva' };
    lowerGroup.add(lowerGumsMesh);
    structureMeshes.set('gingiva_lower', lowerGumsMesh);

    // C. Hard & Soft Palate
    const palateGeo = createPalateGeometry();
    const palateMesh = new THREE.Mesh(palateGeo, palateNormal.clone());
    palateMesh.userData = { id: 'hard_palate', name: 'Hard Palate (Roof of Mouth)', type: 'palate' };
    upperGroup.add(palateMesh);
    structureMeshes.set('hard_palate', palateMesh);
    structureMeshes.set('soft_palate', palateMesh);
    structureMeshes.set('hard_soft_palate', palateMesh);

    // D. Tongue & Floor of Mouth
    const tongueGeo = createTongueGeometry();
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueNormal.clone());
    tongueMesh.userData = { id: 'tongue_dorsum', name: 'Center & Top of Tongue', type: 'tongue' };
    lowerGroup.add(tongueMesh);
    structureMeshes.set('tongue_dorsum', tongueMesh);
    structureMeshes.set('lateral_tongue_left', tongueMesh);
    structureMeshes.set('lateral_tongue_right', tongueMesh);
    structureMeshes.set('floor_of_mouth', tongueMesh);

    // E. Left & Right Inner Cheeks
    const leftCheekGeo = createCheekGeometry(true);
    const leftCheekMesh = new THREE.Mesh(leftCheekGeo, cheekNormal.clone());
    leftCheekMesh.userData = { id: 'buccal_mucosa_left', name: 'Left Inner Cheek', type: 'cheek' };
    scene.add(leftCheekMesh);
    structureMeshes.set('buccal_mucosa_left', leftCheekMesh);

    const rightCheekGeo = createCheekGeometry(false);
    const rightCheekMesh = new THREE.Mesh(rightCheekGeo, cheekNormal.clone());
    rightCheekMesh.userData = { id: 'buccal_mucosa_right', name: 'Right Inner Cheek', type: 'cheek' };
    scene.add(rightCheekMesh);
    structureMeshes.set('buccal_mucosa_right', rightCheekMesh);

    // F. Upper & Lower Lips
    const upperLipGeo = createLipGeometry(true);
    const upperLipMesh = new THREE.Mesh(upperLipGeo, gingivaNormal.clone());
    upperLipMesh.userData = { id: 'lip_upper', name: 'Upper Lip', type: 'lip' };
    upperGroup.add(upperLipMesh);
    structureMeshes.set('lip_upper', upperLipMesh);

    const lowerLipGeo = createLipGeometry(false);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, gingivaNormal.clone());
    lowerLipMesh.userData = { id: 'lip_lower', name: 'Lower Lip', type: 'lip' };
    lowerGroup.add(lowerLipMesh);
    structureMeshes.set('lip_lower', lowerLipMesh);

    toothMeshesRef.current = toothMeshes;
    structureMeshesRef.current = structureMeshes;

    // 7. Animation & Render Loop with silky smooth exponential damping
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth camera position damping
      camera.position.lerp(cameraTargetPos.current, 0.09);
      cameraCurrentLookAt.current.lerp(cameraTargetLookAt.current, 0.09);
      camera.lookAt(cameraCurrentLookAt.current);

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // 8. Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      renderer.dispose();
    };
  }, [webGlAvailable]);

  // Handle Exploded Arch View adjustments (separates upper and lower arches vertically)
  useEffect(() => {
    if (!upperGroupRef.current || !lowerGroupRef.current) return;
    const offset = explodedFactor * 1.8;
    upperGroupRef.current.position.y = offset;
    lowerGroupRef.current.position.y = -offset;
  }, [explodedFactor]);

  // Handle Layer Visibilities & Opacity
  useEffect(() => {
    if (!structureMeshesRef.current || !toothMeshesRef.current) return;

    // Teeth visibility
    toothMeshesRef.current.forEach((mesh) => {
      mesh.visible = visibleLayers.teeth;
    });

    // Gums visibility
    const upperGums = structureMeshesRef.current.get('gingiva_upper');
    const lowerGums = structureMeshesRef.current.get('gingiva_lower');
    if (upperGums) upperGums.visible = visibleLayers.gums;
    if (lowerGums) lowerGums.visible = visibleLayers.gums;

    // Palate visibility
    const palate = structureMeshesRef.current.get('hard_palate');
    if (palate) palate.visible = visibleLayers.palate;

    // Tongue visibility
    const tongue = structureMeshesRef.current.get('tongue_dorsum');
    if (tongue) tongue.visible = visibleLayers.tongue;

    // Cheeks visibility
    const leftCheek = structureMeshesRef.current.get('buccal_mucosa_left');
    const rightCheek = structureMeshesRef.current.get('buccal_mucosa_right');
    if (leftCheek) leftCheek.visible = visibleLayers.cheeks;
    if (rightCheek) rightCheek.visible = visibleLayers.cheeks;

    // Adjust opacity
    if (materialsRef.current) {
      materialsRef.current.cheekNormal.opacity = 0.45 * opacityLevel;
    }
  }, [visibleLayers, opacityLevel]);

  // Update selection & hover visual highlights with Cyan-Blue glow
  useEffect(() => {
    if (!materialsRef.current) return;
    const {
      toothNormal,
      toothHovered,
      toothSelected,
      gingivaNormal,
      gingivaSelected,
      tongueNormal,
      tongueSelected,
      palateNormal,
      palateSelected,
      cheekNormal,
      cheekSelected,
    } = materialsRef.current;

    // Helper to check selection status
    const isItemSelected = (id: string) => {
      return (
        selectedIds.includes(id) ||
        (id.startsWith('tooth_') && selectedIds.includes(id.replace('tooth_', ''))) ||
        (!id.startsWith('tooth_') && selectedIds.includes(`tooth_${id}`))
      );
    };

    // Update teeth meshes
    toothMeshesRef.current.forEach((mesh, id) => {
      const selected = isItemSelected(id);
      const isHovered = hoveredId === id || (hoveredId && id.includes(hoveredId));

      if (selected) {
        mesh.material = toothSelected;
      } else if (isHovered) {
        mesh.material = toothHovered;
      } else {
        mesh.material = toothNormal;
      }
    });

    // Update mucosal structures
    const updateMeshMaterial = (
      meshKey: string,
      selectedMat: THREE.Material,
      normalMat: THREE.Material
    ) => {
      const mesh = structureMeshesRef.current.get(meshKey);
      if (!mesh) return;
      mesh.material = isItemSelected(meshKey) ? selectedMat : normalMat;
    };

    updateMeshMaterial('gingiva_upper', gingivaSelected, gingivaNormal);
    updateMeshMaterial('gingiva_lower', gingivaSelected, gingivaNormal);
    updateMeshMaterial('hard_palate', palateSelected, palateNormal);
    updateMeshMaterial('tongue_dorsum', tongueSelected, tongueNormal);
    updateMeshMaterial('buccal_mucosa_left', cheekSelected, cheekNormal);
    updateMeshMaterial('buccal_mucosa_right', cheekSelected, cheekNormal);
  }, [selectedIds, hoveredId]);

  // Raycasting & Pointer selection
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    previousPointerPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    if (isDragging.current) {
      // Orbit camera rotation
      const deltaX = e.clientX - previousPointerPos.current.x;
      const deltaY = e.clientY - previousPointerPos.current.y;
      previousPointerPos.current = { x: e.clientX, y: e.clientY };

      sphericalCoords.current.theta -= deltaX * 0.007;
      sphericalCoords.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, sphericalCoords.current.phi - deltaY * 0.007)
      );

      const { radius, theta, phi } = sphericalCoords.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi) + cameraTargetLookAt.current.y;
      const z = radius * Math.sin(phi) * Math.cos(theta);
      cameraTargetPos.current.set(x, y, z);
      return;
    }

    // Raycast hover detection
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (intersects.length > 0) {
      // Prioritize tooth hover over gingiva near the cervical boundary
      const toothHit = intersects.find((hit) => hit.object.userData?.type === 'tooth');
      const targetObj = toothHit ? toothHit.object : intersects[0].object;
      if (targetObj.userData && targetObj.userData.id) {
        onHoverStructure(targetObj.userData.id);
        return;
      }
    }
    onHoverStructure(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) {
      isDragging.current = false;
      return;
    }

    // If it was a short tap without drag, trigger selection
    const dx = Math.abs(e.clientX - previousPointerPos.current.x);
    const dy = Math.abs(e.clientY - previousPointerPos.current.y);

    if (dx < 6 && dy < 6 && !selectionLocked) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      if (intersects.length > 0) {
        // Prioritize tooth selection over gingiva near the cervical boundary
        const toothHit = intersects.find((hit) => hit.object.userData?.type === 'tooth');
        const targetObj = toothHit ? toothHit.object : intersects[0].object;
        if (targetObj.userData && targetObj.userData.id) {
          onToggleSelection(targetObj.userData.id);
        }
      }
    }

    isDragging.current = false;
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 0.85 : 1.18;
    sphericalCoords.current.radius = Math.max(
      4.0,
      Math.min(18.0, sphericalCoords.current.radius * factor)
    );
    const { radius, theta, phi } = sphericalCoords.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi) + cameraTargetLookAt.current.y;
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraTargetPos.current.set(x, y, z);
  };

  // Reset View handler
  const handleResetView = () => {
    applyViewPreset('front');
    setExplodedFactor(0);
  };

  if (!webGlAvailable) {
    return (
      <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-600">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <h4 className="text-sm font-bold text-slate-800">3D Hardware Acceleration Unavailable</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Your browser does not support WebGL or hardware acceleration is disabled. Please use the 2D
          Anatomical illustration to select oral regions.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3.8] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm select-none ${className}`}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDragging.current = false;
          onHoverStructure(null);
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Telemetry / View Bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-2">
        {/* Preset View Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs p-1 rounded-lg border border-slate-800 pointer-events-auto overflow-x-auto">
          {(['front', 'upper', 'lower', 'full', 'left', 'right', 'top'] as ViewPreset[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => applyViewPreset(v)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize transition-all cursor-pointer ${
                activePreset === v
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Lock indicator & Layer Drawer Toggle */}
        <div className="flex items-center gap-1 pointer-events-auto">
          {selectionLocked && (
            <div className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowLayerControls((prev) => !prev)}
            title="Toggle Anatomy Layers & Opacity"
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Exploded / Cutaway Arch View Slider (Reversible separation of upper and lower jaws) */}
      <div className="absolute top-12 left-2 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-800 flex items-center gap-2 pointer-events-auto">
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Jaw Gap:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={explodedFactor}
          onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
          className="w-20 accent-teal-400 h-1.5 cursor-pointer bg-slate-700 rounded-lg"
          title="Separates upper and lower arches for internal occlusal inspection"
        />
        <span className="text-[10px] font-mono text-teal-300">{Math.round(explodedFactor * 100)}%</span>
      </div>

      {/* Bottom Floating Control Dock (Zoom In, Zoom Out, Reset View) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-lg pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom('in')}
          title="Zoom In"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom('out')}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        <button
          type="button"
          onClick={handleResetView}
          title="Reset Camera View"
          className="px-2 py-1 rounded-lg text-[10.5px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Optional Anatomy Layer & Opacity Popover */}
      {showLayerControls && (
        <div className="absolute top-12 right-2 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs shadow-xl space-y-2.5 z-20 pointer-events-auto w-48">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">Layers</span>
            <button
              type="button"
              onClick={() => setShowLayerControls(false)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-1.5">
            {Object.entries(visibleLayers).map(([layerKey, isVisible]) => (
              <label
                key={layerKey}
                className="flex items-center justify-between text-slate-300 capitalize cursor-pointer hover:text-white"
              >
                <span>{layerKey}</span>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() =>
                    setVisibleLayers((prev) => ({
                      ...prev,
                      [layerKey]: !prev[layerKey as keyof typeof prev],
                    }))
                  }
                  className="rounded text-teal-500 focus:ring-0 cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
              <span>Cheek Opacity</span>
              <span className="font-mono text-teal-300">{Math.round(opacityLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacityLevel}
              onChange={(e) => setOpacityLevel(parseFloat(e.target.value))}
              className="w-full accent-teal-400 h-1 cursor-pointer bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

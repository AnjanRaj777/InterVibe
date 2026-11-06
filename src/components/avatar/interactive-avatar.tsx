'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sparkles, Radio, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { STAGE, stageVariants, avatarStageVariants } from '@/components/landing/motion-config';

// In-memory GLB binary cache so avatar models preload before the interview starts
const glbBufferCache = new Map<string, Promise<ArrayBuffer>>();

export function preloadAvatarModel(url: string): Promise<ArrayBuffer> {
  let existing = glbBufferCache.get(url);
  if (!existing) {
    existing = fetch(url, { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .catch((err) => {
        glbBufferCache.delete(url);
        throw err;
      });
    glbBufferCache.set(url, existing);
  }
  return existing;
}

export function preloadAllAvatarModels(): void {
  if (typeof window === 'undefined') return;
  ['/avatars/sarah.glb', '/avatars/michael.glb', '/avatars/emma.glb'].forEach((url) => {
    preloadAvatarModel(url).catch(() => {});
  });
}

interface InteractiveAvatarProps {
  persona: {
    name: string;
    title: string;
    avatar: string;
    voice: string;
    auraVoice?: string;
    model?: string;
  };
  activeState: 'speaking' | 'thinking' | 'listening' | 'idle';
  isRecording: boolean;
  audioPlaying: boolean;
  avatarMode: '3d' | '2d';
  onToggleMode: (mode: '3d' | '2d') => void;
  /** Join a parent "hidden" -> "visible" staggered entrance (landing demo card) */
  entranceStagger?: boolean;
}

export const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({
  persona,
  activeState,
  isRecording,
  audioPlaying,
  avatarMode,
  onToggleMode,
  entranceStagger = false,
}) => {
  const [perxonaConfig, setPerxonaConfig] = useState<{
    enabled: boolean;
    publishableKey?: string;
    baseUrl?: string;
  } | null>(null);

  const [perxonaLoaded, setPerxonaLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const presenterRef = useRef<any>(null);

  // Live state ref so Three.js animation loop reads current state at 60fps
  // without re-initializing the WebGL canvas or reloading the GLB model.
  const liveStateRef = useRef({
    activeState,
    isRecording,
    audioPlaying,
  });
  liveStateRef.current = {
    activeState,
    isRecording,
    audioPlaying,
  };

  // 1. Check Perxona Connect configuration on mount
  useEffect(() => {
    let isMounted = true;
    async function checkPerxona() {
      try {
        const res = await fetch('/api/perxona/session');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPerxonaConfig(data);
          }
        }
      } catch (err) {
        console.warn('[Avatar] Perxona check skipped:', err);
      }
    }
    checkPerxona();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Perxona Connect SDK if publishable key is configured
  useEffect(() => {
    if (avatarMode !== '3d' || !perxonaConfig?.enabled || !perxonaConfig.publishableKey) {
      return;
    }

    if (document.getElementById('perxona-connect-script')) {
      setPerxonaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'perxona-connect-script';
    script.type = 'module';
    script.src = `${perxonaConfig.baseUrl || 'https://console.perxona.ai/asia'}/sdk/connect/sv-presenter.js`;
    script.onload = () => {
      setPerxonaLoaded(true);
    };
    script.onerror = () => {
      console.warn('[Avatar] Perxona SDK script not found. Using local 3D Human Avatar.');
    };
    document.body.appendChild(script);
  }, [avatarMode, perxonaConfig]);

  // 3. Photorealistic 3D Human Avatar Engine (Three.js + GLTFLoader + Facial ARKit Blendshapes)
  useEffect(() => {
    if (avatarMode !== '3d' || (perxonaLoaded && perxonaConfig?.enabled)) return;
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 440;

    // Scene & Camera (Reference framing with generous headroom so character head never clips)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 1.15);
    camera.lookAt(0, 1.56, 0);

    // High-performance WebGL Renderer with ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Natural Soft Studio Lighting (diffused warm key, soft fill, subtle rim)
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(1.2, 2.5, 1.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.1);
    fillLight.position.set(-1.4, 1.8, 1.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(0, 2.2, -1.5);
    scene.add(rimLight);

    // Rig references for animations
    let headBone: THREE.Object3D | null = null;
    let neckBone: THREE.Object3D | null = null;
    let spineBone: THREE.Object3D | null = null;
    let leftArm: THREE.Object3D | null = null;
    let rightArm: THREE.Object3D | null = null;
    let leftForeArm: THREE.Object3D | null = null;
    let rightForeArm: THREE.Object3D | null = null;
    let leftHand: THREE.Object3D | null = null;
    let rightHand: THREE.Object3D | null = null;
    let baseHeadRotX = 0;
    let baseHeadRotY = 0;
    let baseHeadRotZ = 0;
    let baseNeckRotX = 0;
    let baseNeckRotY = 0;
    let baseSpineRotX = 0;
    const morphMeshes: THREE.Mesh[] = [];

    // Helper to safely set morph target weight
    const setMorph = (name: string, value: number) => {
      for (const mesh of morphMeshes) {
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          const index = mesh.morphTargetDictionary[name];
          if (index !== undefined) {
            mesh.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
          }
        }
      }
    };

    const setSmile = (value: number) => {
      setMorph('mouthSmile', value);
      setMorph('mouthSmileLeft', value);
      setMorph('mouthSmileRight', value);
    };

    // Load Photorealistic Human 3D Avatar (GLTF/GLB)
    setModelLoading(true);
    const loader = new GLTFLoader();
    const modelUrl = persona.model || '/avatars/sarah.glb';
    const isStrict = persona.name.toLowerCase().includes('michael');
    const baseSmile = isStrict ? 0.05 : 0.16;
    const isEmma = modelUrl.includes('emma');
    const baseArmRx = isEmma ? 1.3 : 1.38;
    const baseArmRz = isEmma ? 0.2 : 0.16;

    const onGltfLoaded = (gltf: any) => {
      if (isDisposed) return;
      const model = gltf.scene;

      model.traverse((child: any) => {
        if (child.isBone) {
          if (child.name === 'Head') headBone = child;
          if (child.name === 'Neck') neckBone = child;
          if (child.name === 'Spine2') spineBone = child;
          if (child.name === 'LeftArm') leftArm = child;
          if (child.name === 'RightArm') rightArm = child;
          if (child.name === 'LeftForeArm') leftForeArm = child;
          if (child.name === 'RightForeArm') rightForeArm = child;
          if (child.name === 'LeftHand') leftHand = child;
          if (child.name === 'RightHand') rightHand = child;

          // Give fingers a natural relaxed anatomical curl instead of stiff T-pose fingers
          if (/LeftHand(Index|Middle|Ring|Pinky)[123]/.test(child.name)) {
            child.rotation.x = 0.22;
          }
          if (/RightHand(Index|Middle|Ring|Pinky)[123]/.test(child.name)) {
            child.rotation.x = 0.22;
          }
        }
        if (child.isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          // Hide glasses if present so character matches reference portrait
          if (mesh.name.toLowerCase().includes('glasses')) {
            mesh.visible = false;
          }
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            morphMeshes.push(mesh);
          }
        }
      });

      // Store base rotations to maintain authentic anatomical posture
      if (headBone) {
        baseHeadRotX = (headBone as THREE.Object3D).rotation.x;
        baseHeadRotY = (headBone as THREE.Object3D).rotation.y;
        baseHeadRotZ = (headBone as THREE.Object3D).rotation.z;
      }
      if (neckBone) {
        baseNeckRotX = (neckBone as THREE.Object3D).rotation.x;
        baseNeckRotY = (neckBone as THREE.Object3D).rotation.y;
      }
      if (spineBone) {
        baseSpineRotX = (spineBone as THREE.Object3D).rotation.x;
      }

      // 1. Lower arms naturally along torso sides
      if (leftArm) {
        leftArm.rotation.set(baseArmRx, 0, -baseArmRz);
      }
      if (rightArm) {
        rightArm.rotation.set(baseArmRx, 0, baseArmRz);
      }
      if (leftForeArm) {
        leftForeArm.rotation.set(0.12, 0, 0.18);
      }
      if (rightForeArm) {
        rightForeArm.rotation.set(0.12, 0, -0.18);
      }

      // 2. Reference portrait positioning
      let headY = 1.62;
      if (headBone) {
        const worldPos = new THREE.Vector3();
        (headBone as THREE.Object3D).getWorldPosition(worldPos);
        if (worldPos.y > 0) headY = worldPos.y;
      }

      const targetY = headY - 0.04;
      const camY = headY + 0.02;
      camera.position.set(0, camY, 1.15);
      camera.lookAt(0, targetY, 0);

      // 3. Reset any erroneous default model weights (e.g., tongueOut)
      setMorph('tongueOut', 0);
      setMorph('mouthOpen', 0);
      setMorph('jawOpen', 0);
      setSmile(baseSmile);

      scene.add(model);
      setModelLoading(false);
    };

    const onGltfError = (err: any) => {
      console.error('[Avatar] Error loading 3D human model:', err);
      setModelLoading(false);
    };

    preloadAvatarModel(modelUrl)
      .then((buffer) => {
        if (isDisposed) return;
        loader.parse(buffer.slice(0), '', onGltfLoaded, onGltfError);
      })
      .catch(() => {
        if (isDisposed) return;
        loader.load(modelUrl, onGltfLoaded, undefined, onGltfError);
      });

    // Interactive Mouse Look-At Tracking (only applied when NOT in speaking mode)
    let pointerYaw = 0;
    let pointerPitch = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerYaw = THREE.MathUtils.clamp(x * 0.16, -0.16, 0.16);
      pointerPitch = THREE.MathUtils.clamp(y * 0.1, -0.1, 0.1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => handleResize()) : null;
    resizeObserver?.observe(container);

    // Animation Smoothing States
    const clock = new THREE.Clock();
    let blinkTimer = 0;
    let blinkProgress = 0;
    let isBlinking = false;
    let frameId: number;

    // Smoothed Lip-Sync & Facial Blendshape States (Oculus Visemes synced across Head, Teeth & Tongue)
    const VISEME_NAMES = [
      'viseme_PP',
      'viseme_FF',
      'viseme_TH',
      'viseme_DD',
      'viseme_kk',
      'viseme_CH',
      'viseme_SS',
      'viseme_nn',
      'viseme_RR',
      'viseme_aa',
      'viseme_E',
      'viseme_I',
      'viseme_O',
      'viseme_U',
    ] as const;

    // Realistic conversational English phoneme sequence (alternating consonants, vowels & natural micro-pauses)
    const SPEECH_TIMELINE: Array<{
      viseme: (typeof VISEME_NAMES)[number] | 'viseme_sil';
      weight: number;
      jaw: number;
      duration: number;
    }> = [
      { viseme: 'viseme_DD', weight: 0.42, jaw: 0.02, duration: 0.09 },
      { viseme: 'viseme_E', weight: 0.52, jaw: 0.04, duration: 0.13 },
      { viseme: 'viseme_nn', weight: 0.38, jaw: 0.02, duration: 0.08 },
      { viseme: 'viseme_aa', weight: 0.54, jaw: 0.06, duration: 0.15 },
      { viseme: 'viseme_RR', weight: 0.42, jaw: 0.02, duration: 0.09 },
      { viseme: 'viseme_I', weight: 0.48, jaw: 0.03, duration: 0.12 },
      { viseme: 'viseme_SS', weight: 0.36, jaw: 0.01, duration: 0.08 },
      { viseme: 'viseme_O', weight: 0.46, jaw: 0.04, duration: 0.14 },
      { viseme: 'viseme_PP', weight: 0.48, jaw: 0.0, duration: 0.09 },
      { viseme: 'viseme_E', weight: 0.46, jaw: 0.03, duration: 0.12 },
      { viseme: 'viseme_TH', weight: 0.38, jaw: 0.02, duration: 0.08 },
      { viseme: 'viseme_aa', weight: 0.48, jaw: 0.05, duration: 0.14 },
      { viseme: 'viseme_FF', weight: 0.42, jaw: 0.01, duration: 0.09 },
      { viseme: 'viseme_U', weight: 0.46, jaw: 0.02, duration: 0.12 },
      { viseme: 'viseme_kk', weight: 0.36, jaw: 0.02, duration: 0.08 },
      { viseme: 'viseme_sil', weight: 0.0, jaw: 0.0, duration: 0.22 },
      { viseme: 'viseme_CH', weight: 0.42, jaw: 0.02, duration: 0.09 },
      { viseme: 'viseme_I', weight: 0.5, jaw: 0.03, duration: 0.13 },
      { viseme: 'viseme_nn', weight: 0.36, jaw: 0.02, duration: 0.08 },
      { viseme: 'viseme_O', weight: 0.44, jaw: 0.04, duration: 0.14 },
      { viseme: 'viseme_DD', weight: 0.38, jaw: 0.02, duration: 0.08 },
      { viseme: 'viseme_aa', weight: 0.5, jaw: 0.05, duration: 0.14 },
      { viseme: 'viseme_PP', weight: 0.46, jaw: 0.0, duration: 0.09 },
      { viseme: 'viseme_E', weight: 0.48, jaw: 0.03, duration: 0.12 },
      { viseme: 'viseme_SS', weight: 0.34, jaw: 0.01, duration: 0.08 },
      { viseme: 'viseme_sil', weight: 0.0, jaw: 0.0, duration: 0.25 },
    ];

    const visemeWeights: Record<string, number> = {};
    for (const v of VISEME_NAMES) visemeWeights[v] = 0;

    let phonemeIdx = 0;
    let phonemeElapsed = 0;
    let currentJaw = 0;
    let currentSmile = baseSmile;
    let currentBrowUp = 0;

    // Smoothed Arm / Forearm / Hand Gesture States
    let lArmX = baseArmRx;
    let lArmZ = -baseArmRz;
    let rArmX = baseArmRx;
    let rArmZ = baseArmRz;
    let lForeArmX = 0.12;
    let lForeArmZ = 0.18;
    let rForeArmX = 0.12;
    let rForeArmZ = -0.18;
    let lHandX = 0;
    let lHandZ = 0;
    let rHandX = 0;
    let rHandZ = 0;

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();
      const {
        activeState: curState,
        audioPlaying: curAudioPlaying,
        isRecording: curIsRecording,
      } = liveStateRef.current;
      const isSpeaking = curState === 'speaking' || curAudioPlaying;

      // Ensure tongue remains naturally inside mouth at all times
      setMorph('tongueOut', 0);

      // 1. Subtle natural breathing & posture
      if (spineBone) {
        const breathAmp = isSpeaking ? 0.015 : 0.01;
        spineBone.rotation.x = baseSpineRotX + Math.sin(time * 1.6) * breathAmp;
      }

      // 2. Head Motion:
      //    - When SPEAKING: disable mouse cursor tracking completely; maintain direct eye contact
      //      with gentle, organic conversational cadence.
      //    - When NOT speaking: allow subtle mouse look-at tracking.
      if (headBone) {
        const activeYaw = isSpeaking ? 0 : pointerYaw;
        const activePitch = isSpeaking ? 0 : pointerPitch;

        const swayY = isSpeaking
          ? Math.sin(time * 1.35) * 0.018 + Math.sin(time * 2.9) * 0.008
          : Math.sin(time * 1.1) * 0.012;
        const swayX = isSpeaking
          ? Math.cos(time * 2.1) * 0.014 + Math.sin(time * 4.2) * 0.006
          : Math.cos(time * 1.5) * 0.008;

        headBone.rotation.y = THREE.MathUtils.lerp(
          headBone.rotation.y,
          baseHeadRotY + activeYaw + swayY,
          0.09
        );
        headBone.rotation.x = THREE.MathUtils.lerp(
          headBone.rotation.x,
          baseHeadRotX - activePitch + swayX,
          0.09
        );
      }

      if (neckBone) {
        const neckYaw = isSpeaking ? Math.sin(time * 1.35) * 0.008 : pointerYaw * 0.25;
        neckBone.rotation.y = THREE.MathUtils.lerp(
          neckBone.rotation.y,
          baseNeckRotY + neckYaw,
          0.08
        );
        neckBone.rotation.x = THREE.MathUtils.lerp(neckBone.rotation.x, baseNeckRotX, 0.08);
      }

      // 3. Natural Conversational Speech Lip-Sync (Unified Oculus Viseme Timeline)
      const attackAlpha = 1 - Math.exp(-delta * 22);
      const decayAlpha = 1 - Math.exp(-delta * 14);

      if (isSpeaking) {
        phonemeElapsed += delta;
        let currentPhoneme = SPEECH_TIMELINE[phonemeIdx];
        if (phonemeElapsed >= currentPhoneme.duration) {
          phonemeElapsed -= currentPhoneme.duration;
          phonemeIdx = (phonemeIdx + 1) % SPEECH_TIMELINE.length;
          currentPhoneme = SPEECH_TIMELINE[phonemeIdx];
        }

        // Smooth bell-shaped envelope within each phoneme so transitions never snap
        const progress = THREE.MathUtils.clamp(phonemeElapsed / currentPhoneme.duration, 0, 1);
        const envelope = 0.55 + 0.45 * Math.sin(progress * Math.PI);
        const activeViseme = currentPhoneme.viseme;
        const activeWeight = currentPhoneme.weight * envelope;

        for (const v of VISEME_NAMES) {
          const target = v === activeViseme ? activeWeight : 0;
          const alpha = target > visemeWeights[v] ? attackAlpha : decayAlpha;
          visemeWeights[v] = THREE.MathUtils.lerp(visemeWeights[v], target, alpha);
          setMorph(v, visemeWeights[v]);
        }

        const targetJaw = currentPhoneme.jaw * envelope;
        currentJaw = THREE.MathUtils.lerp(
          currentJaw,
          targetJaw,
          targetJaw > currentJaw ? attackAlpha : decayAlpha
        );

        // Relax smile during rounded/bilabial sounds so lips close & round naturally
        const isRoundedOrClosed =
          activeViseme === 'viseme_O' ||
          activeViseme === 'viseme_U' ||
          activeViseme === 'viseme_PP' ||
          activeViseme === 'viseme_FF';
        const targetSmile = isRoundedOrClosed
          ? isStrict
            ? 0.02
            : 0.05
          : isStrict
          ? 0.04
          : 0.11;
        const targetBrow = 0.05 + Math.max(0, Math.sin(time * 2.2)) * 0.08;

        currentSmile = THREE.MathUtils.lerp(currentSmile, targetSmile, decayAlpha);
        currentBrowUp = THREE.MathUtils.lerp(currentBrowUp, targetBrow, decayAlpha);
      } else {
        // Smooth transition to relaxed, closed mouth with polite recruiter smile
        phonemeElapsed = 0;
        for (const v of VISEME_NAMES) {
          visemeWeights[v] = THREE.MathUtils.lerp(visemeWeights[v], 0, decayAlpha);
          setMorph(v, visemeWeights[v]);
        }
        currentJaw = THREE.MathUtils.lerp(currentJaw, 0, decayAlpha);
        currentSmile = THREE.MathUtils.lerp(currentSmile, baseSmile, decayAlpha);
        currentBrowUp = THREE.MathUtils.lerp(
          currentBrowUp,
          curState === 'listening' && curIsRecording ? 0.16 : 0,
          decayAlpha
        );
      }

      setMorph('jawOpen', currentJaw);
      setMorph('mouthOpen', 0);
      setSmile(currentSmile);
      setMorph('browInnerUp', currentBrowUp);
      setMorph('browOuterUpLeft', currentBrowUp * 0.5);
      setMorph('browOuterUpRight', currentBrowUp * 0.5);

      // 4. Slight Natural Hand & Arm Movements while Talking
      if (isSpeaking) {
        // Organic alternating left/right gesture waves so hands/arms move subtly with speech
        const leftWave = Math.max(0, Math.sin(time * 1.7) * 0.7 + Math.sin(time * 0.9) * 0.3);
        const rightWave = Math.max(
          0,
          Math.sin(time * 1.5 + 1.8) * 0.7 + Math.cos(time * 0.85) * 0.3
        );
        const microCadence = Math.sin(time * 3.6) * 0.04;

        // Slight upper arm forward/inward shift + gentle forearm/hand lift into lower frame
        const targetLArmX = baseArmRx - 0.1 * leftWave;
        const targetLArmZ = -baseArmRz + 0.38 * leftWave;
        const targetRArmX = baseArmRx - 0.1 * rightWave;
        const targetRArmZ = baseArmRz - 0.38 * rightWave;

        const targetLForeX = 0.22 + 0.12 * leftWave;
        const targetLForeZ = 0.45 + 0.72 * leftWave + microCadence;
        const targetRForeX = 0.22 + 0.12 * rightWave;
        const targetRForeZ = -0.45 - 0.72 * rightWave - microCadence;

        const targetLHandX = -0.08 * leftWave + microCadence;
        const targetLHandZ = -0.12 * leftWave;
        const targetRHandX = -0.08 * rightWave - microCadence;
        const targetRHandZ = 0.12 * rightWave;

        lArmX = THREE.MathUtils.lerp(lArmX, targetLArmX, 0.06);
        lArmZ = THREE.MathUtils.lerp(lArmZ, targetLArmZ, 0.06);
        rArmX = THREE.MathUtils.lerp(rArmX, targetRArmX, 0.06);
        rArmZ = THREE.MathUtils.lerp(rArmZ, targetRArmZ, 0.06);

        lForeArmX = THREE.MathUtils.lerp(lForeArmX, targetLForeX, 0.07);
        lForeArmZ = THREE.MathUtils.lerp(lForeArmZ, targetLForeZ, 0.07);
        rForeArmX = THREE.MathUtils.lerp(rForeArmX, targetRForeX, 0.07);
        rForeArmZ = THREE.MathUtils.lerp(rForeArmZ, targetRForeZ, 0.07);

        lHandX = THREE.MathUtils.lerp(lHandX, targetLHandX, 0.1);
        lHandZ = THREE.MathUtils.lerp(lHandZ, targetLHandZ, 0.1);
        rHandX = THREE.MathUtils.lerp(rHandX, targetRHandX, 0.1);
        rHandZ = THREE.MathUtils.lerp(rHandZ, targetRHandZ, 0.1);
      } else {
        // Gentle idle breathing sway at rest
        const idleBreath = Math.sin(time * 1.5) * 0.015;
        lArmX = THREE.MathUtils.lerp(lArmX, baseArmRx + idleBreath, 0.06);
        lArmZ = THREE.MathUtils.lerp(lArmZ, -baseArmRz, 0.06);
        rArmX = THREE.MathUtils.lerp(rArmX, baseArmRx + idleBreath, 0.06);
        rArmZ = THREE.MathUtils.lerp(rArmZ, baseArmRz, 0.06);

        lForeArmX = THREE.MathUtils.lerp(lForeArmX, 0.12, 0.06);
        lForeArmZ = THREE.MathUtils.lerp(lForeArmZ, 0.18, 0.06);
        rForeArmX = THREE.MathUtils.lerp(rForeArmX, 0.12, 0.06);
        rForeArmZ = THREE.MathUtils.lerp(rForeArmZ, -0.18, 0.06);

        lHandX = THREE.MathUtils.lerp(lHandX, 0, 0.08);
        lHandZ = THREE.MathUtils.lerp(lHandZ, 0, 0.08);
        rHandX = THREE.MathUtils.lerp(rHandX, 0, 0.08);
        rHandZ = THREE.MathUtils.lerp(rHandZ, 0, 0.08);
      }

      if (leftArm) leftArm.rotation.set(lArmX, 0, lArmZ);
      if (rightArm) rightArm.rotation.set(rArmX, 0, rArmZ);
      if (leftForeArm) leftForeArm.rotation.set(lForeArmX, 0, lForeArmZ);
      if (rightForeArm) rightForeArm.rotation.set(rForeArmX, 0, rForeArmZ);
      if (leftHand) leftHand.rotation.set(lHandX, 0, lHandZ);
      if (rightHand) rightHand.rotation.set(rHandX, 0, rHandZ);

      // 5. Attentive Listening Nod when candidate speaks (Spacebar held)
      if (curState === 'listening' && curIsRecording) {
        if (headBone) {
          headBone.rotation.x += Math.sin(time * 3.4) * 0.022; // Gentle attentive nod
          headBone.rotation.z = THREE.MathUtils.lerp(
            headBone.rotation.z,
            baseHeadRotZ + 0.035,
            0.1
          ); // Slight interested head tilt
        }
      } else {
        if (headBone) {
          const speakingTilt = isSpeaking ? Math.sin(time * 1.1) * 0.012 : 0;
          headBone.rotation.z = THREE.MathUtils.lerp(
            headBone.rotation.z,
            baseHeadRotZ + speakingTilt,
            0.1
          );
        }
      }

      // 6. Natural Eye Blinking Simulation (every ~3.5 seconds)
      blinkTimer += delta;
      if (blinkTimer > 3.5 && !isBlinking) {
        isBlinking = true;
        blinkProgress = 0;
      }
      if (isBlinking) {
        blinkProgress += delta * 15;
        const blinkVal = Math.sin(blinkProgress);
        setMorph('eyeBlinkLeft', Math.max(0, blinkVal));
        setMorph('eyeBlinkRight', Math.max(0, blinkVal));
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkTimer = 0;
          setMorph('eyeBlinkLeft', 0);
          setMorph('eyeBlinkRight', 0);
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [avatarMode, perxonaLoaded, perxonaConfig, persona.model, persona.name]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto">
      {/* Top Floating Controls: 3D vs 2D Mode Switch */}
      <motion.div
        variants={entranceStagger ? stageVariants : undefined}
        custom={STAGE.pills}
        className="mb-2 flex items-center gap-2 p-1 rounded-full bg-muted/80 dark:bg-[#141414] border border-border dark:border-[#262626] shadow-md z-20"
      >
        <button
          type="button"
          onClick={() => onToggleMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            avatarMode === '3d'
              ? 'bg-white text-black font-semibold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          <span>3D Human Avatar (Active)</span>
          {perxonaConfig?.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            avatarMode === '2d'
              ? 'bg-white text-black font-semibold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-3 h-3 text-muted-foreground dark:text-zinc-400" />
          <span>2D Minimal</span>
        </button>
      </motion.div>

      {/* 3D HUMAN AVATAR VIEWPORT */}
      <motion.div
        variants={entranceStagger ? avatarStageVariants : undefined}
        custom={STAGE.avatar}
        className="flex flex-col items-center"
      >
      {avatarMode === '3d' ? (
        <div className="relative w-[340px] h-[370px] md:w-[440px] md:h-[430px] flex items-center justify-center">
          {perxonaLoaded && perxonaConfig?.enabled ? (
            /* Live XRSPACE Perxona <sv-presenter> Web Component */
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted dark:from-[#181818]/60 dark:to-[#0e0e0e]/80 border border-border dark:border-[#2b2b2b] shadow-2xl flex items-center justify-center">
              {/* @ts-ignore - custom web component from Perxona SDK */}
              <sv-presenter
                ref={presenterRef}
                class="w-full h-full"
                publishable-key={perxonaConfig.publishableKey}
                base-url={perxonaConfig.baseUrl}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 dark:bg-black/60 backdrop-blur-md border border-border dark:border-white/10 text-[10px] font-mono text-foreground/80 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>XRSPACE Behavior AI™ • 60 FPS</span>
              </div>
            </div>
          ) : (
            /* Photorealistic 3D Human Character Engine (WebGL + Blendshapes) */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Loading indicator while GLB loads */}
              {modelLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 dark:bg-[#121212]/80 backdrop-blur-sm rounded-2xl z-20">
                  <Loader2 className="w-7 h-7 text-cyan-600 dark:text-cyan-400 animate-spin" />
                  <p className="text-xs font-mono text-muted-foreground dark:text-zinc-400">Loading 3D Human Avatar...</p>
                </div>
              )}

              {/* WebGL Canvas Viewport */}
              <div
                ref={containerRef}
                className="w-[340px] h-[350px] md:w-[420px] md:h-[410px] flex items-center justify-center"
              />

              {/* Dynamic Status Pill */}
              <div className="absolute bottom-1 flex items-center gap-2 px-3 py-1 rounded-full bg-background/90 dark:bg-[#181818]/90 backdrop-blur-md border border-border dark:border-[#2b2b2b] text-[11px] font-mono text-foreground/80 dark:text-zinc-300 shadow-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeState === 'speaking' || audioPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <span>3D Photorealistic Avatar • {persona.name} (Deepgram Aura Sync)</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2D MINIMAL RADAR AVATAR */
        <div className="relative flex flex-col items-center my-4">
          {/* Animated Radar Pulse Rings */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {activeState === 'speaking' && (
              <>
                <div
                  className="absolute -inset-[30px] rounded-full border border-foreground/10 dark:border-white/10"
                  style={{ animation: 'pulseRing 2.2s ease-out infinite' }}
                />
                <div
                  className="absolute -inset-[60px] rounded-full border border-foreground/[0.06] dark:border-white/[0.06]"
                  style={{ animation: 'pulseRing 2.2s 0.4s ease-out infinite' }}
                />
                <div
                  className="absolute -inset-[90px] rounded-full border border-foreground/[0.03] dark:border-white/[0.03]"
                  style={{ animation: 'pulseRing 2.2s 0.8s ease-out infinite' }}
                />
              </>
            )}
            {activeState === 'thinking' && (
              <div className="absolute -inset-[24px] rounded-full bg-foreground/[0.04] dark:bg-white/[0.04] blur-[20px]" />
            )}
            {activeState === 'listening' && isRecording && (
              <div
                className="absolute -inset-[30px] rounded-full border border-red-500/20"
                style={{ animation: 'pulseRing 1.8s ease-out infinite' }}
              />
            )}
          </div>

          {/* Avatar Frame with Breathing Animation */}
          <div
            className="relative rounded-full p-[3px] bg-gradient-to-b from-muted to-muted/40 dark:from-[#2a2a2a] dark:to-[#151515] shadow-lg dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_20px_40px_-12px_rgba(0,0,0,0.9)]"
            style={{
              animation: activeState === 'speaking' ? 'avatarBreathe 1.6s ease-in-out infinite' : 'none',
            }}
          >
            <div className="relative rounded-full p-[4px] bg-card dark:bg-[#0e0e0e]">
              <div className="h-[220px] w-[220px] md:h-[260px] md:w-[260px] rounded-full overflow-hidden bg-muted dark:bg-[#181818] relative">
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="h-full w-full object-cover scale-[1.02]"
                />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]" />
                {activeState === 'speaking' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                )}
              </div>

              {/* Corner Status Dot */}
              <div
                className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-[3px] border-card dark:border-[#121212] grid place-items-center transition-all duration-300 ${
                  activeState === 'speaking'
                    ? 'bg-[#ff4a3d] scale-100'
                    : activeState === 'thinking'
                    ? 'bg-[#facc15] scale-100'
                    : isRecording
                    ? 'bg-[#ff4a3d] scale-100'
                    : 'bg-[#22c55e] scale-90'
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full bg-white ${
                    activeState === 'speaking' || isRecording ? 'animate-pulse' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      </motion.div>

      {/* Dynamic Equalizer Soundwave Bars (12 bars) */}
      <div className="mt-4 flex items-end gap-[4px] h-[32px]">
        {[...Array(12)].map((_, c) => {
          const isSpeaking = activeState === 'speaking' || audioPlaying;
          const isThinking = activeState === 'thinking';
          const isMicRecording = isRecording;
          const m = [0, 0.1, 0.2, 0.15, 0.05, 0.25, 0.12, 0.18, 0.08, 0.22, 0.11, 0.19];
          const speakHeights = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 14];

          let barHeight = '4px';
          let animStyle: React.CSSProperties = {};

          if (isSpeaking) {
            barHeight = `${speakHeights[c % speakHeights.length]}px`;
            animStyle = {
              animation: `waveDance 0.8s ease-in-out ${m[c % m.length]}s infinite alternate`,
            };
          } else if (isThinking) {
            barHeight = '8px';
            animStyle = {
              animation: `waveDance 1.6s ease-in-out ${c * 0.1}s infinite alternate`,
            };
          } else if (isMicRecording) {
            barHeight = `${12 + (c % 4) * 4}px`;
            animStyle = {
              animation: `waveDance 0.6s ease-in-out ${(11 - c) * 0.08}s infinite alternate`,
            };
          }

          return (
            <span
              key={c}
              className={`w-[3px] rounded-full transition-all duration-200 ${
                isSpeaking
                  ? avatarMode === '3d'
                    ? 'bg-gradient-to-t from-cyan-500 to-sky-200 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-white'
                  : isThinking
                  ? 'bg-amber-400'
                  : isMicRecording
                  ? 'bg-red-500'
                  : 'bg-[#2a2a2a]'
              }`}
              style={{
                height: barHeight,
                ...animStyle,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

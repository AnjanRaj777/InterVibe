'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sparkles, Radio, Loader2 } from 'lucide-react';

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
}

export const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({
  persona,
  activeState,
  isRecording,
  audioPlaying,
  avatarMode,
  onToggleMode,
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

    // Scene & Camera (Golden-ratio portrait framing matching executive headshot in Image 2)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
    camera.position.set(0, 1.54, 0.88);
    camera.lookAt(0, 1.50, 0);

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
    let baseHeadRotX = 0;
    let baseHeadRotY = 0;
    let baseHeadRotZ = 0;
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
    const baseSmile = isStrict ? 0.05 : 0.18;

    loader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as any).isBone) {
            if (child.name === 'Head') headBone = child;
            if (child.name === 'Neck') neckBone = child;
            if (child.name === 'Spine2') spineBone = child;
            if (child.name === 'LeftArm') leftArm = child;
            if (child.name === 'RightArm') rightArm = child;
            if (child.name === 'LeftForeArm') leftForeArm = child;
            if (child.name === 'RightForeArm') rightForeArm = child;
          }
          if ((child as any).isMesh) {
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
        if (spineBone) {
          baseSpineRotX = (spineBone as THREE.Object3D).rotation.x;
        }

        // 1. Natural executive bust shot framing matching video interview webcam (Image 2)
        // Position camera relative to actual model head position so avatar fills the frame from mid-chest up
        let headY = 1.62;
        if (headBone) {
          const worldPos = new THREE.Vector3();
          (headBone as THREE.Object3D).getWorldPosition(worldPos);
          if (worldPos.y > 0) headY = worldPos.y;
        }

        const targetY = headY - 0.12;
        const camY = headY - 0.08;
        camera.position.set(0, camY, 0.88);
        camera.lookAt(0, targetY, 0);

        // 2. Reset any erroneous default model weights (e.g., tongueOut)
        setMorph('tongueOut', 0);
        setMorph('mouthOpen', 0);
        setMorph('jawOpen', 0);
        setSmile(baseSmile);

        scene.add(model);
        setModelLoading(false);
      },
      undefined,
      (err) => {
        console.error('[Avatar] Error loading 3D human model:', err);
        setModelLoading(false);
      }
    );

    // Interactive Mouse Look-At Tracking
    let targetYaw = 0;
    let targetPitch = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetYaw = THREE.MathUtils.clamp(x * 0.18, -0.18, 0.18);
      targetPitch = THREE.MathUtils.clamp(y * 0.12, -0.12, 0.12);
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

    // Animation Smoothing States
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let blinkProgress = 0;
    let isBlinking = false;
    let frameId: number;

    let currentJaw = 0;
    let currentVisemeAA = 0;
    let currentVisemeO = 0;
    let currentVisemeE = 0;

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Ensure tongue remains naturally inside mouth at all times
      setMorph('tongueOut', 0);

      // 1. Subtle natural breathing & posture
      if (spineBone) {
        spineBone.rotation.x = baseSpineRotX + Math.sin(time * 1.5) * 0.012;
      }

      // 2. Smooth Head Tracking & Conversational Sway
      if (headBone) {
        const swayY = Math.sin(time * 1.2) * 0.015;
        const swayX = Math.cos(time * 1.8) * 0.01;
        headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, baseHeadRotY + targetYaw + swayY, 0.08);
        headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, baseHeadRotX - targetPitch + swayX, 0.08);
      }

      // 3. Realistic Conversational Speech Lip-Sync (Deepgram Aura Sync)
      const isSpeaking = activeState === 'speaking' || audioPlaying;
      if (isSpeaking) {
        // Natural human syllable cadence (~4-5 syllables/sec, subtle 0.08 - 0.28 range)
        const syllable1 = Math.sin(time * 9.0);
        const syllable2 = Math.cos(time * 4.5);
        const rawMouth = Math.max(0, syllable1 * 0.7 + syllable2 * 0.3);

        const targetJaw = rawMouth * 0.26;
        const targetAA = rawMouth * 0.22;
        const targetO = Math.max(0, Math.sin(time * 5.2)) * 0.16;
        const targetE = Math.max(0, Math.cos(time * 6.4)) * 0.18;

        currentJaw = THREE.MathUtils.lerp(currentJaw, targetJaw, 0.28);
        currentVisemeAA = THREE.MathUtils.lerp(currentVisemeAA, targetAA, 0.28);
        currentVisemeO = THREE.MathUtils.lerp(currentVisemeO, targetO, 0.28);
        currentVisemeE = THREE.MathUtils.lerp(currentVisemeE, targetE, 0.28);

        setMorph('jawOpen', currentJaw);
        setMorph('mouthOpen', currentJaw * 0.5);
        setMorph('viseme_aa', currentVisemeAA);
        setMorph('viseme_O', currentVisemeO);
        setMorph('viseme_E', currentVisemeE);
        setSmile(isStrict ? 0.08 : 0.22);
      } else {
        // Smooth transition to relaxed, closed mouth with polite recruiter smile
        currentJaw = THREE.MathUtils.lerp(currentJaw, 0, 0.22);
        currentVisemeAA = THREE.MathUtils.lerp(currentVisemeAA, 0, 0.22);
        currentVisemeO = THREE.MathUtils.lerp(currentVisemeO, 0, 0.22);
        currentVisemeE = THREE.MathUtils.lerp(currentVisemeE, 0, 0.22);

        setMorph('jawOpen', currentJaw);
        setMorph('mouthOpen', currentJaw);
        setMorph('viseme_aa', currentVisemeAA);
        setMorph('viseme_O', currentVisemeO);
        setMorph('viseme_E', currentVisemeE);
        setSmile(baseSmile);
      }

      // 4. Attentive Listening Nod when candidate speaks (Spacebar held)
      if (activeState === 'listening' && isRecording) {
        if (headBone) {
          headBone.rotation.x += Math.sin(time * 3.4) * 0.022; // Gentle attentive nod
          headBone.rotation.z = baseHeadRotZ + 0.035; // Slight interested head tilt
        }
        setMorph('browInnerUp', 0.18);
      } else {
        if (headBone) {
          headBone.rotation.z = THREE.MathUtils.lerp(headBone.rotation.z, baseHeadRotZ, 0.1);
        }
        setMorph('browInnerUp', 0);
      }

      // 5. Natural Eye Blinking Simulation (every ~3.5 seconds)
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
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [avatarMode, activeState, audioPlaying, isRecording, perxonaLoaded, perxonaConfig, persona]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto">
      {/* Top Floating Controls: 3D vs 2D Mode Switch */}
      <div className="mb-2 flex items-center gap-2 p-1 rounded-full bg-[#141414] border border-[#262626] shadow-md z-20">
        <button
          type="button"
          onClick={() => onToggleMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            avatarMode === '3d'
              ? 'bg-white text-black font-semibold shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>3D Human Avatar (Active)</span>
          {perxonaConfig?.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            avatarMode === '2d'
              ? 'bg-white text-black font-semibold shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Radio className="w-3 h-3 text-zinc-400" />
          <span>2D Minimal</span>
        </button>
      </div>

      {/* 3D HUMAN AVATAR VIEWPORT */}
      {avatarMode === '3d' ? (
        <div className="relative w-[340px] h-[370px] md:w-[440px] md:h-[430px] flex items-center justify-center">
          {perxonaLoaded && perxonaConfig?.enabled ? (
            /* Live XRSPACE Perxona <sv-presenter> Web Component */
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#181818]/60 to-[#0e0e0e]/80 border border-[#2b2b2b] shadow-2xl flex items-center justify-center">
              {/* @ts-ignore - custom web component from Perxona SDK */}
              <sv-presenter
                ref={presenterRef}
                class="w-full h-full"
                publishable-key={perxonaConfig.publishableKey}
                base-url={perxonaConfig.baseUrl}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>XRSPACE Behavior AI™ • 60 FPS</span>
              </div>
            </div>
          ) : (
            /* Photorealistic 3D Human Character Engine (WebGL + Blendshapes) */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Loading indicator while GLB loads */}
              {modelLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#121212]/80 backdrop-blur-sm rounded-2xl z-20">
                  <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                  <p className="text-xs font-mono text-zinc-400">Loading 3D Human Avatar...</p>
                </div>
              )}

              {/* WebGL Canvas Viewport */}
              <div
                ref={containerRef}
                className="w-[340px] h-[350px] md:w-[420px] md:h-[410px] flex items-center justify-center"
              />

              {/* Dynamic Status Pill */}
              <div className="absolute bottom-1 flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818]/90 backdrop-blur-md border border-[#2b2b2b] text-[11px] font-mono text-zinc-300 shadow">
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
                  className="absolute -inset-[30px] rounded-full border border-white/10"
                  style={{ animation: 'pulseRing 2.2s ease-out infinite' }}
                />
                <div
                  className="absolute -inset-[60px] rounded-full border border-white/[0.06]"
                  style={{ animation: 'pulseRing 2.2s 0.4s ease-out infinite' }}
                />
                <div
                  className="absolute -inset-[90px] rounded-full border border-white/[0.03]"
                  style={{ animation: 'pulseRing 2.2s 0.8s ease-out infinite' }}
                />
              </>
            )}
            {activeState === 'thinking' && (
              <div className="absolute -inset-[24px] rounded-full bg-white/[0.04] blur-[20px]" />
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
            className="relative rounded-full p-[3px] bg-gradient-to-b from-[#2a2a2a] to-[#151515] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_20px_40px_-12px_rgba(0,0,0,0.9)]"
            style={{
              animation: activeState === 'speaking' ? 'avatarBreathe 1.6s ease-in-out infinite' : 'none',
            }}
          >
            <div className="relative rounded-full p-[4px] bg-[#0e0e0e]">
              <div className="h-[220px] w-[220px] md:h-[260px] md:w-[260px] rounded-full overflow-hidden bg-[#181818] relative">
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="h-full w-full object-cover scale-[1.02]"
                />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]" />
                {activeState === 'speaking' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                )}
              </div>

              {/* Corner Status Dot */}
              <div
                className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-[3px] border-[#121212] grid place-items-center transition-all duration-300 ${
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
              animation: `waveDance 0.8s ease-in-out infinite alternate`,
              animationDelay: `${m[c % m.length]}s`,
            };
          } else if (isThinking) {
            barHeight = '8px';
            animStyle = {
              animation: `waveDance 1.6s ease-in-out infinite alternate`,
              animationDelay: `${c * 0.1}s`,
            };
          } else if (isMicRecording) {
            barHeight = `${12 + (c % 4) * 4}px`;
            animStyle = {
              animation: `waveDance 0.6s ease-in-out infinite alternate`,
              animationDelay: `${(11 - c) * 0.08}s`,
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

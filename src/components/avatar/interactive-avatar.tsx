'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Radio, Eye, Key } from 'lucide-react';

interface InteractiveAvatarProps {
  persona: {
    name: string;
    title: string;
    avatar: string;
    voice: string;
    auraVoice?: string;
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
        console.warn('[Avatar] Perxona session check skipped:', err);
      }
    }
    checkPerxona();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Perxona Connect SDK if publishable key is present
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
      console.warn('[Avatar] Failed to load remote Perxona SDK script.');
    };
    document.body.appendChild(script);
  }, [avatarMode, perxonaConfig]);

  // 3. Real 3D WebGL Avatar Engine (Three.js)
  useEffect(() => {
    if (avatarMode !== '3d' || (perxonaLoaded && perxonaConfig?.enabled)) return;
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 3.4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3D Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.0); // Cool key light
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf8fafc, 1.2); // Warm fill
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.0); // Cyan rim light
    rimLight.position.set(0, 3, -2);
    scene.add(rimLight);

    // Materials
    const skinColor = persona.name.includes('Michael') ? 0xd4a373 : 0xf6d5c2;
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.5,
      metalness: 0.05,
    });

    const hairColor = persona.name.includes('Emma') ? 0xb45309 : persona.name.includes('Michael') ? 0x1f2937 : 0x3b2f2f;
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.7,
      metalness: 0.1,
    });

    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.1,
    });

    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.1,
      metalness: 0.8,
    });

    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });

    // Avatar Group
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // 1. Torso / Shoulders
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.8, 32);
    const torso = new THREE.Mesh(torsoGeo, suitMaterial);
    torso.position.y = -0.7;
    avatarGroup.add(torso);

    // Collar / Inner Shirt
    const shirtGeo = new THREE.ConeGeometry(0.28, 0.4, 32);
    const shirt = new THREE.Mesh(shirtGeo, shirtMaterial);
    shirt.position.set(0, -0.45, 0.18);
    shirt.rotation.x = 0.2;
    avatarGroup.add(shirt);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.35, 32);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.y = -0.22;
    avatarGroup.add(neck);

    // Head Group (rotates on look & nod)
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.2;
    avatarGroup.add(headGroup);

    // 2. Head Base (Face)
    const headGeo = new THREE.SphereGeometry(0.48, 32, 32);
    headGeo.scale(0.9, 1.15, 0.95);
    const head = new THREE.Mesh(headGeo, skinMaterial);
    headGroup.add(head);

    // 3. Hair (Sculpted 3D volume)
    const hairGeo = new THREE.SphereGeometry(0.52, 32, 32);
    hairGeo.scale(0.95, 1.15, 1.05);
    const hair = new THREE.Mesh(hairGeo, hairMaterial);
    hair.position.set(0, 0.08, -0.06);
    headGroup.add(hair);

    // Front Hair Bangs
    const bangsGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.22, 32, 1, false, 0, Math.PI);
    const bangs = new THREE.Mesh(bangsGeo, hairMaterial);
    bangs.position.set(0, 0.38, 0.25);
    bangs.rotation.x = 0.35;
    headGroup.add(bangs);

    // 4. Eyes & Brows
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(0.16, 0.06, 0.4);
    headGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(-0.16, 0.06, 0.4);
    headGroup.add(rightEyeGroup);

    const eyeBallGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const leftEyeWhite = new THREE.Mesh(eyeBallGeo, eyeWhiteMaterial);
    const rightEyeWhite = new THREE.Mesh(eyeBallGeo, eyeWhiteMaterial);
    leftEyeGroup.add(leftEyeWhite);
    rightEyeGroup.add(rightEyeWhite);

    const pupilGeo = new THREE.SphereGeometry(0.035, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeo, eyeMaterial);
    leftPupil.position.z = 0.045;
    const rightPupil = new THREE.Mesh(pupilGeo, eyeMaterial);
    rightPupil.position.z = 0.045;
    leftEyeGroup.add(leftPupil);
    rightEyeGroup.add(rightPupil);

    // Eyelids for blinking
    const eyelidGeo = new THREE.SphereGeometry(0.07, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftEyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
    leftEyelid.rotation.x = Math.PI;
    leftEyelid.scale.set(1, 0.01, 1);
    leftEyeGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
    rightEyelid.rotation.x = Math.PI;
    rightEyelid.scale.set(1, 0.01, 1);
    rightEyeGroup.add(rightEyelid);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.12, 0.02, 0.03);
    const leftBrow = new THREE.Mesh(browGeo, hairMaterial);
    leftBrow.position.set(0.16, 0.16, 0.42);
    leftBrow.rotation.z = -0.08;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, hairMaterial);
    rightBrow.position.set(-0.16, 0.16, 0.42);
    rightBrow.rotation.z = 0.08;
    headGroup.add(rightBrow);

    // 5. Nose
    const noseGeo = new THREE.ConeGeometry(0.04, 0.12, 16);
    const nose = new THREE.Mesh(noseGeo, skinMaterial);
    nose.position.set(0, -0.04, 0.46);
    nose.rotation.x = -0.2;
    headGroup.add(nose);

    // 6. Articulating Lower Jaw & Mouth (Lip-sync to Deepgram Aura Voice)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.2, 0.32);
    headGroup.add(jawGroup);

    const jawGeo = new THREE.SphereGeometry(0.16, 16, 16);
    jawGeo.scale(1.2, 0.6, 0.8);
    const jaw = new THREE.Mesh(jawGeo, skinMaterial);
    jawGroup.add(jaw);

    const lipsMaterial = new THREE.MeshStandardMaterial({
      color: 0xc86464,
      roughness: 0.4,
    });
    const lipsGeo = new THREE.TorusGeometry(0.065, 0.018, 12, 24, Math.PI);
    const lips = new THREE.Mesh(lipsGeo, lipsMaterial);
    lips.position.set(0, 0.04, 0.14);
    lips.rotation.z = Math.PI;
    jawGroup.add(lips);

    // 7. Holographic 3D Floating Cyber Ring
    const ringGeo = new THREE.TorusGeometry(0.9, 0.008, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const holoRing = new THREE.Mesh(ringGeo, ringMat);
    holoRing.rotation.x = 1.2;
    avatarGroup.add(holoRing);

    // Mouse Tracking state
    let targetYaw = 0;
    let targetPitch = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetYaw = THREE.MathUtils.clamp(x * 0.35, -0.35, 0.35);
      targetPitch = THREE.MathUtils.clamp(y * 0.25, -0.25, 0.25);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let blinkProgress = 0;
    let isBlinking = false;
    let frameId: number;

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Idle breathing (gentle vertical oscillation)
      avatarGroup.position.y = Math.sin(time * 1.6) * 0.025;
      torso.scale.x = 1 + Math.sin(time * 1.6) * 0.01;
      holoRing.rotation.z = time * 0.2;

      // Smooth look-at tracking
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetYaw, 0.08);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -targetPitch, 0.08);

      // Speaking State (Articulate jaw to Deepgram Aura audio)
      const isSpeaking = activeState === 'speaking' || audioPlaying;
      if (isSpeaking) {
        const mouthOpen = Math.abs(Math.sin(time * 14)) * 0.18 + (Math.sin(time * 8) > 0 ? 0.08 : 0);
        jawGroup.position.y = -0.2 - mouthOpen;
        jawGroup.rotation.x = mouthOpen * 1.2;
        holoRing.material.opacity = 0.6 + Math.sin(time * 10) * 0.3;
        ringMat.color.setHex(0x06b6d4); // Cyan pulse
      } else {
        jawGroup.position.y = THREE.MathUtils.lerp(jawGroup.position.y, -0.2, 0.2);
        jawGroup.rotation.x = THREE.MathUtils.lerp(jawGroup.rotation.x, 0, 0.2);
        holoRing.material.opacity = 0.35;
        ringMat.color.setHex(0x38bdf8);
      }

      // Attentive Listening Nod when candidate speaks (Spacebar held)
      if (activeState === 'listening' && isRecording) {
        headGroup.rotation.x += Math.sin(time * 3.5) * 0.03; // Gentle attentive nod
        ringMat.color.setHex(0xef4444); // Red indicator
      }

      // Blinking simulation
      blinkTimer += delta;
      if (blinkTimer > 3.2 && !isBlinking) {
        isBlinking = true;
        blinkProgress = 0;
      }
      if (isBlinking) {
        blinkProgress += delta * 12;
        const scaleY = Math.sin(blinkProgress) * 1.1;
        leftEyelid.scale.y = Math.max(0.01, scaleY);
        rightEyelid.scale.y = Math.max(0.01, scaleY);
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkTimer = 0;
          leftEyelid.scale.y = 0.01;
          rightEyelid.scale.y = 0.01;
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
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
          <span>3D Avatar (Active)</span>
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

      {/* 3D AVATAR VIEWPORT */}
      {avatarMode === '3d' ? (
        <div className="relative w-[340px] h-[350px] md:w-[400px] md:h-[400px] flex items-center justify-center">
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
            /* Interactive Real-Time 3D WebGL Avatar Engine */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* WebGL Canvas Container */}
              <div
                ref={containerRef}
                className="w-[340px] h-[340px] md:w-[380px] md:h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing"
              />

              {/* Status Badge */}
              <div className="absolute bottom-2 flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818]/90 backdrop-blur-md border border-[#2b2b2b] text-[11px] font-mono text-zinc-300 shadow">
                <span className={`w-2 h-2 rounded-full ${activeState === 'speaking' || audioPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span>3D WebGL Engine • {persona.name} (Deepgram Aura Sync)</span>
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

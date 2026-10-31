// Shared materials for v4 parts. makeMats(THREE) -> { cardboard, wood, metal, ... }
function canvasTex(THREE, w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(...repeat); return t;
}
function rnd(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
export function cardboardTexture(THREE) {
  // near-white so vertex colour/material colour sets the kraft tone; centre tape stripe along v, fibres, edge darkening
  return canvasTex(THREE, 256, 256, (x, w, h) => {
    const r = rnd(11);
    x.fillStyle = '#e6e6e6'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const v = 200 + r() * 55; x.fillStyle = `rgba(${v},${v * 0.97},${v * 0.92},0.35)`; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1); }
    for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(150,130,100,0.10)'; x.beginPath(); const yy = r() * h; x.moveTo(0, yy); x.lineTo(w, yy + (r() - 0.5) * 8); x.stroke(); }
    // packing tape: slightly darker amber band with glossy highlight and wrinkles
    x.fillStyle = 'rgba(170,120,50,0.38)'; x.fillRect(w * 0.43, 0, w * 0.14, h);
    x.fillStyle = 'rgba(255,245,220,0.45)'; x.fillRect(w * 0.455, 0, w * 0.025, h);
    for (let i = 0; i < 10; i++) { x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(w * 0.43, r() * h, w * 0.14, 1); }
    x.strokeStyle = 'rgba(120,80,30,0.5)'; x.lineWidth = 1; x.strokeRect(w * 0.43, -2, w * 0.14, h + 4);
    // edge shading (box edges / creases)
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(90,60,30,0.25)'); g.addColorStop(0.06, 'rgba(0,0,0,0)'); g.addColorStop(0.94, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,30,0.25)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const g2 = x.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(90,60,30,0.22)'); g2.addColorStop(0.06, 'rgba(0,0,0,0)'); g2.addColorStop(0.94, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(90,60,30,0.22)');
    x.fillStyle = g2; x.fillRect(0, 0, w, h);
    // plain patch at (0.2,0.2) uv region kept clean for labels
    x.fillStyle = '#f6f6f6'; x.fillRect(w * 0.15, h * 0.75, w * 0.1, h * 0.1);
  });
}
export function woodTexture(THREE) {
  // grain runs along u (board length); near-white base so vertex colours set tone
  return canvasTex(THREE, 256, 128, (x, w, h) => {
    const r = rnd(5);
    x.fillStyle = '#ececec'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const y0 = r() * h, a = 0.08 + r() * 0.22, v = 120 + r() * 80;
      x.strokeStyle = `rgba(${v * 0.8},${v * 0.6},${v * 0.4},${a})`; x.lineWidth = 0.6 + r() * 1.6; x.beginPath(); x.moveTo(0, y0);
      for (let s = 0; s <= w; s += 16) x.lineTo(s, y0 + Math.sin(s * 0.03 + i) * (1 + r() * 2.5)); x.stroke();
    }
    for (let i = 0; i < 4; i++) { const kx = r() * w, ky = r() * h; x.fillStyle = 'rgba(110,70,35,0.35)'; x.beginPath(); x.ellipse(kx, ky, 5 + r() * 6, 2 + r() * 3, 0, 0, 7); x.fill(); }
    for (let i = 0; i < 600; i++) { x.fillStyle = 'rgba(80,50,20,0.06)'; x.fillRect(r() * w, r() * h, 2, 1); }
  });
}
export function wrapTexture(THREE) {
  // horizontal stretch-film streaks (rotation of wrap) - modulates colour; opacity stays on material
  return canvasTex(THREE, 64, 256, (x, w, h) => {
    const r = rnd(3); x.fillStyle = '#9aa3aa'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const v = 200 + r() * 55; x.fillStyle = `rgba(${v},${v},${v + 5},${0.25 + r() * 0.5})`; x.fillRect(0, r() * h, w, 0.5 + r() * 2.5); }
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(0, r() * h, w, 1); }
  }, [1, 3]);
}
export function makeMats(THREE) {
  const S = (p) => new THREE.MeshStandardMaterial(p);
  const cbTex = cardboardTexture(THREE), wdTex = woodTexture(THREE), wrTex = wrapTexture(THREE);
  const wrapProps = { color: 0xd4dde3, map: wrTex, transparent: true, opacity: 0.35, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 };
  const mats = {
    cardboard: S({ color: 0xc49a6c, map: cbTex, roughness: 0.85, metalness: 0 }),
    cardboardVC: S({ color: 0xffffff, map: cbTex, roughness: 0.85, metalness: 0, vertexColors: true }),
    wood: S({ color: 0xc49a66, map: wdTex, roughness: 0.82, metalness: 0 }),
    woodVC: S({ color: 0xffffff, map: wdTex, roughness: 0.82, metalness: 0, vertexColors: true }),
    metal: S({ color: 0xa3a8ad, metalness: 0.6, roughness: 0.5 }),
    galv: S({ color: 0xbfc4ca, metalness: 0.7, roughness: 0.42 }),
    plasticRed: S({ color: 0x52101c, roughness: 0.6, metalness: 0 }),
    yellow: S({ color: 0xdcae1c, roughness: 0.62, metalness: 0 }),
    black: S({ color: 0x1b1b1d, roughness: 0.65, metalness: 0 }),
    white: S({ color: 0xf3f3ee, roughness: 0.8 }),
    rubber: S({ color: 0x202022, roughness: 0.92 }),
    vc: S({ color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0 }),
    vcMetal: S({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.5 }),
    greenInd: S({ color: 0x2f4a3a, roughness: 0.7, metalness: 0.15 }),
    screen: S({ color: 0x0b0f16, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.15 }),
    wrap: new THREE.MeshPhysicalMaterial(wrapProps),
    shrink: new THREE.MeshPhysicalMaterial({ ...wrapProps, map: null, opacity: 0.22, color: 0xf4f8fb }),
    textures: { cardboard: cbTex, wood: wdTex, wrap: wrTex },
  };
  return mats;
}

import { useState, useRef, useEffect, useCallback } from "react";

interface Guides { top: number; bottom: number; left: number; right: number; }
interface Enhancement { luminanceDenoise: number; luminanceBrightness: number; luminanceContrast: number; luminanceClarity: number; luminanceDetail: number; }

function applyEnhancements(src: HTMLCanvasElement, enh: Enhancement): HTMLCanvasElement {
  const { luminanceDenoise, luminanceBrightness, luminanceContrast, luminanceClarity, luminanceDetail } = enh;
  const hasChange = luminanceDenoise > 0 || luminanceBrightness !== 0 || luminanceContrast !== 0 || luminanceClarity > 0 || luminanceDetail > 0;
  if (!hasChange) return src;

  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  const ctx = out.getContext("2d")!;

  const brightness = 1 + luminanceBrightness / 100;
  const contrast = 1 + luminanceContrast / 100;
  ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";

  let imgData = ctx.getImageData(0, 0, out.width, out.height);

  if (luminanceDenoise > 0) {
    const radius = Math.max(1, Math.round(luminanceDenoise / 40));
    const { width: w, height: h, data: d } = imgData;
    const blurred = new Uint8ClampedArray(d.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, cnt = 0;
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
        const i = (yy * w + xx) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; cnt++;
      }
      const o = (y * w + x) * 4;
      blurred[o] = r / cnt; blurred[o + 1] = g / cnt; blurred[o + 2] = b / cnt; blurred[o + 3] = d[o + 3];
    }
    imgData = new ImageData(blurred, w, h);
    ctx.putImageData(imgData, 0, 0);
    imgData = ctx.getImageData(0, 0, out.width, out.height);
  }

  if (luminanceClarity > 0) {
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);
    const w = out.width;
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const strength = luminanceClarity / 100;
    for (let y = 1; y < out.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let v = 0;
          for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++)
            v += copy[((y + ky) * w + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
          const orig = copy[(y * w + x) * 4 + c];
          data[(y * w + x) * 4 + c] = Math.min(255, Math.max(0, orig + (v - orig) * strength));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    imgData = ctx.getImageData(0, 0, out.width, out.height);
  } else {
    ctx.putImageData(imgData, 0, 0);
  }

  if (luminanceDetail > 0) {
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);
    const w = out.width;
    const strength = (luminanceDetail / 100) * 0.65;
    for (let y = 1; y < out.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * w + x) * 4 + c;
          const orig = copy[idx];
          const avg = (copy[((y - 1) * w + x) * 4 + c] + copy[((y + 1) * w + x) * 4 + c] +
            copy[(y * w + (x - 1)) * 4 + c] + copy[(y * w + (x + 1)) * 4 + c]) / 4;
          data[idx] = Math.min(255, Math.max(0, orig + (orig - avg) * strength));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  return out;
}

const HANDLE_SIZE = 28;

export default function A4CropTool() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("");
  const [guides, setGuides] = useState<Guides>({ top: 0.1, bottom: 0.9, left: 0.1, right: 0.9 });
  const [enh, setEnh] = useState<Enhancement>({ luminanceDenoise: 0, luminanceBrightness: 0, luminanceContrast: 0, luminanceClarity: 0, luminanceDetail: 0 });
  const [dragging, setDragging] = useState<keyof Guides | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedCanvas, setCroppedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    const t = guides.top * h, b = guides.bottom * h, l = guides.left * w, r = guides.right * w;
    ctx.fillRect(0, 0, w, t);
    ctx.fillRect(0, b, w, h - b);
    ctx.fillRect(0, t, l, b - t);
    ctx.fillRect(r, t, w - r, b - t);
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.setLineDash([12, 6]);
    ctx.strokeRect(l, t, r - l, b - t);
    ctx.setLineDash([]);
    const dot = Math.max(6, w * 0.015);
    [[l, t], [r, t], [l, b], [r, b]].forEach(([cx, cy]) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(cx, cy, dot, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.stroke();
    });
  }, [image, guides]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    const client = "touches" in e ? e.touches[0] : e;
    return { x: (client.clientX - rect.left) / rect.width, y: (client.clientY - rect.top) / rect.height };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const cont = containerRef.current;
    if (!cont || !image) return;
    const rect = cont.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    const threshold = HANDLE_SIZE / rect.width;
    const dists: [keyof Guides, number][] = [
      ["top", Math.abs(y - guides.top)],
      ["bottom", Math.abs(y - guides.bottom)],
      ["left", Math.abs(x - guides.left)],
      ["right", Math.abs(x - guides.right)],
    ];
    const [closest, dist] = dists.reduce((a, b) => b[1] < a[1] ? b : a);
    if (dist < threshold * 3) { setDragging(closest); e.preventDefault(); }
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const client = "touches" in e ? (e as TouchEvent).touches[0] : e as MouseEvent;
    const x = Math.max(0, Math.min(1, (client.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (client.clientY - rect.top) / rect.height));
    setGuides(prev => {
      const next = { ...prev };
      if (dragging === "top") next.top = Math.min(y, prev.bottom - 0.05);
      if (dragging === "bottom") next.bottom = Math.max(y, prev.top + 0.05);
      if (dragging === "left") next.left = Math.min(x, prev.right - 0.05);
      if (dragging === "right") next.right = Math.max(x, prev.left + 0.05);
      return next;
    });
    e.preventDefault();
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove, { passive: false });
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImage(img); setPreviewUrl(null); };
    img.src = url;
  };

  const handleCrop = () => {
    if (!image) return;
    setDownloading(true);
    const w = image.naturalWidth, h = image.naturalHeight;
    const sx = Math.round(guides.left * w), sy = Math.round(guides.top * h);
    const sw = Math.round((guides.right - guides.left) * w), sh = Math.round((guides.bottom - guides.top) * h);
    const tmp = document.createElement("canvas");
    tmp.width = sw; tmp.height = sh;
    const ctx = tmp.getContext("2d")!;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    const enhanced = applyEnhancements(tmp, enh);
    // Store canvas ref for PNG export; also keep JPEG URL for preview
    const jpegUrl = enhanced.toDataURL("image/jpeg", 0.95);
    setCroppedCanvas(enhanced);
    setPreviewUrl(jpegUrl);
    setDownloading(false);
  };

  const handleDownload = (format: "jpeg" | "png" = "jpeg") => {
    if (!croppedCanvas) return;
    if (format === "png") {
      croppedCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${imageName || "cropped"}_a4.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, "image/png");
    } else {
      const a = document.createElement("a");
      a.href = croppedCanvas.toDataURL("image/jpeg", 0.95);
      a.download = `${imageName || "cropped"}_a4.jpg`;
      a.click();
    }
  };

  const SliderRow = ({ label, value, onChange, min = -50, max = 100 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#15233D", minWidth: 32, textAlign: "right" }}>{value > 0 ? "+" : ""}{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => { onChange(Number(e.target.value)); setPreviewUrl(null); }}
        style={{ width: "100%", cursor: "pointer", accentColor: "#15233D" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f7", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#15233D,#3D5A73)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: 0 }}>✂️ A4 Document Crop</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "2px 0 0", letterSpacing: 1 }}>DRAG GUIDES · ENHANCE · SAVE</p>
        </div>
        <a href="/" style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 14px" }}>← Toolkit</a>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 12px" }}>
        {!image ? (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ background: "#fff", borderRadius: 16, padding: "52px 24px", textAlign: "center", border: "2.5px dashed #c0c8e0", cursor: "pointer" }}
            onClick={() => document.getElementById("a4-file-input")?.click()}
          >
            <div style={{ fontSize: 56, marginBottom: 14 }}>📄</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#15233D", margin: "0 0 8px" }}>Upload Document Image</h2>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>Tap to select or drag & drop your image here</p>
            <div style={{ display: "inline-block", background: "linear-gradient(135deg,#15233D,#3D5A73)", color: "#fff", borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 15 }}>Choose Image</div>
            <p style={{ fontSize: 11, color: "#aaa", margin: "12px 0 0" }}>JPG, PNG, WebP supported</p>
            <input id="a4-file-input" type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        ) : (
          <>
            <div style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#15233D", margin: 0 }}>🖱️ Drag guides to define crop area</h2>
                <button onClick={() => { setImage(null); setPreviewUrl(null); }} style={{ background: "#eef1f7", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#555" }}>Change Image</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                {(["top", "bottom", "left", "right"] as const).map(g => (
                  <div key={g} style={{ background: "#f0f7ff", border: "1px solid #c0d8f8", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#15233D" }}>
                    {g[0].toUpperCase() + g.slice(1)}: {Math.round(guides[g] * 100)}%
                  </div>
                ))}
              </div>
              <div
                ref={containerRef}
                style={{ position: "relative", cursor: dragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none", borderRadius: 8, overflow: "hidden" }}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
              >
                <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
                {(["top", "bottom"] as const).map(g => (
                  <div key={g} style={{ position: "absolute", left: 0, right: 0, top: `${guides[g] * 100}%`, height: 3, background: "#00e5ff", transform: "translateY(-1px)", zIndex: 10, cursor: "ns-resize" }}>
                    <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%) translateY(-50%)", background: "#00e5ff", borderRadius: 10, padding: "3px 12px", display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>⟺</span>
                    </div>
                  </div>
                ))}
                {(["left", "right"] as const).map(g => (
                  <div key={g} style={{ position: "absolute", top: 0, bottom: 0, left: `${guides[g] * 100}%`, width: 3, background: "#00e5ff", transform: "translateX(-1px)", zIndex: 10, cursor: "ew-resize" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translateX(-50%) translateY(-50%)", background: "#00e5ff", borderRadius: 10, padding: "12px 3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", writingMode: "vertical-rl" }}>⟺</span>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 8, marginBottom: 0 }}>Drag the cyan guide lines to frame the crop area</p>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#15233D", margin: 0 }}>🎛️ Image Enhancement</h2>
                <button onClick={() => { setEnh({ luminanceDenoise: 0, luminanceBrightness: 0, luminanceContrast: 0, luminanceClarity: 0, luminanceDetail: 0 }); setPreviewUrl(null); }}
                  style={{ background: "#eef1f7", border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#888" }}>Reset</button>
              </div>
              <SliderRow label="🧹 Luminance Denoise" value={enh.luminanceDenoise} onChange={v => setEnh(p => ({ ...p, luminanceDenoise: v }))} min={0} max={100} />
              <SliderRow label="☀️ Luminance Brightness" value={enh.luminanceBrightness} onChange={v => setEnh(p => ({ ...p, luminanceBrightness: v }))} min={-50} max={100} />
              <SliderRow label="🌓 Luminance Contrast" value={enh.luminanceContrast} onChange={v => setEnh(p => ({ ...p, luminanceContrast: v }))} min={-50} max={100} />
              <SliderRow label="🔍 Luminance Clarity" value={enh.luminanceClarity} onChange={v => setEnh(p => ({ ...p, luminanceClarity: v }))} min={0} max={100} />
              <SliderRow label="✨ Luminance Detail" value={enh.luminanceDetail} onChange={v => setEnh(p => ({ ...p, luminanceDetail: v }))} min={0} max={100} />
            </div>

            <button onClick={handleCrop} disabled={downloading}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#9f5de2)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", marginBottom: 12, opacity: downloading ? 0.7 : 1 }}>
              {downloading ? "⏳ Processing..." : "✂️ Crop & Enhance"}
            </button>

            {previewUrl && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1E7145", margin: "0 0 10px" }}>✅ Result Preview</h3>
                <img src={previewUrl} alt="Cropped result" style={{ width: "100%", borderRadius: 8, border: "1px solid #dde", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleDownload("jpeg")}
                    style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1E7145,#2e9e55)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                    ⬇️ JPEG
                  </button>
                  <button onClick={() => handleDownload("png")}
                    style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0e6a8a,#1590bf)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                    ⬇️ PNG
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#888", textAlign: "center", margin: "8px 0 0" }}>PNG preserves transparency · JPEG for UTI Portal upload</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

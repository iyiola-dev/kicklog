import { useState, useRef, useCallback } from "react";
export default function KickLog() {
  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [frameInterval, setFrameInterval] = useState(3);
  const [frames, setFrames] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerColor, setNewPlayerColor] = useState("#00e68a");
  const [assignMode, setAssignMode] = useState(null);
  const [phase, setPhase] = useState("upload");
  const [previewFrame, setPreviewFrame] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const PLAYER_COLORS = ["#00e68a","#00b8ff","#ff6b6b","#ffc800","#c77dff","#ff8c42","#4ecdc4","#ff6392","#a8e6cf","#dda0dd"];
  const extractFrames = useCallback(async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setExtracting(true);
    setExtractProgress(0);
    await new Promise((r) => {
      if (videoEl.readyState >= 2) r();
      else videoEl.onloadeddata = r;
    });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const duration = videoEl.duration;
    const w = Math.min(videoEl.videoWidth, 1280);
    const h = Math.round((w / videoEl.videoWidth) * videoEl.videoHeight);
    canvas.width = w;
    canvas.height = h;
    const extracted = [];
    let t = 0;
    const captureNext = () =>
      new Promise((resolve) => {
        if (t > duration) return resolve(null);
        videoEl.currentTime = t;
        videoEl.onseeked = () => {
          ctx.drawImage(videoEl, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          extracted.push({ id: `frame_${extracted.length}`, time: t, dataUrl });
          setExtractProgress(Math.min(100, (t / duration) * 100));
          t += frameInterval;
          resolve(true);
        };
      });
    let cont = true;
    while (cont) { cont = await captureNext(); }
    setFrames(extracted);
    setExtracting(false);
    setExtractProgress(100);
    setPhase("frames");
  }, [frameInterval]);
  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const id = `p_${Date.now()}`;
    setPlayers((prev) => [...prev, { id, name: newPlayerName.trim(), color: newPlayerColor, frames: [] }]);
    setNewPlayerName("");
    setNewPlayerColor(PLAYER_COLORS[(players.length + 1) % PLAYER_COLORS.length]);
  };
  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    if (assignMode === id) setAssignMode(null);
  };
  const toggleFrameForPlayer = (frameId) => {
    if (!assignMode) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== assignMode) return p;
        const has = p.frames.includes(frameId);
        return { ...p, frames: has ? p.frames.filter((f) => f !== frameId) : [...p.frames, frameId] };
      })
    );
  };
  const getFramePlayerTags = (frameId) => players.filter((p) => p.frames.includes(frameId));
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const downloadFrame = (frame, playerName) => {
    const a = document.createElement("a");
    a.href = frame.dataUrl;
    a.download = `${(playerName || "untagged").replace(/\s+/g, "_")}_${formatTime(frame.time).replace(":", "m")}s.jpg`;
    a.click();
  };
  const downloadAllTagged = async () => {
    for (const player of players) {
      for (const fId of player.frames) {
        const frame = frames.find((f) => f.id === fId);
        if (frame) { downloadFrame(frame, player.name); await new Promise((r) => setTimeout(r, 200)); }
      }
    }
  };
  const downloadSummary = () => {
    let text = `KICKLOG MATCH FRAME EXPORT\n${"=".repeat(40)}\n\n`;
    text += `Video: ${video?.name || "Unknown"}\nFrame interval: ${frameInterval}s\nTotal frames: ${frames.length}\nPlayers tagged: ${players.length}\n`;
    players.forEach((p) => {
      text += `\n${"─".repeat(30)}\nPLAYER: ${p.name}\nFrames tagged: ${p.frames.length}\n`;
      text += `Timestamps: ${p.frames.map((fId) => { const fr = frames.find((f) => f.id === fId); return fr ? formatTime(fr.time) : "?"; }).join(", ")}\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kicklog_summary.txt";
    a.click();
  };
  const activePlayer = players.find((p) => p.id === assignMode);
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e4e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2a3d; border-radius: 3px; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .btn { padding: 10px 20px; border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .btn-go { background: #00e68a; color: #080c14; }
        .btn-go:hover { box-shadow: 0 4px 16px rgba(0,230,138,0.25); }
        .btn-ghost { background: #111827; color: #94a3b8; border: 1px solid #1e293b; }
        .btn-ghost:hover { color: #e4e8f0; border-color: #334155; }
        .btn-sm { padding: 6px 14px; font-size: 12px; }
        .btn-xs { padding: 4px 10px; font-size: 11px; border-radius: 5px; }
        .input-field { background: #0d1117; border: 1px solid #1e293b; color: #e4e8f0; padding: 10px 14px; border-radius: 7px; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; }
        .input-field:focus { border-color: #00e68a; }
        .input-field::placeholder { color: #475569; }
        .frame-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
        .frame-cell { position: relative; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; aspect-ratio: 16/9; }
        .frame-cell:hover { border-color: #334155; }
        .frame-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .frame-cell.selected { border-color: var(--sel-color, #00e68a); box-shadow: 0 0 12px var(--sel-glow, rgba(0,230,138,0.3)); }
        .tag-dot { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.5); flex-shrink: 0; }
        .overlay-bar { position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 6px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
        .preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 100; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; cursor: zoom-out; }
        .preview-overlay img { max-width: 95vw; max-height: 85vh; object-fit: contain; border-radius: 8px; }
        .sidebar { position: sticky; top: 0; height: 100vh; overflow-y: auto; padding: 16px; border-right: 1px solid #141c2b; background: #0a0f19; width: 280px; flex-shrink: 0; }
        @media (max-width: 768px) {
          .sidebar { position: static; width: 100%; height: auto; border-right: none; border-bottom: 1px solid #141c2b; }
          .app-layout { flex-direction: column !important; }
          .frame-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
        }
      `}</style>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {videoUrl && <video ref={videoRef} src={videoUrl} style={{ display: "none" }} preload="auto" crossOrigin="anonymous" />}
      {previewFrame && (
        <div className="preview-overlay" onClick={() => setPreviewFrame(null)}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {getFramePlayerTags(previewFrame.id).map((p) => (
              <span key={p.id} style={{ background: p.color + "22", color: p.color, fontSize: 13, padding: "4px 12px", borderRadius: 99, fontWeight: 600 }}>{p.name}</span>
            ))}
            <span className="mono" style={{ fontSize: 13, color: "#94a3b8" }}>{formatTime(previewFrame.time)}</span>
          </div>
          <img src={previewFrame.dataUrl} alt="" onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }} />
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); downloadFrame(previewFrame, getFramePlayerTags(previewFrame.id).map(p=>p.name).join("_") || "frame"); }}>
            Download this frame
          </button>
        </div>
      )}
      {/* UPLOAD */}
      {phase === "upload" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #00e68a, #00b8ff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#080c14" }}>K</div>
              <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.5px" }}>KickLog</div>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.2, marginBottom: 10 }}>
              Extract frames.<br />Tag players.<br /><span style={{ color: "#00e68a" }}>Analyze in chat.</span>
            </h1>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6 }}>
              Upload your Sunday match video, grab frames at any interval, tag who's who, then download labeled frames to bring back to Claude for action analysis.
            </p>
          </div>
          <div onClick={() => document.getElementById("vid-input").click()}
            style={{ border: `2px dashed ${video ? "#00e68a" : "#1e293b"}`, borderRadius: 12, padding: "44px 20px", textAlign: "center", cursor: "pointer", background: video ? "rgba(0,230,138,0.04)" : "transparent", transition: "all 0.15s" }}>
            <input id="vid-input" type="file" accept="video/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files[0]; if (f) { setVideo(f); setVideoUrl(URL.createObjectURL(f)); } }} />
            {video ? (
              <><div style={{ fontSize: 28, marginBottom: 6 }}>⚽</div><div style={{ fontWeight: 600 }}>{video.name}</div><div className="mono" style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{(video.size / 1024 / 1024).toFixed(1)} MB</div></>
            ) : (
              <><div style={{ fontSize: 28, marginBottom: 6 }}>📹</div><div style={{ fontWeight: 500 }}>Click to select match video</div><div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>MP4, MOV, WebM</div></>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Frame interval</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 5, 10].map((v) => (
                <button key={v} className={`btn btn-sm ${frameInterval === v ? "btn-go" : "btn-ghost"}`} onClick={() => setFrameInterval(v)}>{v}s</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Lower = more frames. 3s is a good default for full matches.</div>
          </div>
          {extracting && (
            <div style={{ marginTop: 24 }}>
              <div style={{ height: 3, background: "#141c2b", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${extractProgress}%`, background: "linear-gradient(90deg, #00e68a, #00b8ff)", transition: "width 0.3s" }} />
              </div>
              <div className="mono" style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{Math.round(extractProgress)}% extracting...</div>
            </div>
          )}
          <button className="btn btn-go" disabled={!video || extracting} onClick={extractFrames}
            style={{ marginTop: 24, opacity: !video || extracting ? 0.4 : 1, width: "100%", justifyContent: "center" }}>
            Extract Frames →
          </button>
        </div>
      )}
      {/* FRAMES + TAGGING */}
      {phase === "frames" && (
        <div className="app-layout" style={{ display: "flex", minHeight: "100vh" }}>
          <div className="sidebar">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #00e68a, #00b8ff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#080c14" }}>K</div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>KickLog</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Players</div>
            {players.length === 0 && (
              <p style={{ fontSize: 12, color: "#334155", marginBottom: 12, lineHeight: 1.5 }}>
                Add a player name below, then click their name to start "tag mode" — tap any frames where they appear.
              </p>
            )}
            {players.map((p) => (
              <div key={p.id} onClick={() => setAssignMode(assignMode === p.id ? null : p.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, marginBottom: 4, cursor: "pointer", transition: "all 0.15s",
                  background: assignMode === p.id ? p.color + "15" : "transparent", border: `1.5px solid ${assignMode === p.id ? p.color : "transparent"}` }}>
                <div className="tag-dot" style={{ background: p.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "#475569" }}>{p.frames.length} frames</div>
                </div>
                <button className="btn-xs btn-ghost" onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }}
                  style={{ padding: "2px 6px", fontSize: 10, lineHeight: 1 }}>✕</button>
              </div>
            ))}
            <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
              <input type="color" value={newPlayerColor} onChange={(e) => setNewPlayerColor(e.target.value)}
                style={{ width: 28, height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "transparent" }} />
              <input className="input-field" placeholder="Player name" value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                style={{ flex: 1, padding: "8px 10px", fontSize: 12 }} />
              <button className="btn btn-go btn-xs" onClick={addPlayer}>+</button>
            </div>
            <div style={{ borderTop: "1px solid #141c2b", marginTop: 20, paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Export</div>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }} onClick={downloadSummary}>
                📋 Summary (.txt)
              </button>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}
                onClick={downloadAllTagged} disabled={players.every((p) => p.frames.length === 0)}>
                📸 Tagged Frames
              </button>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPhase("review")}>
                📊 Review by Player
              </button>
            </div>
            <div style={{ borderTop: "1px solid #141c2b", marginTop: 16, paddingTop: 16 }}>
              <button className="btn btn-ghost btn-xs" onClick={() => { setPhase("upload"); setFrames([]); setPlayers([]); }}>← New Video</button>
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
            {assignMode && activePlayer && (
              <div style={{ padding: "10px 16px", marginBottom: 12, borderRadius: 8, background: activePlayer.color + "12", border: `1px solid ${activePlayer.color}33`,
                display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)" }}>
                <div className="tag-dot" style={{ background: activePlayer.color }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Tagging: {activePlayer.name}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>— click frames where this player appears</span>
                <div style={{ flex: 1 }} />
                <button className="btn btn-xs btn-ghost" onClick={() => setAssignMode(null)}>Done</button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 12, color: "#475569" }}>{frames.length} frames</span>
              {!assignMode && <span style={{ fontSize: 12, color: "#334155" }}>Click a frame to preview · Select a player to start tagging</span>}
            </div>
            <div className="frame-grid">
              {frames.map((frame) => {
                const tags = getFramePlayerTags(frame.id);
                const isTaggedForActive = activePlayer?.frames.includes(frame.id);
                return (
                  <div key={frame.id} className={`frame-cell ${isTaggedForActive ? "selected" : ""}`}
                    style={{ "--sel-color": activePlayer?.color, "--sel-glow": activePlayer ? activePlayer.color + "40" : "rgba(0,230,138,0.3)" }}
                    onClick={() => assignMode ? toggleFrameForPlayer(frame.id) : setPreviewFrame(frame)}>
                    <img src={frame.dataUrl} alt="" loading="lazy" />
                    <div className="overlay-bar">
                      <span className="mono" style={{ fontSize: 10, color: "#94a3b8" }}>{formatTime(frame.time)}</span>
                      <div style={{ flex: 1 }} />
                      {tags.map((t) => (
                        <div key={t.id} className="tag-dot" style={{ background: t.color, width: 8, height: 8 }} title={t.name} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* REVIEW */}
      {phase === "review" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Player Review</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Download per-player frames, then upload them to Claude chat for action analysis.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPhase("frames")}>← Back to Tagging</button>
          </div>
          {players.map((player) => {
            const taggedFrames = player.frames.map((fId) => frames.find((f) => f.id === fId)).filter(Boolean).sort((a, b) => a.time - b.time);
            return (
              <div key={player.id} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <div className="tag-dot" style={{ background: player.color, width: 14, height: 14 }} />
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{player.name}</span>
                  <span className="mono" style={{ fontSize: 12, color: "#475569" }}>{taggedFrames.length} frames</span>
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-xs" onClick={() => {
                    taggedFrames.forEach((f, i) => { setTimeout(() => downloadFrame(f, player.name), i * 200); });
                  }}>Download {player.name}'s frames</button>
                </div>
                {taggedFrames.length === 0 ? (
                  <div style={{ padding: 16, color: "#334155", fontSize: 13, background: "#0d1117", borderRadius: 8, textAlign: "center" }}>No frames tagged</div>
                ) : (
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
                    {taggedFrames.map((frame) => (
                      <div key={frame.id} style={{ flexShrink: 0, position: "relative", cursor: "pointer" }} onClick={() => setPreviewFrame(frame)}>
                        <img src={frame.dataUrl} alt="" style={{ width: 160, height: 90, objectFit: "cover", borderRadius: 6, border: `2px solid ${player.color}33` }} />
                        <div style={{ position: "absolute", bottom: 4, left: 4 }}>
                          <span className="mono" style={{ fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.7)", padding: "1px 5px", borderRadius: 3 }}>{formatTime(frame.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid #141c2b", paddingTop: 20, marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-go" onClick={downloadAllTagged}>Download All Tagged Frames</button>
            <button className="btn btn-ghost" onClick={downloadSummary}>Download Summary</button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Award, Printer } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { certificateNo, playlistCompletion, type Playlist, type VideoSession } from "@/lib/mock/training";

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

/**
 * The certificate as a standalone A4-landscape page. Sized in vw so the same markup scales
 * into the preview iframe and fills the printed page.
 */
function certificateHtml({ playlist, list, learnerId, name, print }: { playlist: Playlist; list: VideoSession[]; learnerId: string; name: string; print?: boolean }) {
  const c = playlistCompletion(list, learnerId);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const detail = (label: string, value: string) => `<div class="d"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(`${playlist.title} — BHE UNI certificate`)}</title><style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box}
html,body{margin:0;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:#0f172a}
.c{position:relative;width:100%;aspect-ratio:297/210;overflow:hidden;background:#fff}
.band{position:absolute;inset:0 auto 0 0;width:27%;padding:5vw 2.6vw 4vw;display:flex;flex-direction:column;align-items:center;justify-content:space-between;color:#fff;text-align:center;
  background:radial-gradient(circle at 20% 110%,rgba(255,255,255,.12) 0 18%,transparent 18.2%),radial-gradient(circle at 110% -10%,rgba(255,255,255,.08) 0 30%,transparent 30.2%),linear-gradient(165deg,#17305c 0%,#2c4f8f 55%,#4d76bb 100%)}
.logo{width:8vw;height:8vw;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 .6vw 1.6vw rgba(0,0,0,.25)}
.logo img{height:4.6vw}
.brand{margin-top:1.4vw;font-weight:800;font-size:2.4vw;letter-spacing:.14em}
.sub{margin-top:.3vw;font-size:.95vw;letter-spacing:.32em;text-transform:uppercase;opacity:.75}
.seal{position:relative;width:11vw;height:11vw;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#5b4309;
  background:radial-gradient(circle at 35% 30%,#fdf1c4,#e7c160 55%,#c49a2c);box-shadow:0 0 0 .45vw rgba(255,255,255,.18),0 .8vw 1.8vw rgba(0,0,0,.3)}
.seal:before{content:"";position:absolute;inset:.7vw;border-radius:50%;border:.15vw dashed rgba(91,67,9,.55)}
.seal b{font-size:1.05vw;letter-spacing:.22em}
.seal i{font-style:normal;font-family:Georgia,serif;font-size:2.6vw;font-weight:700;line-height:1.1}
.seal small{font-size:.75vw;letter-spacing:.2em}
.main{position:absolute;inset:0 0 0 27%;padding:5.2vw 5.6vw 4.2vw;display:flex;flex-direction:column}
.main:before{content:"";position:absolute;inset:1.8vw;border:.12vw solid #e7d9a8;border-radius:.6vw;pointer-events:none}
.eyebrow{display:flex;align-items:center;gap:1vw;color:#b08a22;font-weight:700;font-size:1vw;letter-spacing:.34em;text-transform:uppercase}
.eyebrow:after{content:"";flex:1;height:.1vw;background:linear-gradient(90deg,#e7c160,transparent)}
h1{margin:1.6vw 0 0;font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:4.4vw;line-height:1.05;letter-spacing:-.01em}
.muted{color:#64748b;font-size:1.15vw}
.pre{margin-top:3.6vw}
.name{margin-top:.6vw;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:5vw;line-height:1.1;color:#17305c;padding-bottom:.9vw;border-bottom:.12vw solid #e2e8f0}
.module{margin-top:.8vw;font-size:2.5vw;font-weight:700;color:#2c4f8f}
.desc{margin-top:.5vw;max-width:90%;color:#64748b;font-size:1.05vw;line-height:1.5}
.grid{margin-top:auto;display:grid;grid-template-columns:repeat(4,1fr);gap:1.6vw;padding-top:1.6vw;border-top:.1vw solid #eef2f7}
.d span{display:block;color:#94a3b8;font-size:.8vw;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.d b{display:block;margin-top:.4vw;font-size:1.25vw;font-weight:600;color:#0f172a}
.sig{margin-top:2vw;display:flex;justify-content:space-between;align-items:flex-end;gap:4vw}
.sig>div{flex:1;max-width:34%;font-size:1vw;color:#64748b}
.sig .line{border-top:.12vw solid #0f172a;padding-top:.6vw}
.sig div b{display:block;color:#0f172a;font-size:1.15vw}
.sig .script{display:block;height:2.8vw;font-family:"Brush Script MT","Segoe Script",cursive;font-size:2.4vw;line-height:2.8vw;color:#17305c}
</style></head><body><div class="c">
<aside class="band">
  <div><div class="logo"><img src="${origin}/logo-icon.svg" alt=""></div><div class="brand">BHE UNI</div><div class="sub">Training Academy</div></div>
  <div class="seal"><b>CERTIFIED</b><i>${esc((c.completedAt ?? "").slice(0, 4))}</i><small>BHE UNI</small></div>
</aside>
<main class="main">
  <div class="eyebrow">Certificate of completion</div>
  <h1>Training module certificate</h1>
  <div class="muted pre">This certificate is proudly presented to</div>
  <div class="name">${esc(name)}</div>
  <div class="muted" style="margin-top:1.4vw">for successfully completing every session and assessment in</div>
  <div class="module">${esc(playlist.title)}</div>
  ${playlist.description ? `<div class="desc">${esc(playlist.description)}</div>` : ""}
  <div class="grid">
    ${detail("Completed on", c.completedAt ? formatDay(c.completedAt) : "—")}
    ${detail("Sessions", `${c.total} videos · ${c.minutes} min`)}
    ${detail("Average score", c.score !== undefined ? `${c.score}%` : "Completed")}
    ${detail("Certificate no.", certificateNo(playlist.id, learnerId))}
  </div>
  <div class="sig">
    <div><span class="script">${esc(playlist.createdBy)}</span><div class="line"><b>${esc(playlist.createdBy)}</b>Module lead · ${esc(playlist.category)}</div></div>
    <div><span class="script"></span><div class="line"><b>BHE UNI Training Team</b>BHE Student Consultancy Ltd</div></div>
  </div>
</main>
</div>${print ? "<script>window.onload=()=>setTimeout(()=>window.print(),150)</script>" : ""}</body></html>`;
}

export function ModuleCertificate({ playlist, list, learnerId, name, celebrate, onClose }: { playlist: Playlist; list: VideoSession[]; learnerId: string; name: string; celebrate?: boolean; onClose: () => void }) {
  const print = () => {
    const w = window.open("", "_blank", "width=1123,height=794");
    if (!w) return;
    w.document.write(certificateHtml({ playlist, list, learnerId, name, print: true }));
    w.document.close();
  };
  return (
    <Modal open onClose={onClose} icon={Award} size="lg" title={celebrate ? "Congratulations — module complete!" : "BHE UNI certificate"} subtitle={celebrate ? `You've passed every session in ${playlist.title}. Here's your certificate.` : playlist.title}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Close</button><button type="button" onClick={print} className={buttonPrimary}><Printer className="size-4" /> Download or print PDF</button></div>}
    >
      <div className="overflow-hidden rounded-xl shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
        <iframe title={`${playlist.title} certificate`} srcDoc={certificateHtml({ playlist, list, learnerId, name })} className="pointer-events-none block aspect-[297/210] w-full border-0 bg-white" />
      </div>
    </Modal>
  );
}

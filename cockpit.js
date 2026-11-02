/* Market 360 · Buồng lái: giao diện thay thế. Người xem là thuyền trưởng, đi từ thiên hà (vĩ mô) xuống hệ sao (thị trường), hành tinh (ngành), vệ tinh (cổ phiếu).
   Bầu trời sao vẽ bằng canvas 2D làm nền; mọi số liệu là chữ HTML/SVG cỡ lớn để đọc ngay. Đọc cùng data.json với giao diện cũ. */
(function(){
const FONT='"Be Vietnam Pro",system-ui,sans-serif';
const fmt=(v,d=0)=>v==null||isNaN(v)?"–":Number(v).toLocaleString("vi-VN",{minimumFractionDigits:d,maximumFractionDigits:d});
const sgn=(v,d=1)=>v==null||isNaN(v)?"–":(v>0?"+":v<0?"−":"")+fmt(Math.abs(v),d);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const dm=s=>{const p=String(s||"").split("-");return p.length===3?+p[2]+"/"+(+p[1]):String(s||"")};
const last=a=>a&&a.length?a[a.length-1]:null;
const cls=v=>v>0?"up":v<0?"down":"";

/* ---------- tóm tắt số liệu ---------- */
function digest(D){const S={D};const v=D.vni||{},h=D.hnx||{};
  S.date=(D.asof||"").split("-").reverse().join("/");S.vni=v;S.vch=v.c-v.p;S.vpc=S.vch/v.p*100;S.hnx=h;S.hch=h.c-h.p;S.hpc=S.hch/h.p*100;
  S.vn30=D.vn30;S.f1m=D.f1m;S.basis=S.f1m&&S.vn30?S.f1m.c-S.vn30.c:null;S.oi=D.oi||[];
  S.fo=D.foreign||[];S.f=last(S.fo);let st=0;if(S.f){const s=Math.sign(S.f[1]);for(let i=S.fo.length-1;i>=0&&Math.sign(S.fo[i][1])===s;i--)st++}S.fst=st;S.fsum=S.fo.reduce((a,r)=>a+r[1],0);
  S.prop=D.prop||[];S.p=last(S.prop);S.br=D.breadth||[];S.b=last(S.br);S.mkt=D.mkt||[];S.mk=last(S.mkt);
  const wk=(D.exvin&&D.exvin.rows||[]).slice(-53,-1).map(r=>r[1]).filter(x=>x>0);S.wk=(D.exvin&&D.exvin.rows||[]).slice(-53).map(r=>[r[0],r[1]]);
  if(wk.length&&v.c){S.hi52=Math.max(...wk,v.c);S.lo52=Math.min(...wk,v.c);S.fromHi=(v.c/Math.max(...wk)-1)*100}
  S.gb=D.gb10;S.fx=D.fx||[];S.etf=D.etf;S.rates=D.rates;S.vinc=D.vinc;
  S.secc=D.secc&&D.secc.rows?[...D.secc.rows].sort((a,b)=>b[1]-a[1]):[];
  S.rank=[];const R=D.rank;if(R&&R.sec){const n=R.d.length;S.rankD=R.d;
    S.rank=R.sec.map(([icb,name,tks])=>{const ser=[];for(let i=0;i<n;i++){const xs=tks.map(t=>R.tk[t]&&R.tk[t][i]).filter(x=>x!=null);ser.push(xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null)}
      const lv=[...ser].reverse().find(x=>x!=null),pv=ser.slice(0,-5).reverse().find(x=>x!=null);
      const best=tks.map(t=>[t,R.tk[t]&&[...R.tk[t]].reverse().find(x=>x!=null)]).filter(x=>x[1]!=null).sort((a,b)=>b[1]-a[1]);
      return {name,ser,lv,ch5:lv!=null&&pv!=null?lv-pv:null,best}}).sort((a,b)=>(b.lv??-1)-(a.lv??-1))}
  S.sets={};(D.screen&&D.screen.sets||[]).forEach(s=>S.sets[s.n]=s);S.screenDate=D.screen&&D.screen.date;S.top=D.top;
  return S}

/* ---------- biểu đồ SVG nhỏ ---------- */
function spark(vals,{w=300,h=70,color="var(--acc)",area=true,dots=false}={}){const xs=vals.filter(v=>v!=null);if(xs.length<2)return"";
  const mn=Math.min(...xs),mx=Math.max(...xs),r=mx-mn||1,X=i=>4+i*(w-8)/(vals.length-1),Y=v=>h-6-(v-mn)/r*(h-12);
  let d="";vals.forEach((v,i)=>{if(v!=null)d+=(d?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)});
  const li=vals.length-1;return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="sp" aria-hidden="true">${area?`<path d="${d}L${X(li)} ${h}L${X(0)} ${h}Z" fill="${color}" opacity=".12"/>`:""}<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" vector-effect="non-scaling-stroke"/>${vals[li]!=null?`<circle cx="${X(li)}" cy="${Y(vals[li])}" r="3.5" fill="${color}"/>`:""}</svg>`}
function bars(rows,{w=600,h=140,lab=true}={}){if(!rows.length)return"";const mx=Math.max(1,...rows.map(r=>Math.abs(r[1]))),bw=w/rows.length,mid=h/2;
  return `<svg viewBox="0 0 ${w} ${h+(lab?18:0)}" class="bars" role="img" aria-label="Biểu đồ cột">${rows.map(([t,v],i)=>{const hh=Math.max(1,(mid-4)*Math.abs(v)/mx);return `<rect x="${i*bw+2}" y="${v>=0?mid-hh:mid}" width="${bw-4}" height="${hh}" rx="2" fill="${v>=0?"var(--up)":"var(--down)"}"><title>${esc(t)}: ${sgn(v,1)} tỷ</title></rect>`}).join("")}
  <line x1="0" x2="${w}" y1="${mid}" y2="${mid}" stroke="rgba(255,255,255,.25)"/>${lab?[0,Math.floor(rows.length/2),rows.length-1].map(i=>`<text x="${i*bw+bw/2}" y="${h+14}" text-anchor="middle" class="ax">${esc(rows[i][0])}</text>`).join(""):""}</svg>`}
function gauge(pct,{label="",color="var(--acc)"}={}){const p=Math.max(0,Math.min(1,pct)),a=Math.PI*(1-p),x=60+48*Math.cos(a),y=60-48*Math.sin(a);
  return `<svg viewBox="0 0 120 70" class="gauge" aria-hidden="true"><path d="M12 60A48 48 0 0 1 108 60" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10" stroke-linecap="round"/>
  <path d="M12 60A48 48 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/><text x="60" y="58" text-anchor="middle" class="gv">${esc(label)}</text></svg>`}
const card=(t,body,o={})=>`<section class="card ${o.cls||""}"${o.span?` data-span="${o.span}"`:""}><h3>${esc(t)}${o.sub?`<span>${esc(o.sub)}</span>`:""}</h3>${body}</section>`;
const big=(v,ch,chc)=>`<div class="big">${v}</div>${ch?`<div class="chg ${chc}">${ch}</div>`:""}`;

/* ---------- 5 hành tinh ---------- */
/* Hệ tên theo hướng phân tích top-down: đi từ quy mô lớn nhất xuống nhỏ nhất.
   Thiên hà (vĩ mô) chứa hệ sao (thị trường); ngôi sao trung tâm là VN-Index; các hành tinh (ngành) quay quanh nó; các vệ tinh (cổ phiếu) quay quanh ngành của mình. */
const PLANETS=[
 {id:"home",kind:"bridge",lv:"Đài chỉ huy",name:"Tổng quan vũ trụ",short:"Tổng quan",c1:"#6fb6ff",c2:"#1d4f9a",sec:null,hint:"Nhìn nhanh cả bốn tầng trước khi đi sâu: thiên hà, hệ sao, hành tinh, vệ tinh."},
 {id:"macro",kind:"galaxy",lv:"Tầng 1 · Thiên hà",name:"Vĩ mô",c1:"#ffd27a",c2:"#b86b1f",sec:"vi-mo",hint:"Lực hấp dẫn lớn nhất: lãi suất, tỷ giá, dòng vốn quỹ chi phối mọi thứ bên trong."},
 {id:"market",kind:"star",lv:"Tầng 2 · Hệ sao",name:"Thị trường",c1:"#fff1b0",c2:"#f0a32c",sec:"thi-truong",hint:"VN-Index là ngôi sao trung tâm; dòng tiền, độ rộng và định giá là ánh sáng của nó."},
 {id:"sector",kind:"planet",lv:"Tầng 3 · Hành tinh",name:"Ngành",c1:"#c9a2ff",c2:"#5b33a8",sec:"nganh",hint:"Mỗi ngành là một hành tinh quay quanh thị trường, mạnh yếu theo điểm RS."},
 {id:"stock",kind:"moon",lv:"Tầng 4 · Vệ tinh",name:"Cổ phiếu",c1:"#e6e9ef",c2:"#7d8696",sec:"co-phieu",hint:"Cổ phiếu là vệ tinh quay quanh ngành của nó. Chọn mã sau khi đã xem ba tầng trên."}];

function viewHome(S){const v=S.vni,o=[];
  const pos=S.hi52?(v.c-S.lo52)/(S.hi52-S.lo52):null;
  o.push(card("VN-Index 52 tuần",big(fmt(v.c,2),`${S.vch>=0?"▲":"▼"} ${fmt(Math.abs(S.vch),2)} điểm · ${sgn(S.vpc,2)}%`,cls(S.vch))+spark(S.wk.map(r=>r[1]),{color:S.vch>=0?"var(--up)":"var(--down)"})+`<p class="note">52 tuần qua, giá đóng cửa theo tuần. Thanh khoản ${fmt(v.vol,0)} triệu cp.</p>`,{span:2,cls:"hero",sub:"Phiên "+S.date}));
  if(pos!=null)o.push(card("Vị trí trong vùng 52 tuần",gauge(pos,{label:fmt(pos*100,0)+"%",color:pos>.7?"var(--up)":pos<.3?"var(--down)":"var(--gold)"})+`<div class="row"><span>Đáy ${fmt(S.lo52,0)}</span><span>Đỉnh ${fmt(S.hi52,0)}</span></div><p class="note">${S.fromHi>=0?"VN-Index đang ở đỉnh 52 tuần.":`Cách đỉnh 52 tuần ${fmt(-S.fromHi,1)}%.`}</p>`));
  if(S.f)o.push(card("Khối ngoại HOSE",big(sgn(S.f[1],0)+" tỷ",`${S.f[1]<0?"Bán":"Mua"} ròng ${S.fst} phiên liên tiếp`,cls(S.f[1]))+bars(S.fo.slice(-10),{h:70,lab:false})));
  if(S.b)o.push(card("Độ rộng HOSE",`<div class="split"><b class="up">${S.b[1]}</b><i style="--a:${S.b[1]};--d:${S.b[2]}"></i><b class="down">${S.b[2]}</b></div><p class="note">Mã tăng / mã giảm, phiên ${esc(S.b[0])}</p>`));
  if(S.mk)o.push(card("Định giá VN-Index",big(fmt(S.mk[1],2)+" lần",`P/B ${fmt(S.mk[2],2)}`,"")));
  return o.join("")}
function viewMacro(S){const o=[];const g=S.gb;
  if(g&&g.rows){const rr=g.rows.slice(-30);o.push(card("Lợi suất TPCP 10 năm",big(fmt(g.last[1],2)+"%",`Đấu thầu ${dm(g.last[0])} · ${fmt(g.last[2],0)} tỷ trúng thầu`,"")+spark(rr.map(r=>r[1]),{color:"var(--gold)"})+`<p class="note">${rr.length} phiên đấu thầu gần nhất. Nguồn VBMA.</p>`,{span:2,cls:"hero"}))}
  if(S.fx.length){const f=last(S.fx),f0=S.fx[0];o.push(card("USD/VND (Vietcombank)",big(fmt(f[2],0),`Bán ra · ${sgn((f[2]/f0[2]-1)*100,2)}% từ ${dm(f0[0])}`,cls(f[2]-f0[2]))+spark(S.fx.map(r=>r[2]),{color:"var(--acc)"})))}
  if(S.etf&&S.etf.rows){const e=S.etf.rows,l=last(e);o.push(card("Quỹ ETF "+S.etf.sym,big(fmt(l[1],0)+" đ",`Giá phiên ${dm(l[0])}`,"")+spark(e.map(r=>r[1]),{color:"var(--up)"})))}
  if(S.rates&&S.rates.banks){const i=S.rates.terms.indexOf("12T"),bs=S.rates.banks.filter(b=>b[1][i]!=null).sort((a,b)=>b[1][i]-a[1][i]),mx=Math.max(...bs.map(b=>b[1][i]));
    o.push(card("Lãi suất tiết kiệm 12 tháng",`<ul class="hb">${bs.map(([n,r])=>`<li><span>${esc(n)}</span><i style="width:${r[i]/mx*100}%"></i><b>${fmt(r[i],1)}%</b></li>`).join("")}</ul>`,{span:2,sub:"Cập nhật "+dm(S.rates.asof)}))}
  return o.join("")}
function viewMarket(S){const o=[];
  if(S.fo.length)o.push(card("Khối ngoại ròng HOSE (tỷ đồng)",bars(S.fo)+`<p class="note">Tổng từ ${esc(S.fo[0][0])}: <b class="${cls(S.fsum)}">${sgn(S.fsum,0)} tỷ</b></p>`,{span:2,cls:"hero"}));
  if(S.prop.length)o.push(card("Tự doanh CTCK (tỷ đồng)",bars(S.prop.slice(-15),{h:90})+`<p class="note">Phiên gần nhất ${esc(S.p[0])}: <b class="${cls(S.p[1])}">${sgn(S.p[1],0)} tỷ</b></p>`));
  if(S.mk)o.push(card("% cổ phiếu trên đường trung bình",`<div class="g3">${[["MA20",S.mk[3]],["MA50",S.mk[4]],["MA200",S.mk[5]]].map(([n,v])=>`<div>${gauge(v/100,{label:fmt(v,0)+"%",color:v>=50?"var(--up)":"var(--down)"})}<span>${n}</span></div>`).join("")}</div><p class="note">Trên 50% là đa số cổ phiếu khỏe.</p>`));
  if(S.mkt.length){const m=S.mkt.slice(-60);o.push(card("P/E VN-Index",big(fmt(S.mk[1],2)+" lần","",""
    )+spark(m.map(r=>r[1]),{color:"var(--gold)"})+`<p class="note">${m.length} điểm dữ liệu gần nhất</p>`))}
  if(S.br.length){const b=S.br.slice(-10);o.push(card("Mã tăng / giảm 10 phiên",`<ul class="ad">${b.map(r=>`<li><span>${esc(r[0])}</span><i style="--a:${r[1]};--d:${r[2]}"></i></li>`).join("")}</ul>`))}
  if(S.oi.length){const l=last(S.oi);o.push(card("Hợp đồng mở VN30F1M",big(fmt(l[1],0),"Ngày "+dm(l[0]),"")+spark(S.oi.slice(-30).map(r=>r[1]))))}
  return o.join("")}
function viewSector(S){const o=[];
  if(S.rank.length){const mx=100;o.push(card("Xếp hạng sức mạnh ngành",`<ol class="rk">${S.rank.map((r,i)=>`<li><b>${i+1}</b><span>${esc(r.name)}<small>${r.best.slice(0,3).map(x=>x[0]).join(" · ")}</small></span><i style="width:${(r.lv||0)/mx*100}%;background:${r.lv>=70?"var(--up)":r.lv<40?"var(--down)":"var(--gold)"}"></i><em>${fmt(r.lv,0)}</em>${spark(r.ser.slice(-15),{w:90,h:28,area:false,color:"var(--acc)"})}</li>`).join("")}</ol><p class="note">Điểm RS trung bình các mã trong ngành (0–100), cao là mạnh. Dải nhỏ bên phải: 15 phiên gần nhất.</p>`,{span:2,cls:"hero"}))}
  if(S.secc.length){const r=[...S.secc].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,12).sort((a,b)=>b[1]-a[1]),mx=Math.max(.01,...r.map(x=>Math.abs(x[1])));
    o.push(card("Ngành đóng góp điểm VN-Index",`<ul class="ct">${r.map(([n,v])=>`<li><span>${esc(n)}</span><div><i class="${v>=0?"p":"n"}" style="width:${Math.abs(v)/mx*50}%"></i></div><b class="${cls(v)}">${sgn(v,2)}</b></li>`).join("")}</ul>`,{span:2,sub:"Phiên "+dm(S.D.secc.date)}))}
  return o.join("")}
function viewStock(S){const o=[],sets=[["Vượt đỉnh 52 tuần","up"],["Phá đáy 52 tuần","down"],["Giá tăng, KL đột biến","gold"],["CANSLIM","acc"],["Tăng trưởng","acc"],["Cổ tức cao","gold"]];
  sets.forEach(([n,c])=>{const s=S.sets[n];if(!s)return;o.push(card(n,`<ul class="tk">${s.rows.slice(0,10).map(r=>`<li><b>${esc(r[0])}</b><span>${esc(r[2]||"")}</span><em class="${cls(r[6])}">${sgn(r[6],1)}%</em></li>`).join("")}</ul><p class="note">% là thay đổi giá 1 tuần. ${esc(s.cond||"")}</p>`,{cls:"c-"+c,sub:s.count?s.count+" mã":""}))});
  if(S.top&&S.top.src)o.push(card("Điểm xếp hạng nhóm SSI100",`<div class="g4">${S.top.src.map(s=>`<div><h4>${esc(s.n)}</h4><ol>${s.rows.slice(0,5).map(r=>`<li><b>${esc(r[0])}</b><em>${fmt(r[1],s.dec||0)}</em></li>`).join("")}</ol></div>`).join("")}</div>`,{span:2,sub:"Cập nhật "+dm(S.top.date)}));
  return o.join("")}
const VIEWS={home:viewHome,macro:viewMacro,market:viewMarket,sector:viewSector,stock:viewStock};
function talk(id,S){const L=[];const v=S.vni;
  if(id==="home"){L.push(`VN-Index ${S.vch>=0?"tăng":"giảm"} ${fmt(Math.abs(S.vch),2)} điểm, đóng cửa ${fmt(v.c,2)}.`);if(S.f)L.push(`Khối ngoại ${S.f[1]<0?"bán":"mua"} ròng ${fmt(Math.abs(S.f[1]),0)} tỷ, ${S.fst} phiên liên tiếp.`);if(S.hi52)L.push(S.fromHi>=0?"VN-Index đang ở đỉnh 52 tuần!":`Còn cách đỉnh 52 tuần ${fmt(-S.fromHi,1)}%.`);if(S.b)L.push(`Phiên ${S.b[0]}: ${S.b[1]} mã tăng, ${S.b[2]} mã giảm.`)}
  if(id==="macro"){if(S.gb)L.push(`Lợi suất TPCP 10 năm ${fmt(S.gb.last[1],2)}%.`);const f=last(S.fx);if(f)L.push(`USD/VND bán ra ${fmt(f[2],0)} đồng.`)}
  if(id==="market"){if(S.mk)L.push(`P/E ${fmt(S.mk[1],2)} lần, ${fmt(S.mk[3],0)}% mã trên MA20.`);if(S.p)L.push(`Tự doanh ${S.p[1]<0?"bán":"mua"} ròng ${fmt(Math.abs(S.p[1]),0)} tỷ phiên ${S.p[0]}.`);L.push(`Từ ${S.fo[0]?.[0]}: ngoại ${S.fsum<0?"bán":"mua"} ròng ${fmt(Math.abs(S.fsum),0)} tỷ.`)}
  if(id==="sector"){const t=S.rank[0],w=last(S.rank);if(t)L.push(`Ngành mạnh nhất: ${t.name}, RS ${fmt(t.lv,0)}.`);if(w)L.push(`Yếu nhất: ${w.name}, RS ${fmt(w.lv,0)}.`);if(S.secc.length){L.push(`${S.secc[0][0]} góp nhiều nhất, ${sgn(S.secc[0][1],2)} điểm.`);L.push(`${last(S.secc)[0]} kéo mạnh nhất, ${sgn(last(S.secc)[1],2)} điểm.`)}}
  if(id==="stock"){const a=S.sets["Vượt đỉnh 52 tuần"],b=S.sets["Phá đáy 52 tuần"];if(a)L.push(`Vượt đỉnh 52 tuần: ${a.rows.slice(0,3).map(r=>r[0]).join(", ")}.`);if(b)L.push(`Phá đáy 52 tuần: ${b.rows.slice(0,3).map(r=>r[0]).join(", ")}.`)}
  return L.length?L:["Chưa có số liệu cho khu vực này."]}

/* ---------- giao diện ---------- */
const CSS=`#ship{--bg:#02040b;--panel:rgba(12,20,36,.78);--fg:#eef3fa;--muted:#9fb3cc;--line:rgba(148,190,240,.18);--acc:#7cc0f5;--gold:#f5c45a;--up:#34d68a;--down:#ff6f68;
position:fixed;inset:0;z-index:1000;background:var(--bg);color:var(--fg);font-family:${FONT};display:flex;flex-direction:column;overflow:hidden;color-scheme:dark}
#ship canvas.sky{position:absolute;inset:0;width:100%;height:100%;z-index:0}
#ship .top{position:relative;z-index:2;display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));background:linear-gradient(rgba(2,4,11,.9),rgba(2,4,11,.4))}
#ship .top h1{margin:0;font-family:Lora,Georgia,serif;font-size:1.2rem;font-weight:600;color:var(--fg);background:none;-webkit-text-fill-color:currentColor}
#ship .top .s{font-size:.8rem;color:var(--muted)} #ship .top .t{flex:1 1 220px;min-width:0}
#ship .old,#ship .go,#ship .nav button{font:inherit;color:var(--fg);cursor:pointer}
#ship .top .up{color:var(--up)}#ship .top .down{color:var(--down)}
#ship .oldhost{display:flex;flex-direction:column;gap:28px}#ship .oldhost section>h2{display:none}#ship .oldhost:empty{display:none}#ship .win.ph .mine:empty{display:none}
#ship .mus{font:inherit;font-size:.85rem;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:9px;padding:6px 12px;font-weight:600}#ship .mus[aria-pressed="true"]{border-color:var(--gold);color:var(--gold)}#ship .mus.wait{border-color:var(--acc);color:var(--acc);animation:muspulse 1.6s ease-in-out infinite}@keyframes muspulse{50%{opacity:.55}}@media (prefers-reduced-motion:reduce){#ship .mus.wait{animation:none}}#ship .mus:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
#ship .old{font-size:.85rem;background:transparent;border:1px solid var(--acc);color:var(--acc);border-radius:9px;padding:6px 12px;font-weight:600}
#ship .main{position:relative;z-index:1;flex:1;min-height:0;overflow-y:auto;scroll-behavior:smooth}
#ship .win{max-width:1180px;margin:0 auto;padding:6px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:16px}
#ship .dest{display:flex;align-items:center;gap:16px;min-height:120px}
#ship .dest .pl{width:110px;height:110px;flex:none}
#ship .dest h2{margin:0;font-family:Lora,Georgia,serif;font-weight:600;font-size:clamp(1.6rem,4vw,2.4rem);display:block;color:var(--fg)}
#ship .dest .hint{margin:4px 0 0;font-size:.85rem;color:var(--muted);max-width:620px}#ship .nav button small{font-size:.66rem;font-weight:500;color:var(--muted);opacity:.85}
#ship .dest .ey{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);font-weight:700}
#ship .co{display:flex;gap:12px;align-items:flex-start;max-width:720px}
#ship .co svg{flex:none;width:54px;height:54px}
#ship .co p{margin:0;background:rgba(255,255,255,.94);color:#0b1322;border-radius:14px 14px 14px 4px;padding:9px 13px;font-size:.95rem;font-weight:500;min-height:1.4em;transition:opacity .3s}
#ship .mine{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;transition:opacity .35s,transform .35s}
#ship .mine.out,#ship .oldhost.out{opacity:0;transform:scale(.97)}#ship .oldhost{transition:opacity .35s,transform .35s}
#ship .mine .card{background:var(--panel);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:8px;min-width:0;box-shadow:0 10px 30px rgba(0,0,0,.35)}
@media (min-width:700px){#ship .mine .card[data-span="2"]{grid-column:span 2}}
#ship .mine .card.hero{border-color:rgba(245,196,90,.35)}
#ship .mine .card h3{margin:0;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;display:flex;justify-content:space-between;gap:8px}
#ship .mine .card h3 span{text-transform:none;letter-spacing:0;font-weight:500}
#ship .mine .big{font-size:clamp(1.9rem,4vw,2.6rem);font-weight:700;font-variant-numeric:tabular-nums;line-height:1.05}
#ship .mine .chg{font-weight:600;font-size:1rem}
#ship .mine .up{color:var(--up)} #ship .mine .down{color:var(--down)}
#ship .mine .note{margin:0;font-size:.78rem;color:var(--muted)}
#ship .mine .sp{width:100%;height:70px;display:block}
#ship .mine .bars{width:100%;height:auto;display:block}#ship .mine .ax{fill:var(--muted);font-size:13px}
#ship .mine .gauge{width:100%;max-width:200px;align-self:center}#ship .mine .gv{fill:var(--fg);font-size:18px;font-weight:700}
#ship .mine .row{display:flex;justify-content:space-between;font-size:.82rem;color:var(--muted)}
#ship .mine .split{display:flex;align-items:center;gap:10px;font-size:1.8rem}#ship .mine .split i{flex:1;height:14px;border-radius:7px;background:linear-gradient(90deg,var(--up) calc(var(--a)/(var(--a) + var(--d))*100%),var(--down) 0)}
#ship .mine .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;text-align:center;font-size:.8rem;color:var(--muted)}
#ship .mine ul,#ship .mine ol{list-style:none;margin:0;padding:0}
#ship .mine .hb li{display:grid;grid-template-columns:110px 1fr 54px;gap:8px;align-items:center;font-size:.88rem;padding:3px 0}#ship .mine .hb i{height:10px;border-radius:5px;background:var(--acc)}#ship .mine .hb b{text-align:right;font-variant-numeric:tabular-nums}
#ship .mine .ad li{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;font-size:.8rem;color:var(--muted);padding:2px 0}#ship .mine .ad i{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--up) calc(var(--a)/(var(--a) + var(--d))*100%),var(--down) 0)}
#ship .mine .rk li{display:grid;grid-template-columns:24px minmax(0,1.3fr) minmax(40px,1fr) 34px 90px;gap:10px;align-items:center;padding:5px 0;border-top:1px solid var(--line)}
#ship .mine .rk li:first-child{border-top:0}#ship .mine .rk b{color:var(--gold)}#ship .mine .rk span{font-weight:600;font-size:.92rem;min-width:0}#ship .mine .rk small{display:block;color:var(--muted);font-weight:500;font-size:.75rem}
#ship .mine .rk i{height:10px;border-radius:5px}#ship .mine .rk em{font-style:normal;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}#ship .mine .rk .sp{height:28px}
#ship .mine .ct li{display:grid;grid-template-columns:minmax(0,1.2fr) 1fr 64px;gap:10px;align-items:center;font-size:.86rem;padding:3px 0}#ship .mine .ct div{position:relative;height:12px}
#ship .mine .ct i{position:absolute;top:0;height:12px;border-radius:4px}#ship .mine .ct i.p{left:50%;background:var(--up)}#ship .mine .ct i.n{right:50%;background:var(--down)}#ship .mine .ct b{text-align:right;font-variant-numeric:tabular-nums}
#ship .mine .tk li{display:grid;grid-template-columns:56px minmax(0,1fr) 64px;gap:8px;align-items:center;padding:4px 0;border-top:1px solid var(--line);font-size:.86rem}#ship .mine .tk li:first-child{border-top:0}
#ship .mine .tk b{font-size:1rem}#ship .mine .tk span{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ship .mine .tk em{font-style:normal;font-weight:700;text-align:right}
#ship .mine .c-up{border-top:3px solid var(--up)}#ship .mine .c-down{border-top:3px solid var(--down)}#ship .mine .c-gold{border-top:3px solid var(--gold)}#ship .mine .c-acc{border-top:3px solid var(--acc)}
#ship .mine .g4{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px}#ship .mine .g4 h4{margin:0 0 6px;font-size:.8rem;color:var(--gold)}#ship .mine .g4 li{display:flex;justify-content:space-between;padding:2px 0}#ship .mine .g4 em{font-style:normal;color:var(--acc);font-weight:600}
#ship .go{align-self:flex-start;font-size:.85rem;background:transparent;border:1px solid var(--line);border-radius:9px;padding:6px 12px;color:var(--muted)}
#ship .nav{position:relative;z-index:2;display:flex;flex-wrap:nowrap;justify-content:center;gap:8px;padding:10px max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));background:linear-gradient(rgba(2,4,11,.3),rgba(2,4,11,.95));overflow-x:auto}
#ship .nav button{display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:14px;padding:8px 14px 6px;min-width:86px;font-size:.82rem;font-weight:600;color:var(--muted)}
#ship .nav button svg{width:34px;height:34px}
#ship .nav button[aria-current="true"]{border-color:var(--gold);color:var(--fg);background:rgba(245,196,90,.1)}
#ship .nav button:hover,#ship .nav button:focus-visible,#ship .old:focus-visible,#ship .go:focus-visible{border-color:var(--gold);outline:none}
@media (max-width:640px){#ship .dest{min-height:0}#ship .dest .pl{width:72px;height:72px}#ship .nav{justify-content:flex-start}#ship .nav button{flex:1 0 64px;min-width:64px;padding:6px 4px;font-size:.72rem}#ship .nav button svg{width:28px;height:28px}#ship .rk li{grid-template-columns:22px minmax(0,1fr) 34px 70px}#ship .rk i{display:none}#ship .card{padding:14px}}
#ship .dest{min-height:0;gap:14px}#ship .dest .pl{width:64px;height:64px}#ship .dest h2{font-size:clamp(1.4rem,3vw,2rem)}
#ship .head{display:flex;flex-wrap:wrap;align-items:center;gap:8px 28px}#ship .head .dest{flex:1 1 420px}#ship .head .co{flex:1 1 320px}
#ship .win{gap:12px}
@media (max-width:640px){#ship .dest .pl{width:44px;height:44px}#ship .dest .hint{display:none}#ship .co svg{width:40px;height:40px}#ship .co p{font-size:.88rem;padding:7px 11px}
#ship .mine{grid-template-columns:1fr 1fr;gap:10px}#ship .mine .card[data-span="2"]{grid-column:1/-1}#ship .mine .card{padding:12px}#ship .mine .big{font-size:1.5rem}#ship .mine .split{font-size:1.3rem}#ship .mine .gauge{max-width:130px}#ship .mine .sp{height:54px}}
@media (prefers-reduced-motion:reduce){#ship *{transition:none!important}}`;
/* tâm trạng phiên: theo % thay đổi VN-Index; đổi màu tinh vân, độ sáng sao, hiệu ứng nền và nét mặt phi công phụ */
const MOODS={
 joy:{n:"Hưng phấn",c:"#34d68a",bg:"#04120c",neb:["#2fbf71","#f5c45a"],star:1.15,sp:.07,fx:"fireworks"},
 good:{n:"Tích cực",c:"#7ef0b4",bg:"#031014",neb:["#2aa889","#3b7fd0"],star:1.05,sp:.05,fx:"shoot"},
 flat:{n:"Trung tính",c:"#9fb3cc",bg:"#02040b",neb:null,star:1,sp:.04,fx:null},
 sad:{n:"Ảm đạm",c:"#ffb0a8",bg:"#040509",neb:["#3a4152","#2a2f3d"],star:.55,sp:.02,fx:"dust"},
 storm:{n:"Căng thẳng",c:"#ff6f68",bg:"#07030a",neb:["#7a2032","#3b1f55"],star:.45,sp:.015,fx:"asteroid"}};
const moodOf=pc=>pc>=1?"joy":pc>=.2?"good":pc>-.2?"flat":pc>-1?"sad":"storm";
function alien(m){const sk={joy:"#7be07b",good:"#7be07b",flat:"#7be07b",sad:"#8fbf8f",storm:"#93b393"}[m];
  const mouth={joy:'<path d="M21 34q9 10 18 0z" fill="#1d5a1d"/>',good:'<path d="M23 35q7 6 14 0" stroke="#1d5a1d" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    flat:'<path d="M24 37h12" stroke="#1d5a1d" stroke-width="2.2" stroke-linecap="round"/>',sad:'<path d="M24 39q6-5 12 0" stroke="#1d5a1d" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    storm:'<path d="M23 40q7-7 14 0" stroke="#1d5a1d" stroke-width="2.4" fill="none" stroke-linecap="round"/>'}[m];
  const brow=m==="sad"||m==="storm"?'<path d="M17 16l10 3M43 16l-10 3" stroke="#1d5a1d" stroke-width="2" stroke-linecap="round"/>':"";
  const ant=m==="sad"||m==="storm"?'<line x1="22" y1="12" x2="13" y2="6" stroke="'+sk+'" stroke-width="2"/><line x1="38" y1="12" x2="47" y2="6" stroke="'+sk+'" stroke-width="2"/><circle cx="13" cy="6" r="3" fill="#c9b85a"/><circle cx="47" cy="6" r="3" fill="#c9b85a"/>'
    :'<line x1="22" y1="12" x2="16" y2="2" stroke="'+sk+'" stroke-width="2"/><line x1="38" y1="12" x2="44" y2="2" stroke="'+sk+'" stroke-width="2"/><circle cx="16" cy="3" r="3" fill="#fff36b"/><circle cx="44" cy="3" r="3" fill="#fff36b"/>';
  const extra=m==="joy"?'<path d="M6 20l2-4 2 4-4-2h4zM52 18l2-4 2 4-4-2h4z" fill="#f5c45a"/>':m==="storm"?'<path d="M46 24q3 5 0 7q-3-2 0-7z" fill="#7cc0f5"/>':"";
  return `<svg viewBox="0 0 60 60" aria-hidden="true">${ant}<ellipse cx="30" cy="27" rx="19" ry="17" fill="${sk}"/><ellipse cx="23" cy="26" rx="5" ry="${m==="joy"?5:7}" fill="#0b0b12"/><ellipse cx="37" cy="26" rx="5" ry="${m==="joy"?5:7}" fill="#0b0b12"/><circle cx="25" cy="23" r="1.6" fill="#fff"/><circle cx="39" cy="23" r="1.6" fill="#fff"/>
${brow}${mouth}${extra}<path d="M14 60q2-14 16-14t16 14z" fill="#2a3550"/><rect x="24" y="50" width="12" height="3" rx="1.5" fill="#f5c45a"/></svg>`}
function planetSVG(p,id){const G=`<defs><radialGradient id="g${id}" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></radialGradient></defs>`;
  const body={
   bridge:`<circle cx="50" cy="50" r="40" fill="none" stroke="${p.c1}" stroke-opacity=".5" stroke-width="3"/><circle cx="50" cy="50" r="26" fill="none" stroke="${p.c1}" stroke-opacity=".7" stroke-width="3"/><circle cx="50" cy="50" r="11" fill="url(#g${id})"/><path d="M50 50L84 30" stroke="${p.c1}" stroke-width="4" stroke-linecap="round"/><circle cx="74" cy="64" r="4" fill="#f5c45a"/><circle cx="28" cy="34" r="3" fill="#7ef0b4"/>`,
   galaxy:`<g transform="rotate(-25 50 50)"><ellipse cx="50" cy="50" rx="46" ry="18" fill="${p.c2}" opacity=".35"/><path d="M50 50c18-16 40-6 42 4M50 50c-18 16-40 6-42-4M50 50c-6-12 6-20 18-16M50 50c6 12-6 20-18 16" fill="none" stroke="${p.c1}" stroke-width="4" stroke-linecap="round"/></g><circle cx="50" cy="50" r="9" fill="url(#g${id})"/>`,
   star:`<circle cx="50" cy="50" r="44" fill="${p.c2}" opacity=".18"/><circle cx="50" cy="50" r="34" fill="${p.c2}" opacity=".28"/><circle cx="50" cy="50" r="24" fill="url(#g${id})"/>`,
   planet:`<ellipse cx="50" cy="52" rx="48" ry="12" fill="none" stroke="${p.c1}" stroke-opacity=".55" stroke-width="3"/><circle cx="50" cy="50" r="30" fill="url(#g${id})"/><ellipse cx="40" cy="58" rx="8" ry="4" fill="#000" opacity=".12"/><path d="M2 52a48 12 0 0 0 96 0" fill="none" stroke="${p.c1}" stroke-opacity=".8" stroke-width="3"/>`,
   moon:`<circle cx="50" cy="50" r="40" fill="none" stroke="${p.c2}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="4 5"/><circle cx="22" cy="72" r="9" fill="#5b33a8" opacity=".8"/><circle cx="58" cy="42" r="22" fill="url(#g${id})"/><circle cx="50" cy="36" r="5" fill="#000" opacity=".14"/><circle cx="64" cy="50" r="3.5" fill="#000" opacity=".14"/><circle cx="60" cy="32" r="2.5" fill="#000" opacity=".12"/>`}[p.kind];
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${G}${body}</svg>`}

/* ---------- nhạc nền theo trạng thái vũ trụ: tự soạn bằng Web Audio, không dùng tệp âm thanh ngoài ----------
   joy: giọng trưởng, 128 BPM, arpeggio nhanh, trống bốn phách. good: trưởng ngũ cung, 104 BPM, nhẹ nhàng.
   flat: pad treo (sus), 76 BPM, thưa. sad: giọng thứ, 64 BPM, giai điệu đi xuống, không trống.
   storm: điệu Phrygian, 92 BPM, ostinato quãng 2 thứ, trống trầm kiểu taiko, tiếng ù nền. */
const SONGS={
 joy:{bpm:128,prog:[[60,64,67,71],[57,60,64,67],[65,69,72,76],[67,71,74,77]],arp:"up16",lead:[72,74,76,79,81,84],leadP:.4,bass:"pump",drum:"four",wave:"triangle",pad:.035},
 good:{bpm:104,prog:[[62,66,69,73],[59,62,66,69],[67,71,74,78],[69,73,76,78]],arp:"up8",lead:[74,76,78,81,83],leadP:.28,bass:"root",drum:"soft",wave:"triangle",pad:.045},
 flat:{bpm:76,prog:[[62,64,69],[60,62,67],[57,59,64],[60,62,67]],arp:"sparse",lead:[69,71,74,76],leadP:.14,bass:"long",drum:null,wave:"sine",pad:.06},
 sad:{bpm:64,prog:[[57,60,64],[53,57,60],[48,52,55],[52,55,59]],arp:"down8",lead:[69,67,64,62,60],leadP:.22,bass:"long",drum:null,wave:"sine",pad:.055},
 storm:{bpm:92,prog:[[50,53,57],[51,55,58],[50,53,57],[49,52,56]],arp:"ostinato",lead:[62,63,65,62],leadP:.1,bass:"pulse",drum:"taiko",wave:"sawtooth",pad:.04,drone:38}};
function Music(mood){const P=SONGS[mood]||SONGS.flat,AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  let ac=null,master,rev,timer=0,step=0,nextT=0,on=false,droneN=[];const hz=m=>440*Math.pow(2,(m-69)/12),sd=60/P.bpm/4;
  function init(){ac=new AC();master=ac.createGain();master.gain.value=0;const comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);
    rev=ac.createConvolver();const L=ac.sampleRate*2.4,b=ac.createBuffer(2,L,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,2.6)}rev.buffer=b;
    const rg=ac.createGain();rg.gain.value=.35;rev.connect(rg);rg.connect(master)}
  function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
  function tone(t,m,dur,vol,wave,send=.3,cut=0){const o=ac.createOscillator(),g=ac.createGain();o.type=wave;o.frequency.value=hz(m);let n=o;
    if(cut){const f=ac.createBiquadFilter();f.type="lowpass";f.frequency.value=cut;o.connect(f);n=f}n.connect(g);env(g,t,.008,vol,dur);g.connect(master);
    if(send){const s=ac.createGain();s.gain.value=send;g.connect(s);s.connect(rev)}o.start(t);o.stop(t+dur+.1)}
  function pad(t,ch,dur){ch.forEach(m=>[-6,6].forEach(dt=>{const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=hz(m);o.detune.value=dt;o.connect(g);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(P.pad,t+dur*.35);g.gain.linearRampToValueAtTime(0,t+dur*1.05);g.connect(rev);const d=ac.createGain();d.gain.value=.6;g.connect(d);d.connect(master);o.start(t);o.stop(t+dur*1.1)}))}
  let nb=null;function noise(){if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}const s=ac.createBufferSource();s.buffer=nb;return s}
  function kick(t,v=.5,f0=120,f1=42){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+.15);o.connect(g);env(g,t,.003,v,.28);g.connect(master);o.start(t);o.stop(t+.35)}
  function hat(t,v=.06){const s=noise(),f=ac.createBiquadFilter(),g=ac.createGain();f.type="highpass";f.frequency.value=7000;s.connect(f);f.connect(g);env(g,t,.002,v,.05);g.connect(master);s.start(t);s.stop(t+.08)}
  function taiko(t,v=.6){kick(t,v,90,38);const s=noise(),f=ac.createBiquadFilter(),g=ac.createGain();f.type="lowpass";f.frequency.value=380;s.connect(f);f.connect(g);env(g,t,.004,v*.35,.35);g.connect(master);const r=ac.createGain();r.gain.value=.4;g.connect(r);r.connect(rev);s.start(t);s.stop(t+.45)}
  function drone(){if(!P.drone)return;[0,7,.12].forEach((iv,i)=>{const o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter(),l=ac.createOscillator(),lg=ac.createGain();
      o.type=i===2?"sawtooth":"triangle";o.frequency.value=hz(P.drone+(i===2?0:iv));if(i===2)o.detune.value=12;f.type="lowpass";f.frequency.value=260;l.frequency.value=.11+i*.05;lg.gain.value=120;l.connect(lg);lg.connect(f.frequency);
      o.connect(f);f.connect(g);g.gain.value=i===2?.025:.05;g.connect(master);o.start();l.start();droneN.push(o,l)});
    const s=noise(),f=ac.createBiquadFilter(),g=ac.createGain();s.loop=true;f.type="lowpass";f.frequency.value=140;s.connect(f);f.connect(g);g.gain.value=.05;g.connect(master);s.start();droneN.push(s)}
  function play(i,t){const bar=Math.floor(i/16),k=i%16,ch=P.prog[bar%P.prog.length],r=ch[0],bl=sd*16;
    if(k===0)pad(t,ch,bl);
    const up=ch.map(m=>m+12);
    if(P.arp==="up16")tone(t,up[k%up.length]+(k>=8?12:0),sd*1.6,.07,P.wave,.25,3200);
    else if(P.arp==="up8"&&k%2===0)tone(t,up[(k/2)%up.length],sd*3,.07,P.wave,.3,2600);
    else if(P.arp==="down8"&&k%2===0){const d=[...up].reverse();tone(t,d[(k/2)%d.length],sd*4,.06,"sine",.45)}
    else if(P.arp==="sparse"&&(k===0||k===6||k===10))tone(t,up[Math.floor(Math.random()*up.length)],sd*6,.06,"sine",.5);
    else if(P.arp==="ostinato"&&k%2===0)tone(t,r+([0,0,1,0,0,0,1,3][(k/2)%8]),sd*1.8,.05,"sawtooth",.15,900+300*Math.sin(i/9));
    if(k%2===0&&Math.random()<P.leadP){const m=P.lead[Math.floor(Math.random()*P.lead.length)];tone(t,m,sd*(2+Math.floor(Math.random()*3)),mood==="storm"?.04:.055,mood==="joy"||mood==="good"?"square":"triangle",.5,mood==="joy"?4200:2200)}
    const b=r-24;
    if(P.bass==="pump"&&k%4===0)tone(t,b,sd*3,.12,"triangle",0,900);
    else if(P.bass==="root"&&k%8===0)tone(t,b,sd*7,.11,"triangle",0,800);
    else if(P.bass==="long"&&k===0)tone(t,b,bl*.95,.1,"sine",.1);
    else if(P.bass==="pulse"&&k%2===0)tone(t,b,sd*1.5,.09,"sawtooth",0,320);
    if(P.drum==="four"){if(k%4===0)kick(t,.45);if(k%4===2)hat(t,.07);if(k%2===1)hat(t,.025)}
    else if(P.drum==="soft"){if(k===0||k===8)kick(t,.28);if(k%4===2)hat(t,.03)}
    else if(P.drum==="taiko"){if(k===0||k===3||k===8||k===11)taiko(t,k%8===0?.6:.4);if(k===14&&Math.random()<.5)taiko(t,.3)}}
  function tick(){while(nextT<ac.currentTime+.25){play(step,nextT);step++;nextT+=sd}}
  /* on = người xem muốn nghe; playing = âm thanh thật sự đang chạy (trình duyệt có thể giữ AudioContext ở trạng thái suspended tới khi có thao tác) */
  let cb=null;
  /* iPhone ở chế độ im lặng tắt tiếng Web Audio; phát kèm một thẻ audio im lặng để chuyển sang kênh phát nhạc */
  let sil=null;function iosUnmute(){try{if(!sil){const n=800,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
      w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
      sil=new Audio(URL.createObjectURL(new Blob([b],{type:"audio/wav"})));sil.loop=true;sil.setAttribute("playsinline","")}const p=sil.play();p&&p.catch(()=>{})}catch(e){}}
  function start(){on=true;iosUnmute();if(!ac){init();drone();ac.onstatechange=()=>cb&&cb()}
    if(nextT<ac.currentTime)nextT=ac.currentTime+.05;master.gain.cancelScheduledValues(ac.currentTime);master.gain.setTargetAtTime(.6,ac.currentTime,.4);
    clearInterval(timer);timer=setInterval(()=>{if(ac.state==="running")tick()},60);
    try{const p=ac.resume();p&&p.then(()=>cb&&cb(),()=>{})}catch(e){}cb&&cb()}
  function stop(){on=false;clearInterval(timer);if(sil)sil.pause();if(!ac)return;master.gain.setTargetAtTime(0,ac.currentTime,.15);setTimeout(()=>{if(!on&&ac&&ac.state==="running")ac.suspend()},600);cb&&cb()}
  function kill(){on=false;clearInterval(timer);if(sil){sil.pause();sil=null}if(ac){droneN.forEach(n=>{try{n.stop()}catch(e){}});ac.close();ac=null}}
  return {start,stop,kill,get on(){return on},get playing(){return on&&!!ac&&ac.state==="running"},set onchange(f){cb=f}}}

let ROOT=null,STOP=null;
function build(D){const S=digest(D),MK=moodOf(S.vpc),MO=MOODS[MK];
  if(!document.getElementById("ship-css")){const st=document.createElement("style");st.id="ship-css";st.textContent=CSS;document.head.appendChild(st)}
  const root=document.createElement("div");root.id="ship";root.setAttribute("aria-label","Market 360, giao diện buồng lái");
  root.innerHTML=`<canvas class="sky" aria-hidden="true"></canvas>
  <div class="top"><div class="t"><h1>Market 360 · Buồng lái</h1><div class="s">Phiên ${esc(S.date)} · VN-Index ${fmt(S.vni.c,2)} <span class="${cls(S.vch)}">${sgn(S.vch,2)} (${sgn(S.vpc,2)}%)</span> · <span class="mood" style="color:${MO.c}">Trạng thái vũ trụ: ${esc(MO.n)}</span></div></div><button type="button" class="mus" data-mus aria-pressed="false">♪ Bật nhạc</button><button type="button" class="old" data-old>Giao diện cũ</button></div>
  <div class="main"><div class="win"><div class="head"><div class="dest"><div class="pl"></div><div><div class="ey"></div><h2></h2><p class="hint"></p></div></div>
  <div class="co">${alien(MK)}<p aria-live="polite"></p></div></div><div class="mine"></div><div class="oldhost"></div><button type="button" class="go" data-go>Mở mục này ở giao diện cũ</button></div></div>
  <nav class="nav" aria-label="Chọn tầng phân tích">${PLANETS.map((p,i)=>`<button type="button" data-p="${p.id}">${planetSVG(p,"n"+i)}${esc(p.short||p.name)}<small>${esc(p.lv.replace(/^Tầng \d · /,""))}</small></button>`).join("")}</nav>`;
  document.body.appendChild(root);document.documentElement.style.overflow="hidden";
  const $=s=>root.querySelector(s),grid=$(".mine"),host=$(".oldhost"),say=$(".co p"),main=$(".main");
  const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* bầu trời: sao bay qua, tăng tốc khi chuyển hành tinh; hành tinh đích lớn dần ở góc */
  const cv=$("canvas.sky"),g=cv.getContext("2d");let W=0,H=0,dpr=1;const N=420,stars=[];
  for(let i=0;i<N;i++)stars.push({x:Math.random()*2-1,y:Math.random()*2-1,z:Math.random()});
  function rs(){dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0)}rs();addEventListener("resize",rs);
  let warp=0,cur=PLANETS[0],grow=1,raf=0,alive=true,lt=performance.now();
  const ships=[{x:-.2,y:.18,v:.035,s:1},{x:1.2,y:.32,v:-.022,s:.7}];const slow=MK==="sad"||MK==="storm"?.55:MK==="joy"?1.4:1;
  /* hiệu ứng nền theo không khí phiên: pháo hoa (hưng phấn), sao băng (tích cực), bụi rơi (ảm đạm), thiên thạch trôi chậm (căng thẳng) */
  const parts=[],FWC=["#34d68a","#f5c45a","#7cc0f5","#ff9fb0","#fff36b"];let fxT=.3;
  const dust=MK==="sad"||MK==="storm"?[...Array(MK==="storm"?90:60)].map(()=>({x:Math.random(),y:Math.random(),v:.008+Math.random()*.02,r:.6+Math.random()*1.4})):[];
  const rocks=MK==="storm"?[...Array(6)].map((_,i)=>({x:Math.random(),y:.15+Math.random()*.7,v:(.004+Math.random()*.008)*(i%2?1:-1),r:8+Math.random()*18,a:Math.random()*6,va:(Math.random()-.5)*.6,pts:[...Array(8)].map(()=>.7+Math.random()*.35)})):[];
  function fx(dt,now){if(REDUCED)return;fxT-=dt;
    if(MO.fx==="fireworks"&&fxT<=0){fxT=.8+Math.random()*1.2;const x=W*(.1+Math.random()*.8),y=H*(.1+Math.random()*.35),c=FWC[Math.floor(Math.random()*FWC.length)];
      for(let i=0;i<46;i++){const a=i/46*Math.PI*2,v=60+Math.random()*80;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1.4,c})}}
    if(MO.fx==="shoot"&&fxT<=0){fxT=1.8+Math.random()*2.5;parts.push({x:W*(.2+Math.random()*.8),y:H*Math.random()*.3,vx:-420,vy:200,l:.9,c:"#ffffff",tail:1})}
    for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;if(p.l<=0){parts.splice(i,1);continue}
      if(p.tail){g.strokeStyle=`rgba(255,255,255,${Math.min(1,p.l)})`;g.lineWidth=2;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.12,p.y-p.vy*.12);g.stroke();p.x+=p.vx*dt;p.y+=p.vy*dt}
      else{p.vy+=40*dt;p.vx*=.985;p.x+=p.vx*dt;p.y+=p.vy*dt;g.globalAlpha=Math.min(1,p.l);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,2,0,7);g.fill();g.globalAlpha=1}}
    g.fillStyle="rgba(170,170,185,.35)";for(const d of dust){d.y+=d.v*dt;d.x+=Math.sin(now/1500+d.y*20)*.0004;if(d.y>1.02){d.y=-.02;d.x=Math.random()}g.beginPath();g.arc(d.x*W,d.y*H,d.r,0,7);g.fill()}
    for(const r of rocks){r.x+=r.v*dt;r.a+=r.va*dt;if(r.x>1.15)r.x=-.15;if(r.x<-.15)r.x=1.15;g.save();g.translate(r.x*W,r.y*H);g.rotate(r.a);g.fillStyle="#3b3540";g.strokeStyle="#5a5060";g.lineWidth=1.5;g.beginPath();
      r.pts.forEach((k,i)=>{const a=i/r.pts.length*Math.PI*2;i?g.lineTo(Math.cos(a)*r.r*k,Math.sin(a)*r.r*k):g.moveTo(Math.cos(a)*r.r*k,Math.sin(a)*r.r*k)});g.closePath();g.fill();g.stroke();g.restore()}}
  function frame(now){if(!alive)return;const dt=Math.min(.05,(now-lt)/1000);lt=now;
    g.fillStyle=MO.bg;g.fillRect(0,0,W,H);
    if(MO.neb){const m=g.createRadialGradient(W*.15,H*.85,0,W*.15,H*.85,Math.max(W,H)*.75);m.addColorStop(0,MO.neb[0]+"88");m.addColorStop(.5,MO.neb[1]+"40");m.addColorStop(1,"transparent");g.fillStyle=m;g.fillRect(0,0,W,H)}
    if(MK==="joy"||MK==="good"){const u=g.createRadialGradient(W*.5,-H*.1,0,W*.5,-H*.1,Math.max(W,H)*.6);u.addColorStop(0,MK==="joy"?"rgba(245,196,90,.28)":"rgba(126,240,180,.16)");u.addColorStop(1,"transparent");g.fillStyle=u;g.fillRect(0,0,W,H)}
    if(MK==="storm"){const pu=.16+.06*Math.sin(now/1300),v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,"transparent");v.addColorStop(1,`rgba(150,20,40,${REDUCED?.16:pu})`);g.fillStyle=v;g.fillRect(0,0,W,H)}
    const neb=g.createRadialGradient(W*.8,H*.25,0,W*.8,H*.25,Math.max(W,H)*.7);neb.addColorStop(0,cur.c2+"55");neb.addColorStop(1,"transparent");g.fillStyle=neb;g.fillRect(0,0,W,H);
    const sp=(REDUCED?0:MO.sp)+warp*1.6,cx=W/2,cy=H*.4;
    for(const s of stars){const pz=s.z;s.z-=sp*dt;if(s.z<=.02){s.x=Math.random()*2-1;s.y=Math.random()*2-1;s.z=1}
      const k=Math.max(W,H)*.5,x=cx+s.x/s.z*k*.5,y=cy+s.y/s.z*k*.5,r=Math.max(.4,(1-s.z)*2);
      g.strokeStyle=g.fillStyle=`rgba(255,255,255,${Math.min(1,(.25+(1-s.z)*.75)*MO.star)})`;
      if(warp>.05){const x0=cx+s.x/pz*k*.5,y0=cy+s.y/pz*k*.5;g.lineWidth=r;g.beginPath();g.moveTo(x0,y0);g.lineTo(x,y);g.stroke()}else{g.beginPath();g.arc(x,y,r,0,7);g.fill()}}
    // hành tinh đích
    grow+=(1-grow)*Math.min(1,dt*2);const R=Math.min(W,H)*.28*grow,px=W*.84,py=H*.3;
    g.globalAlpha=.55;
    if(cur.kind==="galaxy"){g.save();g.translate(px,py);g.rotate(-.45+(REDUCED?0:now/40000));const ga=g.createRadialGradient(0,0,0,0,0,R*1.6);ga.addColorStop(0,cur.c1);ga.addColorStop(.25,cur.c2+"cc");ga.addColorStop(1,"transparent");g.scale(1,.42);g.fillStyle=ga;g.beginPath();g.arc(0,0,R*1.6,0,7);g.fill();
      g.strokeStyle=cur.c1;g.lineWidth=R*.07;for(let k=0;k<2;k++){g.beginPath();for(let t=0;t<4.2;t+=.1){const r=R*.12+t*R*.3,a=t+k*Math.PI;t?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.stroke()}g.restore()}
    else if(cur.kind==="star"){const co=g.createRadialGradient(px,py,R*.2,px,py,R*1.5);co.addColorStop(0,cur.c1);co.addColorStop(.45,cur.c2+"aa");co.addColorStop(1,"transparent");g.fillStyle=co;g.beginPath();g.arc(px,py,R*1.5,0,7);g.fill()}
    else if(cur.kind==="moon"){const pp=g.createRadialGradient(px-R*.6,py+R*.5,R*.05,px-R*.5,py+R*.6,R*.6);pp.addColorStop(0,"#c9a2ff");pp.addColorStop(1,"#5b33a8");g.fillStyle=pp;g.beginPath();g.arc(px-R*.55,py+R*.65,R*.45,0,7);g.fill();
      const mg=g.createRadialGradient(px-R*.2,py-R*.3,R*.05,px,py,R*.6);mg.addColorStop(0,cur.c1);mg.addColorStop(1,cur.c2);g.fillStyle=mg;g.beginPath();g.arc(px+R*.2,py-R*.15,R*.6,0,7);g.fill();
      g.fillStyle="rgba(0,0,0,.15)";[[.05,-.3,.12],[.35,0,.08],[.2,-.5,.06],[.4,-.35,.05]].forEach(([x,y,r])=>{g.beginPath();g.arc(px+R*x,py+R*y,R*r,0,7);g.fill()})}
    else{const pg=g.createRadialGradient(px-R*.35,py-R*.35,R*.1,px,py,R);pg.addColorStop(0,cur.c1);pg.addColorStop(1,cur.c2);g.fillStyle=pg;g.beginPath();g.arc(px,py,R*(cur.kind==="bridge"?.8:1),0,7);g.fill();
      if(cur.kind==="planet"){g.strokeStyle=cur.c1;g.lineWidth=R*.06;g.beginPath();g.ellipse(px,py,R*1.6,R*.35,-.25,0,7);g.stroke()}}
    g.globalAlpha=1;
    // tàu nhỏ bay ngang
    fx(dt,now);
    if(!REDUCED)for(const s of ships){s.x+=s.v*slow*dt;if(s.x>1.3)s.x=-.3;if(s.x<-.3)s.x=1.3;const x=s.x*W,y=s.y*H+Math.sin(now/700+s.y*9)*6,z=s.s*10;
      g.fillStyle="#c9d2de";g.beginPath();g.ellipse(x,y,z*1.6,z*.45,0,0,7);g.fill();g.fillStyle="rgba(124,192,245,.8)";g.beginPath();g.ellipse(x,y-z*.3,z*.6,z*.5,0,Math.PI,0);g.fill();
      g.fillStyle=MK==="sad"||MK==="storm"?(Math.floor(now/600)%2?"#ff6f68":"#6b2a2a"):MK==="joy"?FWC[Math.floor(now/180)%FWC.length]:(Math.floor(now/250)%2?"#fff36b":"#7cc0f5");for(let k=-1;k<=1;k++){g.beginPath();g.arc(x+k*z*.9,y+z*.1,z*.13,0,7);g.fill()}}
    warp=Math.max(0,warp-dt*1.4);raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);

  let lines=[],li=0,sayT=0;
  function speak(){if(!lines.length)return;say.style.opacity=0;setTimeout(()=>{say.textContent=lines[li%lines.length];say.style.opacity=1;li++},REDUCED?0:250)}
  function go(id,first){const p=PLANETS.find(x=>x.id===id)||PLANETS[0];cur=p;
    root.querySelectorAll("[data-p]").forEach(b=>b.setAttribute("aria-current",b.dataset.p===id));
    try{localStorage.setItem("m360-ship-p",id)}catch(e){}
    const paint=()=>{$(".dest .pl").innerHTML=planetSVG(p,"d");$(".dest h2").textContent=p.name;$(".dest .ey").textContent=p.lv;$(".dest .hint").textContent=p.hint;putBack();grid.innerHTML=id==="home"?VIEWS.home(S):"";borrow(id);grid.classList.remove("out");host.classList.remove("out");
      $("[data-go]").dataset.sec=p.sec||"";lines=talk(id,S);li=0;speak();main.scrollTop=0};
    if(first||REDUCED){paint();return}warp=1;grow=.15;grid.classList.add("out");host.classList.add("out");setTimeout(paint,380)}
  /* mượn nguyên các khung của giao diện cũ (không sao chép, không cắt): chuyển vào hành tinh, trả về chỗ cũ khi rời đi */
  const SEL={home:["section.hero"],macro:["#vi-mo"],market:["#thi-truong"],sector:["#nganh"],stock:["#co-phieu"]};const moved=[];
  function borrow(id){for(const q of SEL[id]||[]){const el=document.querySelector(".wrap "+q)||document.querySelector(q);if(!el||root.contains(el))continue;const mk=document.createComment("m360-slot");el.before(mk);host.appendChild(el);moved.push([el,mk])}}
  function putBack(){while(moved.length){const [el,mk]=moved.pop();mk.replaceWith(el)}}
  root.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>go(b.dataset.p));
  sayT=setInterval(speak,6000);
  $("[data-old]").onclick=()=>close(true);
  /* nhạc: mặc định bật (trừ khi người xem đã tắt); trình duyệt chỉ cho phát sau một thao tác, nên nếu chưa phát được sẽ bắt đầu ở lần chạm/bấm đầu tiên */
  const mus=Music(MK),mb=$("[data-mus]");let want=true;try{want=localStorage.getItem("m360-music")!=="off"}catch(e){}
  const ui=()=>{const pl=!!(mus&&mus.playing),wait=!!(mus&&mus.on&&!pl);mb.setAttribute("aria-pressed",pl);mb.textContent=pl?"♪ Tắt nhạc":wait?"♪ Chạm để nghe nhạc":"♪ Bật nhạc";mb.classList.toggle("wait",wait)};
  if(!mus)mb.hidden=true;else{mus.onchange=ui;
    /* bấm nút: đang phát thì tắt, chưa phát thì bật (gọi trong chính thao tác bấm để trình duyệt cho phép phát) */
    mb.onclick=()=>{if(mus.playing){want=false;mus.stop()}else{want=true;mus.start()}try{localStorage.setItem("m360-music",want?"on":"off")}catch(e){}ui()};
    /* chạm bất kỳ đâu trong buồng lái cũng mở khóa âm thanh nếu người xem muốn nghe */
    const unlock=e=>{if(e.target.closest&&e.target.closest("[data-mus]"))return;if(want&&!mus.playing&&!document.hidden)mus.start()};
    ["pointerup","touchend","keydown"].forEach(t=>root.addEventListener(t,unlock));
    if(want)mus.start();
    var onVis=()=>{if(document.hidden)mus.stop();else if(want)mus.start()};document.addEventListener("visibilitychange",onVis)}
  ui();
  $("[data-go]").onclick=e=>{const sec=e.currentTarget.dataset.sec;close(true);setTimeout(()=>{const t=sec&&document.getElementById(sec);if(t)t.scrollIntoView({behavior:"smooth"});else scrollTo({top:0,behavior:"smooth"})},60)};
  const onKey=e=>{if(e.target.closest&&e.target.closest("input,textarea"))return;const i=PLANETS.findIndex(p=>p===cur),d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(d)go(PLANETS[(i+d+PLANETS.length)%PLANETS.length].id)};
  addEventListener("keydown",onKey);
  let start="home";try{start=localStorage.getItem("m360-ship-p")||"home"}catch(e){}go(VIEWS[start]?start:"home",true);
  return ()=>{if(mus){mus.kill();document.removeEventListener("visibilitychange",onVis)}putBack();alive=false;cancelAnimationFrame(raf);clearInterval(sayT);removeEventListener("resize",rs);removeEventListener("keydown",onKey)}}
function setPref(v){try{localStorage.setItem("m360-ui",v)}catch(e){}}
function sync(on){const b=document.getElementById("ui-moon"),o=document.getElementById("ui-old");b&&b.setAttribute("aria-pressed",on);o&&o.setAttribute("aria-pressed",!on)}
function close(save){if(STOP){STOP();STOP=null}if(ROOT){ROOT.remove();ROOT=null}document.documentElement.style.overflow="";if(save)setPref("old");sync(false)}
async function open(){if(ROOT)return;setPref("ship");sync(true);
  try{const D=await fetch("data.json",{cache:"no-store"}).then(r=>r.json());if(ROOT)return;STOP=build(D);ROOT=document.getElementById("ship")}
  catch(e){sync(false);alert("Không tải được số liệu cho giao diện buồng lái.")}}
window.M360Ship={open,close};
})();

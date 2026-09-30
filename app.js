const KEY="moneyTrackerV1";
const categories={
  expense:[["food","🍚","อาหาร"],["home","🏠","ห้อง/ไฟ/น้ำ"],["fuel","⛽","น้ำมัน"],["vehicle","🚗","รถ"],["phone","📱","โทรศัพท์/อินเทอร์เน็ต"],["misc","🛒","จิปาถะ"],["fun","🎮","ความบันเทิง"],["other","📦","อื่น ๆ"]],
  income:[["salary","💵","เงินเดือน"],["grab","🛵","Grab / งานเสริม"],["other_income","💰","รายรับอื่น ๆ"]],
  saving:[["saving","💰","เงินออม"]],
  investing:[["investing","📈","ลงทุน"]]
};
const typeNames={income:"รายรับ",expense:"รายจ่าย",saving:"ออม",investing:"ลงทุน"};
let data=JSON.parse(localStorage.getItem(KEY)||'{"transactions":[],"goals":[]}');

const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:0}).format(n||0);
const today=()=>new Date().toISOString().slice(0,10);
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));

function monthName(d=new Date()){return d.toLocaleDateString("th-TH",{month:"long",year:"numeric"})}
function currentMonth(){return today().slice(0,7)}
function inMonth(t,m=currentMonth()){return t.date.startsWith(m)}
function catLabel(id){
  for(const group of Object.values(categories)) for(const c of group) if(c[0]===id)return c[1]+" "+c[2];
  return id;
}
function render(){
  $("monthLabel").textContent=monthName();
  const tx=data.transactions.filter(t=>inMonth(t));
  const sum=type=>tx.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount),0);
  const income=sum("income"), expense=sum("expense"), saving=sum("saving"), investing=sum("investing");
  $("income").textContent=money(income);$("expense").textContent=money(expense);$("saving").textContent=money(saving);$("investing").textContent=money(investing);
  $("balance").textContent=money(income-expense-saving-investing);

  const groups={};tx.filter(t=>t.type==="expense").forEach(t=>groups[t.category]=(groups[t.category]||0)+Number(t.amount));
  $("categoryList").innerHTML=Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([id,n])=>`<div class="category-row"><span class="icon">${catLabel(id).split(" ")[0]}</span><span class="name">${catLabel(id).substring(catLabel(id).indexOf(" ")+1)}</span><span class="amount">${money(n)}</span></div>`).join("")||'<div class="empty">ยังไม่มีค่าใช้จ่ายเดือนนี้</div>';

  $("goalList").innerHTML=data.goals.map((g,i)=>{
    const pct=Math.min(100,(g.current/g.target)*100);
    return `<div class="goal"><div class="goal-head"><b>${esc(g.name)}</b><span>${money(g.current)} / ${money(g.target)}</span></div><div class="progress"><i style="width:${pct}%"></i></div><small>${Math.round(pct)}%</small></div>`;
  }).join("")||'<div class="empty">ยังไม่มีเป้าหมาย</div>';

  $("recentList").innerHTML=data.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(txHtml).join("")||'<div class="empty">ยังไม่มีรายการ</div>';
}
function txHtml(t){
  const sign=t.type==="income"?"+":"-";
  return `<div class="transaction"><span class="icon">${catLabel(t.category).split(" ")[0]}</span><div class="tx-info"><b>${esc(t.note||catLabel(t.category).substring(catLabel(t.category).indexOf(" ")+1))}</b><small>${t.date} · ${typeNames[t.type]}</small></div><span class="tx-amount ${t.type}">${sign}${money(t.amount)}</span></div>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fillCategories(){
  const arr=categories[$("type").value]||[];
  $("category").innerHTML=arr.map(c=>`<option value="${c[0]}">${c[1]} ${c[2]}</option>`).join("");
}
$("addBtn").onclick=()=>{$("date").value=today();fillCategories();$("transactionDialog").showModal()};
$("type").onchange=fillCategories;
$("transactionForm").onsubmit=e=>{
  e.preventDefault();
  data.transactions.push({id:crypto.randomUUID(),amount:Number($("amount").value),type:$("type").value,category:$("category").value,note:$("note").value.trim(),date:$("date").value});
  save();e.target.closest("dialog").close();e.target.reset();render();
};
$("addGoalBtn").onclick=()=>$("goalDialog").showModal();
$("goalForm").onsubmit=e=>{
  e.preventDefault();data.goals.push({id:crypto.randomUUID(),name:$("goalName").value.trim(),target:Number($("goalTarget").value),current:0});save();e.target.closest("dialog").close();e.target.reset();render();
};
function openHistory(){
  const months=[...new Set(data.transactions.map(t=>t.date.slice(0,7)))].sort().reverse();
  $("monthFilter").innerHTML='<option value="all">ทุกเดือน</option>'+months.map(m=>`<option>${m}</option>`).join("");
  drawHistory();$("historyDialog").showModal();
}
function drawHistory(){
  const q=$("search").value.toLowerCase(),m=$("monthFilter").value;
  const arr=data.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(t=>(m==="all"||t.date.startsWith(m))&&(t.note+" "+catLabel(t.category)).toLowerCase().includes(q));
  $("allTransactions").innerHTML=arr.map(txHtml).join("")||'<div class="empty">ไม่พบรายการ</div>';
}
$("historyBtn").onclick=openHistory;$("viewAllBtn").onclick=openHistory;$("closeHistory").onclick=()=>$("historyDialog").close();
$("search").oninput=drawHistory;$("monthFilter").onchange=drawHistory;
$("settingsBtn").onclick=()=>$("settingsDialog").showModal();$("closeSettings").onclick=()=>$("settingsDialog").close();
$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`money-tracker-${today()}.json`;a.click();URL.revokeObjectURL(a.href);
};
$("importFile").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.transactions||!x.goals)throw Error();data=x;save();render();alert("นำเข้าข้อมูลสำเร็จ");}catch{alert("ไฟล์ไม่ถูกต้อง")}};r.readAsText(file);
};
$("clearBtn").onclick=()=>{if(confirm("ลบข้อมูลทั้งหมดจริงหรือไม่? แนะนำ Export สำรองก่อน")){data={transactions:[],goals:[]};save();render();$("settingsDialog").close()}};
render();

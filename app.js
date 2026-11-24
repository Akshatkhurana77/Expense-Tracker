const STORAGE_KEY = "personal-expense-tracker-v1";
const categories = {
  expense: ["Food & Dining","Transport","Shopping","Bills & Utilities","Entertainment","Health","Education","Travel","Groceries","Other"],
  income: ["Salary","Freelance","Business","Gift","Investment","Other"]
};
const icons = {"Food & Dining":"🍜","Transport":"🚕","Shopping":"🛍️","Bills & Utilities":"🧾","Entertainment":"🎬","Health":"💊","Education":"📚","Travel":"✈️","Groceries":"🛒","Salary":"💼","Freelance":"💻","Business":"🏪","Gift":"🎁","Investment":"📈","Other":"💳"};
const $ = id => document.getElementById(id);
let state = loadState();
let deferredInstallPrompt = null;

function loadState(){ try { const v=JSON.parse(localStorage.getItem(STORAGE_KEY)); return v && Array.isArray(v.transactions) ? v : {transactions:[],budget:0}; } catch { return {transactions:[],budget:0}; } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function money(n){ return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n||0); }
function dateToday(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function monthKey(date){ return String(date||"").slice(0,7); }
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function totals(items=state.transactions){return items.reduce((a,t)=>{a[t.type]+=Number(t.amount);return a;},{income:0,expense:0});}
function updateCategoryOptions(){
  const type=document.querySelector('input[name="transactionType"]:checked').value;
  $("categoryInput").innerHTML=categories[type].map(c=>`<option>${escapeHTML(c)}</option>`).join("");
}
function openDialog(tx=null){
  $("transactionForm").reset(); $("transactionId").value=tx?.id||"";
  document.querySelector(`input[name="transactionType"][value="${tx?.type||"expense"}"]`).checked=true;
  updateCategoryOptions();
  $("dialogTitle").textContent=tx?"Edit transaction":"Add transaction";
  $("titleInput").value=tx?.title||""; $("amountInput").value=tx?.amount||"";
  $("dateInput").value=tx?.date||dateToday(); $("categoryInput").value=tx?.category||categories[tx?.type||"expense"][0];
  $("noteInput").value=tx?.note||"";
  $("transactionDialog").showModal(); $("titleInput").focus();
}
function closeDialog(){ $("transactionDialog").close(); }
function render(){
  const t=totals(); $("balanceValue").textContent=money(t.income-t.expense);
  $("incomeValue").textContent=money(t.income); $("expenseValue").textContent=money(t.expense);
  $("year").textContent=new Date().getFullYear();
  $("todayLabel").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
  renderTransactions(); renderBudget(); renderBreakdown();
}
function renderTransactions(){
  const query=$("searchInput").value.toLowerCase().trim(), type=$("typeFilter").value, cat=$("categoryFilter").value;
  const items=[...state.transactions].filter(t=>(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(`${t.title} ${t.category} ${t.note||""}`.toLowerCase().includes(query))).sort((a,b)=>b.date.localeCompare(a.date)||b.created-b.created);
  $("transactionList").innerHTML=items.map(t=>`<div class="transaction">
    <div class="tx-icon">${icons[t.category]||"💳"}</div><div class="tx-info"><div class="tx-title">${escapeHTML(t.title)}</div><div class="tx-meta">${escapeHTML(t.category)} · ${new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}${t.note?" · "+escapeHTML(t.note):""}</div></div>
    <div class="tx-amount ${t.type}">${t.type==="income"?"+":"−"}${money(t.amount)}</div><div class="tx-actions"><button type="button" data-edit="${t.id}" aria-label="Edit ${escapeHTML(t.title)}">✎</button><button type="button" data-delete="${t.id}" aria-label="Delete ${escapeHTML(t.title)}">×</button></div></div>`).join("");
  $("emptyState").style.display=items.length?"none":"block";
  const allCats=[...new Set(state.transactions.map(t=>t.category))].sort();
  const current=$("categoryFilter").value;
  $("categoryFilter").innerHTML='<option value="all">All categories</option>'+allCats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  $("categoryFilter").value=allCats.includes(current)?current:"all";
}
function renderBudget(){
  const month=dateToday().slice(0,7), spent=state.transactions.filter(t=>t.type==="expense"&&monthKey(t.date)===month).reduce((s,t)=>s+Number(t.amount),0);
  $("budgetInput").value=state.budget||"";
  $("budgetSpent").textContent=money(spent)+" spent this month";
  const pct=state.budget>0?Math.round(spent/state.budget*100):0;
  $("budgetPercent").textContent=state.budget>0?`${pct}% of budget`:"No budget";
  $("budgetProgress").style.width=Math.min(pct,100)+"%";
  $("budgetProgress").classList.toggle("over",pct>100);
  $("budgetHint").textContent=state.budget>0?(pct>100?"You are over your monthly budget. Consider reviewing your spending.":`You have ${money(state.budget-spent)} left for this month.`):"Choose a monthly budget to track your spending.";
}
function renderBreakdown(){
  const month=dateToday().slice(0,7), items=state.transactions.filter(t=>t.type==="expense"&&monthKey(t.date)===month);
  const sums={}; items.forEach(t=>sums[t.category]=(sums[t.category]||0)+Number(t.amount));
  const rows=Object.entries(sums).sort((a,b)=>b[1]-a[1]), total=rows.reduce((s,r)=>s+r[1],0);
  $("categoryBreakdown").innerHTML=rows.length?rows.map(([name,value])=>`<div class="breakdown-row"><div class="breakdown-label"><span>${icons[name]||"💳"} ${escapeHTML(name)}</span><strong>${money(value)}</strong></div><div class="mini-track"><div class="mini-fill" style="width:${total?value/total*100:0}%"></div></div></div>`).join(""):'<p class="hint">No expenses recorded this month yet.</p>';
}
function exportCSV(){
  const rows=[["Date","Type","Title","Category","Amount (INR)","Note"],...state.transactions.map(t=>[t.date,t.type,t.title,t.category,t.amount,t.note||""])];
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="expense-tracker-transactions.csv";a.click();URL.revokeObjectURL(url);
}
$("addTopBtn").addEventListener("click",()=>openDialog());
$("closeDialog").addEventListener("click",closeDialog); $("cancelDialog").addEventListener("click",closeDialog);
document.querySelectorAll('input[name="transactionType"]').forEach(r=>r.addEventListener("change",updateCategoryOptions));
$("transactionForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("transactionId").value, type=document.querySelector('input[name="transactionType"]:checked').value;
  const tx={id:id||crypto.randomUUID(),type,title:$("titleInput").value.trim(),amount:Number($("amountInput").value),date:$("dateInput").value,category:$("categoryInput").value,note:$("noteInput").value.trim(),created:Date.now()};
  if(!tx.title||!tx.date||!Number.isFinite(tx.amount)||tx.amount<=0)return;
  if(id)state.transactions=state.transactions.map(x=>x.id===id?{...x,...tx}:x);else state.transactions.push(tx);
  saveState();closeDialog();render();
});
$("transactionList").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit){const tx=state.transactions.find(t=>t.id===edit.dataset.edit);if(tx)openDialog(tx);}
  if(del){const tx=state.transactions.find(t=>t.id===del.dataset.delete);if(tx&&confirm(`Delete "${tx.title}"?`)){state.transactions=state.transactions.filter(t=>t.id!==tx.id);saveState();render();}}
});
["searchInput","typeFilter","categoryFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderTransactions));
$("saveBudgetBtn").addEventListener("click",()=>{const n=Number($("budgetInput").value);if(!Number.isFinite(n)||n<0){alert("Enter a valid budget amount.");return;}state.budget=n;saveState();renderBudget();});
$("exportBtn").addEventListener("click",exportCSV);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").classList.add("hidden");});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("Service worker registration failed",err)));}
render();

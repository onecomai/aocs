export function dashboardHTML(businessName, agents, token = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${businessName || 'AOCS'}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #333; }
.header { background: #111; color: #fff; padding: 20px 30px; }
.header h1 { font-size: 20px; font-weight: 600; }
.header p { font-size: 13px; color: #888; margin-top: 4px; }
.container { max-width: 900px; margin: 0 auto; padding: 20px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
.stat { background: #fff; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.stat .num { font-size: 28px; font-weight: 700; color: #111; }
.stat .label { font-size: 12px; color: #888; margin-top: 4px; }
.chat-box { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; margin-bottom: 24px; }
.chat-header { padding: 14px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px; }
.chat-header select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.messages { height: 350px; overflow-y: auto; padding: 20px; }
.msg { margin-bottom: 12px; max-width: 80%; }
.msg.user { margin-left: auto; }
.msg .bubble { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
.msg.user .bubble { background: #111; color: #fff; border-bottom-right-radius: 4px; }
.msg.bot .bubble { background: #f0f0f0; border-bottom-left-radius: 4px; }
.msg .meta { font-size: 11px; color: #aaa; margin-top: 3px; }
.msg.user .meta { text-align: right; }
.input-row { display: flex; border-top: 1px solid #eee; }
.input-row input { flex: 1; padding: 14px 20px; border: none; font-size: 14px; outline: none; }
.input-row button { padding: 14px 24px; background: #111; color: #fff; border: none; cursor: pointer; font-size: 14px; }
.input-row button:hover { background: #333; }
.log { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.log-header { padding: 14px 20px; border-bottom: 1px solid #eee; font-weight: 600; }
.log-list { max-height: 400px; overflow-y: auto; }
.log-item { padding: 12px 20px; border-bottom: 1px solid #f5f5f5; display: flex; gap: 12px; align-items: flex-start; }
.log-item:last-child { border-bottom: none; }
.log-item .badge { background: #111; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; }
.log-item .text { font-size: 13px; flex: 1; }
.log-item .time { font-size: 11px; color: #aaa; white-space: nowrap; }
.empty { padding: 40px; text-align: center; color: #aaa; }
</style>
</head>
<body>
<div class="header">
  <h1>${businessName || 'AOCS'}</h1>
  <p>Your AI agents are working. This is what they did.</p>
</div>
<div class="container">
  <div class="stats" id="stats"></div>

  <div class="chat-box">
    <div class="chat-header">
      <span>Talk to:</span>
      <select id="agentPicker">${agents.map(a => `<option value="${a}">${a}</option>`).join('')}</select>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-row">
      <input id="input" placeholder="Type a message..." autocomplete="off" />
      <button id="send">Send</button>
    </div>
  </div>

  <div class="log">
    <div class="log-header">Activity Log</div>
    <div class="log-list" id="log"><div class="empty">No activity yet</div></div>
  </div>
</div>

<script>
const TOKEN = "${token}";
const msgBox = document.getElementById('messages');
const input = document.getElementById('input');
const picker = document.getElementById('agentPicker');

function addMsg(text, who, agent) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  div.innerHTML = '<div class="bubble">' + esc(text) + '</div><div class="meta">' + (who === 'bot' ? agent + ' · ' : '') + time + '</div>';
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

async function send() {
  const text = input.value.trim();
  if (!text) return;
  const agent = picker.value;
  input.value = '';
  addMsg(text, 'user');
  try {
    const r = await fetch('/agent/' + agent, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
      body: JSON.stringify({ input: text })
    });
    const d = await r.json();
    addMsg(d.output || d.error, 'bot', agent);
    loadLog();
    loadStats();
  } catch (e) {
    addMsg('Connection error: ' + e.message, 'bot', agent);
  }
}

document.getElementById('send').onclick = send;
input.onkeydown = (e) => { if (e.key === 'Enter') send(); };

async function loadStats() {
  try {
    const r = await fetch('/stats', { headers: { 'Authorization': 'Bearer ' + TOKEN } });
    const s = await r.json();
    document.getElementById('stats').innerHTML =
      '<div class="stat"><div class="num">' + s.today + '</div><div class="label">Today</div></div>' +
      '<div class="stat"><div class="num">' + s.total + '</div><div class="label">Total</div></div>' +
      '<div class="stat"><div class="num">' + Object.keys(s.byAgent).length + '</div><div class="label">Active Agents</div></div>';
  } catch {}
}

async function loadLog() {
  try {
    const r = await fetch('/activity', { headers: { 'Authorization': 'Bearer ' + TOKEN } });
    const items = await r.json();
    const el = document.getElementById('log');
    if (!items.length) { el.innerHTML = '<div class="empty">No activity yet</div>'; return; }
    el.innerHTML = items.slice(0, 30).map(i => {
      const t = new Date(i.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      const preview = (i.output || '').slice(0, 120);
      return '<div class="log-item"><span class="badge">' + esc(i.agent) + '</span><span class="text">' + esc(preview) + '</span><span class="time">' + t + '</span></div>';
    }).join('');
  } catch {}
}

loadStats();
loadLog();
setInterval(loadStats, 15000);
setInterval(loadLog, 15000);
input.focus();
</script>
</body>
</html>`;
}

export function widgetHTML(agentName, token = '') {
  return `<!-- AOCS Chat Widget - paste before </body> -->
<div id="aocs-widget" style="position:fixed;bottom:20px;right:20px;z-index:9999;font-family:-apple-system,system-ui,sans-serif">
<div id="aocs-chat" style="display:none;width:340px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);overflow:hidden">
<div style="background:#111;color:#fff;padding:12px 16px;font-size:14px;font-weight:600">Chat with us</div>
<div id="aocs-msgs" style="height:300px;overflow-y:auto;padding:12px"></div>
<div style="display:flex;border-top:1px solid #eee">
<input id="aocs-in" style="flex:1;padding:10px 14px;border:none;font-size:14px;outline:none" placeholder="Type a message..." />
<button onclick="aocsSend()" style="padding:10px 16px;background:#111;color:#fff;border:none;cursor:pointer;font-size:14px">Send</button>
</div></div>
<button onclick="document.getElementById('aocs-chat').style.display=document.getElementById('aocs-chat').style.display==='none'?'block':'none'" style="width:56px;height:56px;border-radius:28px;background:#111;color:#fff;border:none;cursor:pointer;font-size:24px;box-shadow:0 2px 12px rgba(0,0,0,0.2);margin-top:8px;float:right">&#x1F4AC;</button>
</div>
<script>
function aocsSend(){var i=document.getElementById('aocs-in'),m=document.getElementById('aocs-msgs'),t=i.value.trim();if(!t)return;i.value='';
m.innerHTML+='<div style="text-align:right;margin:6px 0"><span style="background:#111;color:#fff;padding:6px 12px;border-radius:10px;font-size:13px;display:inline-block;max-width:80%">'+t.replace(/</g,'&lt;')+'</span></div>';
m.scrollTop=m.scrollHeight;
fetch('/agent/${agentName || 'receptionist'}',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer ${token}'},body:JSON.stringify({input:t})}).then(r=>r.json()).then(d=>{
m.innerHTML+='<div style="margin:6px 0"><span style="background:#f0f0f0;padding:6px 12px;border-radius:10px;font-size:13px;display:inline-block;max-width:80%">'+(d.output||d.error).replace(/</g,'&lt;')+'</span></div>';
m.scrollTop=m.scrollHeight;}).catch(e=>{m.innerHTML+='<div style="margin:6px 0;color:red;font-size:12px">Error connecting</div>';});}
document.getElementById('aocs-in').onkeydown=function(e){if(e.key==='Enter')aocsSend();}
</script>`;
}

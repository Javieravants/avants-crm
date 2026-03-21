// === Dashboard Agente — Avants Suite ===

// Frases motivacionales
const _FRASES = [
  {txt:'El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el coraje de continuar.', autor:'Winston Churchill'},
  {txt:'La única forma de hacer un gran trabajo es amar lo que haces.', autor:'Steve Jobs'},
  {txt:'No cuentes los días, haz que los días cuenten.', autor:'Muhammad Ali'},
  {txt:'El secreto del éxito es la constancia en el propósito.', autor:'Benjamin Disraeli'},
  {txt:'Cada llamada es una nueva oportunidad. El siguiente sí está ahí fuera.', autor:'Avants Suite'},
  {txt:'El talento gana partidos, pero el trabajo en equipo gana campeonatos.', autor:'Michael Jordan'},
  {txt:'No busques el momento perfecto, toma el momento y hazlo perfecto.', autor:'Avants Suite'},
  {txt:'La perseverancia no es una carrera larga, son muchas carreras cortas una tras otra.', autor:'Walter Elliot'},
];

// GIF Giphy — funciones globales
window.dispararCelebracion = async function(titulo, subtitulo) {
  const overlay = document.getElementById('dash-celebracion-overlay');
  if (!overlay) return _crearOverlayCelebracion(titulo, subtitulo);
  _mostrarCelebracion(overlay, titulo, subtitulo);
};

window.dispararAnimo = async function(mensaje) {
  const overlay = document.getElementById('dash-animo-overlay');
  if (!overlay) return _crearOverlayAnimo(mensaje);
  _mostrarAnimo(overlay, mensaje);
};

async function _fetchGif(tag) {
  try {
    const r = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${encodeURIComponent(tag)}&rating=g`);
    const data = await r.json();
    return data.data?.images?.fixed_height?.url || null;
  } catch { return null; }
}

function _crearOverlayCelebracion(titulo, subtitulo) {
  const ov = document.createElement('div');
  ov.id = 'dash-celebracion-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:2000;opacity:0;transition:opacity .3s;';
  ov.innerHTML = '<div id="dash-cel-content" style="text-align:center;"></div>';
  ov.onclick = (e) => { if (e.target === ov) { ov.style.opacity = '0'; setTimeout(() => ov.remove(), 300); } };
  document.body.appendChild(ov);
  _mostrarCelebracion(ov, titulo, subtitulo);
}

async function _mostrarCelebracion(ov, titulo, subtitulo) {
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.style.opacity = '1');
  const content = ov.querySelector('#dash-cel-content');
  const gifUrl = await _fetchGif('celebration');
  content.innerHTML = `
    ${gifUrl ? `<img src="${gifUrl}" style="width:300px;border-radius:16px;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,.4);" alt="Celebración">` : ''}
    <div style="font-size:24px;font-weight:800;color:#10b981;margin-bottom:8px;font-family:inherit;">${titulo || 'VENTA CERRADA'}</div>
    <div style="font-size:14px;color:#94a3b8;">${subtitulo || ''}</div>
    <div style="margin-top:16px;font-size:12px;color:#475569;">Click para cerrar</div>
  `;
  _lanzarConfetti();
  setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => ov.remove(), 300); }, 6000);
}

function _crearOverlayAnimo(mensaje) {
  const ov = document.createElement('div');
  ov.id = 'dash-animo-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:2000;opacity:0;transition:opacity .3s;';
  ov.innerHTML = '<div id="dash-animo-content" style="text-align:center;"></div>';
  ov.onclick = (e) => { if (e.target === ov) { ov.style.opacity = '0'; setTimeout(() => ov.remove(), 300); } };
  document.body.appendChild(ov);
  _mostrarAnimo(ov, mensaje);
}

async function _mostrarAnimo(ov, mensaje) {
  ov.style.display = 'flex';
  requestAnimationFrame(() => ov.style.opacity = '1');
  const content = ov.querySelector('#dash-animo-content');
  const gifUrl = await _fetchGif('funny motivation');
  content.innerHTML = `
    ${gifUrl ? `<img src="${gifUrl}" style="width:280px;border-radius:16px;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,.4);" alt="Ánimo">` : ''}
    <div style="font-size:18px;font-weight:700;color:#f59e0b;margin-bottom:8px;font-family:inherit;">${mensaje || 'Sigue intentándolo, el siguiente coge seguro'}</div>
    <div style="margin-top:12px;font-size:12px;color:#475569;">Click para cerrar</div>
  `;
  setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => ov.remove(), 300); }, 7000);
}

function _lanzarConfetti() {
  let container = document.getElementById('dash-confetti');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dash-confetti';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2001;';
    document.body.appendChild(container);
  }
  container.innerHTML = '';
  const colores = ['#009DDD','#10b981','#f59e0b','#8b5cf6','#ef4444','#fff','#ff4a6e'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;border-radius:2px;left:${Math.random()*100}%;background:${colores[Math.floor(Math.random()*colores.length)]};animation:confettiFall ${1.5+Math.random()}s ease-in ${Math.random()}s forwards;`;
    container.appendChild(p);
  }
  setTimeout(() => container.remove(), 3500);
}

// Inyectar keyframes de confetti (una sola vez)
if (!document.getElementById('confetti-css')) {
  const st = document.createElement('style'); st.id = 'confetti-css';
  st.textContent = `@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0);opacity:1;}100%{transform:translateY(100vh) rotate(720deg);opacity:0;}}`;
  document.head.appendChild(st);
}

// === MÓDULO DASHBOARD ===
const DashboardModule = {
  data: null,

  async render() {
    const c = document.getElementById('main-content');
    c.style.padding = '0';
    c.style.overflow = 'hidden';

    // Frase motivacional — popup una vez por sesión
    this._showMotivationalPopup();

    // Inyectar CSS del dashboard
    if (!document.getElementById('dash-css')) {
      const st = document.createElement('style'); st.id = 'dash-css';
      st.textContent = this._getStyles();
      document.head.appendChild(st);
    }

    // Cargar datos
    try {
      this.data = await API.get('/dashboard');
    } catch (e) {
      this.data = { user: { nombre: 'Agente', rol: 'agent' }, kpis: {}, ranking: [], agenda: [], ventas_semana: [] };
    }

    this._renderDashboard(c);
  },

  _showMotivationalPopup() {
    const key = 'dash-frase-' + new Date().toISOString().split('T')[0];
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const frase = _FRASES[Math.floor(Math.random() * _FRASES.length)];
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:1500;opacity:0;transition:opacity .4s;';
    ov.innerHTML = `<div style="text-align:center;max-width:500px;padding:40px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);">
      <div style="width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,#009DDD,#0070a8);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 4px 20px rgba(0,157,221,.3);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>
      </div>
      <div style="font-size:20px;font-weight:800;color:#0f172a;line-height:1.5;margin-bottom:12px;font-style:italic;">"${frase.txt}"</div>
      <div style="font-size:13px;color:#94a3b8;">— ${frase.autor}</div>
      <button onclick="this.closest('div[style*=fixed]').style.opacity='0';setTimeout(()=>this.closest('div[style*=fixed]').remove(),400)" style="margin-top:24px;padding:10px 28px;border-radius:10px;border:none;background:#009DDD;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">A por el día</button>
    </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.style.opacity = '1');
  },

  _renderDashboard(c) {
    const d = this.data;
    const user = d.user;
    const kpis = d.kpis;
    const nombre = (user.nombre || '').split(' ')[0];
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
    const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const ini = (n) => (n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const hu = (id) => (id*47)%360;

    c.innerHTML = `<div class="dash-wrap">
      <!-- HERO -->
      <div class="dash-hero">
        <div class="dash-hero-bg"></div>
        <div class="dash-hero-top">
          <div class="dash-hero-left">
            <div class="dash-hero-name">${saludo}, <span>${this._esc(nombre)}</span></div>
            <div class="dash-hero-sub">${hoy} · ${kpis.deals_open || 0} deals activos · ${kpis.tickets_activos || 0} trámites abiertos</div>
          </div>
          <div class="dash-hero-quote" id="dash-frase">
            <div id="dash-frase-txt"></div>
            <div class="dash-hero-quote-author" id="dash-frase-autor"></div>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="dash-kpi-grid">
        <div class="dash-kpi">
          <div class="dash-kpi-glow" style="background:#009DDD;"></div>
          <div class="dash-kpi-label">Deals activos</div>
          <div class="dash-kpi-val" style="color:#009DDD;">${kpis.deals_open || 0}</div>
          <div class="dash-kpi-sub">en pipeline</div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-glow" style="background:#10b981;"></div>
          <div class="dash-kpi-label">Ventas hoy</div>
          <div class="dash-kpi-val" style="color:#10b981;">${kpis.ventas_hoy || 0}</div>
          <div class="dash-kpi-sub">deals cerrados</div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-glow" style="background:#f59e0b;"></div>
          <div class="dash-kpi-label">Tickets activos</div>
          <div class="dash-kpi-val" style="color:#f59e0b;">${kpis.tickets_activos || 0}</div>
          <div class="dash-kpi-sub">pendientes</div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-glow" style="background:#8b5cf6;"></div>
          <div class="dash-kpi-label">Resueltos mes</div>
          <div class="dash-kpi-val" style="color:#8b5cf6;">${kpis.tickets_resueltos || 0}</div>
          <div class="dash-kpi-sub">este mes</div>
        </div>
      </div>

      <!-- GRID INFERIOR -->
      <div class="dash-bottom-grid">
        <!-- AGENDA -->
        <div class="dash-card">
          <div class="dash-card-head">
            <div class="dash-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
              Agenda hoy
            </div>
            <span class="dash-card-badge">${d.agenda.length}</span>
          </div>
          <div class="dash-card-body" id="dash-agenda">
            ${d.agenda.length === 0 ? '<div class="dash-empty">Sin actividades programadas hoy</div>' :
              d.agenda.map(a => {
                const hora = (a.texto.match(/(\d{2}:\d{2})/) || [''])[0] || '';
                const tipo = a.texto.includes('Cierre') ? 'cierre' : a.texto.includes('Seguimiento') ? 'seguimiento' : 'llamada';
                return `<div class="dash-ag-item" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${a.persona_id}),300)" style="cursor:pointer;">
                  <div class="dash-ag-hora">${hora || '--:--'}</div>
                  <div class="dash-ag-av" style="background:hsl(${hu(a.persona_id)},55%,55%)">${ini(a.persona_nombre)}</div>
                  <div class="dash-ag-info"><div class="dash-ag-name">${this._esc(a.persona_nombre)}</div></div>
                  <span class="dash-ag-tag t-${tipo}">${tipo}</span>
                </div>`;
              }).join('')}
          </div>
        </div>

        <!-- RANKING -->
        <div class="dash-card">
          <div class="dash-card-head">
            <div class="dash-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M4 20V14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6"/><path d="M10 20V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v11"/><path d="M16 20V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v15"/></svg>
              Ranking equipo
            </div>
            <span style="font-size:10px;color:#94a3b8;">Este mes</span>
          </div>
          <div class="dash-card-body">
            ${d.ranking.length === 0 ? '<div class="dash-empty">Sin datos de ranking</div>' :
              d.ranking.map((r, i) => {
                const isMe = r.id === user.id;
                const maxVentas = d.ranking[0]?.ventas || 1;
                const pct = Math.round((r.ventas / maxVentas) * 100);
                return `<div class="dash-rank-item ${isMe ? 'me' : ''}">
                  <div class="dash-rank-pos" style="color:${i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#cd7c3a':'#475569'}">${i+1}</div>
                  <div class="dash-rank-av" style="background:hsl(${hu(r.id)},55%,55%)">${ini(r.nombre)}</div>
                  <div class="dash-rank-info">
                    <div class="dash-rank-name">${this._esc(r.nombre)}${isMe ? ' <span style="color:#009DDD;font-size:10px;">(tú)</span>' : ''}</div>
                    <div class="dash-rank-bar-wrap"><div class="dash-rank-bar" style="width:${pct}%;background:${i===0?'#10b981':isMe?'#009DDD':'#475569'};"></div></div>
                  </div>
                  <div class="dash-rank-pts" style="color:${i===0?'#10b981':isMe?'#009DDD':'#94a3b8'};">${r.ventas}</div>
                </div>`;
              }).join('')}
          </div>
        </div>

        <!-- GRÁFICO SEMANA -->
        <div class="dash-card">
          <div class="dash-card-head">
            <div class="dash-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M4 20V14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6"/><path d="M10 20V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v11"/><path d="M16 20V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v15"/></svg>
              Mi semana
            </div>
          </div>
          <div class="dash-card-body">
            <div class="dash-chart-wrap" id="dash-chart"></div>
            <!-- Botones demo celebración/ánimo -->
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button onclick="window.dispararCelebracion('VENTA CERRADA','ADESLAS Plena Total · 149€/mes')" class="dash-demo-btn" style="border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.08);color:#10b981;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
                Simular venta
              </button>
              <button onclick="window.dispararAnimo('Llevas 5 sin respuesta. ¡El siguiente coge seguro!')" class="dash-demo-btn" style="border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.08);color:#f59e0b;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Simular ánimo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    // Frase del día
    const frase = _FRASES[Math.floor(Math.random() * _FRASES.length)];
    const fraseEl = document.getElementById('dash-frase-txt');
    const autorEl = document.getElementById('dash-frase-autor');
    if (fraseEl) fraseEl.textContent = `"${frase.txt}"`;
    if (autorEl) autorEl.textContent = `— ${frase.autor}`;

    // Gráfico de barras
    this._renderChart();
  },

  _renderChart() {
    const chart = document.getElementById('dash-chart');
    if (!chart) return;
    const dias = ['L', 'M', 'X', 'J', 'V'];
    const ventasMap = {};
    (this.data.ventas_semana || []).forEach(v => {
      const d = new Date(v.dia).getDay(); // 0=dom, 1=lun...
      ventasMap[d] = parseInt(v.ventas);
    });
    const max = Math.max(1, ...Object.values(ventasMap));
    const colors = ['#009DDD', '#10b981', '#009DDD', '#10b981', '#f59e0b'];

    chart.innerHTML = dias.map((dia, i) => {
      const dayIdx = i + 1; // lun=1, mar=2...
      const val = ventasMap[dayIdx] || 0;
      const pct = Math.max(5, (val / max) * 100);
      return `<div class="dash-chart-group">
        <div class="dash-chart-val">${val}</div>
        <div class="dash-chart-bar" style="height:${pct}%;background:linear-gradient(180deg,${colors[i]},${colors[i]}40);"></div>
        <div class="dash-chart-label">${dia}</div>
      </div>`;
    }).join('');
  },

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  _getStyles() {
    return `
      .dash-wrap{display:flex;flex-direction:column;height:calc(100vh - 60px);overflow-y:auto;background:#f4f6f9;color:#0f172a;font-size:14px;}

      /* HERO */
      .dash-hero{padding:28px 28px 20px;position:relative;overflow:hidden;flex-shrink:0;}
      .dash-hero-bg{position:absolute;top:-60px;right:-80px;width:400px;height:400px;background:radial-gradient(circle,rgba(0,157,221,.08) 0%,transparent 70%);pointer-events:none;}
      .dash-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;}
      .dash-hero-left{flex:1;}
      .dash-hero-name{font-size:26px;font-weight:800;color:#0f172a;margin-bottom:4px;}
      .dash-hero-name span{color:#009DDD;}
      .dash-hero-sub{font-size:13px;color:#94a3b8;}
      .dash-hero-quote{background:#fff;border:1px solid #e8edf2;border-radius:10px;padding:10px 14px;max-width:340px;font-size:12px;color:#475569;font-style:italic;line-height:1.5;border-left:3px solid #009DDD;box-shadow:0 1px 3px rgba(0,0,0,.05);}
      .dash-hero-quote-author{font-size:10px;color:#94a3b8;margin-top:4px;font-style:normal;}

      /* KPIs */
      .dash-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 28px 20px;flex-shrink:0;}
      .dash-kpi{background:#fff;border:1px solid #e8edf2;border-radius:14px;padding:16px;position:relative;overflow:hidden;transition:box-shadow .15s;box-shadow:0 1px 3px rgba(0,0,0,.05);}
      .dash-kpi:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);}
      .dash-kpi-glow{position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;opacity:.1;}
      .dash-kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:10px;}
      .dash-kpi-val{font-size:32px;font-weight:800;line-height:1;margin-bottom:4px;}
      .dash-kpi-sub{font-size:11px;color:#94a3b8;}

      /* GRID INFERIOR */
      .dash-bottom-grid{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:14px;padding:0 28px 28px;flex:1;min-height:0;}

      /* CARD */
      .dash-card{background:#fff;border:1px solid #e8edf2;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 3px rgba(0,0,0,.05);}
      .dash-card-head{padding:14px 16px;border-bottom:1px solid #e8edf2;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
      .dash-card-title{font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;display:flex;align-items:center;gap:6px;}
      .dash-card-badge{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;background:rgba(0,157,221,.1);color:#009DDD;}
      .dash-card-body{padding:12px 16px;flex:1;overflow-y:auto;}
      .dash-empty{text-align:center;padding:24px;color:#94a3b8;font-size:13px;}

      /* AGENDA */
      .dash-ag-item{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid #e8edf2;}
      .dash-ag-item:last-child{border-bottom:none;}
      .dash-ag-hora{font-size:11px;font-weight:700;min-width:36px;flex-shrink:0;color:#475569;}
      .dash-ag-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:white;flex-shrink:0;}
      .dash-ag-info{flex:1;min-width:0;}
      .dash-ag-name{font-size:11px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .dash-ag-tag{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;flex-shrink:0;}
      .t-cierre{background:rgba(16,185,129,.1);color:#10b981;}
      .t-llamada{background:rgba(0,157,221,.1);color:#009DDD;}
      .t-seguimiento{background:rgba(245,158,11,.1);color:#f59e0b;}
      .t-vencida{background:rgba(239,68,68,.1);color:#ef4444;}

      /* RANKING */
      .dash-rank-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e8edf2;}
      .dash-rank-item:last-child{border-bottom:none;}
      .dash-rank-item.me{background:rgba(0,157,221,.05);margin:0 -16px;padding:8px 16px;border-radius:8px;}
      .dash-rank-pos{font-size:14px;font-weight:800;min-width:24px;text-align:center;flex-shrink:0;}
      .dash-rank-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white;flex-shrink:0;}
      .dash-rank-info{flex:1;min-width:0;}
      .dash-rank-name{font-size:12px;font-weight:600;color:#0f172a;}
      .dash-rank-bar-wrap{height:4px;background:#e8edf2;border-radius:2px;margin-top:4px;}
      .dash-rank-bar{height:100%;border-radius:2px;transition:width .8s ease;}
      .dash-rank-pts{font-size:12px;font-weight:800;flex-shrink:0;}

      /* GRÁFICO */
      .dash-chart-wrap{display:flex;align-items:flex-end;gap:8px;height:120px;padding:8px 0;}
      .dash-chart-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
      .dash-chart-bar{width:100%;border-radius:4px 4px 0 0;min-height:4px;transition:height .6s ease;}
      .dash-chart-val{font-size:11px;font-weight:700;color:#475569;}
      .dash-chart-label{font-size:10px;color:#94a3b8;font-weight:600;}

      /* DEMO BTNS */
      .dash-demo-btn{flex:1;padding:8px;border-radius:8px;border:1px solid;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;background:#fff;}

      /* RESPONSIVE */
      @media(max-width:1024px){.dash-kpi-grid{grid-template-columns:repeat(2,1fr);}.dash-bottom-grid{grid-template-columns:1fr;}}
    `;
  },
};

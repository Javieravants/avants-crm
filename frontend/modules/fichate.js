// === Fichate v2.0 — Módulo nativo CRM ===
// Port fiel del original index.html de IONOS
// Usa tablas ft_* en PostgreSQL, auth JWT del CRM

const FichateModule = {
  // Estado (equivalente a S del original)
  view: 'clock', emps: [], recs: [], reqs: [], docs: [], hols: [], shifts: [],
  dash: null, appCreds: [], selEmp: null, ftUser: null, clockTimer: null,

  // Constantes del original
  AT: {vacation:{l:'Vacaciones',c:'#6366f1'},medical_full:{l:'Baja Médica',c:'#ef4444'},medical_hours:{l:'Visita Médica',c:'#f59e0b',p:1},personal:{l:'Asunto Personal',c:'#8b5cf6'},maternity:{l:'Maternidad/Pat.',c:'#14b8a6'},training:{l:'Formación',c:'#3b82f6'},other:{l:'Otro',c:'#64748b'}},
  SM: {pending:{l:'Pendiente',c:'#f59e0b',b:'#fffbeb'},approved:{l:'Aprobada',c:'#22c55e',b:'#f0fdf4'},rejected:{l:'Rechazada',c:'#ef4444',b:'#fef2f2'}},
  RR: ["Coincidencia con otros permisos","Necesidades del servicio","Documentación incompleta","Campaña comercial","Límite de ausencias","Otro motivo"],
  NP: [{id:'clock',l:'Fichaje',i:'⏱️'},{id:'requests',l:'Ausencias',i:'📅'},{id:'documents',l:'Documentos',i:'📄'},{id:'credentials',l:'Credenciales',i:'🔑'}],
  NC: [{id:'dashboard',l:'Panel',i:'📊'},{id:'employees',l:'Empleados',i:'👥'},{id:'records',l:'Registros',i:'📋'},{id:'payroll',l:'Nóminas',i:'💰'},{id:'reports',l:'Informes',i:'📈'},{id:'settings',l:'Ajustes',i:'⚙️'}],

  // Helpers (portados del original)
  isA() {
    // Si hay ftUser, usar su role (ya sobreescrito con CRM rol)
    if (this.ftUser) return this.ftUser.role === 'admin' || this.ftUser.role === 'supervisor';
    // Fallback: usar el rol del CRM directamente
    const u = Auth.getUser();
    return u && (u.rol === 'admin' || u.rol === 'supervisor');
  },
  fD(d) { return d ? new Date(d+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'; },
  fT(d) { return d ? new Date(d).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—'; },
  dH(a,b) { return a&&b ? ((new Date(b)-new Date(a))/36e5) : 0; },
  hu(id) { return (id*47)%360; },
  ini(n) { return (n||'?').split(' ').map(w=>w[0]).slice(0,2).join(''); },
  av(n,id,s=36,fs=13) { return `<div style="width:${s}px;height:${s}px;border-radius:50%;background:linear-gradient(135deg,hsl(${this.hu(id)},55%,60%),hsl(${this.hu(id)+30},50%,50%));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${fs}px;flex-shrink:0">${this.ini(n)}</div>`; },
  bg(l,c,b) { return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:12.5px;font-weight:600;color:${c};background:${b||c+'15'}"><span style="width:7px;height:7px;border-radius:50%;background:${c};flex-shrink:0"></span>${l}</span>`; },
  rBg(r) { return r==='admin'?this.bg('Admin','#8b5cf6','#f5f3ff'):r==='supervisor'?this.bg('Supervisor','#6366f1','#eef2ff'):this.bg('Agente','#64748b','#f1f5f9'); },
  sBg(a) { return a==1?this.bg('Activo','#22c55e','#f0fdf4'):this.bg('Inactivo','#ef4444','#fef2f2'); },
  esc(s) { const d=document.createElement('div');d.textContent=s||'';return d.innerHTML; },

  // API helper (replica api() del original pero usa JWT del CRM)
  async api(action, o={}) {
    const {method='GET',body,params={},isForm=false}=o;
    let u=`/api/fichate/${action}`;
    const qp=new URLSearchParams(params);
    if(qp.toString())u+='?'+qp.toString();
    const h={'Authorization':'Bearer '+API.getToken()};
    if(!isForm)h['Content-Type']='application/json';
    const f={method,headers:h};
    if(body)f.body=isForm?body:JSON.stringify(body);
    const r=await fetch(u,f);
    if(action==='report_csv'||action==='document_download')return r;
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Error');
    return d;
  },

  // ══════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════
  async render() {
    if(this.clockTimer){clearInterval(this.clockTimer);this.clockTimer=null;}
    const c=document.getElementById('main-content');

    // Inyectar estilos
    if(!document.getElementById('ft-css')){
      const st=document.createElement('style');st.id='ft-css';
      st.textContent=`
        #ft-app{display:flex;height:calc(100vh - 0px);margin:-24px;overflow:hidden;font-family:'Inter',system-ui,sans-serif}
        .ft-sb{width:260px;background:#fff;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden}
        .ft-sb-n{flex:1;padding:8px 12px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
        .ft-nb{display:flex;align-items:center;gap:12px;padding:10px 14px;border:none;border-radius:10px;cursor:pointer;font-size:14.5px;font-weight:500;background:transparent;color:#6b7280;transition:all .15s;text-align:left;font-family:inherit}
        .ft-nb:hover{background:#f5f5f5;color:#1a1a2e}
        .ft-nb.a{background:#fff0f3;color:#ff4a6e;font-weight:600}
        .ft-nb-b{margin-left:auto;background:#ff4a6e;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;min-width:18px;text-align:center}
        .ft-mn{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#fafafa}
        .ft-tp{height:64px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;padding:0 32px;flex-shrink:0}
        .ft-tp h1{font-size:22px;font-weight:800;letter-spacing:-.3px}
        .ft-ct{flex:1;overflow:auto;padding:28px 32px}
        .ft-cd{background:#fff;border-radius:16px;border:1px solid #e5e7eb}
        .ft-cd-p{padding:24px}
        .ft-cd-h{padding:18px 24px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center}
        .ft-cd-h span{font-weight:700;font-size:16px}
        .ft-sg{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
        .ft-st{padding:24px}
        .ft-st-l{font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
        .ft-st-v{font-size:32px;font-weight:900;letter-spacing:-1px}
        .ft-st-s{font-size:13px;color:#9ca3af;margin-top:6px;font-weight:500}
        .ft-btn{padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:14px;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .12s}
        .ft-btn:hover{opacity:.9}
        .ft-bp{background:#ff4a6e;color:#fff}.ft-bg2{background:#22c55e;color:#fff}.ft-br{background:#ef4444;color:#fff}
        .ft-bo{border:1px solid #e5e7eb;background:#fff;color:#6b7280}.ft-bs{padding:6px 12px;font-size:12.5px;border-radius:8px}
        .ft-inp{width:100%;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;outline:none;background:#fff;color:#1a1a2e;font-size:14px;font-family:inherit}
        .ft-inp:focus{border-color:#ff4a6e;box-shadow:0 0 0 3px rgba(255,74,110,.08)}
        .ft-fg{margin-bottom:12px}
        .ft-fg label{display:block;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .ft-tbl{width:100%;border-collapse:collapse}
        .ft-tbl thead tr{background:#fafafa}
        .ft-tbl th{padding:14px 20px;text-align:left;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #e5e7eb}
        .ft-tbl td{padding:16px 20px;font-size:14.5px;border-bottom:1px solid #f5f5f5}
        .ft-tbl tbody tr:hover{background:#fafafa}
        .ft-mo{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
        .ft-mo-c{background:#fff;border-radius:18px;width:94%;max-width:540px;max-height:88vh;overflow:auto;box-shadow:0 24px 64px rgba(0,0,0,.12)}
        .ft-mo-h{padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#fff;z-index:1;border-radius:18px 18px 0 0}
        .ft-mo-h h3{font-size:18px;font-weight:800}
        .ft-mo-b{padding:24px}
        .ft-g2{display:grid;grid-template-columns:1.15fr 1fr;gap:20px}
        .ft-vb{width:60px;height:6px;border-radius:3px;background:#f3f4f6;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:8px}
        .ft-vb-f{height:100%;border-radius:3px}
        .ft-tg{padding:14px 18px;border-radius:10px;font-size:14px;line-height:1.6}
        .ft-drop{text-align:center;padding:40px;border:2px dashed rgba(255,74,110,.25);border-radius:16px;background:rgba(255,240,243,.3)}
        .ft-empty{padding:40px;text-align:center;color:#9ca3af;font-size:15px}
        .ft-sb-section{padding:6px 16px;margin-top:10px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px}
        .ft-sb-u{padding:18px;border-top:1px solid #f0f0f0;display:flex;align-items:center;gap:12px}
        @media(max-width:768px){.ft-sb{width:68px}.ft-nb>span:not(.ft-nb-b),.ft-sb-u>div,.ft-sb-section{display:none}.ft-sg{grid-template-columns:repeat(2,1fr)}.ft-g2{grid-template-columns:1fr}.ft-tp{padding:0 16px}.ft-tp h1{font-size:18px}.ft-ct{padding:16px}}
      `;
      document.head.appendChild(st);
    }

    // Cargar datos iniciales
    const crmUser=Auth.getUser();
    try {
      const [eR,hR,shR]=await Promise.all([this.api('employees'),this.api('holidays',{params:{year:new Date().getFullYear()}}),this.api('shifts')]);
      this.emps=eR.employees||[];this.hols=hR.holidays||[];this.shifts=shR.shifts||[];
    } catch(e){console.error('Error cargando datos Fichate:',e)}

    // Identificar ft_user del CRM user — el rol SIEMPRE viene del CRM
    this.ftUser=this.emps.find(e=>e.email?.toLowerCase()===crmUser.email?.toLowerCase())||null;
    if(this.ftUser){
      this.ftUser.role=crmUser.rol||'agent';
    } else {
      // Fallback: crear un ftUser virtual con datos del CRM
      this.ftUser={id:0,name:crmUser.nombre,email:crmUser.email,role:crmUser.rol||'agent',company_id:1,is_active:1,vacation_days:22,used_vacation_days:0};
      console.warn('Fichate: usuario CRM no encontrado en ft_users, usando fallback con rol:', crmUser.rol);
    }

    console.log('Fichate: ftUser =', this.ftUser?.name, 'role =', this.ftUser?.role, 'isA =', this.isA());

    if(this.isA()){try{this.dash=await this.api('dashboard')}catch(e){console.error('Error dashboard:',e)}}
    try{this.reqs=(await this.api('requests')).requests||[]}catch(e){}

    this.renderApp(c);
  },

  renderApp(c) {
    const adm=this.isA();
    const pc=this.reqs.filter(r=>r.status==='pending').length;
    const allNav=[...this.NP,...(adm?this.NC:[])];
    const title=this.selEmp?'Perfil de Empleado':(allNav.find(n=>n.id===this.view)?.l||'Panel');
    const u=this.ftUser||{name:'Usuario',id:0,role:'agent'};

    c.innerHTML=`<div id="ft-app">
      <aside class="ft-sb">
        <div style="padding:24px 22px;display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:#ff4a6e;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff">F</div>
          <div><div style="color:#1a1a2e;font-weight:800;font-size:18px;letter-spacing:-.3px">Fichate</div><div style="color:#9ca3af;font-size:11px;font-weight:500">Control Horario</div></div>
        </div>
        <nav class="ft-sb-n">
          <div class="ft-sb-section">Tú</div>
          ${this.NP.map(n=>`<button class="ft-nb ${this.view===n.id?'a':''}" onclick="FichateModule.go('${n.id}')">${n.i} <span>${n.l}</span>${n.id==='requests'&&pc>0?`<span class="ft-nb-b">${pc}</span>`:''}</button>`).join('')}
          ${adm?`<div class="ft-sb-section" style="margin-top:16px">Tu Empresa</div>${this.NC.map(n=>`<button class="ft-nb ${this.view===n.id?'a':''}" onclick="FichateModule.go('${n.id}')">${n.i} <span>${n.l}</span></button>`).join('')}`:''}
        </nav>
        <div class="ft-sb-u">${this.av(u.name,u.id,38,13)}<div><div style="font-size:14px;font-weight:600;color:#1a1a2e">${(u.name||'').split(' ').slice(0,2).join(' ')}</div><div style="font-size:11.5px;color:#9ca3af">${u.role==='admin'?'Administrador':u.role==='supervisor'?'Supervisor':'Agente'}</div></div></div>
      </aside>
      <div class="ft-mn">
        <header class="ft-tp">
          <div style="display:flex;align-items:center;gap:12px">
            <h1>${title}</h1>
            ${this.selEmp?`<button class="ft-btn ft-bo ft-bs" onclick="FichateModule.selEmp=null;FichateModule.renderApp(document.getElementById('main-content'))">← Volver</button>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="padding:6px 14px;border-radius:8px;background:#f0fdf4;color:#22c55e;font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e"></span>${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'short'})}</div>
          </div>
        </header>
        <main class="ft-ct" id="ft-ct">${this.selEmp?this.profH():this.viewH()}</main>
        <footer style="text-align:center;padding:14px 0;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6">Avants SL · RD-Ley 8/2019 · Fichate v2.0</footer>
      </div>
    </div>`;

    // Auto-load data for current view
    if(this.view==='clock')setTimeout(()=>this.loadClk(),100);
    // Start clock interval
    this.clockTimer=setInterval(()=>{const el=document.getElementById('ft-lc');if(el)el.textContent=new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})},1000);
  },

  go(v) {
    this.view=v;this.selEmp=null;
    this.renderApp(document.getElementById('main-content'));
    if(v==='records')this.loadRecs(new Date().toISOString().slice(0,7));
    if(v==='requests')this.loadReqs();
    if(v==='documents')this.loadDocs();
    if(v==='dashboard'&&this.isA())this.render();
    if(v==='employees')this.render();
    if(v==='credentials')this.loadCreds();
    if(v==='payroll')this.loadDocs();
  },

  viewH() {
    switch(this.view){
      case 'dashboard':return this.dashH();case 'clock':return this.clkH();
      case 'employees':return this.empH();case 'records':return this.recH();
      case 'requests':return this.reqH();case 'documents':return this.docH();
      case 'payroll':return this.payH();case 'credentials':return this.credH();
      case 'reports':return this.repH();case 'settings':return this.setH();
      default:return '<div class="ft-empty">En desarrollo</div>';
    }
  },

  // Data loaders
  async loadRecs(m){try{this.recs=(await this.api('records',{params:{month:m}})).records||[];this.renderApp(document.getElementById('main-content'))}catch(e){}},
  async loadReqs(st){try{const p=st&&st!=='all'?{status:st}:{};this.reqs=(await this.api('requests',{params:p})).requests||[];this.renderApp(document.getElementById('main-content'))}catch(e){}},
  async loadDocs(){try{this.docs=(await this.api('documents')).documents||[];this.renderApp(document.getElementById('main-content'))}catch(e){}},
  async loadCreds(){try{this.appCreds=(await this.api('app_credentials')).credentials||[];this.renderApp(document.getElementById('main-content'))}catch(e){}},

  async loadClk(){
    try{
      const d=await this.api('clock');
      const el=document.getElementById('ft-trecs');
      const stat=document.getElementById('ft-cstat');
      const btnIn=document.getElementById('ft-cbIn');
      const btnOut=document.getElementById('ft-cbOut');
      if(!el)return;
      const clocked=d.is_clocked_in;
      if(stat){
        if(clocked){const rec=d.records?.find(r=>!r.clock_out);stat.innerHTML='🟢 Trabajando desde '+this.fT(rec?.clock_in)}
        else if(d.records?.length>0){const last=d.records[0];const hrs=this.dH(last.clock_in,last.clock_out).toFixed(1);stat.innerHTML='⚪ Jornada finalizada ('+hrs+'h)'}
        else{stat.innerHTML='⚪ Sin fichar hoy'}
      }
      if(btnIn){btnIn.style.opacity=clocked?'0.4':'1';btnIn.style.pointerEvents=clocked?'none':'auto'}
      if(btnOut){btnOut.style.opacity=clocked?'1':'0.4';btnOut.style.pointerEvents=clocked?'auto':'none'}
      if(!d.records||d.records.length===0){el.innerHTML='<div class="ft-empty" style="padding:12px">Sin fichajes hoy</div>';return}
      el.innerHTML=d.records.map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f5f5f5"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:13px;background:#f0fdf4;color:#22c55e;padding:3px 8px;border-radius:6px;font-weight:600">▶ ${this.fT(r.clock_in)}</span>${r.clock_out?`<span style="font-size:13px;background:#fef2f2;color:#ef4444;padding:3px 8px;border-radius:6px;font-weight:600">⏹ ${this.fT(r.clock_out)}</span>`:'<span style="font-size:13px;background:#f0fdf4;color:#22c55e;padding:3px 8px;border-radius:6px;font-weight:600">En curso...</span>'}</div><span style="font-size:14px;color:#6b7280;font-weight:700">${r.clock_out?this.dH(r.clock_in,r.clock_out).toFixed(2)+'h':''}</span></div>`).join('');
    }catch(e){}
  },

  async doClock(action){
    try{
      const d=await this.api('clock',{method:'POST',body:{action}});
      const m=d.action==='clock_in'?`<div class="ft-tg" style="background:#f0fdf4;color:#22c55e">✅ Entrada registrada: ${this.fT(d.time)}</div>`:`<div class="ft-tg" style="background:#fff0f3;color:#ff4a6e">✅ Salida registrada: ${this.fT(d.time)}</div>`;
      document.getElementById('ft-cmsg').innerHTML=m;
      this.loadClk();
    }catch(e){document.getElementById('ft-cmsg').innerHTML=`<div class="ft-tg" style="background:#fef2f2;color:#ef4444">${e.message}</div>`}
  },

  // ══════════════════════════════════════
  // VISTA: DASHBOARD
  // ══════════════════════════════════════
  dashH(){
    const d=this.dash;if(!d)return '<div class="ft-empty">Cargando panel...</div>';
    const activos=this.emps.filter(e=>e.is_active==1);
    const pctFichado=d.active_employees>0?Math.round((d.clocked_in/d.active_employees)*100):0;
    const avgH=d.clocked_in>0?(d.today_hours/d.clocked_in).toFixed(1):'0';
    const wa=d.weekly_attendance||[];
    const wMax=Math.max(...wa.map(w=>w.count),1);
    const dias=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const hoy=new Date();

    return `
    <div style="margin-bottom:24px"><div style="font-size:26px;font-weight:800;margin-bottom:4px">Buenos días, ${(this.ftUser?.name||'').split(' ')[0]} 👋</div><div style="font-size:15px;color:#6b7280">${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · ${activos.length} empleados activos</div></div>

    <div class="ft-sg">
      <div class="ft-cd ft-st"><div class="ft-st-l">Fichados Hoy</div><div style="display:flex;align-items:baseline;gap:8px"><div class="ft-st-v" style="color:#22c55e">${d.clocked_in}</div><span style="font-size:14px;color:#9ca3af;font-weight:500">/ ${d.active_employees}</span></div><div style="margin-top:10px;height:6px;border-radius:3px;background:#f3f4f6;overflow:hidden"><div style="height:100%;border-radius:3px;background:#22c55e;width:${pctFichado}%"></div></div><div class="ft-st-s">${pctFichado}% del equipo</div></div>
      <div class="ft-cd ft-st"><div class="ft-st-l">Horas Hoy</div><div class="ft-st-v" style="color:#ff4a6e">${d.today_hours}h</div><div class="ft-st-s">Media: ${avgH}h por persona</div></div>
      <div class="ft-cd ft-st"><div class="ft-st-l">Solicitudes</div><div class="ft-st-v" style="color:${d.pending_requests>0?'#f59e0b':'#9ca3af'}">${d.pending_requests}</div><div class="ft-st-s">${d.pending_requests>0?'pendientes de aprobar':'todo al día ✓'}</div></div>
      <div class="ft-cd ft-st"><div class="ft-st-l">Vacaciones usadas</div><div class="ft-st-v" style="color:#8b5cf6">${activos.reduce((s,e)=>s+(e.used_vacation_days||0),0)}</div><div class="ft-st-s">de ${activos.reduce((s,e)=>s+(e.vacation_days||22),0)} totales</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div class="ft-cd ft-cd-p"><div style="font-weight:700;font-size:16px;margin-bottom:16px">Asistencia semanal</div><div style="display:flex;align-items:flex-end;gap:8px;height:120px">${wa.map(w=>{const h=Math.max(8,Math.round((w.count/wMax)*100));const d2=new Date(w.date+'T12:00:00');const dn=dias[d2.getDay()];const isToday=w.date===hoy.toISOString().slice(0,10);return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:13px;font-weight:700;color:${isToday?'#ff4a6e':'#6b7280'}">${w.count}</div><div style="width:100%;height:${h}px;border-radius:6px;background:${isToday?'#ff4a6e':'#f3f4f6'}"></div><div style="font-size:11px;font-weight:${isToday?'700':'500'};color:${isToday?'#ff4a6e':'#9ca3af'}">${dn}</div></div>`}).join('')}</div></div>

      <div class="ft-cd ft-cd-p"><div style="font-weight:700;font-size:16px;margin-bottom:12px">Equipo ahora</div><div style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto">${activos.slice(0,12).map(e=>{const rec=d.today_records.find(r=>r.employee_name===e.name&&!r.clock_out);return`<div style="display:flex;align-items:center;gap:10px;padding:6px 0"><div style="width:8px;height:8px;border-radius:50%;background:${rec?'#22c55e':'#e5e7eb'}"></div>${this.av(e.name,e.id,30,10)}<span style="flex:1;font-size:14px;font-weight:500">${(e.name||'').split(' ').slice(0,2).join(' ')}</span><span style="font-size:12px;color:${rec?'#22c55e':'#9ca3af'};font-weight:600">${rec?'Trabajando':'Ausente'}</span></div>`}).join('')}</div></div>
    </div>

    <div class="ft-g2">
      <div class="ft-cd" style="padding:0"><div class="ft-cd-h"><span>Actividad de Hoy</span><button class="ft-btn ft-bo ft-bs" onclick="FichateModule.go('records')">Ver todo →</button></div>${d.today_records.length===0?'<div class="ft-empty">Sin fichajes hoy</div>':d.today_records.slice(0,8).map(r=>`<div style="display:flex;align-items:center;gap:12px;padding:14px 24px;border-bottom:1px solid #f5f5f5"><div style="width:8px;height:8px;border-radius:50%;background:${r.clock_out?'#9ca3af':'#22c55e'}"></div>${this.av(r.employee_name,r.user_id,32,11)}<span style="flex:1;font-weight:500;font-size:14.5px">${r.employee_name}</span><span style="font-size:14px;color:#6b7280;font-weight:600">${this.fT(r.clock_in)}</span>${r.clock_out?`<span style="font-size:13px;color:#6b7280">${this.fT(r.clock_out)}</span>`:''}${r.clock_out?this.bg('Completado','#9ca3af','#f3f4f6'):this.bg('Trabajando','#22c55e','#f0fdf4')}</div>`).join('')}</div>

      <div class="ft-cd" style="padding:0"><div class="ft-cd-h"><span>Solicitudes Pendientes</span><button class="ft-btn ft-bo ft-bs" onclick="FichateModule.go('requests')">Ver todas →</button></div>${(d.pending_reqs||[]).length===0?'<div class="ft-empty" style="padding:48px">Todo al día 👍</div>':d.pending_reqs.map(r=>{const t=this.AT[r.type]||{l:r.type,c:'#64748b'};return`<div style="padding:16px 24px;border-bottom:1px solid #f5f5f5"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="display:flex;align-items:center;gap:10px">${this.av(r.employee_name,r.user_id,32,11)}<span style="font-weight:600;font-size:15px">${r.employee_name}</span></div>${this.bg(t.l,t.c)}</div><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;color:#9ca3af">${this.fD(r.start_date)}${r.end_date&&r.end_date!==r.start_date?' → '+this.fD(r.end_date):''}</span><div style="display:flex;gap:5px"><button class="ft-btn ft-bg2 ft-bs" onclick="FichateModule.reviewReq(${r.id},'approved')">Aprobar</button><button class="ft-btn ft-bs ft-bo" style="color:#ef4444" onclick="FichateModule.rejectModal(${r.id})">Rechazar</button></div></div></div>`}).join('')}</div>
    </div>`;
  },

  // ══════════════════════════════════════
  // VISTA: FICHAJE (CLOCK)
  // ══════════════════════════════════════
  clkH(){
    const me=this.ftUser||{};
    const myVac=(me.vacation_days||22)-(me.used_vacation_days||0);
    const myUsed=me.used_vacation_days||0;
    const myTotal=me.vacation_days||22;
    const today=new Date().toISOString().slice(0,10);
    const nextHols=this.hols.filter(h=>(h.date>=today||(typeof h.date==='object'&&h.date.toISOString().split('T')[0]>=today))).slice(0,3);

    return `<div style="max-width:900px;margin:0 auto">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="ft-cd" style="padding:18px 20px"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px">Vacaciones</div><div style="font-size:32px;font-weight:900;color:#ff4a6e;margin-top:4px">${myVac}<span style="font-size:14px;font-weight:500;color:#9ca3af"> días libres</span></div><div style="font-size:12px;color:#6b7280;margin-top:2px">${myUsed} usados de ${myTotal}</div></div><div style="width:56px;height:56px;border-radius:50%;background:conic-gradient(#ff4a6e ${Math.round((myUsed/myTotal)*100)}%, #f1f5f9 0);display:flex;align-items:center;justify-content:center"><div style="width:44px;height:44px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#ff4a6e">${Math.round((myVac/myTotal)*100)}%</div></div></div></div>

        <div class="ft-cd" style="padding:18px 20px"><div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Próximos festivos</div>${nextHols.length===0?'<div style="font-size:13px;color:#9ca3af">Sin festivos próximos</div>':nextHols.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f8f8f8"><span style="font-size:13px;font-weight:600">${h.name||'Festivo'}</span><span style="font-size:12px;color:#ff4a6e;font-weight:600">${this.fD(typeof h.date==='object'?h.date.toISOString().split('T')[0]:h.date)}</span></div>`).join('')}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div class="ft-cd" style="padding:0;overflow:hidden">
            <div style="padding:32px 28px;background:linear-gradient(135deg,#ff4a6e,#ff7e95);color:#fff;text-align:center">
              <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;opacity:.7;margin-bottom:8px">${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
              <div id="ft-lc" style="font-size:48px;font-weight:900;line-height:1;margin:10px 0">${new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
              <div id="ft-cstat" style="font-size:13px;opacity:.85;margin-top:6px">Cargando estado...</div>
            </div>
            <div style="padding:20px 24px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <button class="ft-btn" id="ft-cbIn" style="padding:14px;font-size:15px;justify-content:center;border-radius:12px;background:#22c55e;color:white;font-weight:700;border:none;cursor:pointer" onclick="FichateModule.doClock('in')">▶ Entrada</button>
                <button class="ft-btn" id="ft-cbOut" style="padding:14px;font-size:15px;justify-content:center;border-radius:12px;background:#ef4444;color:white;font-weight:700;border:none;cursor:pointer" onclick="FichateModule.doClock('out')">⏹ Salida</button>
              </div>
              <div id="ft-cmsg" style="margin-top:10px"></div>
            </div>
          </div>
          <div class="ft-cd" style="padding:16px 20px;margin-top:16px"><div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Mis fichajes de hoy</div><div id="ft-trecs">Cargando...</div></div>
        </div>
        <div></div>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  // VISTA: EMPLEADOS
  // ══════════════════════════════════════
  empH(){
    const rows=this.emps.map(e=>`<tr onclick="FichateModule.pickE(${e.id})" style="cursor:pointer"><td><div style="display:flex;align-items:center;gap:12px">${this.av(e.name,e.id,40,14)}<div><div style="font-weight:600;font-size:14.5px">${this.esc(e.name)}</div><div style="font-size:12.5px;color:#9ca3af">${e.email||''}</div></div></div></td><td style="font-size:13.5px;color:#6b7280">${e.dni||'—'}</td><td style="color:#6b7280;font-size:14px">${e.position||'—'}</td><td>${this.rBg(e.role)}</td><td><span class="ft-vb"><span class="ft-vb-f" style="width:${((e.used_vacation_days||0)/(e.vacation_days||22))*100}%;background:${(e.used_vacation_days||0)>15?'#ef4444':'#ff4a6e'}"></span></span><span style="font-size:13px;font-weight:600;color:#6b7280">${e.used_vacation_days||0}/${e.vacation_days||22}</span></td><td>${this.sBg(e.is_active)}</td></tr>`).join('');

    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><div><input placeholder="Buscar empleado..." class="ft-inp" style="width:260px" id="ft-empQ" oninput="FichateModule.fEmp()"></div><button class="ft-btn ft-bp" onclick="FichateModule.addEmpM()">+ Nuevo Empleado</button></div><div class="ft-cd" style="padding:0;overflow:hidden"><table class="ft-tbl"><thead><tr><th>Empleado</th><th>DNI</th><th>Puesto</th><th>Rol</th><th>Vacaciones</th><th>Estado</th></tr></thead><tbody id="ft-etb">${rows}</tbody></table></div>`;
  },

  fEmp(){
    const q=(document.getElementById('ft-empQ')?.value||'').toLowerCase();
    const f=this.emps.filter(e=>(e.name||'').toLowerCase().includes(q)||(e.email||'').toLowerCase().includes(q));
    document.getElementById('ft-etb').innerHTML=f.map(e=>`<tr onclick="FichateModule.pickE(${e.id})" style="cursor:pointer"><td><div style="display:flex;align-items:center;gap:12px">${this.av(e.name,e.id,40,14)}<div><div style="font-weight:600">${this.esc(e.name)}</div><div style="font-size:12px;color:#9ca3af">${e.email||''}</div></div></div></td><td style="color:#6b7280">${e.dni||'—'}</td><td style="color:#6b7280">${e.position||'—'}</td><td>${this.rBg(e.role)}</td><td><span class="ft-vb"><span class="ft-vb-f" style="width:${((e.used_vacation_days||0)/(e.vacation_days||22))*100}%;background:#ff4a6e"></span></span>${e.used_vacation_days||0}/${e.vacation_days||22}</td><td>${this.sBg(e.is_active)}</td></tr>`).join('');
  },

  pickE(id){this.selEmp=this.emps.find(e=>e.id===id);this.loadReqs();this.loadDocs();this.renderApp(document.getElementById('main-content'))},

  // ══════════════════════════════════════
  // VISTA: PERFIL EMPLEADO
  // ══════════════════════════════════════
  profH(){
    const e=this.selEmp;if(!e)return '';
    return `<div class="ft-cd" style="padding:24px 28px;display:flex;align-items:center;gap:20px;margin-bottom:18px">${this.av(e.name,e.id,68,24)}<div style="flex:1"><div style="font-size:22px;font-weight:800;letter-spacing:-.3px;margin-bottom:4px">${this.esc(e.name)}</div><div style="font-size:14px;color:#6b7280;display:flex;gap:14px;flex-wrap:wrap"><span>${e.position||'—'}</span><span style="color:#e5e7eb">|</span><span>${e.email||''}</span><span style="color:#e5e7eb">|</span><span>DNI: ${e.dni||'—'}</span></div></div><div style="display:flex;gap:6px">${this.rBg(e.role)} ${this.sBg(e.is_active)}</div><button class="ft-btn ft-bo" onclick="FichateModule.editEmpM(${e.id})">✏️ Editar</button></div>
    <div class="ft-sg">
      <div class="ft-cd ft-st"><div class="ft-st-l">Vacaciones</div><div class="ft-st-v" style="color:#ff4a6e">${(e.vacation_days||22)-(e.used_vacation_days||0)}</div><div class="ft-st-s">${e.used_vacation_days||0} de ${e.vacation_days||22}</div></div>
      <div class="ft-cd ft-st"><div class="ft-st-l">Último acceso</div><div class="ft-st-v" style="color:#8b5cf6;font-size:18px">${e.last_login?this.fD(e.last_login):'Nunca'}</div></div>
      <div class="ft-cd ft-st"><div class="ft-st-l">Alta</div><div class="ft-st-v" style="color:#f59e0b;font-size:18px">${e.start_date?this.fD(e.start_date):'—'}</div></div>
      <div class="ft-cd ft-st"><div class="ft-st-l">Teléfono</div><div class="ft-st-v" style="color:#22c55e;font-size:18px">${e.phone||'—'}</div><div class="ft-st-s">${e.schedule||''}</div></div>
    </div>
    ${this.isA()?`<div class="ft-cd ft-cd-p" style="margin-bottom:18px"><div style="font-weight:700;font-size:16px;margin-bottom:14px">Credenciales de Acceso</div><div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:16px"><div style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:8px">🔒 Solo visible para administradores</div>${[['Email',e.email],['Contraseña',e.password_plain||'(sin registrar)']].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="font-size:14px;color:#92400e">${l}</span><span style="font-size:14.5px;font-weight:700;color:#78350f">${v}</span></div>`).join('')}</div></div>`:''}`;
  },

  // ══════════════════════════════════════
  // VISTA: REGISTROS
  // ══════════════════════════════════════
  recH(){
    const r=this.recs;const t=r.reduce((s,x)=>s+this.dH(x.clock_in,x.clock_out),0);
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><input type="month" class="ft-inp" style="width:150px" value="${new Date().toISOString().slice(0,7)}" onchange="FichateModule.loadRecs(this.value)"><span style="font-weight:700;font-size:12px;color:#ff4a6e">${r.length} reg · ${t.toFixed(1)}h</span></div><div class="ft-cd" style="padding:0;overflow:hidden">${r.length===0?'<div class="ft-empty">Sin registros</div>':`<table class="ft-tbl"><thead><tr><th>Empleado</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Horas</th><th></th></tr></thead><tbody>${r.map(x=>`<tr><td style="font-weight:600">${x.employee_name||''}</td><td>${this.fD(x.date)}</td><td style="font-size:11.5px">${this.fT(x.clock_in)}</td><td style="font-size:11.5px">${x.clock_out?this.fT(x.clock_out):this.bg('En curso','#10b981','#ecfdf5')}</td><td style="font-weight:600;font-size:11.5px">${x.clock_out?this.dH(x.clock_in,x.clock_out).toFixed(2)+'h':'—'}</td><td><div style="display:flex;gap:3px"><button class="ft-btn ft-bs ft-bo" style="color:#ff4a6e" onclick="FichateModule.editRecM(${x.id})">✏️</button><button class="ft-btn ft-bs ft-bo" style="color:#ef4444" onclick="FichateModule.delRec(${x.id})">✕</button></div></td></tr>`).join('')}</tbody></table>`}</div>`;
  },

  async editRecM(id){
    const r=this.recs.find(x=>x.id===id||x.id==id);if(!r)return;
    const ci=r.clock_in?r.clock_in.replace(' ','T').slice(0,19):'';
    const co=r.clock_out?r.clock_out.replace(' ','T').slice(0,19):'';
    this.modal('Editar Registro — '+(r.employee_name||''),`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Entrada</label><input type="datetime-local" class="ft-inp" id="ft-rci" value="${ci}" step="1"></div><div class="ft-fg"><label>Salida</label><input type="datetime-local" class="ft-inp" id="ft-rco" value="${co}" step="1"></div></div><div class="ft-fg"><label>Notas</label><textarea class="ft-inp" id="ft-rnote" rows="2">${r.notes||''}</textarea></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:8px" onclick="FichateModule.saveRecEdit(${id})">Guardar Cambios</button>`);
  },

  async saveRecEdit(id){
    const ci=document.getElementById('ft-rci')?.value?.replace('T',' ')||'';
    const co=document.getElementById('ft-rco')?.value?.replace('T',' ')||null;
    const notes=document.getElementById('ft-rnote')?.value||'';
    if(!ci)return alert('La entrada es obligatoria');
    try{await this.api('record_update',{method:'PUT',params:{id},body:{clock_in:ci,clock_out:co,notes}});document.querySelector('.ft-mo')?.remove();this.loadRecs(new Date().toISOString().slice(0,7))}catch(e){alert(e.message)}
  },

  async delRec(id){if(!confirm('¿Eliminar este registro?'))return;try{await this.api('record_delete',{method:'DELETE',params:{id}});this.loadRecs(new Date().toISOString().slice(0,7))}catch(e){alert(e.message)}},

  // ══════════════════════════════════════
  // VISTA: AUSENCIAS
  // ══════════════════════════════════════
  reqH(){
    const reqList=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><select class="ft-inp" style="width:auto" onchange="FichateModule.loadReqs(this.value)"><option value="all">Todas</option><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option></select><button class="ft-btn ft-bp" onclick="FichateModule.newReqM()">+ Solicitud</button></div><div class="ft-cd" style="padding:0;overflow:hidden">${this.reqs.length===0?'<div class="ft-empty">Sin solicitudes</div>':`<table class="ft-tbl"><thead><tr><th>Empleado</th><th>Tipo</th><th>Fechas</th><th>Estado</th>${this.isA()?'<th>Acciones</th>':''}</tr></thead><tbody>${this.reqs.map(r=>{const t=this.AT[r.type]||{l:r.type,c:'#64748b'};const s=this.SM[r.status]||{};return`<tr><td style="font-weight:600">${r.employee_name||''}</td><td>${this.bg(t.l,t.c)}</td><td style="font-size:12px;color:#6b7280">${r.partial==1?this.fD(r.start_date)+' '+(r.time_from||'')+'→'+(r.time_to||''):this.fD(r.start_date)+(r.end_date&&r.end_date!==r.start_date?' → '+this.fD(r.end_date):'')}</td><td>${this.bg(s.l||r.status,s.c||'#64748b',s.b||'#f1f5f9')}</td>${this.isA()&&r.status==='pending'?`<td><div style="display:flex;gap:3px"><button class="ft-btn ft-bg2 ft-bs" onclick="FichateModule.reviewReq(${r.id},'approved')">Aprobar</button><button class="ft-btn ft-bs ft-bo" style="color:#ef4444" onclick="FichateModule.rejectModal(${r.id})">Rechazar</button></div></td>`:(this.isA()?'<td style="color:#9ca3af">—</td>':'')}</tr>`}).join('')}</tbody></table>`}</div>`;

    return reqList;
  },

  async reviewReq(id,st){try{await this.api('request_review',{method:'PUT',params:{id},body:{status:st}});this.loadReqs();if(this.isA())this.render()}catch(e){alert(e.message)}},

  rejectModal(id){
    this.modal('Motivo de Rechazo',`${this.RR.map((r,i)=>`<label style="display:flex;align-items:center;gap:7px;padding:7px;border-radius:6px;border:1px solid #e5e7eb;margin-bottom:5px;font-size:12.5px;cursor:pointer"><input type="radio" name="ft-rr" value="${r}" ${i===0?'checked':''}> ${r}</label>`).join('')}<div class="ft-fg" style="margin-top:8px"><label>Detalle</label><textarea class="ft-inp" id="ft-rd" rows="2"></textarea></div><button class="ft-btn ft-br" style="width:100%;justify-content:center;margin-top:8px" onclick="FichateModule.submitRej(${id})">Confirmar Rechazo</button>`);
  },

  async submitRej(id){
    const r=document.querySelector('input[name="ft-rr"]:checked')?.value||'';
    const d=document.getElementById('ft-rd')?.value||'';
    try{await this.api('request_review',{method:'PUT',params:{id},body:{status:'rejected',reject_reason:d?r+': '+d:r}});document.querySelector('.ft-mo')?.remove();this.loadReqs();if(this.isA())this.render()}catch(e){alert(e.message)}
  },

  newReqM(){
    this.modal('Nueva Solicitud',`${this.isA()?`<div class="ft-fg"><label>Empleado</label><select class="ft-inp" id="ft-re">${this.emps.filter(e=>e.is_active==1).map(e=>`<option value="${e.id}">${this.esc(e.name)}</option>`).join('')}</select></div>`:''}<div class="ft-fg"><label>Tipo</label><select class="ft-inp" id="ft-rt" onchange="FichateModule.togP()">${Object.entries(this.AT).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}</select></div><div id="ft-fd"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Fecha inicio</label><input type="date" class="ft-inp" id="ft-rs"></div><div class="ft-fg"><label>Fecha fin</label><input type="date" class="ft-inp" id="ft-rf"></div></div></div><div id="ft-pd" style="display:none"><div class="ft-fg"><label>Fecha</label><input type="date" class="ft-inp" id="ft-rpd"></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div class="ft-fg"><label>Hora desde</label><input type="time" class="ft-inp" id="ft-rtf" onchange="FichateModule.calcHr()"></div><div class="ft-fg"><label>Hora hasta</label><input type="time" class="ft-inp" id="ft-rtt" onchange="FichateModule.calcHr()"></div><div class="ft-fg"><label>Horas</label><input type="number" class="ft-inp" id="ft-rh" step="0.5" readonly style="font-weight:700;background:#f8fafc"></div></div></div><div class="ft-fg"><label>Notas</label><textarea class="ft-inp" id="ft-rn" rows="2"></textarea></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:6px" onclick="FichateModule.saveReq()">Enviar</button>`);
  },

  togP(){const t=document.getElementById('ft-rt').value;const p=this.AT[t]?.p;document.getElementById('ft-fd').style.display=p?'none':'block';document.getElementById('ft-pd').style.display=p?'block':'none'},
  calcHr(){const f=document.getElementById('ft-rtf')?.value,t=document.getElementById('ft-rtt')?.value;if(f&&t){const[fh,fm]=f.split(':').map(Number),[th,tm]=t.split(':').map(Number);document.getElementById('ft-rh').value=Math.max(0,((th*60+tm)-(fh*60+fm))/60).toFixed(1)}},

  async saveReq(){
    const t=document.getElementById('ft-rt').value,p=this.AT[t]?.p;
    const b={type:t,user_id:this.isA()?parseInt(document.getElementById('ft-re')?.value)||undefined:undefined,partial:p?1:0,notes:document.getElementById('ft-rn')?.value||null};
    if(p){b.start_date=document.getElementById('ft-rpd')?.value;b.end_date=b.start_date;b.time_from=document.getElementById('ft-rtf')?.value;b.time_to=document.getElementById('ft-rtt')?.value;b.hours_requested=parseFloat(document.getElementById('ft-rh')?.value)||0}
    else{b.start_date=document.getElementById('ft-rs')?.value;b.end_date=document.getElementById('ft-rf')?.value}
    if(!b.start_date)return alert('Selecciona fecha');
    try{await this.api('requests',{method:'POST',body:b});document.querySelector('.ft-mo')?.remove();this.loadReqs()}catch(e){alert(e.message)}
  },

  // ══════════════════════════════════════
  // VISTA: DOCUMENTOS
  // ══════════════════════════════════════
  docH(){
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><select class="ft-inp" style="width:auto" onchange="FichateModule.loadDocsF(this.value)"><option value="all">Todos</option><option value="payroll">Nóminas</option><option value="contract">Contratos</option><option value="certificate">Certificados</option><option value="medical">Médicos</option></select>${this.isA()?'<button class="ft-btn ft-bp" onclick="FichateModule.uploadDocM()">+ Subir</button>':''}</div><div class="ft-cd" style="padding:0;overflow:hidden">${this.docs.length===0?'<div class="ft-empty">Sin documentos</div>':`<table class="ft-tbl"><thead><tr><th>Nombre</th><th>Empleado</th><th>Tipo</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>${this.docs.map(d=>`<tr><td style="font-weight:600">${this.esc(d.name)}</td><td>${d.employee_name||''}</td><td>${this.bg(d.category||'otro','#64748b','#f1f5f9')}</td><td style="font-size:12px;color:#9ca3af">${this.fD(d.date)}</td><td><div style="display:flex;gap:4px"><button class="ft-btn ft-bs ft-bo" style="color:#ff4a6e" onclick="FichateModule.viewDoc(${d.id})">👁</button><button class="ft-btn ft-bs ft-bo" style="color:#22c55e" onclick="FichateModule.dlDoc(${d.id})">⬇</button>${this.isA()?`<button class="ft-btn ft-bs ft-bo" style="color:#ef4444" onclick="FichateModule.delDoc(${d.id})">✕</button>`:''}</div></td></tr>`).join('')}</tbody></table>`}</div>`;
  },

  async loadDocsF(cat){try{const p=cat&&cat!=='all'?{category:cat}:{};this.docs=(await this.api('documents',{params:p})).documents||[];this.renderApp(document.getElementById('main-content'))}catch(e){}},
  viewDoc(id){window.open(`/api/fichate/document_download?id=${id}&preview=1&token=${API.getToken()}`,'_blank')},
  dlDoc(id){window.open(`/api/fichate/document_download?id=${id}&token=${API.getToken()}`,'_blank')},
  async delDoc(id){if(!confirm('¿Eliminar documento?'))return;try{await this.api('document_delete',{method:'DELETE',params:{id}});this.loadDocs()}catch(e){alert(e.message)}},

  uploadDocM(){
    this.modal('Subir Documento',`<div class="ft-fg"><label>Empleado</label><select class="ft-inp" id="ft-de">${this.emps.filter(e=>e.is_active==1).map(e=>`<option value="${e.id}">${this.esc(e.name)}</option>`).join('')}</select></div><div class="ft-fg"><label>Categoría</label><select class="ft-inp" id="ft-dc"><option value="payroll">Nómina</option><option value="contract">Contrato</option><option value="certificate">Certificado</option><option value="medical">Médico</option><option value="other">Otro</option></select></div><div class="ft-fg"><label>Nombre</label><input class="ft-inp" id="ft-dn" placeholder="Ej: Nómina Enero 2026"></div><div class="ft-fg"><label>Fecha</label><input type="date" class="ft-inp" id="ft-dd"></div><div class="ft-fg"><label>Archivo</label><input type="file" class="ft-inp" id="ft-df" accept=".pdf,.jpg,.jpeg,.png"></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:8px" onclick="FichateModule.saveDocs()">Subir</button>`);
  },

  async saveDocs(){
    const f=document.getElementById('ft-df')?.files[0];if(!f)return alert('Selecciona archivo');
    const fd=new FormData();fd.append('file',f);fd.append('user_id',document.getElementById('ft-de').value);fd.append('category',document.getElementById('ft-dc').value);fd.append('name',document.getElementById('ft-dn').value||f.name);fd.append('date',document.getElementById('ft-dd').value||new Date().toISOString().slice(0,10));
    try{await this.api('documents',{method:'POST',body:fd,isForm:true});document.querySelector('.ft-mo')?.remove();this.loadDocs()}catch(e){alert(e.message)}
  },

  // ══════════════════════════════════════
  // VISTA: NÓMINAS
  // ══════════════════════════════════════
  payH(){
    return `<div class="ft-cd ft-cd-p"><div style="font-weight:700;font-size:18px;margin-bottom:6px">📄 Distribución de Nóminas</div><div style="font-size:14px;color:#6b7280;margin-bottom:20px">Sube el PDF con todas las nóminas. El sistema buscará el DNI de cada empleado y asignará la nómina automáticamente.</div><div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:20px"><div class="ft-fg" style="margin:0"><label>Mes</label><input type="month" class="ft-inp" id="ft-payMonth" value="${new Date().toISOString().slice(0,7)}" style="width:180px"></div></div><div class="ft-drop"><div style="font-size:40px;margin-bottom:10px">📎</div><div style="font-weight:700;font-size:16px;margin-bottom:4px">Sube los PDFs de nóminas</div><div style="font-size:14px;color:#6b7280;margin-bottom:16px">Puede ser un PDF con todas las nóminas juntas o varios archivos</div><input type="file" id="ft-payF" multiple accept=".pdf" style="display:none" onchange="FichateModule.uploadPay()"><button class="ft-btn ft-bp" style="font-size:15px;padding:12px 24px" onclick="document.getElementById('ft-payF').click()">Seleccionar archivos</button></div><div id="ft-payRes" style="margin-top:18px"></div></div>`;
  },

  async uploadPay(){
    const f=document.getElementById('ft-payF').files;if(!f.length)return;
    const month=document.getElementById('ft-payMonth')?.value||new Date().toISOString().slice(0,7);
    const fd=new FormData();for(let i=0;i<f.length;i++)fd.append('files',f[i]);fd.append('month',month);
    const el=document.getElementById('ft-payRes');
    el.innerHTML='<div class="ft-tg" style="background:#fffbeb;color:#f59e0b">⏳ Procesando '+f.length+' archivo(s)... puede tardar hasta 2 minutos...</div>';
    try{
      const d=await this.api('payroll_upload',{method:'POST',body:fd,isForm:true});
      let matched=0,unmatched=0,skipped=0;
      let h='<div style="margin-top:12px">';
      (d.results||[]).forEach(r=>{if(r.status==='matched'){matched++;h+=`<div class="ft-tg" style="background:#f0fdf4;color:#22c55e;margin-bottom:4px">✅ ${r.employee} (${r.dni})</div>`}else if(r.status==='skipped'){skipped++;h+=`<div class="ft-tg" style="background:#fffbeb;color:#f59e0b;margin-bottom:4px">⚠️ ${r.employee} — ${r.reason}</div>`}else{unmatched++;h+=`<div class="ft-tg" style="background:#fef2f2;color:#ef4444;margin-bottom:4px">❌ ${r.file||'Página'} — ${r.reason||'No asignado'}</div>`}});
      h+=`</div><div style="margin-top:12px;padding:14px;border-radius:10px;background:#fafafa;font-size:14px"><strong>Resumen:</strong> ${matched} asignadas, ${skipped} ya existían, ${unmatched} sin asignar</div>`;
      el.innerHTML=h;this.loadDocs();
    }catch(e){el.innerHTML=`<div class="ft-tg" style="background:#fef2f2;color:#ef4444">${e.message}</div>`}
  },

  // ══════════════════════════════════════
  // VISTA: CREDENCIALES
  // ══════════════════════════════════════
  credH(){
    const me=this.ftUser;
    const myCreds=this.appCreds.filter(c=>c.user_id==me?.id);
    const sharedCreds=this.appCreds.filter(c=>!c.user_id);
    const credRows=(creds,canEdit)=>creds.map(c=>`<tr><td style="font-weight:600">${this.esc(c.app_name)}${c.app_url?` <a href="${c.app_url}" target="_blank" style="font-size:11px;color:#ff4a6e">🔗</a>`:''}</td><td style="font-size:12px">${c.username||'—'}</td><td style="font-family:monospace;font-size:12px;font-weight:600">${c.password_plain||'—'}</td><td style="font-size:12px;color:#9ca3af">${c.notes||'—'}</td>${canEdit?`<td><div style="display:flex;gap:3px"><button class="ft-btn ft-bs ft-bo" style="color:#ff4a6e" onclick="FichateModule.editCredM(${c.id})">✏️</button><button class="ft-btn ft-bs ft-bo" style="color:#ef4444" onclick="FichateModule.delCred(${c.id})">✕</button></div></td>`:''}</tr>`).join('');

    const loginCard=me?`<div class="ft-cd ft-cd-p" style="margin-bottom:16px"><div style="font-weight:700;font-size:15px;margin-bottom:12px">🔐 Acceso Fichate</div><div style="background:#fff0f3;border-radius:10px;padding:14px">${[['Email',me.email],['Contraseña',me.password_plain||'—']].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,74,110,.1)"><span style="font-size:13px;color:#6b7280">${l}</span><span style="font-size:13px;font-weight:700">${v}</span></div>`).join('')}</div></div>`:'';

    const myCard=`<div class="ft-cd" style="padding:0;overflow:hidden;margin-bottom:16px"><div class="ft-cd-h"><span>🔑 Mis Credenciales</span><button class="ft-btn ft-bp ft-bs" onclick="FichateModule.addCredM()">+ Añadir</button></div>${myCreds.length===0?'<div class="ft-empty" style="padding:16px">Sin credenciales guardadas</div>':`<table class="ft-tbl"><thead><tr><th>Aplicación</th><th>Usuario</th><th>Contraseña</th><th>Notas</th><th></th></tr></thead><tbody>${credRows(myCreds,true)}</tbody></table>`}</div>`;

    if(!this.isA())return loginCard+myCard;

    const empTable=`<div class="ft-cd" style="padding:0;overflow:hidden;margin-bottom:16px"><div class="ft-cd-h"><span>👥 Credenciales de Empleados</span></div><div style="padding:8px 18px;background:#fffbeb;border-bottom:1px solid #fef3c7;font-size:11px;color:#92400e;font-weight:500">🔒 Solo visible para admin</div><table class="ft-tbl"><thead><tr><th>Empleado</th><th>Email</th><th>Contraseña</th><th>Último acceso</th></tr></thead><tbody>${this.emps.filter(e=>e.is_active==1).map(e=>`<tr><td><div style="display:flex;align-items:center;gap:8px">${this.av(e.name,e.id,28,10)}<span style="font-weight:600;font-size:12px">${this.esc(e.name)}</span></div></td><td style="font-size:12px;color:#6b7280">${e.email||''}</td><td style="font-family:monospace;font-size:12px;font-weight:600">${e.password_plain||'—'}</td><td style="font-size:11px;color:#9ca3af">${e.last_login?this.fT(e.last_login):'Nunca'}</td></tr>`).join('')}</tbody></table></div>`;

    const sharedCard=`<div class="ft-cd" style="padding:0;overflow:hidden;margin-bottom:16px"><div class="ft-cd-h"><span>🌐 Compartidas (empresa)</span><button class="ft-btn ft-bp ft-bs" onclick="FichateModule.addCredM(true)">+ Añadir</button></div>${sharedCreds.length===0?'<div class="ft-empty" style="padding:16px">Sin credenciales compartidas</div>':`<table class="ft-tbl"><thead><tr><th>Aplicación</th><th>Usuario</th><th>Contraseña</th><th>Notas</th><th></th></tr></thead><tbody>${credRows(sharedCreds,true)}</tbody></table>`}</div>`;

    return empTable+sharedCard+myCard;
  },

  async delCred(id){if(!confirm('¿Eliminar?'))return;try{await this.api('app_credential_delete',{method:'DELETE',params:{id}});this.loadCreds()}catch(e){alert(e.message)}},

  addCredM(shared){
    this.modal('Nueva Credencial',`<div class="ft-fg"><label>Aplicación *</label><input class="ft-inp" id="ft-ca" placeholder="Ej: Pipedrive"></div><div class="ft-fg"><label>URL</label><input class="ft-inp" id="ft-cu" placeholder="https://..."></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Usuario</label><input class="ft-inp" id="ft-cuser"></div><div class="ft-fg"><label>Contraseña</label><input class="ft-inp" id="ft-cpw"></div></div><div class="ft-fg"><label>Notas</label><textarea class="ft-inp" id="ft-cn" rows="2"></textarea></div><input type="hidden" id="ft-cshared" value="${shared?'1':'0'}"><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:8px" onclick="FichateModule.saveCred()">Guardar</button>`);
  },

  editCredM(id){
    const c=this.appCreds.find(x=>x.id===id||x.id==id);if(!c)return;
    this.modal('Editar Credencial',`<div class="ft-fg"><label>Aplicación *</label><input class="ft-inp" id="ft-ca" value="${this.esc(c.app_name||'')}"></div><div class="ft-fg"><label>URL</label><input class="ft-inp" id="ft-cu" value="${this.esc(c.app_url||'')}"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Usuario</label><input class="ft-inp" id="ft-cuser" value="${this.esc(c.username||'')}"></div><div class="ft-fg"><label>Contraseña</label><input class="ft-inp" id="ft-cpw" value="${this.esc(c.password_plain||'')}"></div></div><div class="ft-fg"><label>Notas</label><textarea class="ft-inp" id="ft-cn" rows="2">${this.esc(c.notes||'')}</textarea></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:8px" onclick="FichateModule.updateCred(${id})">Guardar</button>`);
  },

  async saveCred(){const shared=document.getElementById('ft-cshared')?.value==='1';const b={app_name:document.getElementById('ft-ca').value,app_url:document.getElementById('ft-cu').value,username:document.getElementById('ft-cuser').value,password_plain:document.getElementById('ft-cpw').value,notes:document.getElementById('ft-cn').value};if(shared)b.user_id=null;if(!b.app_name)return alert('Nombre obligatorio');try{await this.api('app_credentials',{method:'POST',body:b});document.querySelector('.ft-mo')?.remove();this.loadCreds()}catch(e){alert(e.message)}},
  async updateCred(id){const b={app_name:document.getElementById('ft-ca').value,app_url:document.getElementById('ft-cu').value,username:document.getElementById('ft-cuser').value,password_plain:document.getElementById('ft-cpw').value,notes:document.getElementById('ft-cn').value};try{await this.api('app_credential_update',{method:'PUT',params:{id},body:b});document.querySelector('.ft-mo')?.remove();this.loadCreds()}catch(e){alert(e.message)}},

  // ══════════════════════════════════════
  // VISTA: INFORMES
  // ══════════════════════════════════════
  repH(){
    return `<div class="ft-cd ft-cd-p"><div style="font-weight:700;font-size:14px;margin-bottom:14px">Informes</div><div style="display:flex;gap:8px;margin-bottom:14px"><input type="month" class="ft-inp" style="width:150px" id="ft-repM" value="${new Date().toISOString().slice(0,7)}"></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">${[['hours','📊','Registro de Jornada','Entradas y salidas por empleado'],['absences','📅','Ausencias y Permisos','Vacaciones, bajas y permisos'],['summary','📈','Resumen Mensual','Horas, días y vacaciones']].map(([t,i,n,d])=>`<div class="ft-cd ft-cd-p" style="cursor:pointer" onclick="FichateModule.dlRep('${t}')"><div style="font-size:24px;margin-bottom:6px">${i}</div><div style="font-weight:700;font-size:13px;margin-bottom:2px">${n}</div><div style="font-size:11px;color:#9ca3af">${d}</div></div>`).join('')}</div><div class="ft-tg" style="background:#fffbeb;color:#92400e"><strong>RD-Ley 8/2019:</strong> Los registros se conservan 4 años.</div></div>`;
  },

  dlRep(t){const m=document.getElementById('ft-repM')?.value||new Date().toISOString().slice(0,7);window.open(`/api/fichate/report_csv?month=${m}&type=${t}&token=${API.getToken()}`,'_blank')},

  // ══════════════════════════════════════
  // VISTA: SETTINGS
  // ══════════════════════════════════════
  setH(){
    const turnos=this.shifts;
    const getTurnoOpts=(sel)=>'<option value="">Sin asignar</option>'+turnos.map(t=>`<option value="${t.name}" ${sel===t.name?'selected':''}>${t.name} (${(t.start_time||'').substring(0,5)} - ${(t.end_time||'').substring(0,5)})</option>`).join('');

    return `
    <div class="ft-cd ft-cd-p" style="margin-bottom:20px">
      <div style="font-weight:700;font-size:18px;margin-bottom:16px">⚙️ Configuración</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="ft-cd ft-cd-p" style="background:#fafafa"><div style="font-weight:700;margin-bottom:12px">🏖️ Vacaciones</div><div class="ft-fg"><label>Días base por año</label><input class="ft-inp" id="ft-vacBase" type="number" value="${localStorage.getItem('ft2_vacbase')||'22'}" style="max-width:120px"></div><button class="ft-btn ft-bp" onclick="localStorage.setItem('ft2_vacbase',document.getElementById('ft-vacBase').value);alert('Guardado')">Guardar</button></div>
        <div class="ft-cd ft-cd-p" style="background:#fafafa"><div style="font-weight:700;margin-bottom:12px">🏢 Datos Empresa</div><div style="font-size:14px;color:#6b7280;line-height:2"><div><strong>Razón social:</strong> Telegestion de Seguros y Soluciones Avants SL</div><div><strong>Registros:</strong> Conservados 4 años (RD-Ley 8/2019)</div></div></div>
      </div>
    </div>

    <div class="ft-cd ft-cd-p" style="margin-bottom:20px">
      <div style="font-weight:700;font-size:18px;margin-bottom:6px">📅 Vacaciones Colectivas</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:16px">Asigna vacaciones a todos los empleados a la vez.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
        <div class="ft-fg"><label>Tipo</label><select class="ft-inp" id="ft-bulkType">${Object.entries(this.AT).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}</select></div>
        <div class="ft-fg"><label>Fecha inicio</label><input type="date" class="ft-inp" id="ft-bulkFrom"></div>
        <div class="ft-fg"><label>Fecha fin</label><input type="date" class="ft-inp" id="ft-bulkTo"></div>
      </div>
      <div class="ft-fg"><label>Empleados</label><div style="display:flex;gap:8px;margin-bottom:8px"><button class="ft-btn ft-bs ft-bo" onclick="document.querySelectorAll('.ft-bulk-chk').forEach(c=>c.checked=true)">Todos</button><button class="ft-btn ft-bs ft-bo" onclick="document.querySelectorAll('.ft-bulk-chk').forEach(c=>c.checked=false)">Ninguno</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">${this.emps.filter(e=>e.is_active==1).map(e=>`<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:13px;cursor:pointer"><input type="checkbox" class="ft-bulk-chk" value="${e.id}" checked> ${(e.name||'').split(' ').slice(0,2).join(' ')}</label>`).join('')}</div></div>
      <button class="ft-btn ft-bp" onclick="FichateModule.saveBulkVac()" style="margin-top:4px">Crear ausencias</button>
      <div id="ft-bulkRes" style="margin-top:10px"></div>
    </div>

    <div class="ft-cd ft-cd-p">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div><div style="font-weight:700;font-size:18px">🕐 Turnos y Horarios</div></div><button class="ft-btn ft-bp" onclick="FichateModule.addTurnoM()">+ Nuevo Turno</button></div>
      ${turnos.length===0?'<div class="ft-empty">No hay turnos definidos</div>':`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">${turnos.map(t=>`<div class="ft-cd ft-cd-p" style="position:relative"><div style="position:absolute;top:12px;right:12px;display:flex;gap:4px"><button class="ft-btn ft-bs ft-bo" style="color:#ff4a6e" onclick="FichateModule.editTurnoM(${t.id},'${(t.name||'').replace(/'/g,"\\'")}','${(t.start_time||'09:00:00').substring(0,5)}','${(t.end_time||'15:00:00').substring(0,5)}','${t.daily_hours||7.5}','${t.break_time||''}','${t.color||'#ff4a6e'}')">✏️</button><button class="ft-btn ft-bs ft-bo" style="color:#ef4444" onclick="FichateModule.delTurno(${t.id},'${(t.name||'').replace(/'/g,"\\'")}')">✕</button></div><div style="font-weight:700;font-size:16px;margin-bottom:8px;color:${t.color||'#ff4a6e'}">${t.name}</div><div style="font-size:14px;color:#6b7280;line-height:2"><div>📅 ${(t.start_time||'').substring(0,5)} - ${(t.end_time||'').substring(0,5)}</div><div>⏱ ${t.daily_hours||'7.5'}h/día</div>${t.break_time?`<div>☕ Pausa: ${t.break_time}</div>`:''}<div>👥 ${this.emps.filter(e=>e.schedule===t.name).length} empleados</div></div></div>`).join('')}</div>`}

      ${turnos.length>0?`<div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0f0f0"><div style="font-weight:700;font-size:15px;margin-bottom:12px">Asignación rápida</div><table class="ft-tbl"><thead><tr><th>Empleado</th><th>Turno actual</th><th>Cambiar a</th></tr></thead><tbody>${this.emps.filter(e=>e.is_active==1).map(e=>`<tr><td><div style="display:flex;align-items:center;gap:10px">${this.av(e.name,e.id,32,11)}<span style="font-weight:600">${this.esc(e.name)}</span></div></td><td>${e.schedule?this.bg(e.schedule,turnos.find(t=>t.name===e.schedule)?.color||'#6b7280'):'<span style="color:#9ca3af">Sin asignar</span>'}</td><td><select class="ft-inp" style="width:auto;min-width:180px" onchange="FichateModule.assignTurno(${e.id},this.value)">${getTurnoOpts(e.schedule)}</select></td></tr>`).join('')}</tbody></table></div>`:''}
    </div>`;
  },

  async saveBulkVac(){
    const type=document.getElementById('ft-bulkType')?.value;
    const from=document.getElementById('ft-bulkFrom')?.value;
    const to=document.getElementById('ft-bulkTo')?.value;
    const checks=document.querySelectorAll('.ft-bulk-chk:checked');
    const empIds=[...checks].map(c=>c.value);
    if(!from)return alert('Selecciona fecha');
    if(empIds.length===0)return alert('Selecciona empleados');
    const el=document.getElementById('ft-bulkRes');
    el.innerHTML='<div class="ft-tg" style="background:#fffbeb;color:#f59e0b">⏳ Creando '+empIds.length+' solicitudes...</div>';
    let ok=0,err=0;
    for(const eid of empIds){try{await this.api('requests',{method:'POST',body:{type,start_date:from,end_date:to||from,user_id:parseInt(eid),notes:document.getElementById('ft-bulkNotes')?.value||'',partial:0}});ok++}catch(e){err++}}
    el.innerHTML=`<div class="ft-tg" style="background:#f0fdf4;color:#22c55e">✅ ${ok} solicitudes creadas${err>0?' · '+err+' errores':''}</div>`;
    // Auto-aprobar
    try{const reqs=(await this.api('requests')).requests||[];const pending=reqs.filter(r=>r.status==='pending'&&r.start_date===from);for(const r of pending){await this.api('request_review',{method:'PUT',params:{id:r.id},body:{status:'approved'}})}el.innerHTML+=`<div class="ft-tg" style="background:#f0fdf4;color:#22c55e;margin-top:4px">✅ Todas aprobadas</div>`}catch(e){}
    this.render();
  },

  addTurnoM(){
    this.modal('Nuevo Turno',`<div class="ft-fg"><label>Nombre *</label><input class="ft-inp" id="ft-tn" placeholder="Ej: Jornada Mañana"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Hora inicio</label><input class="ft-inp" id="ft-th1" type="time" value="09:00" onchange="FichateModule.calcTurnoH()"></div><div class="ft-fg"><label>Hora fin</label><input class="ft-inp" id="ft-th2" type="time" value="15:00" onchange="FichateModule.calcTurnoH()"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Horas/día</label><input class="ft-inp" id="ft-thd" type="number" step="0.5" value="6.0" readonly style="font-weight:700;background:#fafafa"></div><div class="ft-fg"><label>Pausa (ej: 14:00-14:30)</label><input class="ft-inp" id="ft-tbr" onchange="FichateModule.calcTurnoH()"></div></div><div class="ft-fg"><label>Color</label><div style="display:flex;gap:6px;margin-top:4px">${['#ff4a6e','#6366f1','#22c55e','#f59e0b','#8b5cf6','#14b8a6','#3b82f6','#ef4444'].map(c=>`<div onclick="document.getElementById('ft-tcol').value='${c}';this.parentElement.querySelectorAll('div').forEach(d=>d.style.outline='');this.style.outline='3px solid ${c}';this.style.outlineOffset='2px'" style="width:32px;height:32px;border-radius:8px;background:${c};cursor:pointer"></div>`).join('')}<input type="hidden" id="ft-tcol" value="#ff4a6e"></div></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:10px" onclick="FichateModule.saveTurno()">Crear Turno</button>`);
  },

  calcTurnoH(){const h1=document.getElementById('ft-th1')?.value,h2=document.getElementById('ft-th2')?.value,br=document.getElementById('ft-tbr')?.value||'';if(!h1||!h2)return;const[h1h,h1m]=h1.split(':').map(Number),[h2h,h2m]=h2.split(':').map(Number);let mins=(h2h*60+h2m)-(h1h*60+h1m);if(mins<0)mins+=1440;if(br&&br.includes('-')){const[b1,b2]=br.split('-').map(s=>s.trim());if(b1&&b2){const[b1h,b1m]=b1.split(':').map(Number),[b2h,b2m]=b2.split(':').map(Number);let bm=(b2h*60+b2m)-(b1h*60+b1m);if(bm>0)mins-=bm}}document.getElementById('ft-thd').value=(mins/60).toFixed(1)},

  async saveTurno(){this.calcTurnoH();const n=document.getElementById('ft-tn')?.value;const h1=document.getElementById('ft-th1')?.value;const h2=document.getElementById('ft-th2')?.value;if(!n||!h1||!h2)return alert('Nombre y horario obligatorios');try{await this.api('shifts',{method:'POST',body:{name:n,start_time:h1,end_time:h2,daily_hours:document.getElementById('ft-thd')?.value||'7.5',break_time:document.getElementById('ft-tbr')?.value||'',color:document.getElementById('ft-tcol')?.value||'#ff4a6e'}});document.querySelector('.ft-mo')?.remove();this.render()}catch(e){alert(e.message)}},

  editTurnoM(id,name,h1,h2,dh,br,col){
    this.modal('Editar Turno: '+name,`<div class="ft-fg"><label>Nombre</label><input class="ft-inp" id="ft-tn" value="${name}"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Hora inicio</label><input class="ft-inp" id="ft-th1" type="time" value="${h1||'09:00'}" onchange="FichateModule.calcTurnoH()"></div><div class="ft-fg"><label>Hora fin</label><input class="ft-inp" id="ft-th2" type="time" value="${h2||'15:00'}" onchange="FichateModule.calcTurnoH()"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Horas/día</label><input class="ft-inp" id="ft-thd" type="number" step="0.5" value="${dh||'7.5'}" readonly style="font-weight:700;background:#fafafa"></div><div class="ft-fg"><label>Pausa</label><input class="ft-inp" id="ft-tbr" value="${br||''}" onchange="FichateModule.calcTurnoH()"></div></div><input type="hidden" id="ft-told" value="${name}"><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:10px" onclick="FichateModule.updateTurno(${id})">Guardar</button>`);
  },

  async updateTurno(id){this.calcTurnoH();try{await this.api('shift_update',{method:'PUT',params:{id},body:{name:document.getElementById('ft-tn')?.value,start_time:document.getElementById('ft-th1')?.value,end_time:document.getElementById('ft-th2')?.value,daily_hours:document.getElementById('ft-thd')?.value,break_time:document.getElementById('ft-tbr')?.value||'',old_name:document.getElementById('ft-told')?.value}});document.querySelector('.ft-mo')?.remove();this.render()}catch(e){alert(e.message)}},

  async delTurno(id,name){if(!confirm('¿Eliminar turno "'+name+'"?'))return;try{await this.api('shift_delete',{method:'DELETE',params:{id}});this.render()}catch(e){alert(e.message)}},

  async assignTurno(empId,turno){try{await this.api('employee_update',{method:'PUT',params:{id:empId},body:{schedule:turno}});this.render()}catch(e){alert(e.message)}},

  // ══════════════════════════════════════
  // MODALES DE EMPLEADOS
  // ══════════════════════════════════════
  addEmpM(){
    const vacDays=parseInt(localStorage.getItem('ft2_vacbase'))||22;
    const getTurnoOpts=()=>'<option value="">Sin asignar</option>'+this.shifts.map(t=>`<option value="${t.name}">${t.name}</option>`).join('');
    this.modal('Nuevo Empleado',`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Nombre *</label><input class="ft-inp" id="ft-en"></div><div class="ft-fg"><label>DNI *</label><input class="ft-inp" id="ft-ed" placeholder="12345678A" oninput="document.getElementById('ft-epw').value=this.value"></div><div class="ft-fg"><label>Email *</label><input class="ft-inp" id="ft-ee" type="email"></div><div class="ft-fg"><label>Teléfono</label><input class="ft-inp" id="ft-ep"></div><div class="ft-fg"><label>Puesto</label><input class="ft-inp" id="ft-epos" value="Agente Comercial"></div><div class="ft-fg"><label>Rol</label><select class="ft-inp" id="ft-er"><option value="agent">Agente</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></div><div class="ft-fg"><label>Contraseña (= DNI)</label><input class="ft-inp" id="ft-epw"></div><div class="ft-fg"><label>PIN</label><input class="ft-inp" id="ft-epin" maxlength="4"></div><div class="ft-fg"><label>Vacaciones</label><input class="ft-inp" id="ft-ev" type="number" value="${vacDays}"></div><div class="ft-fg"><label>Fecha alta</label><input class="ft-inp" id="ft-esd" type="date"></div><div class="ft-fg"><label>Turno</label><select class="ft-inp" id="ft-eturno">${getTurnoOpts()}</select></div></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:10px" onclick="FichateModule.saveNewEmp()">Guardar</button>`);
  },

  async saveNewEmp(){
    const dni=document.getElementById('ft-ed').value;
    const b={name:document.getElementById('ft-en').value,dni,email:document.getElementById('ft-ee').value,phone:document.getElementById('ft-ep').value,position:document.getElementById('ft-epos').value,role:document.getElementById('ft-er').value,password:document.getElementById('ft-epw').value||dni||'1234',pin:document.getElementById('ft-epin').value||null,vacation_days:parseInt(document.getElementById('ft-ev').value)||22,start_date:document.getElementById('ft-esd').value||null,schedule:document.getElementById('ft-eturno')?.value||null};
    if(!b.name||!b.email)return alert('Nombre y email obligatorios');
    if(!b.dni)return alert('DNI obligatorio');
    try{await this.api('employees',{method:'POST',body:b});document.querySelector('.ft-mo')?.remove();this.render()}catch(e){alert(e.message)}
  },

  editEmpM(id){
    const e=this.emps.find(x=>x.id===id);if(!e)return;
    const getTurnoOpts=(sel)=>'<option value="">Sin asignar</option>'+this.shifts.map(t=>`<option value="${t.name}" ${sel===t.name?'selected':''}>${t.name}</option>`).join('');
    this.modal('Editar: '+this.esc(e.name),`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="ft-fg"><label>Nombre</label><input class="ft-inp" id="ft-uen" value="${this.esc(e.name)}"></div><div class="ft-fg"><label>DNI</label><input class="ft-inp" id="ft-ued" value="${e.dni||''}"></div><div class="ft-fg"><label>Email</label><input class="ft-inp" id="ft-uee" value="${e.email||''}"></div><div class="ft-fg"><label>Teléfono</label><input class="ft-inp" id="ft-uep" value="${e.phone||''}"></div><div class="ft-fg"><label>Puesto</label><input class="ft-inp" id="ft-uepos" value="${e.position||''}"></div><div class="ft-fg"><label>Rol</label><select class="ft-inp" id="ft-uer"><option value="agent" ${e.role==='agent'?'selected':''}>Agente</option><option value="supervisor" ${e.role==='supervisor'?'selected':''}>Supervisor</option><option value="admin" ${e.role==='admin'?'selected':''}>Admin</option></select></div><div class="ft-fg"><label>Nueva contraseña</label><input class="ft-inp" id="ft-uepw" placeholder="Sin cambios"></div><div class="ft-fg"><label>PIN</label><input class="ft-inp" id="ft-uepin" value="${e.pin||''}" maxlength="4"></div><div class="ft-fg"><label>Vacaciones</label><input class="ft-inp" id="ft-uev" type="number" value="${e.vacation_days||22}"></div><div class="ft-fg"><label>Usados</label><input class="ft-inp" id="ft-uevu" type="number" value="${e.used_vacation_days||0}"></div><div class="ft-fg"><label>Turno</label><select class="ft-inp" id="ft-uesch">${getTurnoOpts(e.schedule)}</select></div><div class="ft-fg"><label>Fecha alta</label><input class="ft-inp" id="ft-uesd" type="date" value="${e.start_date||''}"></div></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center;margin-top:10px" onclick="FichateModule.saveEditEmp(${e.id})">Guardar</button>`);
  },

  async saveEditEmp(id){
    const b={name:document.getElementById('ft-uen').value,dni:document.getElementById('ft-ued').value,email:document.getElementById('ft-uee').value,phone:document.getElementById('ft-uep').value,position:document.getElementById('ft-uepos').value,role:document.getElementById('ft-uer').value,pin:document.getElementById('ft-uepin').value||null,vacation_days:parseInt(document.getElementById('ft-uev').value),used_vacation_days:parseInt(document.getElementById('ft-uevu').value),schedule:document.getElementById('ft-uesch').value,start_date:document.getElementById('ft-uesd').value||null};
    const pw=document.getElementById('ft-uepw').value;if(pw)b.password=pw;
    try{await this.api('employee_update',{method:'PUT',params:{id},body:b});document.querySelector('.ft-mo')?.remove();this.render()}catch(e){alert(e.message)}
  },

  resetPwM(id){
    const e=this.emps.find(x=>x.id===id);if(!e)return;
    this.modal('Resetear Contraseña — '+this.esc(e.name),`<div style="text-align:center;margin-bottom:16px"><div style="font-size:40px;margin-bottom:8px">🔑</div></div><div class="ft-fg"><label>Nueva contraseña</label><input class="ft-inp" id="ft-rpw" value="${e.dni||'1234'}" style="font-size:18px;font-weight:700;text-align:center"></div><button class="ft-btn ft-bp" style="width:100%;justify-content:center" onclick="FichateModule.doResetPw(${e.id})">Resetear</button>`);
  },

  async doResetPw(id){const pw=document.getElementById('ft-rpw')?.value;if(!pw)return alert('Escribe una contraseña');try{await this.api('reset_password',{method:'POST',body:{user_id:id,password:pw}});document.querySelector('.ft-mo')?.remove();alert('✅ Contraseña reseteada');this.render()}catch(e){alert(e.message)}},

  // ══════════════════════════════════════
  // MODAL GENÉRICO
  // ══════════════════════════════════════
  modal(title,body){
    const o=document.createElement('div');o.className='ft-mo';
    o.onclick=e=>{if(e.target===o)o.remove()};
    o.innerHTML=`<div class="ft-mo-c"><div class="ft-mo-h"><h3>${title}</h3><button style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;padding:6px;border-radius:8px" onclick="this.closest('.ft-mo').remove()">✕</button></div><div class="ft-mo-b">${body}</div></div>`;
    document.body.appendChild(o);
  }
};

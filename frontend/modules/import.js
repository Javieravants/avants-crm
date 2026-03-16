// === Módulo Importación Excel ===

const ImportModule = {
  async render() {
    if (!Auth.hasRole('admin', 'supervisor')) {
      document.getElementById('main-content').innerHTML = `
        <h1 class="page-title">Acceso denegado</h1>
        <div class="card text-center" style="padding:64px;"><p class="text-light">No tienes permiso.</p></div>
      `;
      return;
    }

    const container = document.getElementById('main-content');

    let stats = { personas: 0, deals: 0, importaciones: 0 };
    try { stats = await API.get('/import/stats'); } catch {}

    container.innerHTML = `
      <h1 class="page-title">Importar Excel</h1>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
        <div class="card text-center">
          <p style="font-size:28px;font-weight:700;color:var(--accent);">${stats.personas}</p>
          <p class="text-light" style="font-size:13px;">Personas en BD</p>
        </div>
        <div class="card text-center">
          <p style="font-size:28px;font-weight:700;color:#1565c0;">${stats.deals}</p>
          <p class="text-light" style="font-size:13px;">Deals importados</p>
        </div>
        <div class="card text-center">
          <p style="font-size:28px;font-weight:700;color:#2e7d32;">${stats.importaciones}</p>
          <p class="text-light" style="font-size:13px;">Importaciones</p>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:4px;">Subir archivo</h3>
        <p class="text-light" style="font-size:13px;margin-bottom:16px;">
          Excel (.xlsx, .xls) o CSV. Se procesan todas las hojas automáticamente.
          El sistema detecta las columnas por nombre (DNI, Nombre, Póliza, etc.)
        </p>

        <div class="form-group">
          <label>Tipo de importación</label>
          <select class="form-control" id="import-tipo" style="max-width:250px;">
            <option value="ventas">Ventas / Histórico</option>
            <option value="impagos">Impagos (ADESLAS, DKV...)</option>
          </select>
        </div>

        <div class="drop-zone" id="drop-zone">
          <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none;">
          <div class="drop-zone-content">
            <p style="font-size:36px;margin-bottom:8px;">📄</p>
            <p><strong>Arrastra tu Excel aquí</strong></p>
            <p class="text-light" style="font-size:13px;">o haz clic para seleccionar archivo</p>
          </div>
        </div>

        <div id="upload-progress" class="hidden" style="margin-top:16px;">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="progress-fill"></div>
          </div>
          <p class="text-light text-center" style="margin-top:8px;font-size:13px;" id="progress-text">Procesando...</p>
        </div>
      </div>

      <div id="import-result" class="hidden"></div>

      <div class="card" style="margin-top:24px;">
        <h3 style="margin-bottom:16px;">Historial de importaciones</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Archivo</th>
                <th>Tipo</th>
                <th>Hojas</th>
                <th>Filas</th>
                <th>Personas</th>
                <th>Deals</th>
                <th>Errores</th>
              </tr>
            </thead>
            <tbody id="import-logs-tbody">
              <tr><td colspan="8" class="text-center text-light">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.setupDropZone();
    this.loadLogs();
  },

  setupDropZone() {
    const zone = document.getElementById('drop-zone');
    const input = document.getElementById('file-input');

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drop-zone-active');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drop-zone-active');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drop-zone-active');
      const file = e.dataTransfer.files[0];
      if (file) this.uploadFile(file);
    });

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.uploadFile(file);
    });
  },

  async uploadFile(file) {
    const zone = document.getElementById('drop-zone');
    const progress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultDiv = document.getElementById('import-result');

    // Mostrar nombre del archivo
    zone.querySelector('.drop-zone-content').innerHTML = `
      <p style="font-size:36px;margin-bottom:8px;">⏳</p>
      <p><strong>${file.name}</strong></p>
      <p class="text-light" style="font-size:13px;">${(file.size / 1024).toFixed(0)} KB — procesando...</p>
    `;

    progress.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    progressFill.style.width = '30%';
    progressText.textContent = 'Subiendo archivo...';

    const tipo = document.getElementById('import-tipo').value;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    try {
      progressFill.style.width = '60%';
      progressText.textContent = 'Procesando hojas...';

      const token = Auth.getToken();
      const res = await fetch('/api/import/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      progressFill.style.width = '100%';
      progressText.textContent = 'Completado';

      this.showResult(data);
      this.loadLogs();

      // Restaurar drop zone
      setTimeout(() => {
        zone.querySelector('.drop-zone-content').innerHTML = `
          <p style="font-size:36px;margin-bottom:8px;">📄</p>
          <p><strong>Arrastra tu Excel aquí</strong></p>
          <p class="text-light" style="font-size:13px;">o haz clic para seleccionar archivo</p>
        `;
        progress.classList.add('hidden');
        progressFill.style.width = '0%';
      }, 3000);

    } catch (err) {
      progressFill.style.width = '100%';
      progressFill.style.background = '#c62828';
      progressText.textContent = `Error: ${err.message}`;

      zone.querySelector('.drop-zone-content').innerHTML = `
        <p style="font-size:36px;margin-bottom:8px;">❌</p>
        <p><strong>Error al procesar</strong></p>
        <p class="text-light" style="font-size:13px;">${err.message}</p>
      `;
    }
  },

  showResult(data) {
    const div = document.getElementById('import-result');
    div.classList.remove('hidden');

    const t = data.totals;
    const hasErrors = t.errores > 0;

    let hojasHtml = data.hojas.map((h) => `
      <tr>
        <td><strong>${h.nombre}</strong></td>
        <td>${h.filas}</td>
        <td>${h.personas}</td>
        <td>${h.deals}</td>
        <td>${h.errores > 0 ? `<span style="color:#c62828;">${h.errores}</span>` : '0'}</td>
      </tr>
    `).join('');

    div.innerHTML = `
      <div class="card" style="margin-top:16px;border-left:4px solid ${hasErrors ? '#f9a825' : '#2e7d32'};">
        <h3 style="margin-bottom:16px;">Resultado de importación</h3>

        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">
          <div class="text-center">
            <p style="font-size:24px;font-weight:700;color:#1565c0;">${t.filas_procesadas}</p>
            <p class="text-light" style="font-size:12px;">Filas procesadas</p>
          </div>
          <div class="text-center">
            <p style="font-size:24px;font-weight:700;color:#2e7d32;">${t.personas_creadas}</p>
            <p class="text-light" style="font-size:12px;">Personas creadas</p>
          </div>
          <div class="text-center">
            <p style="font-size:24px;font-weight:700;color:var(--accent);">${t.deals_creados}</p>
            <p class="text-light" style="font-size:12px;">Deals importados</p>
          </div>
          <div class="text-center">
            <p style="font-size:24px;font-weight:700;color:#6b7280;">${t.leads_ignorados || 0}</p>
            <p class="text-light" style="font-size:12px;">Leads sin póliza</p>
          </div>
          <div class="text-center">
            <p style="font-size:24px;font-weight:700;color:${hasErrors ? '#c62828' : '#2e7d32'};">${t.errores}</p>
            <p class="text-light" style="font-size:12px;">Errores</p>
          </div>
        </div>

        <h4 style="font-size:14px;margin-bottom:8px;">Detalle por hoja</h4>
        <table>
          <thead><tr><th>Hoja</th><th>Filas</th><th>Personas</th><th>Deals</th><th>Errores</th></tr></thead>
          <tbody>${hojasHtml}</tbody>
        </table>

        ${hasErrors ? `
        <div style="margin-top:16px;padding:12px 16px;background:#fff8e1;border-radius:10px;">
          <p style="font-size:14px;"><strong>${t.errores} error(es) encontrado(s)</strong></p>
          <p class="text-light" style="font-size:13px;margin-top:4px;">
            Puedes descargar los errores desde el historial de importaciones.
          </p>
        </div>` : ''}
      </div>
    `;
  },

  async loadLogs() {
    const tbody = document.getElementById('import-logs-tbody');
    try {
      const logs = await API.get('/import/logs');
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-light">Sin importaciones</td></tr>';
        return;
      }
      tbody.innerHTML = logs.map((l) => `
        <tr>
          <td class="text-light">${new Date(l.created_at).toLocaleString('es-ES')}</td>
          <td><strong>${l.filename}</strong></td>
          <td><span class="badge" style="background:#e3f2fd;color:#1565c0;">${l.tipo}</span></td>
          <td>${l.hojas_procesadas}</td>
          <td>${l.filas_procesadas}</td>
          <td>${l.personas_creadas}</td>
          <td>${l.deals_creados}</td>
          <td>
            ${l.errores > 0
              ? `<a href="#" class="error-download" data-log-id="${l.id}" style="color:#c62828;text-decoration:underline;">${l.errores} errores</a>`
              : '<span style="color:#2e7d32;">0</span>'}
          </td>
        </tr>
      `).join('');

      // Descargar errores
      tbody.querySelectorAll('.error-download').forEach((link) => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = link.dataset.logId;
          try {
            const token = Auth.getToken();
            const res = await fetch(`/api/import/logs/${id}/errors`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error descargando');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `errores_importacion_${id}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            alert('Error descargando: ' + err.message);
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:#c62828">${err.message}</td></tr>`;
    }
  },
};

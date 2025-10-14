// Frontend module for partners management: fetch partners, show cards, handle create/edit with logo upload, and realtime via Socket.IO

const API_BASE = '/api';
let socket;
window.IS_ADMIN = false; // flag simples para controle de admin (frontend only)

async function init() {
  await loadPartners();
  setupUI();
  setupSocket();
}

async function loadPartners() {
  try {
    const res = await fetch(`${API_BASE}/partners`);
    const json = await res.json();
    const partners = json.data || [];
    renderPartners(partners);
    updateStats(partners);
  } catch (err) {
    console.error('Erro ao carregar parceiros', err);
  }
}

function renderPartners(partners) {
  const grid = document.getElementById('partners-grid');
  grid.innerHTML = '';
  partners.forEach(p => {
  const card = document.createElement('div');
  card.className = 'partner-card';
  card.innerHTML = `
      <div class="partner-header">
        <div class="partner-info">
          <h3>${escapeHtml(p.companyName)}</h3>
          <div class="cnpj">${escapeHtml(p.document || '')}</div>
        </div>
        <div class="partner-actions">
          <div class="status-badge ${p.status === 'active' ? 'status-active' : p.status === 'pending' ? 'status-pending' : 'status-inactive'}">${escapeHtml(p.status || '')}</div>
        </div>
      </div>
      <div class="partner-details">
        <div class="detail-row"><div class="detail-label">Responsável</div><div>${escapeHtml(p.responsible || '')}</div></div>
        <div class="detail-row"><div class="detail-label">Email</div><div>${escapeHtml(p.email || '')}</div></div>
        <div class="detail-row"><div class="detail-label">Telefone</div><div>${escapeHtml(p.phone || '')}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:10px;align-items:center;">
          ${p.logo ? `<img src="${p.logo}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(0,0,0,0.1);">` : ''}
          <div style="font-size:0.9rem;color:rgba(255,255,255,0.9)">${p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
        </div>
        <div class="partner-actions">
          ${window.IS_ADMIN ? `<button class="btn btn-sm btn-info" onclick="openEditModal('${p.id}')"><i class="fas fa-edit"></i></button>` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateStats(partners) {
  document.getElementById('total-partners').textContent = partners.length;
  document.getElementById('active-partners').textContent = partners.filter(p => p.status === 'active').length;
  document.getElementById('pending-partners').textContent = partners.filter(p => p.status === 'pending').length;
  const revenue = 0; // placeholder
  document.getElementById('monthly-revenue').textContent = `R$ ${revenue}`;
}

function setupUI() {
  document.getElementById('add-partner-btn').addEventListener('click', () => openCreateModal());
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  document.getElementById('save-btn').addEventListener('click', submitPartner);
  const adminToggle = document.getElementById('admin-toggle');
  if (adminToggle) {
    adminToggle.addEventListener('click', () => {
      window.IS_ADMIN = !window.IS_ADMIN;
      adminToggle.textContent = window.IS_ADMIN ? 'Sair do Admin' : 'Entrar como Admin';
      showNotification(window.IS_ADMIN ? 'Modo Admin ativado' : 'Modo Admin desativado', 'info');
      // re-render partners to update buttons
      loadPartners();
    });
  }
}

function openCreateModal() {
  document.getElementById('modal-title').textContent = 'Novo Parceiro';
  document.getElementById('partner-form').dataset.id = '';
  document.getElementById('company-name').value = '';
  document.getElementById('document').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('responsible').value = '';
  document.getElementById('status').value = 'active';
  document.getElementById('observations').value = '';
  showModal();
}

function openEditModal(id) {
  // fetch partner and populate form
  fetch(`${API_BASE}/partners`).then(r=>r.json()).then(j=>{
    const partner = (j.data||[]).find(p=>p.id===id);
    if (!partner) return alert('Parceiro não encontrado');
    document.getElementById('modal-title').textContent = 'Editar Parceiro';
    document.getElementById('partner-form').dataset.id = id;
    document.getElementById('company-name').value = partner.companyName||'';
    document.getElementById('document').value = partner.document||'';
    document.getElementById('email').value = partner.email||'';
    document.getElementById('phone').value = partner.phone||'';
    document.getElementById('responsible').value = partner.responsible||'';
    document.getElementById('status').value = partner.status||'active';
    document.getElementById('observations').value = partner.observations||'';
    showModal();
  });
}

// Carregar clients de um partner e exibir na aba clients
async function loadPartnerClients(partnerId) {
  try {
    const res = await fetch(`${API_BASE}/partners/${partnerId}/clients`);
    const json = await res.json();
    const clients = json.data || [];
    const container = document.getElementById('partner-clients');
    container.innerHTML = '';
    clients.forEach(cl => {
      const el = document.createElement('div');
      el.className = 'quick-action';

      const title = document.createElement('div');
      title.innerHTML = `<strong>${escapeHtml(cl.name)}</strong>`;

      const doc = document.createElement('div');
      doc.textContent = cl.document || '';

      const value = document.createElement('div');
      value.textContent = `R$ ${cl.contractValue || 0}`;

      const actions = document.createElement('div');
      if (window.IS_ADMIN) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-info';
        btn.textContent = 'Editar';
        // Abrir modal diretamente com os dados do client já carregados
        btn.addEventListener('click', () => openClientModal(cl));
        actions.appendChild(btn);
      }

      el.appendChild(title);
      el.appendChild(doc);
      el.appendChild(value);
      el.appendChild(actions);
      container.appendChild(el);
    });
  } catch (e) { console.error(e); }
}

function openClientEdit(clientId) {
  // buscar client a partir do backend
  fetch(`${API_BASE}/partners`) // obter all e localizar
    .then(r=>r.json())
    .then(async j=>{
      // buscar clients endpoint direto (procurar partnerId que contenha o client)
      // para simplificar, chamar GET /api/partners and then iterate
      const allPartners = j.data || [];
      let found;
      for (const p of allPartners) {
        const resp = await fetch(`${API_BASE}/partners/${p.id}/clients`);
        const js = await resp.json();
        const cl = (js.data || []).find(c=>c.id===clientId);
        if (cl) { found = cl; break; }
      }
      if (!found) return alert('Cliente não encontrado');
      // abrir modal de edição de cliente
      openClientModal(found);
    });
}

function openClientModal(client) {
  // criar modal dinâmico se não existir
  let modal = document.getElementById('client-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'client-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `\
      <div class="modal"><div class="modal-header"><h3 class="modal-title">Editar Cliente</h3><button class="modal-close" id="client-close">&times;</button></div><div class="modal-body"><form id="client-form"><div class="form-grid"><div class="form-group"><label class="form-label">Nome</label><input class="form-control" id="client-name" required></div><div class="form-group"><label class="form-label">Documento</label><input class="form-control" id="client-document"></div><div class="form-group"><label class="form-label">Valor do Contrato</label><input class="form-control" id="client-contract" type="number"></div><div class="form-group"><label class="form-label">Status</label><select class="form-control" id="client-status"><option value="active">Ativo</option><option value="in_contract">Em Contrato</option><option value="cancelled">Cancelado</option></select></div></div></form></div><div class="modal-footer"><button class="btn" id="client-cancel">Cancelar</button><button class="btn btn-primary" id="client-save">Salvar</button></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('client-close').addEventListener('click', ()=>modal.classList.remove('active'));
    document.getElementById('client-cancel').addEventListener('click', ()=>modal.classList.remove('active'));
    document.getElementById('client-save').addEventListener('click', async ()=>{
      const id = modal.dataset.clientId;
      const payload = { name: document.getElementById('client-name').value, document: document.getElementById('client-document').value, contractValue: Number(document.getElementById('client-contract').value||0), status: document.getElementById('client-status').value };
      const resp = await fetch(`${API_BASE}/clients/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const js = await resp.json();
      if (js.success) {
        modal.classList.remove('active');
        showNotification('Cliente atualizado', 'success');
      } else showNotification('Erro ao atualizar cliente', 'error');
    });
  }
  // preencher campos
  modal.dataset.clientId = client.id;
  modal.querySelector('#client-name').value = client.name||'';
  modal.querySelector('#client-document').value = client.document||'';
  modal.querySelector('#client-contract').value = client.contractValue||0;
  modal.querySelector('#client-status').value = client.status||'active';
  modal.classList.add('active');
}

function showModal() { document.getElementById('partner-modal').classList.add('active'); }
function closeModal() { document.getElementById('partner-modal').classList.remove('active'); }

async function submitPartner() {
  const form = document.getElementById('partner-form');
  const id = form.dataset.id;
  const fd = new FormData();
  fd.append('companyName', document.getElementById('company-name').value);
  fd.append('document', document.getElementById('document').value);
  fd.append('email', document.getElementById('email').value);
  fd.append('phone', document.getElementById('phone').value);
  fd.append('responsible', document.getElementById('responsible').value);
  fd.append('status', document.getElementById('status').value);
  fd.append('observations', document.getElementById('observations').value);

  // file input not present in HTML; create one dynamically to allow logo upload
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = 'logo';

  // try to read file from user (open dialog)
  fileInput.onchange = async () => {
    if (fileInput.files.length > 0) fd.append('logo', fileInput.files[0]);

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_BASE}/partners/${id}` : `${API_BASE}/partners`;
      const res = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (json.success) {
        closeModal();
        // optimistic update will be handled by socket event
        showNotification('Parceiro salvo com sucesso', 'success');
      } else {
        showNotification('Erro ao salvar parceiro', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Erro ao salvar parceiro', 'error');
    }
  };

  // trigger file picker; if user cancels, still submit without file
  fileInput.click();
  // fallback: submit without file after short timeout
  setTimeout(async () => {
    if (!fd.get('logo')) {
      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/partners/${id}` : `${API_BASE}/partners`;
        const res = await fetch(url, { method, body: fd });
        const json = await res.json();
        if (json.success) {
          closeModal();
          showNotification('Parceiro salvo com sucesso', 'success');
        } else {
          showNotification('Erro ao salvar parceiro', 'error');
        }
      } catch (err) {
        console.error(err);
        showNotification('Erro ao salvar parceiro', 'error');
      }
    }
  }, 2000);
}

function showNotification(msg, type='info') {
  const container = document.getElementById('notification-container');
  const el = document.createElement('div');
  el.className = `notification show ${type}`;
  el.innerHTML = `<div class="notification-icon"><i class="fas ${type==='success'?'fa-check':'fa-info-circle'}"></i></div><div>${escapeHtml(msg)}</div>`;
  container.appendChild(el);
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),500); }, 3000);
}

function setupSocket() {
  try {
    socket = io();
    socket.on('connect', () => console.log('socket connected'));
    socket.on('partner:created', (p) => { loadPartners(); showNotification('Novo parceiro adicionado', 'success'); });
    socket.on('partner:updated', (p) => { loadPartners(); showNotification('Parceiro atualizado', 'info'); });
  } catch (e) { console.warn('Socket.IO não disponível', e); }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"]+/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s] || s));
}

// Inicializar
window.addEventListener('DOMContentLoaded', init);

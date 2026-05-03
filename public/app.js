let allStickers = [];
let currentFilter = 'all'; 
let currentTab = 'Especiais'; 
let groupsList = [];
let authMode = 'login'; // 'login' or 'register'

// Função para resolver URLs baseadas no diretório atual (Proxy reverso)
function getBaseUrl(path) {
    let base = window.location.pathname;
    if (base.endsWith('.html')) base = base.substring(0, base.lastIndexOf('/'));
    if (!base.endsWith('/')) base += '/';
    if (path.startsWith('/')) path = path.substring(1);
    return base + path;
}

// Verifica token no carregamento
document.addEventListener('DOMContentLoaded', () => {
    setupFilters();
    
    const mobileTabSelect = document.getElementById('mobile-tab-select');
    if(mobileTabSelect) {
        mobileTabSelect.addEventListener('change', (e) => {
            currentTab = e.target.value;
            renderTabs();
            renderStickers();
        });
    }
    
    
    const token = localStorage.getItem('token');
    if (token) {
        showScreen('app');
        fetchStickers();
        checkAdmin();
        document.getElementById('nav-username').textContent = localStorage.getItem('username');
    } else {
        showScreen('auth');
    }

    const originalPrint = window.print;
    window.print = function() {
        preparePrint();
        originalPrint();
    };

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(getBaseUrl('/sw.js')).then(reg => {
                console.log('SW registrado com sucesso:', reg.scope);
            }).catch(err => {
                console.log('Erro ao registrar SW:', err);
            });
        });
    }
});

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Navegação entre Telas
function showScreen(screen) {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-app').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    
    document.getElementById('nav-controls').classList.remove('hidden');
    
    if (screen === 'auth') {
        document.getElementById('view-auth').classList.remove('hidden');
        document.getElementById('main-nav').classList.add('hidden');
        
    } else if (screen === 'app') {
        document.getElementById('main-nav').classList.remove('hidden');
        
        document.getElementById('view-app').classList.remove('hidden');
        document.getElementById('view-app').classList.add('flex');
        document.getElementById('view-app').classList.add('flex-col');
    } else if (screen === 'admin') {
        document.getElementById('view-admin').classList.remove('hidden');
        loadAdminUsers();
    }
}

function checkAdmin() {
    if (localStorage.getItem('role') === 'admin') {
        document.getElementById('btn-admin-nav').classList.remove('hidden');
    } else {
        document.getElementById('btn-admin-nav').classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    showScreen('auth');
}

// Autenticação
async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const errDiv = document.getElementById('auth-error');
    const sucDiv = document.getElementById('auth-success');
    
    errDiv.classList.add('hidden');
    sucDiv.classList.add('hidden');
    
    const url = getBaseUrl(authMode === 'login' ? '/api/auth/login' : '/api/auth/register');
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
            errDiv.textContent = data.error;
            errDiv.classList.remove('hidden');
            return;
        }
        
        if (authMode === 'register') {
            sucDiv.textContent = 'Conta criada! Faça login agora.';
            sucDiv.classList.remove('hidden');
            document.getElementById('auth-password').value = '';
        } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);
            document.getElementById('nav-username').textContent = data.username;
            checkAdmin();
            fetchStickers();
            showScreen('app');
        }
    } catch (err) {
        errDiv.textContent = 'Erro de conexão com o servidor.';
        errDiv.classList.remove('hidden');
    }
}

// Mudar Senha
function showChangePassword() {
    document.getElementById('modal-password').classList.remove('hidden');
    document.getElementById('pw-msg').textContent = '';
    document.getElementById('new-password').value = '';
}

async function submitChangePassword() {
    const newPassword = document.getElementById('new-password').value;
    const msgDiv = document.getElementById('pw-msg');
    
    try {
        const res = await fetch(getBaseUrl('/api/auth/change-password'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ newPassword })
        });
        const data = await res.json();
        
        if (!res.ok) {
            msgDiv.className = 'text-slate-800 text-sm mb-4 font-medium';
            msgDiv.textContent = data.error;
        } else {
            msgDiv.className = 'text-[#009c3b] text-sm mb-4 font-medium';
            msgDiv.textContent = 'Senha alterada com sucesso!';
            setTimeout(() => document.getElementById('modal-password').classList.add('hidden'), 2000);
        }
    } catch (e) {
        msgDiv.textContent = 'Erro de conexão';
    }
}

// Funções do Álbum (Mesma lógica, mas com auth header)
async function fetchStickers() {
    try {
        const response = await fetch(getBaseUrl('/api/stickers'), { headers: getAuthHeaders() });
        if (response.status === 401 || response.status === 403) return logout();
        
        const data = await response.json();
        allStickers = data.stickers;
        
        const uniqueGroups = new Set();
        allStickers.forEach(s => uniqueGroups.add(s.group_name));
        groupsList = Array.from(uniqueGroups);
        
        if (!groupsList.includes(currentTab) && groupsList.length > 0) {
            currentTab = groupsList[0];
        }

        updateDashboard();
        renderTabs();
        renderStickers();
    } catch (error) {
        console.error('Erro ao buscar figurinhas:', error);
    }
}

function updateDashboard() {
    const total = allStickers.length;
    const obtained = allStickers.filter(s => s.obtained).length;
    const duplicates = allStickers.reduce((acc, s) => acc + s.duplicates, 0);
    const missing = total - obtained;
    const percent = total > 0 ? ((obtained / total) * 100).toFixed(1) : 0;

    document.getElementById('stat-obtained').textContent = obtained;
    document.getElementById('stat-missing').textContent = missing;
    document.getElementById('stat-duplicates').textContent = duplicates;
    
    document.getElementById('total-obtained').textContent = obtained;
    document.getElementById('total-stickers').textContent = total;
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('progress-bar').style.width = `${percent}%`;
}

function setupFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    const mobileFilter = document.getElementById('mobile-filter-select');
    
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setFilter(e.target.getAttribute('data-filter'));
            
            btns.forEach(b => {
                b.classList.remove('bg-[#002776]', 'text-white', 'active', 'shadow-sm');
                b.classList.add('bg-transparent', 'text-slate-600');
            });
            e.target.classList.add('bg-[#002776]', 'text-white', 'active', 'shadow-sm');
            e.target.classList.remove('bg-transparent', 'text-slate-600', 'hover:bg-slate-200');
            
            if(mobileFilter) mobileFilter.value = currentFilter;
        });
    });

    if(mobileFilter) {
        mobileFilter.addEventListener('change', (e) => {
            setFilter(e.target.value);
            
            btns.forEach(b => {
                if (b.getAttribute('data-filter') === currentFilter) {
                    b.classList.add('bg-[#002776]', 'text-white', 'active', 'shadow-sm');
                    b.classList.remove('bg-transparent', 'text-slate-600');
                } else {
                    b.classList.remove('bg-[#002776]', 'text-white', 'active', 'shadow-sm');
                    b.classList.add('bg-transparent', 'text-slate-600');
                }
            });
        });
    }
}

function setFilter(filter) {
    currentFilter = filter;
    renderStickers();
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    const mobileSelect = document.getElementById('mobile-tab-select');
    
    if(container) container.innerHTML = '';
    if(mobileSelect) mobileSelect.innerHTML = '';
    
    groupsList.forEach(group => {
        const btn = document.createElement('button');
        const isActive = group === currentTab;
        
        btn.className = `px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap border-2 ${
            isActive 
            ? 'bg-[#002776] text-white border-[#002776]' 
            : 'bg-white text-slate-500 hover:bg-[#002776] hover:text-white border-slate-200 hover:border-[#002776]'
        }`;
        btn.textContent = group;
        btn.onclick = () => {
            currentTab = group;
            renderTabs();
            renderStickers();
        };
        if(container) container.appendChild(btn);
        
        if(mobileSelect) {
            const opt = document.createElement('option');
            opt.value = group;
            opt.textContent = group;
            if (isActive) opt.selected = true;
            mobileSelect.appendChild(opt);
        }
    });
}

function renderStickers() {
    const appDiv = document.getElementById('app-grid');
    appDiv.innerHTML = '';
    
    let tabStickers = allStickers.filter(s => s.group_name === currentTab);
    
    let filteredStickers = tabStickers;
    if (currentFilter === 'missing') {
        filteredStickers = tabStickers.filter(s => !s.obtained);
    } else if (currentFilter === 'duplicates') {
        filteredStickers = tabStickers.filter(s => s.duplicates > 0);
    }
    
    if (filteredStickers.length === 0) {
        appDiv.innerHTML = `<div class="text-center py-20 animate-fade-in border border-slate-200 border-dashed rounded-lg">
            <p class="text-slate-400">Nenhuma figurinha aqui com o filtro atual.</p>
        </div>`;
        return;
    }

    const grouped = {};
    filteredStickers.forEach(s => {
        if (!grouped[s.team_name]) {
            grouped[s.team_name] = { flag: s.team_flag_url, stickers: [] };
        }
        grouped[s.team_name].stickers.push(s);
    });

    for (const [teamName, data] of Object.entries(grouped)) {
        const section = document.createElement('section');
        section.className = 'mb-10 animate-fade-in';
        
        let headerHTML = `<div class="flex items-center gap-3 mb-4 border-b border-slate-200 pb-2">`;
        if (data.flag && data.flag !== "null") {
            headerHTML += `<img src="${data.flag}" alt="${teamName}" class="w-8 h-auto rounded-sm border border-slate-200 shadow-sm object-cover">`;
        }
        headerHTML += `<h2 class="text-xl font-bold text-slate-800">${teamName}</h2>`;
        headerHTML += `<span class="text-xs font-medium text-slate-400 ml-auto bg-white px-2 py-1 rounded">${data.stickers.length}</span>`;
        headerHTML += `</div>`;
        
        const header = document.createElement('div');
        header.innerHTML = headerHTML;
        
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';
        
        data.stickers.forEach(sticker => {
            const isObtained = sticker.obtained;
            const cardClass = isObtained ? 'sticker-obtained' : 'sticker-missing';
            const checkIcon = isObtained ? 'text-white' : 'text-slate-300';
            const numColor = isObtained ? 'text-white' : 'text-slate-400';
            
            const removeBtnAttrs = (!isObtained || sticker.duplicates === 0) 
                ? 'disabled class="w-7 h-7 flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed rounded"' 
                : 'class="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#002776] rounded transition"';
                
            const addBtnAttrs = !isObtained 
                ? 'disabled class="w-7 h-7 flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed rounded"' 
                : 'class="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#002776] rounded transition"';
            
            const card = document.createElement('div');
            card.className = `sticker-card ${cardClass} border rounded-lg p-3 flex flex-col justify-between h-32 relative cursor-pointer`;
            card.onclick = () => toggleObtained(sticker.number, !isObtained);
            
            let displayNum = sticker.number;
            
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <span class="text-xl font-bold ${numColor}">${displayNum}</span>
                    <button class="p-1 hover:bg-[#002776] rounded transition" title="Marcar como ${isObtained ? 'Faltante' : 'Obtida'}">
                        <svg class="w-5 h-5 ${checkIcon}" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div class="mt-auto flex justify-between items-center bg-white/60 rounded p-1 border border-slate-200" onclick="event.stopPropagation()">
                    <button onclick="updateDuplicates('${sticker.number}', 'remove')" ${removeBtnAttrs}>-</button>
                    <span class="text-xs font-bold text-[#002776]">${sticker.duplicates} rep.</span>
                    <button onclick="updateDuplicates('${sticker.number}', 'add')" ${addBtnAttrs}>+</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        section.appendChild(header);
        section.appendChild(grid);
        appDiv.appendChild(section);
    }
}

async function toggleObtained(number, newValue) {
    await fetch(getBaseUrl(`/api/stickers/${number}/status`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ obtained: newValue })
    });
    const sticker = allStickers.find(s => s.number == number);
    if (sticker) sticker.obtained = newValue;
    updateDashboard();
    renderStickers();
}

async function updateDuplicates(number, action) {
    await fetch(getBaseUrl(`/api/stickers/${number}/duplicates`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: action })
    });
    const sticker = allStickers.find(s => s.number == number);
    if (sticker) {
        if (action === 'add') sticker.duplicates++;
        else if (action === 'remove' && sticker.duplicates > 0) sticker.duplicates--;
    }
    updateDashboard();
    renderStickers();
}

function preparePrint() {
    const printContent = document.getElementById('print-content');
    const printTitle = document.getElementById('print-title');
    
    printTitle.textContent = "Checklist Completo do Álbum";
    let listHTML = '<div class="print-grid">';
    
    allStickers.forEach(s => {
        let n = s.number;
        
        let cellClass = 'print-cell';
        cellClass += s.obtained ? ' obtained' : ' missing';
        
        listHTML += `<div class="${cellClass}">${n}</div>`;
    });
    
    listHTML += `</div>`;
    printContent.innerHTML = listHTML;
}

// Funções do Painel Admin
async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-table');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>';
    
    try {
        const res = await fetch(getBaseUrl('/api/admin/users'), { headers: getAuthHeaders() });
        const data = await res.json();
        
        tbody.innerHTML = '';
        data.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#0A3B21] hover:bg-white/50';
            tr.innerHTML = `
                <td class="py-3 px-4">${u.id}</td>
                <td class="py-3 px-4 font-medium text-slate-800">${u.username}</td>
                <td class="py-3 px-4"><span class="px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-indigo-900 text-indigo-300' : 'bg-[#002776] text-slate-700'}">${u.role}</span></td>
                <td class="py-3 px-4 text-right flex justify-end gap-2">
                    <button onclick="adminReset(${u.id})" class="px-2 py-1 bg-amber-600 hover:bg-amber-700 rounded text-xs text-white" title="Resetar Álbum">Zerar</button>
                    <button onclick="adminTempPass(${u.id})" class="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs text-white" title="Senha Temporária">Senha</button>
                    <button onclick="adminDelete(${u.id})" class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white" title="Excluir Usuário" ${u.role === 'admin' ? 'disabled' : ''}>Del</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-800">Erro ao carregar usuários.</td></tr>';
    }
}

async function adminAction(url, confirmMsg) {
    if (!confirm(confirmMsg)) return;
    try {
        const res = await fetch(getBaseUrl(url), { method: 'POST', headers: getAuthHeaders() });
        const data = await res.json();
        alert(data.message || data.error);
        if (url.includes('DELETE')) loadAdminUsers(); // update table if deleted
    } catch (e) {
        alert('Erro na requisição');
    }
}

async function adminReset(id) {
    adminAction(`/api/admin/users/${id}/reset`, 'Tem certeza que deseja zerar o álbum deste usuário?');
}

async function adminTempPass(id) {
    adminAction(`/api/admin/users/${id}/temp-password`, 'Definir senha temporária (Temp1234)?');
}

async function adminDelete(id) {
    if (!confirm('ATENÇÃO: Deseja EXCLUIR completamente este usuário e seu álbum?')) return;
    try {
        const res = await fetch(getBaseUrl(`/api/admin/users/${id}`), { method: 'DELETE', headers: getAuthHeaders() });
        const data = await res.json();
        alert(data.message || data.error);
        loadAdminUsers();
    } catch (e) {
        alert('Erro na requisição');
    }
}

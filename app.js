const API_BASE = 'http://localhost:3000';
let allReports = []; 
let selectedReportId = null;

// פונקציה למעבר בין לשוניות (Tabs)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
    if(btn) btn.classList.add('active');

    if (tabId === 'manage-tab') {
        loadReports();
    }
}

function getStatusClass(status) {
    return status ? status.replace(/\s+/g, '-') : '';
}

function updateDashboardCounters(reports) {
    document.getElementById('count-all').innerText = reports.length;
    document.getElementById('count-pending').innerText = reports.filter(r => r.status === 'ממתין לאימות').length;
    document.getElementById('count-progress').innerText = reports.filter(r => r.status === 'בטיפול').length;
    document.getElementById('count-done').innerText = reports.filter(r => r.status === 'טופל').length;
}

async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/reports`);
        allReports = await response.json();
        
        updateDashboardCounters(allReports);
        filterReports(); 
    } catch (error) {
        console.error("שגיאה בתקשורת עם השרת", error);
    }
}

function filterReports() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const listEl = document.getElementById('reportsList');
    listEl.innerHTML = '';

    const filtered = allReports.filter(report => {
        const matchesStatus = (statusFilter === 'ALL' || report.status === statusFilter);
        const matchesSearch = (
            report.reporterName.toLowerCase().includes(searchVal) ||
            report.address.toLowerCase().includes(searchVal) ||
            report.damageType.toLowerCase().includes(searchVal) ||
            report.description.toLowerCase().includes(searchVal)
        );
        return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = '<p style="color:var(--text-light); text-align:center; padding:20px;">לא נמצאו דיווחים מתאימים.</p>';
        return;
    }

    filtered.forEach(report => {
        const div = document.createElement('div');
        const statusClass = getStatusClass(report.status);
        const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString('he-IL') : 'אין תאריך';
        
        div.className = `report-item ${selectedReportId === report.id ? 'active' : ''}`;
        div.onclick = () => showReportDetails(report.id);
        div.innerHTML = `
            <span class="timestamp">${dateStr}</span>
            <div style="font-weight: bold; font-size: 1.05em; margin-bottom: 4px;">${report.damageType}</div>
            <div style="color: var(--text-light); font-size: 0.9em; margin-bottom: 4px;">${report.address}</div>
            <div style="font-size: 0.85em;">מדווח: ${report.reporterName}</div>
            <span class="status-badge status-${statusClass}">${report.status}</span>
        `;
        listEl.appendChild(div);
    });
}

// שליחת הטופס
document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        reporterName: document.getElementById('reporterName').value,
        address: document.getElementById('address').value,
        damageType: document.getElementById('damageType').value,
        description: document.getElementById('description').value
    };
    
    await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    e.target.reset(); 
    alert('הדיווח נשלח בהצלחה ונקלט במערכת!');
    switchTab('manage-tab'); 
});

async function showReportDetails(id) {
    const response = await fetch(`${API_BASE}/reports/${id}`);
    const report = await response.json();
    selectedReportId = id;
    const statusClass = getStatusClass(report.status);
    const fullTimeStr = report.createdAt ? new Date(report.createdAt).toLocaleString('he-IL') : 'לא ידוע';
    
    document.getElementById('reportDetails').innerHTML = `
        <div class="details-row"><strong>מזהה פניה:</strong> #${report.id}</div>
        <div class="details-row"><strong>תאריך דיווח:</strong> ${fullTimeStr}</div>
        <div class="details-row"><strong>שם המדווח:</strong> ${report.reporterName}</div>
        <div class="details-row"><strong>כתובת:</strong> ${report.address}</div>
        <div class="details-row"><strong>סוג נזק:</strong> ${report.damageType}</div>
        <div class="details-row"><strong>תיאור נזק:</strong> <p class="details-description-box">${report.description}</p></div>
        <div class="details-row"><strong>סטטוס נוכחי:</strong> <span class="status-badge status-${statusClass}">${report.status}</span></div>
    `;
    
    const selectEl = document.getElementById('statusSelect');
    selectEl.innerHTML = '';
    
    if (report.status === 'ממתין לאימות') {
        selectEl.innerHTML = `
            <option value="בטיפול">העבר לסטטוס: בטיפול</option>
            <option value="טופל">העבר לסטטוס: טופל</option>
        `;
    } else if (report.status === 'בטיפול') {
        selectEl.innerHTML = `
            <option value="בטיפול" selected>בטיפול (ללא שינוי)</option>
            <option value="טופל">העבר לסטטוס: טופל</option>
        `;
    } else {
        selectEl.innerHTML = `
            <option value="בטיפול">החזר לטיפול חוזר</option>
            <option value="טופל" selected>טופל (סגור)</option>
        `;
    }
    
    document.getElementById('detailsPanel').style.display = 'block';
    filterReports(); 
}

function closeDetails() {
    document.getElementById('detailsPanel').style.display = 'none';
    selectedReportId = null;
    filterReports();
}

async function updateStatus() {
    if (!selectedReportId) return;
    const newStatus = document.getElementById('statusSelect').value;
    
    await fetch(`${API_BASE}/reports/${selectedReportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    
    await loadReports(); 
    showReportDetails(selectedReportId); 
}

// טעינה ראשונית
loadReports();
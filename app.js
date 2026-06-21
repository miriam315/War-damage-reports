const express = require('express');
const path = require('path');
const app = express();

// פתרון CORS: מאפשר לדפדפן לגשת לשרת גם מקובץ HTML מקומי שפתוח ישירות
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let reports = [];
let nextId = 1;

// GET /reports - קבלת כל הדיווחים
app.get('/reports', (req, res) => {
    res.json(reports);
});

// POST /reports - הוספת דיווח חדש
app.post('/reports', (req, res) => {
    const { reporterName, address, damageType, description } = req.body;
    
    const newReport = {
        id: nextId++,
        reporterName,
        address,
        damageType,
        description,
        status: 'ממתין לאימות'
    };
    
    reports.push(newReport);
    res.status(201).json(newReport);
});

// GET /reports/{id} - קבלת דיווח לפי מזהה
app.get('/reports/:id', (req, res) => {
    const report = reports.find(r => r.id === parseInt(req.params.id));
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
});

// PATCH /reports/{id}/status - עדכון סטטוס לדיווח
app.patch('/reports/:id/status', (req, res) => {
    const { status } = req.body;
    const report = reports.find(r => r.id === parseInt(req.params.id));
    
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    if (status === 'ממתין לאימות' || status === 'בטיפול') {
        report.status = status;
        res.json(report);
    } else {
        res.status(400).json({ error: 'Invalid status' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
const express = require('express');
const path = require('path');
const fs = require('fs'); // רכיב לעבודה עם קבצים
const app = express();

const FILE_PATH = path.join(__dirname, 'reports.json');

// פונקציית עזר לקריאת הדיווחים מהקובץ
function readReportsFromFile() {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            // אם הקובץ לא קיים, ניצור אותו עם מערך ריק
            fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("שגיאה בקריאת הקובץ, מחזיר מערך ריק", error);
        return [];
    }
}

// פונקציית עזר לשמירת הדיווחים לקובץ
function writeReportsToFile(reports) {
    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify(reports, null, 2));
    } catch (error) {
        console.error("שגיאה בכתיבה לקובץ", error);
    }
}

// הגדרת CORS לאפשר עבודה מקובץ HTML מקומי
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

// GET /reports - שליפת כל הדיווחים מהקובץ
app.get('/reports', (req, res) => {
    const reports = readReportsFromFile();
    res.json(reports);
});

// POST /reports - יצירת דיווח חדש עם חותמת זמן
app.post('/reports', (req, res) => {
    const { reporterName, address, damageType, description } = req.body;
    const reports = readReportsFromFile();
    
    // מציאת ה-ID הגבוה ביותר כדי להמשיך ממנו
    const maxId = reports.reduce((max, r) => r.id > max ? r.id : max, 0);

    const newReport = {
        id: maxId + 1,
        reporterName,
        address,
        damageType,
        description,
        status: 'ממתין לאימות',
        createdAt: new Date().toISOString() // הוספת תאריך ושעה אוטומטיים
    };
    
    reports.push(newReport);
    writeReportsToFile(reports); // שמירה לקובץ
    res.status(201).json(newReport);
});

// GET /reports/{id}
app.get('/reports/:id', (req, res) => {
    const reports = readReportsFromFile();
    const report = reports.find(r => r.id === parseInt(req.params.id));
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
});

// PATCH /reports/{id}/status
app.patch('/reports/:id/status', (req, res) => {
    const { status } = req.body;
    const reports = readReportsFromFile();
    const report = reports.find(r => r.id === parseInt(req.params.id));
    
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    const allowedStatuses = ['ממתין לאימות', 'בטיפול', 'טופל'];
    if (allowedStatuses.includes(status)) {
        report.status = status;
        writeReportsToFile(reports); // שמירת השינוי לקובץ
        res.json(report);
    } else {
        res.status(400).json({ error: 'Invalid status' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
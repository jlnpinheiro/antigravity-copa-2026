const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-copa-2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar banco de dados SQLite
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS stickers (
                number TEXT PRIMARY KEY,
                order_index INTEGER,
                group_name TEXT,
                team_name TEXT,
                team_flag_url TEXT,
                team_shield_url TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS user_stickers (
                user_id INTEGER,
                sticker_number TEXT,
                obtained BOOLEAN DEFAULT 0,
                duplicates INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, sticker_number),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (sticker_number) REFERENCES stickers(number)
            )`);
            
            checkAndSeedData();
        });
    }
});

// Grupos
const groupsData = {
    'A': [ {name: 'México', code: 'mx', prefix: 'MEX'}, {name: 'África do Sul', code: 'za', prefix: 'RSA'}, {name: 'Coreia do Sul', code: 'kr', prefix: 'KOR'}, {name: 'Tchéquia', code: 'cz', prefix: 'CZE'} ],
    'B': [ {name: 'Canadá', code: 'ca', prefix: 'CAN'}, {name: 'Bósnia e Herz.', code: 'ba', prefix: 'BIH'}, {name: 'Catar', code: 'qa', prefix: 'QAT'}, {name: 'Suíça', code: 'ch', prefix: 'SUI'} ],
    'C': [ {name: 'Brasil', code: 'br', prefix: 'BRA'}, {name: 'Marrocos', code: 'ma', prefix: 'MAR'}, {name: 'Haiti', code: 'ht', prefix: 'HAI'}, {name: 'Escócia', code: 'gb-sct', prefix: 'SCO'} ],
    'D': [ {name: 'EUA', code: 'us', prefix: 'USA'}, {name: 'Paraguai', code: 'py', prefix: 'PAR'}, {name: 'Austrália', code: 'au', prefix: 'AUS'}, {name: 'Turquia', code: 'tr', prefix: 'TUR'} ],
    'E': [ {name: 'Alemanha', code: 'de', prefix: 'GER'}, {name: 'Curaçau', code: 'cw', prefix: 'CUW'}, {name: 'Costa do Marfim', code: 'ci', prefix: 'CIV'}, {name: 'Equador', code: 'ec', prefix: 'ECU'} ],
    'F': [ {name: 'Holanda', code: 'nl', prefix: 'NED'}, {name: 'Japão', code: 'jp', prefix: 'JPN'}, {name: 'Suécia', code: 'se', prefix: 'SWE'}, {name: 'Tunísia', code: 'tn', prefix: 'TUN'} ],
    'G': [ {name: 'Bélgica', code: 'be', prefix: 'BEL'}, {name: 'Egito', code: 'eg', prefix: 'EGY'}, {name: 'Irã', code: 'ir', prefix: 'IRN'}, {name: 'Nova Zelândia', code: 'nz', prefix: 'NZL'} ],
    'H': [ {name: 'Espanha', code: 'es', prefix: 'ESP'}, {name: 'Cabo Verde', code: 'cv', prefix: 'CPV'}, {name: 'Arábia Saudita', code: 'sa', prefix: 'KSA'}, {name: 'Uruguai', code: 'uy', prefix: 'URU'} ],
    'I': [ {name: 'França', code: 'fr', prefix: 'FRA'}, {name: 'Senegal', code: 'sn', prefix: 'SEN'}, {name: 'Iraque', code: 'iq', prefix: 'IRQ'}, {name: 'Noruega', code: 'no', prefix: 'NOR'} ],
    'J': [ {name: 'Argentina', code: 'ar', prefix: 'ARG'}, {name: 'Argélia', code: 'dz', prefix: 'ALG'}, {name: 'Áustria', code: 'at', prefix: 'AUT'}, {name: 'Jordânia', code: 'jo', prefix: 'JOR'} ],
    'K': [ {name: 'Portugal', code: 'pt', prefix: 'POR'}, {name: 'RD do Congo', code: 'cd', prefix: 'COD'}, {name: 'Uzbequistão', code: 'uz', prefix: 'UZB'}, {name: 'Colômbia', code: 'co', prefix: 'COL'} ],
    'L': [ {name: 'Inglaterra', code: 'gb-eng', prefix: 'ENG'}, {name: 'Croácia', code: 'hr', prefix: 'CRO'}, {name: 'Gana', code: 'gh', prefix: 'GHA'}, {name: 'Panamá', code: 'pa', prefix: 'PAN'} ]
};

function getFlagUrl(code) {
    if(!code) return null;
    return `https://flagcdn.com/w80/${code}.png`;
}

async function checkAndSeedData() {
    // Verificar stickers
    db.get("SELECT COUNT(*) as count FROM stickers", async (err, row) => {
        if (err) return console.error(err);
        if (row.count === 0) {
            console.log("Populando banco de dados com figurinhas bases...");
            const stmt = db.prepare("INSERT INTO stickers (number, order_index, group_name, team_name, team_flag_url, team_shield_url) VALUES (?, ?, ?, ?, ?, ?)");
            let orderIndex = 1;
            
            // 1. FWC 00 to 08
            for (let i = 0; i <= 8; i++) {
                const num = `FWC ${i.toString().padStart(2, '0')}`;
                stmt.run(num, orderIndex++, 'FIFA World Cup History (FWC)', 'FIFA World Cup History (FWC)', null, null);
            }
            
            // 2. Teams 1 to 20
            for (const [groupLetter, teams] of Object.entries(groupsData)) {
                const groupName = `Grupo ${groupLetter}`;
                for (const team of teams) {
                    for (let i = 1; i <= 20; i++) {
                        const num = `${team.prefix} ${i}`;
                        stmt.run(num, orderIndex++, groupName, team.name, getFlagUrl(team.code), null);
                    }
                }
            }
            
            // 3. FWC 09 to 19
            for (let i = 9; i <= 19; i++) {
                const num = `FWC ${i.toString().padStart(2, '0')}`;
                stmt.run(num, orderIndex++, 'FIFA World Cup History (FWC)', 'FIFA World Cup History (FWC)', null, null);
            }
            
            // 4. Coca-Cola CC1 to CC14
            for (let i = 1; i <= 14; i++) {
                const num = `CC${i}`;
                stmt.run(num, orderIndex++, 'Figurinhas Coca-cola', 'Figurinhas Coca-cola', null, null);
            }
            
            stmt.finalize();
            console.log("Banco de figurinhas populado.");
        }
    });

    // Criar Admin padrão
    db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'", async (err, row) => {
        if (row.count === 0) {
            const hash = await bcrypt.hash('Surf1st@', 10);
            db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin', hash, 'admin']);
            console.log("Usuário ADMIN criado com sucesso.");
        }
    });
}

// Middleware de Autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    next();
}

// Rotas de Autenticação
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || username.length > 10) return res.status(400).json({ error: 'Login deve ter no máximo 10 caracteres' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' }); 

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Usuário já existe' });
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Usuário criado com sucesso' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Usuário não encontrado' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Senha incorreta' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role, username: user.username });
    });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
    
    const hash = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Senha atualizada' });
    });
});

// Rotas do Usuário (Álbum)
app.get('/api/stickers', authenticateToken, (req, res) => {
    const query = `
        SELECT s.*, 
               COALESCE(us.obtained, 0) as obtained, 
               COALESCE(us.duplicates, 0) as duplicates
        FROM stickers s
        LEFT JOIN user_stickers us ON s.number = us.sticker_number AND us.user_id = ?
        ORDER BY s.order_index ASC
    `;
    db.all(query, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ stickers: rows });
    });
});

app.post('/api/stickers/:number/status', authenticateToken, (req, res) => {
    const { obtained } = req.body;
    const userId = req.user.id;
    const number = req.params.number;
    
    db.get("SELECT duplicates FROM user_stickers WHERE user_id = ? AND sticker_number = ?", [userId, number], (err, row) => {
        const dups = row ? row.duplicates : 0;
        const newObtained = obtained ? 1 : 0;
        
        db.run("INSERT OR REPLACE INTO user_stickers (user_id, sticker_number, obtained, duplicates) VALUES (?, ?, ?, ?)", 
            [userId, number, newObtained, dups], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Status atualizado" });
        });
    });
});

app.post('/api/stickers/:number/duplicates', authenticateToken, (req, res) => {
    const { action } = req.body;
    const userId = req.user.id;
    const number = req.params.number;
    
    db.get("SELECT obtained, duplicates FROM user_stickers WHERE user_id = ? AND sticker_number = ?", [userId, number], (err, row) => {
        let obt = row ? row.obtained : 0;
        let dups = row ? row.duplicates : 0;
        
        if (action === 'add') dups++;
        else if (action === 'remove' && dups > 0) dups--;
        
        db.run("INSERT OR REPLACE INTO user_stickers (user_id, sticker_number, obtained, duplicates) VALUES (?, ?, ?, ?)", 
            [userId, number, obt, dups], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Repetidas atualizadas" });
        });
    });
});

// Rotas de Administração
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all("SELECT id, username, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users: rows });
    });
});

app.post('/api/admin/users/:id/reset', authenticateToken, requireAdmin, (req, res) => {
    db.run("DELETE FROM user_stickers WHERE user_id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Álbum do usuário resetado com sucesso." });
    });
});

app.post('/api/admin/users/:id/temp-password', authenticateToken, requireAdmin, async (req, res) => {
    const tempPass = "Temp1234";
    const hash = await bcrypt.hash(tempPass, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Senha temporária definida como: Temp1234" });
    });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run("DELETE FROM user_stickers WHERE user_id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Usuário excluído com sucesso." });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

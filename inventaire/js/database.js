// Gestion centralisée de la base de données SQL.js
let db = null;

// Afficher un indicateur de chargement
function showLoading(message = 'Chargement de l\'application...') {
  const loadingDiv = document.getElementById('loading');
  if (loadingDiv) {
    loadingDiv.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">${message}</p>
        </div>
      </div>
    `;
  }
}

// Cacher l'indicateur de chargement
function hideLoading() {
  const loadingDiv = document.getElementById('loading');
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.style.display = 'block';
  }
}

// Initialisation de sql.js
async function initDB() {
  try {
    showLoading();
    
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // Charger la base de données depuis localStorage ou créer une nouvelle
    const savedDB = localStorage.getItem('stock.db');
    if (savedDB) {
      try {
        const uint8Array = new Uint8Array(JSON.parse(savedDB));
        db = new SQL.Database(uint8Array);
      } catch (error) {
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }
    
    // Créer les tables si elles n'existent pas
    db.run(`
      CREATE TABLE IF NOT EXISTS inventaire (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Outils',
        supplier TEXT NOT NULL DEFAULT '',
        price REAL NOT NULL DEFAULT 0.0,
        quantity INTEGER NOT NULL DEFAULT 0,
        threshold INTEGER NOT NULL DEFAULT 0,
        photo TEXT,
        website_url TEXT,
        monthly_need INTEGER NOT NULL DEFAULT 0,
        weekly_need INTEGER NOT NULL DEFAULT 0
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS technicien (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Outils',
        supplier TEXT NOT NULL DEFAULT '',
        price REAL NOT NULL DEFAULT 0.0,
        quantity INTEGER NOT NULL DEFAULT 0,
        threshold INTEGER NOT NULL DEFAULT 0,
        photo TEXT,
        website_url TEXT,
        monthly_need INTEGER NOT NULL DEFAULT 0,
        weekly_need INTEGER NOT NULL DEFAULT 0
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        license_plate TEXT NOT NULL UNIQUE,
        mileage INTEGER NOT NULL DEFAULT 0,
        tire_type TEXT DEFAULT 'Été',
        assignment_status TEXT DEFAULT 'Available',
        assigned_to TEXT,
        notes TEXT
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS collaborateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        statut TEXT NOT NULL DEFAULT 'Actif',
        email TEXT,
        telephone TEXT,
        date_embauche DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS collaborateur_materiel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collaborateur_id INTEGER NOT NULL,
        reference TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 1,
        delivered INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collaborateur_id) REFERENCES collaborateurs(id) ON DELETE CASCADE
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS materiel_template (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Migration: Ajouter les nouvelles colonnes si elles n'existent pas
    ['inventaire', 'technicien'].forEach(tableName => {
      try {
        const columns = db.exec(`PRAGMA table_info(${tableName})`);
        if (columns.length > 0) {
          const columnNames = columns[0].values.map(col => col[1]);
          
          if (!columnNames.includes('monthly_need')) {
            db.run(`ALTER TABLE ${tableName} ADD COLUMN monthly_need INTEGER NOT NULL DEFAULT 0`);
          }
          if (!columnNames.includes('weekly_need')) {
            db.run(`ALTER TABLE ${tableName} ADD COLUMN weekly_need INTEGER NOT NULL DEFAULT 0`);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de migration
      }
    });
    
    // Migration: Vérifier et corriger la table vehicule
    try {
      const vehiculeColumns = db.exec(`PRAGMA table_info(vehicule)`);
      if (vehiculeColumns.length > 0) {
        const columnNames = vehiculeColumns[0].values.map(col => col[1]);
        
        // Si la table a une colonne 'reference' NOT NULL, recréer la table
        if (columnNames.includes('reference')) {
          try {
            db.run(`
              CREATE TABLE IF NOT EXISTS vehicule_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                make TEXT NOT NULL,
                model TEXT NOT NULL,
                year INTEGER NOT NULL,
                license_plate TEXT NOT NULL UNIQUE,
                mileage INTEGER NOT NULL DEFAULT 0,
                tire_type TEXT DEFAULT 'Été',
                assignment_status TEXT DEFAULT 'Available',
                assigned_to TEXT,
                notes TEXT
              )
            `);
            
            // Copier les données existantes (si elles existent)
            db.run(`
              INSERT INTO vehicule_new (id, make, model, year, license_plate, mileage, tire_type, assignment_status, assigned_to, notes)
              SELECT id, make, model, year, license_plate, mileage, tire_type, assignment_status, assigned_to, notes
              FROM vehicule
            `);
            
            db.run(`DROP TABLE vehicule`);
            db.run(`ALTER TABLE vehicule_new RENAME TO vehicule`);
          } catch (error) {
            // Ignorer si la table n'a pas de données
            console.error('Erreur lors de la migration de vehicule:', error.message);
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs de migration
    }
    
    // Sauvegarder la base de données
    saveDB();
    
    hideLoading();
    
    return db;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    alert('Erreur lors du chargement de la base de données');
  }
}

// Sauvegarder la base de données dans localStorage
function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Array.from(data);
    localStorage.setItem('stock.db', JSON.stringify(buffer));
  }
}

// Obtenir la base de données
function getDB() {
  return db;
}

// Fonction pour compter les collaborateurs actifs (pour les recommandations futures)
function getActiveCollaboratorsCount() {
  if (!db) return 0;
  try {
    const result = db.exec(`SELECT COUNT(*) as count FROM collaborateurs WHERE statut = 'Actif'`);
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0];
    }
  } catch (error) {
    console.error('Erreur lors du comptage des collaborateurs actifs:', error);
  }
  return 0;
}

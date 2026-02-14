# 🔄 Synchronisation Supabase → PostgreSQL

Ce script permet de synchroniser automatiquement toutes les tables de Supabase vers une base de données PostgreSQL sur un serveur privé toutes les 6 heures.

## 📋 Prérequis

- Node.js >= 14.0.0
- Accès à Supabase avec une **Service Role Key** (pas l'anon key)
- Accès à votre serveur PostgreSQL privé
- Les tables doivent exister dans PostgreSQL (elles seront créées automatiquement si elles n'existent pas)

## 🚀 Installation

1. **Installer les dépendances** :
```bash
npm install
```

2. **Créer le fichier de configuration** :
```bash
cp .env.example .env
```

3. **Configurer les variables d'environnement** dans `.env` :
```env
# Configuration Supabase
SUPABASE_URL=https://wdurkaelytgjbcsmkzgb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Configuration PostgreSQL
POSTGRES_HOST=votre_serveur_postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=nom_de_la_base
POSTGRES_USER=votre_utilisateur
POSTGRES_PASSWORD=votre_mot_de_passe
POSTGRES_SSL=false  # true si SSL requis
```

### 🔑 Obtenir la Service Role Key Supabase

1. Allez dans votre projet Supabase
2. Settings → API
3. Copiez la **Service Role Key** (⚠️ **NE JAMAIS** exposer cette clé publiquement !)

## 📊 Tables synchronisées

Le script synchronise les tables suivantes (dans l'ordre de dépendance) :

1. `depots`
2. `employees`
3. `user_roles`
4. `appointments`
5. `intervention_details`
6. `intervention_photos`
7. `photo_ai_validations`
8. `time_entries`
9. `events`
10. `interventions`
11. `inventory_items`
12. `vehicles`
13. `employee_equipment`

## 🎯 Utilisation

### Synchronisation manuelle

```bash
npm run sync
```

ou

```bash
node sync-supabase-to-postgres.js
```

### Synchronisation automatique (toutes les 6 heures)

#### Option 1: Cron Job (Linux/Mac)

1. **Éditer le crontab** :
```bash
crontab -e
```

2. **Ajouter la ligne suivante** (exécution toutes les 6 heures) :
```cron
0 */6 * * * cd /chemin/vers/votre/projet && /usr/bin/node sync-supabase-to-postgres.js >> /var/log/supabase-sync.log 2>&1
```

**Exemple** (si le script est dans `/home/user/veloxnumeric-web`) :
```cron
0 */6 * * * cd /home/user/veloxnumeric-web && /usr/bin/node sync-supabase-to-postgres.js >> /var/log/supabase-sync.log 2>&1
```

**Horaires possibles** :
- `0 */6 * * *` : Toutes les 6 heures (00:00, 06:00, 12:00, 18:00)
- `0 0,6,12,18 * * *` : Même chose, mais explicite
- `0 2,8,14,20 * * *` : Toutes les 6 heures à 02:00, 08:00, 14:00, 20:00

#### Option 2: Task Scheduler (Windows)

1. Ouvrir **Planificateur de tâches** (Task Scheduler)
2. Créer une **nouvelle tâche**
3. **Déclencheur** : Récurrent, toutes les 6 heures
4. **Action** : Démarrer un programme
   - Programme : `node.exe`
   - Arguments : `sync-supabase-to-postgres.js`
   - Dossier de départ : Chemin vers votre projet
5. **Conditions** : Décocher "Ne démarrer la tâche que si l'ordinateur est branché sur secteur" si nécessaire

#### Option 3: Systemd Timer (Linux avec systemd)

1. **Créer un service** `/etc/systemd/system/supabase-sync.service` :
```ini
[Unit]
Description=Sync Supabase to PostgreSQL
After=network.target

[Service]
Type=oneshot
User=votre_utilisateur
WorkingDirectory=/chemin/vers/votre/projet
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node sync-supabase-to-postgres.js
```

2. **Créer un timer** `/etc/systemd/system/supabase-sync.timer` :
```ini
[Unit]
Description=Run Supabase sync every 6 hours
Requires=supabase-sync.service

[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

3. **Activer le timer** :
```bash
sudo systemctl enable supabase-sync.timer
sudo systemctl start supabase-sync.timer
```

#### Option 4: PM2 (Process Manager pour Node.js)

1. **Installer PM2** :
```bash
npm install -g pm2
```

2. **Créer un fichier de configuration** `ecosystem.config.js` :
```javascript
module.exports = {
  apps: [{
    name: 'supabase-sync',
    script: 'sync-supabase-to-postgres.js',
    cron_restart: '0 */6 * * *',
    autorestart: false,
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. **Démarrer avec PM2** :
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Pour démarrer au boot
```

## 🔍 Fonctionnement

1. **Connexion** : Le script se connecte à Supabase (via API REST) et PostgreSQL
2. **Création des tables** : Si une table n'existe pas dans PostgreSQL, elle est créée automatiquement
3. **Récupération** : Les données sont récupérées depuis Supabase par batch de 1000 enregistrements
4. **Synchronisation** : Les données sont insérées ou mises à jour (UPSERT) dans PostgreSQL
5. **Gestion des conflits** : En cas de conflit sur la clé primaire, les données sont mises à jour

## 📝 Logs

Le script affiche des logs détaillés :
- ✅ Succès
- ⚠️ Avertissements
- ❌ Erreurs

Pour rediriger les logs vers un fichier :
```bash
node sync-supabase-to-postgres.js >> sync.log 2>&1
```

## ⚠️ Notes importantes

1. **Service Role Key** : Ce script utilise la Service Role Key qui a accès complet à toutes les données. **NE JAMAIS** exposer cette clé publiquement ou dans le code source.

2. **Performance** : Pour les grandes tables, la synchronisation peut prendre plusieurs minutes. Le script traite les données par batch pour optimiser les performances.

3. **Dépendances** : Les tables sont synchronisées dans l'ordre de dépendance (ex: `employees` avant `appointments`).

4. **UPSERT** : Le script utilise `ON CONFLICT ... DO UPDATE` pour mettre à jour les enregistrements existants. Les données dans PostgreSQL sont donc toujours à jour avec Supabase.

5. **Première exécution** : Lors de la première exécution, toutes les tables seront créées et toutes les données seront synchronisées.

## 🐛 Dépannage

### Erreur de connexion Supabase
- Vérifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont corrects
- Vérifiez que la Service Role Key a les permissions nécessaires

### Erreur de connexion PostgreSQL
- Vérifiez que le serveur PostgreSQL est accessible depuis votre machine
- Vérifiez les credentials dans `.env`
- Si SSL est requis, mettez `POSTGRES_SSL=true`

### Tables non créées
- Vérifiez que l'utilisateur PostgreSQL a les permissions `CREATE TABLE`
- Vérifiez les logs pour voir les erreurs spécifiques

### Synchronisation lente
- C'est normal pour les grandes tables
- Le script traite par batch de 100 enregistrements pour optimiser

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Node.js pg](https://node-postgres.com/)


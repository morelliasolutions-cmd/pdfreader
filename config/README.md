# Configuration Easypanel

## Configuration de la clé API Easypanel

Ce dossier contient les fichiers de configuration pour la connexion à votre instance Easypanel sur votre VPS.

### Fichiers

- `easypanel.example.json` : Template de configuration (peut être versionné)
- `easypanel.json` : Fichier de configuration réel (ignoré par git, contient vos clés)

### Instructions de configuration

1. **Générer votre clé API** :
   - Connectez-vous à votre dashboard Easypanel
   - Allez dans **Settings → Users**
   - Cliquez sur **"Generate API Key"**
   - Copiez la clé générée

2. **Configurer le fichier `easypanel.json`** :
   ```json
   {
     "hostname": "https://votre-instance.easypanel.io",
     "apiKey": "votre-cle-api-generee",
     "timeout": 30000,
     "verifySSL": true
   }
   ```

3. **Paramètres** :
   - `hostname` : URL de votre instance Easypanel (ex: `https://panel.votre-domaine.com`)
   - `apiKey` : La clé API générée depuis le dashboard
   - `timeout` : Timeout des requêtes en millisecondes (défaut: 30000 = 30s)
   - `verifySSL` : Vérifier les certificats SSL (défaut: true)

### Sécurité

⚠️ **Important** : Le fichier `easypanel.json` est exclu de git pour protéger vos clés sensibles. Ne le commitez jamais !

### Utilisation

Pour utiliser cette configuration dans vos scripts, vous pouvez charger le fichier JSON :

```javascript
const fs = require('fs');
const path = require('path');

const easypanelConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config/easypanel.json'), 'utf8')
);

// Utiliser les valeurs
const { hostname, apiKey } = easypanelConfig;
```

### Exemple d'utilisation avec fetch

```javascript
async function easypanelRequest(endpoint, method = 'GET', body = null) {
  const config = require('./config/easypanel.json');
  const url = `${config.hostname}/api${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  return response.json();
}
```

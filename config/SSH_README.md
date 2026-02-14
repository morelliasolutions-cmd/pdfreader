# Configuration SSH pour VPS Easypanel

## Vue d'ensemble

Ce dossier contient les fichiers de configuration pour la connexion SSH à votre VPS où Easypanel est installé.

## Fichiers

- `ssh.example.json` : Template de configuration (peut être versionné)
- `ssh.json` : Fichier de configuration réel (ignoré par git, contient vos identifiants)
- `ssh-client.js` : Client JavaScript pour connexions SSH
- `test-ssh.js` : Script de test de connexion SSH

## Configuration SSH

### Étape 1 : Créer le fichier de configuration

Copiez `config/ssh.example.json` vers `config/ssh.json` :

```bash
cp config/ssh.example.json config/ssh.json
```

### Étape 2 : Remplir vos identifiants SSH

Éditez `config/ssh.json` et remplissez :

```json
{
  "hostname": "votre-serveur.com",
  "user": "root",
  "port": 22,
  "privateKeyPath": "C:\\Users\\etien\\.ssh\\id_rsa",
  "usePassword": false,
  "password": "",
  "connectionTimeout": 10000
}
```

### Options de configuration

#### Authentification par clé SSH (recommandé)

```json
{
  "hostname": "votre-serveur.com",
  "user": "root",
  "port": 22,
  "privateKeyPath": "C:\\Users\\etien\\.ssh\\id_rsa",
  "usePassword": false,
  "connectionTimeout": 10000
}
```

- `hostname` : Adresse IP ou nom de domaine du serveur
- `user` : Utilisateur SSH (généralement `root`, `ubuntu`, `admin`)
- `port` : Port SSH (généralement 22)
- `privateKeyPath` : Chemin vers votre clé privée SSH (format Windows avec double backslash)
- `usePassword` : `false` pour utiliser la clé SSH

#### Authentification par mot de passe

```json
{
  "hostname": "votre-serveur.com",
  "user": "root",
  "port": 22,
  "usePassword": true,
  "password": "votre-mot-de-passe",
  "connectionTimeout": 10000
}
```

⚠️ **Sécurité** : L'authentification par clé SSH est plus sécurisée que le mot de passe.

## Utilisation

### Test de connexion SSH

```bash
node config/test-ssh.js
```

Ce script va :
1. ✅ Tester la connexion SSH
2. ✅ Vérifier si Docker est installé
3. ✅ Lister les conteneurs Docker
4. ✅ Vérifier les services Supabase

### Utilisation dans vos scripts

```javascript
const SSHClient = require('./config/ssh-client');

async function example() {
  const client = new SSHClient();
  
  try {
    // Connecter
    await client.connect();
    
    // Exécuter une commande
    const result = await client.executeCommand('docker ps');
    console.log(result.stdout);
    
    // Vérifier Docker
    const dockerInfo = await client.checkDocker();
    console.log(dockerInfo);
    
    // Fermer la connexion
    client.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

## Commandes SSH utiles

### Vérifier les services Easypanel

```javascript
const result = await client.executeCommand('docker ps --filter "name=easypanel"');
```

### Vérifier les services Supabase

```javascript
const result = await client.executeCommand('docker ps --filter "name=supabase"');
```

### Voir les logs d'un service

```javascript
const result = await client.executeCommand('docker logs supabase-kong --tail 100');
```

### Vérifier l'espace disque

```javascript
const result = await client.executeCommand('df -h');
```

### Vérifier la mémoire

```javascript
const result = await client.executeCommand('free -h');
```

## Sécurité

⚠️ **Important** : 

- Le fichier `config/ssh.json` est exclu de git (dans `.gitignore`)
- Ne commitez jamais vos clés SSH ou mots de passe
- Utilisez des clés SSH au lieu de mots de passe si possible
- Limitez l'accès SSH par firewall si possible
- Utilisez des clés SSH avec passphrase pour plus de sécurité

## Dépannage

### Erreur : "Connection refused"

- Vérifiez que le serveur est accessible
- Vérifiez que le port SSH (22) n'est pas bloqué par un firewall
- Vérifiez que le service SSH est démarré sur le serveur

### Erreur : "Permission denied"

- Vérifiez que votre clé privée SSH est correcte
- Vérifiez les permissions de la clé SSH : `chmod 600 ~/.ssh/id_rsa`
- Vérifiez que votre utilisateur SSH existe sur le serveur
- Vérifiez que votre clé publique est dans `~/.ssh/authorized_keys` sur le serveur

### Erreur : "Host key verification failed"

- Supprimez l'entrée du serveur de `~/.ssh/known_hosts`
- Ou acceptez la nouvelle clé lors de la connexion

## Notes

- Le client SSH utilise la bibliothèque `ssh2` (npm package)
- Assurez-vous que `ssh2` est installé : `npm install ssh2`
- Les commandes SSH sont exécutées de manière synchrone (une à la fois)
- Les connexions sont fermées automatiquement après chaque commande (sauf si vous gardez la connexion ouverte)

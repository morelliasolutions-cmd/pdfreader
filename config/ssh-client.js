/**
 * Client SSH pour connexion au VPS Easypanel
 * Utilise la configuration depuis config/ssh.json
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

class SSHClient {
  constructor() {
    this.config = this.loadConfig();
    this.connection = null;
  }

  /**
   * Charge la configuration depuis config/ssh.json
   */
  loadConfig() {
    const configPath = path.join(__dirname, 'ssh.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(
        `Fichier de configuration SSH manquant: ${configPath}\n` +
        `Veuillez copier config/ssh.example.json vers config/ssh.json et y entrer vos informations.`
      );
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.hostname || !config.user) {
      throw new Error(
        'Configuration SSH incomplète dans config/ssh.json\n' +
        'Veuillez renseigner hostname et user.'
      );
    }

    return config;
  }

  /**
   * Établit une connexion SSH
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      const connectionConfig = {
        host: this.config.hostname,
        username: this.config.user,
        port: this.config.port || 22,
        readyTimeout: this.config.connectionTimeout || 10000
      };

      // Utiliser clé privée ou mot de passe
      if (this.config.usePassword) {
        connectionConfig.password = this.config.password;
      } else if (this.config.privateKeyPath) {
        if (fs.existsSync(this.config.privateKeyPath)) {
          connectionConfig.privateKey = fs.readFileSync(this.config.privateKeyPath);
        } else {
          reject(new Error(`Clé privée SSH introuvable: ${this.config.privateKeyPath}`));
          return;
        }
      } else {
        // Utiliser la clé par défaut ~/.ssh/id_rsa
        const defaultKeyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'id_rsa');
        if (fs.existsSync(defaultKeyPath)) {
          connectionConfig.privateKey = fs.readFileSync(defaultKeyPath);
        } else {
          reject(new Error('Aucune méthode d\'authentification SSH configurée'));
          return;
        }
      }

      conn.on('ready', () => {
        console.log('✅ Connexion SSH établie');
        this.connection = conn;
        resolve(conn);
      });

      conn.on('error', (err) => {
        console.error('❌ Erreur de connexion SSH:', err.message);
        reject(err);
      });

      conn.connect(connectionConfig);
    });
  }

  /**
   * Exécute une commande SSH
   */
  async executeCommand(command) {
    if (!this.connection) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.connection.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code, signal) => {
          resolve({
            code,
            signal,
            stdout,
            stderr
          });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  /**
   * Teste la connexion SSH
   */
  async testConnection() {
    try {
      await this.connect();
      const result = await this.executeCommand('echo "SSH connection test successful"');
      return {
        success: true,
        result: result.stdout.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      if (this.connection) {
        this.connection.end();
        this.connection = null;
      }
    }
  }

  /**
   * Vérifie si Docker est installé
   */
  async checkDocker() {
    try {
      const result = await this.executeCommand('docker --version');
      return {
        installed: true,
        version: result.stdout.trim(),
        error: result.stderr
      };
    } catch (error) {
      return {
        installed: false,
        error: error.message
      };
    }
  }

  /**
   * Liste les conteneurs Docker
   */
  async listDockerContainers() {
    try {
      const result = await this.executeCommand('docker ps -a');
      return {
        success: true,
        containers: result.stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifie les services Supabase
   */
  async checkSupabaseServices() {
    try {
      const result = await this.executeCommand('docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}"');
      return {
        success: true,
        services: result.stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ferme la connexion SSH
   */
  disconnect() {
    if (this.connection) {
      this.connection.end();
      this.connection = null;
      console.log('🔌 Connexion SSH fermée');
    }
  }
}

module.exports = SSHClient;

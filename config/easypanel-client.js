/**
 * Client Easypanel API
 * Utilise la configuration depuis config/easypanel.json
 */

const fs = require('fs');
const path = require('path');

class EasypanelClient {
  constructor() {
    this.config = this.loadConfig();
    // S'assurer que l'URL a le bon format (ajouter https:// si nécessaire)
    let hostname = this.config.hostname;
    if (!hostname.startsWith('http://') && !hostname.startsWith('https://')) {
      hostname = `https://${hostname}`;
    }
    this.baseURL = hostname;
    this.apiKey = this.config.apiKey;
    this.timeout = this.config.timeout || 30000;
  }

  /**
   * Charge la configuration depuis config/easypanel.json
   */
  loadConfig() {
    const configPath = path.join(__dirname, 'easypanel.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(
        `Fichier de configuration manquant: ${configPath}\n` +
        `Veuillez copier config/easypanel.example.json vers config/easypanel.json et y entrer vos informations.`
      );
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.hostname || !config.apiKey) {
      throw new Error(
        'Configuration incomplète dans config/easypanel.json\n' +
        'Veuillez renseigner hostname et apiKey.'
      );
    }

    return config;
  }

  /**
   * Effectue une requête à l'API Easypanel
   */
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error (${response.status}): ${error.message || response.statusText}`);
      }

      // Si la réponse est vide, retourner null
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error(`Timeout: La requête a pris plus de ${this.timeout}ms`);
      }
      throw error;
    }
  }

  // Méthodes helper pour les opérations communes
  async get(endpoint) {
    return this.request(endpoint, 'GET');
  }

  async post(endpoint, data) {
    return this.request(endpoint, 'POST', data);
  }

  async put(endpoint, data) {
    return this.request(endpoint, 'PUT', data);
  }

  async delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }

  /**
   * Teste la connexion à l'API Easypanel
   */
  async testConnection() {
    try {
      // Endpoint typique pour tester la connexion (à adapter selon l'API Easypanel)
      const result = await this.get('/health');
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = EasypanelClient;

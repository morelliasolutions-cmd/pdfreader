#!/usr/bin/env node

/**
 * Script de synchronisation Supabase → PostgreSQL privé
 * Synchronise toutes les tables de Supabase vers PostgreSQL toutes les 6 heures
 * 
 * Usage:
 *   node sync-supabase-to-postgres.js
 * 
 * Configuration:
 *   Créer un fichier .env avec les variables d'environnement (voir .env.example)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration depuis .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POSTGRES_HOST = process.env.POSTGRES_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT || 5432;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;
const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

// Vérification des variables d'environnement
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !POSTGRES_HOST || !POSTGRES_DATABASE || !POSTGRES_USER || !POSTGRES_PASSWORD) {
    console.error('❌ Erreur: Variables d\'environnement manquantes');
    console.error('Veuillez créer un fichier .env avec toutes les variables requises (voir .env.example)');
    process.exit(1);
}

// Initialisation Supabase (avec service role key pour accès complet)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialisation PostgreSQL
const pgPool = new Pool({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DATABASE,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Liste des tables à synchroniser (dans l'ordre de dépendance)
const TABLES_TO_SYNC = [
    'depots',
    'employees',
    'user_roles',
    'appointments',
    'intervention_details',
    'intervention_photos',
    'photo_ai_validations',
    'time_entries',
    'events',
    'interventions',
    'inventory_items',
    'vehicles',
    'employee_equipment'
];

// Logging avec timestamp
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Fonction pour créer une table dans PostgreSQL si elle n'existe pas
async function ensureTableExists(tableName, columns) {
    try {
        const columnDefs = columns.map(col => {
            const def = `${col.name} ${col.type}`;
            const constraints = [];
            if (col.primaryKey) constraints.push('PRIMARY KEY');
            if (col.notNull && !col.primaryKey) constraints.push('NOT NULL');
            if (col.default) constraints.push(`DEFAULT ${col.default}`);
            return constraints.length > 0 ? `${def} ${constraints.join(' ')}` : def;
        }).join(', ');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                ${columnDefs}
            );
        `;

        await pgPool.query(createTableQuery);
        log(`Table ${tableName} vérifiée/créée`, 'success');
    } catch (error) {
        log(`Erreur lors de la création de la table ${tableName}: ${error.message}`, 'error');
        throw error;
    }
}

// Fonction pour obtenir le schéma d'une table depuis Supabase
async function getTableSchema(tableName) {
    try {
        // Récupérer un échantillon pour déterminer les colonnes
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        // Si pas de données, on utilise une requête SQL directe pour obtenir le schéma
        // Note: Cette approche nécessite l'accès direct à la base Supabase
        // Pour l'instant, on définit manuellement les schémas des tables principales
        
        return getTableSchemaDefinition(tableName);
    } catch (error) {
        log(`Erreur lors de la récupération du schéma pour ${tableName}: ${error.message}`, 'error');
        return getTableSchemaDefinition(tableName);
    }
}

// Définitions de schéma pour les tables principales
function getTableSchemaDefinition(tableName) {
    const schemas = {
        'depots': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'description', type: 'TEXT' },
            { name: 'address', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'employees': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'first_name', type: 'TEXT', notNull: true },
            { name: 'last_name', type: 'TEXT', notNull: true },
            { name: 'email', type: 'TEXT' },
            { name: 'phone', type: 'TEXT' },
            { name: 'type', type: 'TEXT' },
            { name: 'status', type: 'TEXT', default: "'active'" },
            { name: 'contract_start_date', type: 'DATE' },
            { name: 'annual_vacation_days', type: 'INTEGER', default: '25' },
            { name: 'target_hours', type: 'NUMERIC', default: '176' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'user_roles': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'user_id', type: 'UUID' },
            { name: 'role', type: 'TEXT', notNull: true, default: "'technicien'" },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'appointments': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'employee_id', type: 'UUID' },
            { name: 'date', type: 'DATE', notNull: true },
            { name: 'start_time', type: 'TIME', notNull: true },
            { name: 'end_time', type: 'TIME', notNull: true },
            { name: 'activity', type: 'TEXT', notNull: true },
            { name: 'mandate_number', type: 'TEXT', notNull: true },
            { name: 'client_name', type: 'TEXT' },
            { name: 'phone', type: 'TEXT' },
            { name: 'address', type: 'TEXT', notNull: true },
            { name: 'npa', type: 'TEXT' },
            { name: 'city', type: 'TEXT' },
            { name: 'note', type: 'TEXT' },
            { name: 'is_urgent', type: 'BOOLEAN', default: 'FALSE' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'created_by', type: 'TEXT' }
        ],
        'intervention_details': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'appointment_id', type: 'UUID' },
            { name: 'mandate_number', type: 'TEXT' },
            { name: 'pto_reference', type: 'TEXT' },
            { name: 'cable_length', type: 'NUMERIC' },
            { name: 'fibers_count', type: 'INTEGER' },
            { name: 'status', type: 'TEXT' },
            { name: 'technician_id', type: 'UUID' },
            { name: 'validated_by', type: 'UUID' },
            { name: 'validated_at', type: 'TIMESTAMPTZ' },
            { name: 'rejected_reason', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'intervention_photos': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'intervention_detail_id', type: 'UUID' },
            { name: 'photo_type', type: 'TEXT' },
            { name: 'photo_label', type: 'TEXT' },
            { name: 'file_name', type: 'TEXT' },
            { name: 'file_size', type: 'INTEGER' },
            { name: 'file_type', type: 'TEXT' },
            { name: 'storage_path', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'photo_ai_validations': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'photo_id', type: 'UUID' },
            { name: 'status', type: 'TEXT' },
            { name: 'comment', type: 'TEXT' },
            { name: 'confidence_score', type: 'NUMERIC' },
            { name: 'details', type: 'JSONB' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'time_entries': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'employee_id', type: 'UUID', notNull: true },
            { name: 'date', type: 'DATE', notNull: true },
            { name: 'start_time', type: 'TIME', notNull: true },
            { name: 'end_time', type: 'TIME', notNull: true },
            { name: 'total_hours', type: 'NUMERIC(5,2)', notNull: true },
            { name: 'filled_by', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'events': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'employee_id', type: 'UUID', notNull: true },
            { name: 'date', type: 'DATE', notNull: true },
            { name: 'type', type: 'TEXT', notNull: true },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'interventions': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'employee_id', type: 'UUID', notNull: true },
            { name: 'date', type: 'DATE', notNull: true },
            { name: 'canton', type: 'TEXT', notNull: true },
            { name: 'activity', type: 'TEXT', notNull: true },
            { name: 'amount_chf', type: 'NUMERIC(10,2)', notNull: true },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'inventory_items': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'depot_id', type: 'UUID', notNull: true },
            { name: 'reference', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'category', type: 'TEXT', notNull: true, default: "'Outils'" },
            { name: 'supplier', type: 'TEXT' },
            { name: 'price', type: 'NUMERIC(10,2)', notNull: true, default: '0.0' },
            { name: 'quantity', type: 'INTEGER', notNull: true, default: '0' },
            { name: 'threshold', type: 'INTEGER', notNull: true, default: '0' },
            { name: 'photo', type: 'TEXT' },
            { name: 'website_url', type: 'TEXT' },
            { name: 'monthly_need', type: 'INTEGER', default: '0' },
            { name: 'weekly_need', type: 'INTEGER', default: '0' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'vehicles': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'make', type: 'TEXT', notNull: true },
            { name: 'model', type: 'TEXT', notNull: true },
            { name: 'year', type: 'INTEGER', notNull: true },
            { name: 'license_plate', type: 'TEXT', notNull: true },
            { name: 'mileage', type: 'INTEGER', notNull: true, default: '0' },
            { name: 'tire_type', type: 'TEXT', notNull: true, default: "'Été'" },
            { name: 'assignment_status', type: 'TEXT', notNull: true, default: "'Available'" },
            { name: 'assigned_to', type: 'TEXT' },
            { name: 'owner', type: 'TEXT' },
            { name: 'notes', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        'employee_equipment': [
            { name: 'id', type: 'UUID', primaryKey: true },
            { name: 'employee_id', type: 'UUID', notNull: true },
            { name: 'inventory_item_id', type: 'UUID' },
            { name: 'reference', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'category', type: 'TEXT' },
            { name: 'quantity', type: 'INTEGER', notNull: true, default: '1' },
            { name: 'scanned_at', type: 'TIMESTAMPTZ' },
            { name: 'scanned_by', type: 'TEXT' },
            { name: 'returned', type: 'BOOLEAN', default: 'FALSE' },
            { name: 'returned_at', type: 'TIMESTAMPTZ' },
            { name: 'returned_by', type: 'TEXT' },
            { name: 'depot_id', type: 'UUID' },
            { name: 'site_address', type: 'TEXT' },
            { name: 'notes', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ]
    };

    return schemas[tableName] || [];
}

// Fonction pour synchroniser une table
async function syncTable(tableName) {
    try {
        log(`Début de la synchronisation de la table: ${tableName}`);

        // 1. Obtenir le schéma de la table
        const schema = getTableSchemaDefinition(tableName);
        if (schema.length === 0) {
            log(`⚠️  Schéma non défini pour ${tableName}, passage à la suivante`, 'warning');
            return;
        }

        // 2. S'assurer que la table existe dans PostgreSQL
        await ensureTableExists(tableName, schema);

        // 3. Récupérer toutes les données depuis Supabase (par batch pour les grandes tables)
        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: true });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                allData = allData.concat(data);
                page++;
                hasMore = data.length === pageSize;
            } else {
                hasMore = false;
            }
        }

        log(`  → ${allData.length} enregistrements récupérés depuis Supabase`);

        if (allData.length === 0) {
            log(`  → Aucune donnée à synchroniser pour ${tableName}`, 'warning');
            return;
        }

        // 4. Insérer/Mettre à jour dans PostgreSQL (UPSERT)
        const primaryKeyColumn = schema.find(col => col.primaryKey)?.name || 'id';
        const columnNames = Object.keys(allData[0]);
        
        // Préparer les colonnes pour l'UPSERT
        const columns = columnNames.join(', ');
        const updateSet = columnNames
            .filter(col => col !== primaryKeyColumn)
            .map(col => `${col} = EXCLUDED.${col}`)
            .join(', ');

        // Exécuter par batch pour éviter les requêtes trop grandes
        const batchSize = 100;
        let totalSynced = 0;

        for (let i = 0; i < allData.length; i += batchSize) {
            const batch = allData.slice(i, i + batchSize);
            
            // Préparer les valeurs pour ce batch
            const batchValues = [];
            const batchPlaceholders = [];
            
            batch.forEach((row, rowIndex) => {
                const rowPlaceholders = [];
                columnNames.forEach(col => {
                    const value = row[col];
                    // Gérer les types spéciaux
                    if (value === null) {
                        batchValues.push(null);
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        batchValues.push(JSON.stringify(value)); // JSONB
                    } else {
                        batchValues.push(value);
                    }
                    rowPlaceholders.push(`$${batchValues.length}`);
                });
                batchPlaceholders.push(`(${rowPlaceholders.join(', ')})`);
            });

            const batchUpsertQuery = `
                INSERT INTO ${tableName} (${columns})
                VALUES ${batchPlaceholders.join(', ')}
                ON CONFLICT (${primaryKeyColumn}) 
                DO UPDATE SET ${updateSet}
            `;

            await pgPool.query(batchUpsertQuery, batchValues);
            totalSynced += batch.length;
            
            if (totalSynced % 500 === 0) {
                log(`  → ${totalSynced}/${allData.length} enregistrements traités...`);
            }
        }

        log(`  → ${allData.length} enregistrements synchronisés dans PostgreSQL`, 'success');
    } catch (error) {
        log(`Erreur lors de la synchronisation de ${tableName}: ${error.message}`, 'error');
        throw error;
    }
}

// Fonction principale
async function main() {
    log('🚀 Démarrage de la synchronisation Supabase → PostgreSQL');
    log(`Tables à synchroniser: ${TABLES_TO_SYNC.join(', ')}`);

    try {
        // Tester les connexions
        log('Test de connexion à Supabase...');
        const { data: testData, error: supabaseError } = await supabase
            .from('employees')
            .select('id')
            .limit(1);
        
        if (supabaseError && supabaseError.code !== 'PGRST116') {
            throw new Error(`Erreur connexion Supabase: ${supabaseError.message}`);
        }
        log('✅ Connexion Supabase OK', 'success');

        log('Test de connexion à PostgreSQL...');
        await pgPool.query('SELECT NOW()');
        log('✅ Connexion PostgreSQL OK', 'success');

        // Synchroniser chaque table
        for (const tableName of TABLES_TO_SYNC) {
            try {
                await syncTable(tableName);
            } catch (error) {
                log(`❌ Échec de la synchronisation de ${tableName}: ${error.message}`, 'error');
                // Continuer avec les autres tables même en cas d'erreur
            }
        }

        log('✅ Synchronisation terminée avec succès!', 'success');
    } catch (error) {
        log(`❌ Erreur fatale: ${error.message}`, 'error');
        process.exit(1);
    } finally {
        await pgPool.end();
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    main().catch(error => {
        log(`❌ Erreur non gérée: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { syncTable, main };


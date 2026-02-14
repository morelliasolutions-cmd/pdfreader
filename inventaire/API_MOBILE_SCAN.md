# 📱 API Mobile - Scan de Matériel

## Vue d'ensemble

Ce document explique comment l'application mobile peut scanner le matériel et l'ajouter automatiquement à l'inventaire du technicien dans la web app.

## Architecture

```
┌─────────────────────┐
│  App Mobile         │
│  (React Native/     │
│   Flutter/etc)      │
└──────────┬──────────┘
           │
           │ Scan QR/Barcode
           │
           ▼
┌─────────────────────┐
│  Supabase API       │
│  (REST/Realtime)    │
└──────────┬──────────┘
           │
           │ INSERT employee_equipment
           │
           ▼
┌─────────────────────┐
│  Web App            │
│  (collaborateurs    │
│   .html)            │
└─────────────────────┘
```

## Table Supabase : `employee_equipment`

### Structure

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `employee_id` | UUID | ID du technicien (depuis `employees`) |
| `inventory_item_id` | UUID | ID de l'article (optionnel, depuis `inventory_items`) |
| `reference` | TEXT | Référence scannée (code-barres/QR) |
| `name` | TEXT | Nom du matériel |
| `category` | TEXT | Catégorie |
| `quantity` | INTEGER | Quantité (défaut: 1) |
| `scanned_at` | TIMESTAMPTZ | Date/heure du scan |
| `scanned_by` | TEXT | Email ou user_id du scanner |
| `returned` | BOOLEAN | Matériel retourné (défaut: false) |
| `returned_at` | TIMESTAMPTZ | Date de retour |
| `returned_by` | TEXT | Qui a marqué comme retourné |
| `notes` | TEXT | Notes optionnelles |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de modification |

## API Endpoints

### 1. Scanner un matériel

**Endpoint :** `POST /rest/v1/employee_equipment`

**Headers :**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
```

**Body :**
```json
{
  "employee_id": "uuid-du-technicien",
  "reference": "REF-12345",
  "name": "Perceuse Bosch",
  "category": "Outils",
  "quantity": 1,
  "scanned_at": "2025-12-29T10:30:00Z",
  "scanned_by": "technicien@example.com"
}
```

**Réponse :**
```json
{
  "id": "uuid-nouveau-equipement",
  "employee_id": "uuid-du-technicien",
  "reference": "REF-12345",
  "name": "Perceuse Bosch",
  "category": "Outils",
  "quantity": 1,
  "scanned_at": "2025-12-29T10:30:00Z",
  "scanned_by": "technicien@example.com",
  "returned": false,
  "created_at": "2025-12-29T10:30:00Z"
}
```

### 2. Récupérer le matériel d'un technicien

**Endpoint :** `GET /rest/v1/employee_equipment?employee_id=eq.{uuid}&returned=eq.false`

**Headers :**
```
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Réponse :**
```json
[
  {
    "id": "uuid-1",
    "employee_id": "uuid-technicien",
    "reference": "REF-12345",
    "name": "Perceuse Bosch",
    "category": "Outils",
    "quantity": 1,
    "scanned_at": "2025-12-29T10:30:00Z",
    "returned": false
  },
  {
    "id": "uuid-2",
    "employee_id": "uuid-technicien",
    "reference": "REF-67890",
    "name": "Tournevis",
    "category": "Outils",
    "quantity": 2,
    "scanned_at": "2025-12-29T11:00:00Z",
    "returned": false
  }
]
```

### 3. Marquer comme retourné

**Endpoint :** `PATCH /rest/v1/employee_equipment?id=eq.{uuid}`

**Headers :**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
```

**Body :**
```json
{
  "returned": true,
  "returned_at": "2025-12-29T15:00:00Z",
  "returned_by": "chef@example.com"
}
```

## Exemple de code (JavaScript/React Native)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdurkaelytgjbcsmkzgb.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Scanner un matériel
async function scanEquipment(employeeId, barcode, materialName, category) {
  try {
    const { data, error } = await supabase
      .from('employee_equipment')
      .insert({
        employee_id: employeeId,
        reference: barcode,
        name: materialName,
        category: category || 'Outils',
        quantity: 1,
        scanned_at: new Date().toISOString(),
        scanned_by: (await supabase.auth.getUser()).data.user?.email
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Matériel scanné avec succès:', data);
    return data;
  } catch (error) {
    console.error('Erreur scan:', error);
    throw error;
  }
}

// Récupérer le matériel du technicien
async function getTechnicianEquipment(employeeId) {
  try {
    const { data, error } = await supabase
      .from('employee_equipment')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('returned', false)
      .order('scanned_at', { ascending: false });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erreur récupération:', error);
    throw error;
  }
}

// Marquer comme retourné
async function returnEquipment(equipmentId) {
  try {
    const { data, error } = await supabase
      .from('employee_equipment')
      .update({
        returned: true,
        returned_at: new Date().toISOString(),
        returned_by: (await supabase.auth.getUser()).data.user?.email
      })
      .eq('id', equipmentId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erreur retour:', error);
    throw error;
  }
}
```

## Flux utilisateur mobile

1. **Technicien ouvre l'app mobile**
2. **Se connecte** (Supabase Auth)
3. **Ouvre la caméra** pour scanner
4. **Scanne le code-barres/QR** du matériel
5. **L'app envoie** la requête à Supabase
6. **Le matériel apparaît** automatiquement dans la web app (via Realtime ou refresh)

## Realtime (Optionnel)

Pour que le matériel apparaisse en temps réel dans la web app :

```javascript
// Dans collaborateurs.html
const subscription = supabase
  .channel('employee_equipment_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'employee_equipment',
    filter: `employee_id=eq.${currentTechnicianId}`
  }, (payload) => {
    console.log('Nouveau matériel scanné:', payload.new);
    // Ajouter à la liste sans recharger
    currentTechnicianEquipment.unshift(payload.new);
    renderEquipmentList(currentTechnicianEquipment);
  })
  .subscribe();
```

## Sécurité (RLS)

Les policies RLS permettent :
- ✅ Un technicien peut scanner son propre matériel
- ✅ Un chef de chantier peut voir/modifier tous les inventaires
- ✅ Un technicien ne peut pas modifier le matériel d'un autre

## Notes importantes

1. **Référence unique** : La référence scannée doit être unique (ou gérer les doublons côté app)
2. **Lien avec inventory_items** : Optionnel, pour lier au catalogue d'inventaire
3. **Quantité** : Par défaut 1, mais peut être modifiée
4. **Retour** : Les cases à cocher dans la web app mettent à jour `returned`

## Test

Pour tester sans mobile app :

```sql
-- Insérer un équipement de test
INSERT INTO employee_equipment (
  employee_id,
  reference,
  name,
  category,
  quantity,
  scanned_at,
  scanned_by
) VALUES (
  'uuid-technicien',
  'TEST-001',
  'Perceuse Test',
  'Outils',
  1,
  NOW(),
  'test@example.com'
);
```

Puis vérifier dans `collaborateurs.html` que le matériel apparaît.



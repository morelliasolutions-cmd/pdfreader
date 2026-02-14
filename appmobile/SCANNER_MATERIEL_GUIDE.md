# 📷 Configuration Scanner Code-Barres / QR

## Vue d'ensemble

Le sélecteur de matériel dispose maintenant de :
- ✅ **Recherche en temps réel** par référence, nom ou code-barres
- ✅ **Scanner de code-barres/QR** (caméra)
- ✅ **Filtrage automatique** : Seul le stock du technicien est affiché
- ✅ **Menu déroulant navigable** avec scroll

## Fonctionnalités

### 1. Recherche par texte
- Champ de recherche en haut du modal
- Filtre en temps réel (nom, référence, code-barres)
- Message "Aucun résultat trouvé" si pas de correspondance

### 2. Scanner Code-Barres/QR
- Bouton bleu avec icône scanner
- Ouvre la caméra (arrière par défaut)
- Détecte automatiquement les codes
- Trouve le matériel correspondant dans l'inventaire du technicien

### 3. Stock du technicien uniquement
- Seuls les articles dans `technicianInventory` sont affichés
- Quantité disponible calculée automatiquement
- Articles déjà utilisés en totalité sont masqués

## Intégration Bibliothèque de Scan

### Option 1 : html5-qrcode (Recommandé)

**Installation:**
```html
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
```

**Implémentation:**
```javascript
function startBarcodeDetection(video) {
    const html5QrCode = new Html5Qrcode("barcode-video");
    
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
            // Code détecté
            html5QrCode.stop();
            handleScannedCode(decodedText);
        },
        (errorMessage) => {
            // Erreur de scan (normal si rien détecté)
        }
    );
}
```

### Option 2 : QuaggaJS (Code-barres 1D)

**Installation:**
```html
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js"></script>
```

**Implémentation:**
```javascript
function startBarcodeDetection(video) {
    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: video,
            constraints: {
                facingMode: "environment"
            }
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "upc_reader"
            ]
        }
    }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        Quagga.stop();
        handleScannedCode(code);
    });
}
```

### Option 3 : ZXing (Multi-formats)

**Installation:**
```html
<script src="https://unpkg.com/@zxing/library@latest"></script>
```

**Implémentation:**
```javascript
async function startBarcodeDetection(video) {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    
    try {
        const result = await codeReader.decodeOnceFromVideoDevice(undefined, 'barcode-video');
        handleScannedCode(result.text);
    } catch (err) {
        console.error(err);
    }
}
```

## Structure Base de Données

### Table `equipment` ou `inventory`
Assurez-vous que la table contient :
```sql
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS barcode TEXT;
```

### Exemple de données
```javascript
{
  id: "uuid",
  name: "Câble fibre optique 10m",
  reference: "CAB-FO-10M",
  barcode: "8901234567890",  // Code EAN-13 ou autre
  quantity: 5,
  employee_id: "uuid-technicien"
}
```

## Flux d'utilisation

### Scénario 1 : Recherche texte
```
1. Utilisateur ouvre le sélecteur de matériel
2. Tape "CAB" dans la recherche
3. Liste filtrée en temps réel
4. Sélectionne l'article
5. Article ajouté à la liste "Matériel utilisé"
```

### Scénario 2 : Scan code-barres
```
1. Utilisateur clique "Scanner Code-Barres / QR"
2. Autorise l'accès à la caméra
3. Positionne le code dans le cadre
4. Code détecté automatiquement
5. Article trouvé dans l'inventaire
6. Article ajouté directement (ou message si non trouvé)
```

## Métadonnées envoyées au webhook

Les photos spéciales (OTDR Active + Routeur) incluent maintenant :

```json
{
  "photo_id": "otdr-sur-fibre-active",
  "photo_type": "otdr_active",
  "photo_number": 10,
  "intervention_id": "uuid",
  "employee_id": "uuid",
  "timestamp": "2026-01-06T10:30:00Z",
  "technical_info": {
    "mandate_number": "B.112.123456",
    "pto_reference": "PTO-789",
    "cable_alim": "12",
    "fibres": {
      "fibre_1": "1",
      "fibre_2": "13",
      "fibre_3": "5",
      "fibre_4": "17"
    }
  }
}
```

## Configuration n8n

### Webhook pour photos spéciales

Le webhook reçoit :
- **file** : Image (multipart/form-data)
- **metadata** : JSON string avec toutes les infos

**Exemple de traitement n8n:**
```javascript
// Node "Parse Metadata"
const metadata = JSON.parse($json.metadata);

// Extraire les infos
const photoNumber = metadata.photo_number; // 10 ou 11
const mandateNumber = metadata.technical_info.mandate_number;
const fibres = metadata.technical_info.fibres;

// Utiliser pour nommer les fichiers, créer des dossiers, etc.
```

## Tests

### Test recherche
1. Ouvrir le sélecteur de matériel
2. Taper différents termes (nom, ref, code)
3. Vérifier le filtrage en temps réel

### Test scan (simulation)
1. Cliquer sur "Scanner Code-Barres / QR"
2. Entrer manuellement un code
3. Vérifier que l'article est trouvé et sélectionné

### Test métadonnées webhook
1. Upload une photo "OTDR sur Fibre Active"
2. Vérifier dans n8n que les métadonnées JSON sont reçues
3. Parser le JSON et extraire les infos

## Prochaines étapes

1. **Choisir une bibliothèque de scan** (html5-qrcode recommandé)
2. **Ajouter le script** dans le `<head>` de details_intervention.html
3. **Remplacer la fonction** `startBarcodeDetection()` par l'implémentation réelle
4. **Tester avec des vrais codes-barres**
5. **Configurer n8n** pour parser les métadonnées JSON

## Sécurité

✅ **Seul le stock du technicien** est accessible
✅ **Validation des quantités** avant ajout
✅ **Pas d'accès au stock global** (sauf via son inventaire)
✅ **Métadonnées complètes** pour traçabilité

## Dépendances optionnelles

```json
{
  "html5-qrcode": "^2.3.8",  // Pour QR + codes-barres
  "quagga2": "^1.8.4",        // Pour codes-barres 1D uniquement
  "@zxing/library": "^0.19.2" // Pour multi-formats
}
```

Recommandation : **html5-qrcode** (le plus simple et complet)

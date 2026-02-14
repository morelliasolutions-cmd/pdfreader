# 📋 Questionnaire pour Rédaction CGU/CGV et Politique de Confidentialité

**Application SaaS de Gestion FTTH - Suisse**

---

## 🏢 INFORMATIONS ENTREPRISE

### Identification
- [ ] Nom commercial exact de l'entreprise ?
- [ ] Forme juridique (raison individuelle confirmée) ?
- [ ] Numéro IDE (Identification des Entreprises) ?
- [ ] Numéro RC (Registre du Commerce) ?
- [ ] Adresse complète du siège social ?
- [ ] Canton d'enregistrement ?
- [ ] Email de contact officiel ?
- [ ] Numéro de téléphone professionnel ?
- [ ] Site web/URL de l'application ?
- [ ] Nom et prénom du responsable légal (propriétaire de la raison individuelle) ?
- [ ] Numéro AVS de l'entreprise (si applicable) ?

### Assurances et Protections
- [ ] Avez-vous une assurance RC professionnelle ? **NON (mentionné)**
- [ ] Prévoyez-vous d'en souscrire une ? Quand ?
- [ ] Avez-vous une assurance cyber-risques ?
- [ ] Avez-vous une assurance responsabilité civile générale ?
- [ ] Capital/réserves disponibles pour couvrir d'éventuels litiges ?
- [ ] Budget alloué aux affaires juridiques ?

### Représentation Légale
- [ ] Avez-vous un avocat conseil ? Coordonnées ?
- [ ] Cabinet spécialisé en droit numérique/protection des données ?
- [ ] Contact pour contentieux clients ?
- [ ] Médiateur ou organisme de résolution des litiges prévu ?

---

## 💰 INFORMATIONS COMMERCIALES

### Tarification
- [ ] Prix confirmé : **450 CHF/mois** ?
- [ ] TVA suisse (8.1%) incluse ou en sus ?
- [ ] Numéro TVA (si assujetti) ?
- [ ] Y a-t-il des frais de mise en service/onboarding ?
- [ ] Frais de formation initiaux ?
- [ ] Frais de migration de données ?
- [ ] Coûts de personnalisation/paramétrage ?
- [ ] Tarifs dégressifs selon volume/nombre d'utilisateurs ?
- [ ] Remises pour engagement pluriannuel ?
- [ ] Politique de remboursement/annulation ?
- [ ] Période d'essai gratuite ? Durée ?
- [ ] Droit de rétractation offert (au-delà des 14 jours légaux) ?

### Facturation et Paiement
- [ ] Modalités de paiement acceptées (virement, carte, prélèvement, BVR, TWINT, PayPal) ?
- [ ] Facturation : mensuelle, trimestrielle, annuelle ?
- [ ] Date de facturation (1er du mois, date anniversaire) ?
- [ ] Délai de paiement accordé (30 jours, paiement immédiat) ?
- [ ] Pénalités de retard prévues ? Taux ?
- [ ] Frais de rappel en cas d'impayé ?
- [ ] Suspension du service en cas de non-paiement ? Délai de préavis ?
- [ ] Politique de recouvrement (cabinet externe, poursuite) ?
- [ ] Monnaie de facturation (CHF uniquement ou multi-devises) ?

### Contrat et Engagement
- [ ] Durée minimale : **1 an confirmée** ?
- [ ] Renouvellement automatique : **oui, pour 1 an confirmé** ?
- [ ] Préavis de résiliation ? Combien de mois avant la date anniversaire ?
- [ ] Résiliation possible en cours de contrat ? Pénalités ?
- [ ] Conditions de résiliation anticipée (faute grave, manquement) ?
- [ ] Que se passe-t-il en cas de faillite/liquidation du client ?
- [ ] Clause de tacite reconduction explicite ?
- [ ] Notification de renouvellement envoyée au client ? Combien de temps avant ?

---

## 🖥️ INFORMATIONS TECHNIQUES

### Architecture et Hébergement

#### Frontend (Hostinger)
- [ ] Pays d'hébergement du serveur Hostinger ?
- [ ] Type d'hébergement (mutualisé, VPS, dédié) ?
- [ ] Certificat SSL/TLS activé ?
- [ ] CDN utilisé (Cloudflare, autre) ?
- [ ] Nom de domaine exact ?
- [ ] DPO (Data Protection Officer) chez Hostinger identifié ?

#### Backend (Supabase Cloud)
- [ ] Région Supabase utilisée (EU, US, autre) ?
- [ ] RLS (Row Level Security) : **confirmé actif partout** ?
- [ ] Storage : **privé avec URLs signées temporaires confirmé** ?
- [ ] Durée de validité des URLs signées ?
- [ ] Politique de sauvegarde Supabase (fréquence, rétention) ?
- [ ] Plan Supabase (Free, Pro, Enterprise) ?
- [ ] RGPD : contrat de sous-traitance (DPA) signé avec Supabase ?

#### Serveur Tiers (IA/n8n/cal.com)
- [ ] Localisation géographique de ce serveur ?
- [ ] Hébergeur utilisé ?
- [ ] IA : quel modèle (GPT, Claude, Llama, Florence) ?
- [ ] Les données client transitent-elles par l'IA ? Lesquelles ?
- [ ] L'IA traite-t-elle des données personnelles ?
- [ ] Journalisation des requêtes IA ?
- [ ] n8n : workflows impliquant des données sensibles ?
- [ ] cal.com : données de rendez-vous stockées où ?
- [ ] Accès sécurisé (VPN, IP whitelisting) ?

### Sécurité et Disponibilité
- [ ] Certificats SSL/TLS sur tous les endpoints ?
- [ ] Authentification : MFA disponible ?
- [ ] Politique de mot de passe (longueur, complexité) ?
- [ ] Durée de session avant déconnexion automatique ?
- [ ] Chiffrement des données au repos ? Algorithme ?
- [ ] Chiffrement des données en transit ? TLS 1.2+ ?
- [ ] Logs d'accès conservés ? Durée ?
- [ ] Tests d'intrusion réalisés ? Fréquence ?
- [ ] Audit de sécurité externe ? Quand ?
- [ ] Plan de reprise d'activité (PRA) documenté ?
- [ ] Disponibilité garantie (SLA) ? Pourcentage (99%, 99.5%, 99.9%) ?
- [ ] Fenêtres de maintenance planifiées ? Notification clients ?
- [ ] Temps de rétablissement maximal (RTO) en cas de panne ?

### Sauvegardes et Restauration
- [ ] Fréquence des sauvegardes complètes ?
- [ ] Fréquence des sauvegardes incrémentales ?
- [ ] Localisation géographique des sauvegardes ?
- [ ] Sauvegardes chiffrées ?
- [ ] Test de restauration : quelle fréquence ?
- [ ] Durée de rétention des sauvegardes ?
- [ ] Le client peut-il demander une restauration ? Coût ?
- [ ] Délai de restauration garanti ?

---

## 📊 DONNÉES ET CONFIDENTIALITÉ

### Types de Données Traitées

#### Données Personnelles Clients (Entreprises FTTH)
- [ ] Coordonnées entreprise (nom, adresse, SIRET/IDE) ?
- [ ] Contact principal (nom, prénom, email, téléphone) ?
- [ ] Données de facturation ?
- [ ] Utilisateurs de l'application : nom, prénom, email, rôle ?
- [ ] Géolocalisation des interventions techniques ?
- [ ] Photos de chantiers/installations ?
- [ ] Planning des techniciens (noms, horaires) ?

#### Données Personnelles Finales (Clients des Clients FTTH)
- [ ] L'application stocke-t-elle des données d'abonnés FTTH finaux ?
- [ ] Coordonnées d'abonnés (nom, adresse, téléphone) ?
- [ ] Numéros de contrat/abonnement ?
- [ ] Données de localisation d'installation ?
- [ ] Photos de domicile/intérieur ?

#### Données Techniques et Logs
- [ ] Adresses IP des utilisateurs ?
- [ ] Cookies utilisés ? Lesquels ?
- [ ] Données de connexion (date, heure, action) ?
- [ ] Géolocalisation des accès ?
- [ ] Données de navigation (pages visitées) ?

### Conformité RGPD/nLPD (Suisse)

#### Bases Légales du Traitement
- [ ] Traitement basé sur : contrat, intérêt légitime, consentement, obligation légale ?
- [ ] Consentement explicite requis pour IA/photos/géolocalisation ?
- [ ] Finalités exactes du traitement (gestion interventions, facturation, support) ?

#### Droits des Personnes
- [ ] Procédure pour exercer le droit d'accès ?
- [ ] Délai de réponse aux demandes (max 30 jours légaux) ?
- [ ] Droit de rectification : comment ?
- [ ] Droit à l'effacement : conditions et exceptions ?
- [ ] Droit à la portabilité : format d'export proposé ?
- [ ] Droit d'opposition : pour quels traitements ?
- [ ] Droit de limitation du traitement ?

#### Durée de Conservation
- [ ] Durée de conservation des données clients actifs ?
- [ ] Durée de conservation après résiliation du contrat ?
- [ ] Durée de conservation des logs (1 an, 2 ans) ?
- [ ] Durée de conservation des sauvegardes ?
- [ ] Obligations légales de conservation comptable (10 ans en Suisse) ?
- [ ] Suppression automatique ou sur demande ?

#### Transferts de Données
- [ ] Données transférées hors Suisse/UE ? Vers quels pays ?
- [ ] Clauses contractuelles types (SCC) avec sous-traitants ?
- [ ] Adequacy decision pour les pays destinataires ?
- [ ] Mécanismes de protection (Privacy Shield, BCR) ?

#### Sous-Traitants
- [ ] Liste complète des sous-traitants (Hostinger, Supabase, hébergeur serveur 3) ?
- [ ] Contrats de sous-traitance (DPA) signés ?
- [ ] Audits de conformité des sous-traitants ?
- [ ] Clause de sous-traitance ultérieure (accord préalable requis) ?

### Violation de Données (Data Breach)

- [ ] Procédure interne de détection d'une violation ?
- [ ] Délai de notification à l'autorité (72h légal RGPD) ?
- [ ] Autorité suisse compétente : PFPDT (Préposé Fédéral Protection Données et Transparence) ?
- [ ] Notification aux personnes concernées : dans quels cas ?
- [ ] Registre des violations tenu ?
- [ ] Communication publique prévue en cas de violation massive ?

### Cookies et Tracking
- [ ] Cookies strictement nécessaires uniquement ?
- [ ] Cookies analytiques (Google Analytics, Matomo) ?
- [ ] Cookies publicitaires/réseaux sociaux ?
- [ ] Durée de validité des cookies ?
- [ ] Banner de consentement conforme ?
- [ ] Politique de cookies séparée ou intégrée à la confidentialité ?

---

## 🛡️ PROPRIÉTÉ INTELLECTUELLE

### Droits d'Auteur et Licence
- [ ] Qui détient les droits sur le code source (vous uniquement) ?
- [ ] Bibliothèques open source utilisées ? Licences (MIT, GPL, Apache) ?
- [ ] Client obtient-il une licence d'utilisation ? Type (non-exclusive, personnelle) ?
- [ ] Reverse engineering autorisé ou interdit ?
- [ ] Décompilation/modification du code interdite ?
- [ ] Extraction de données autorisée dans quelles conditions ?

### Marques et Logos
- [ ] Marque déposée pour le nom de l'application ? Pays ?
- [ ] Logo protégé (droits d'auteur ou marque) ?
- [ ] Client peut-il utiliser votre logo ? Dans quel contexte ?
- [ ] White-labeling possible ? Coût supplémentaire ?

### Données Client
- [ ] Qui détient la propriété des données saisies par le client ?
- [ ] Export de données en fin de contrat : format, délai ?
- [ ] Suppression des données après résiliation : délai ?
- [ ] Droit de réutilisation anonymisée des données (analytics) ?

---

## ⚖️ RESPONSABILITÉS ET LIMITES

### Limitation de Responsabilité

#### Exclusions
- [ ] Responsabilité limitée au montant payé sur 12 mois ?
- [ ] Exclusion de responsabilité pour dommages indirects/perte de profits ?
- [ ] Force majeure : définition précise (cyberattaque, catastrophe naturelle) ?
- [ ] Panne de sous-traitant (Hostinger, Supabase) : pas de responsabilité ?
- [ ] Bug logiciel : obligation de moyen ou de résultat ?

#### Cas de Fuite de Données
- [ ] **Point critique** : clause de décharge maximale en cas de fuite ?
- [ ] Client responsable de la sécurité de ses identifiants ?
- [ ] Obligation de notification immédiate en cas de suspicion de compromission ?
- [ ] Pénalités contractuelles plafonnées ?
- [ ] Exclusion de responsabilité si faille provient d'un sous-traitant ?
- [ ] Clause d'indemnisation réciproque si le client est responsable ?

#### Garanties
- [ ] Garantie de disponibilité (SLA) : 99% ? 99.5% ?
- [ ] Crédit/remboursement si SLA non respecté ?
- [ ] Garantie de correction de bugs critiques : délai ?
- [ ] Aucune garantie sur les résultats business du client ?
- [ ] Pas de garantie de compatibilité avec équipements tiers ?

### Obligations du Client
- [ ] Client responsable de la sécurité de ses accès ?
- [ ] Client doit maintenir ses coordonnées à jour ?
- [ ] Client interdit d'utilisation frauduleuse/illégale ?
- [ ] Client ne peut pas revendre l'accès (sauf white-label) ?
- [ ] Client doit sauvegarder ses propres données critiques ?
- [ ] Client doit notifier toute activité suspecte ?

### Suspension et Résiliation par Vous
- [ ] Suspension immédiate en cas de non-paiement ? Après combien de jours ?
- [ ] Suspension en cas d'usage abusif/illégal ?
- [ ] Résiliation immédiate pour faute grave du client ?
- [ ] Résiliation moyennant préavis si client nuit à votre réputation ?
- [ ] Conservation des données après résiliation pour faute ? Durée ?

---

## 🔧 MAINTENANCE ET SUPPORT

### Mises à Jour
- [ ] Fréquence des mises à jour (hebdo, mensuel, trimestriel) ?
- [ ] Mises à jour automatiques ou nécessitant accord client ?
- [ ] Notification préalable des mises à jour majeures ?
- [ ] Maintenance corrective (bugs critiques) : délai d'intervention ?
- [ ] Maintenance évolutive (nouvelles fonctionnalités) : incluse ou payante ?
- [ ] Compatibilité ascendante garantie ?

### Support Client
- [ ] Canaux de support (email, téléphone, chat, ticket) ?
- [ ] Horaires de support (9h-18h, 24/7) ?
- [ ] Langue(s) de support (français, allemand, anglais) ?
- [ ] Délai de première réponse (4h, 24h) ?
- [ ] Niveaux de criticité (bloquant, majeur, mineur) ?
- [ ] Support inclus dans l'abonnement ou payant ?
- [ ] Coût du support supplémentaire/premium ?

---

## 🌍 JURIDICTION ET LOI APPLICABLE

### Droit Applicable
- [ ] Loi suisse exclusivement (Code des Obligations suisse) ?
- [ ] Canton compétent pour les litiges ?
- [ ] Tribunal cantonal ou arbitrage ?
- [ ] Médiation obligatoire avant action en justice ?
- [ ] Langue officielle des contrats (français, allemand) ?

### Clients Internationaux
- [ ] Acceptez-vous des clients hors Suisse ?
- [ ] Clients UE : RGPD appliqué ?
- [ ] Clients hors UE : conformité locale de leur responsabilité ?
- [ ] Taxes locales (TVA EU) : responsabilité du client ?

---

## 📜 CLAUSES SPÉCIFIQUES SUISSE (Raison Individuelle sans RC Pro)

### Protection Patrimoniale
- [ ] **Clause de limitation de responsabilité maximale légale ?**
- [ ] Séparation des patrimoines personnel/professionnel (si possible) ?
- [ ] Clause de non-responsabilité pour actes de tiers (sous-traitants) ?
- [ ] Clause d'acceptation des risques par le client ?
- [ ] Assurance cyber recommandée au client ?

### Mentions Obligatoires Suisse
- [ ] Mention "raison individuelle" dans CGV ?
- [ ] Absence de RC Pro explicitement mentionnée ?
- [ ] Mention du registre du commerce cantonal ?
- [ ] Numéro IDE obligatoire sur factures ?
- [ ] TVA : mention "non assujetti" ou numéro TVA ?

### Délai de Prescription
- [ ] Application du délai de 10 ans (droit suisse général) ?
- [ ] Ou délai réduit à 2 ans (défaut de la chose) ?
- [ ] Clause de réduction du délai de prescription (min 1 an) ?

---

## 📝 COMMUNICATIONS ET NOTIFICATIONS

### Notifications Légales
- [ ] Adresse email officielle pour notifications ?
- [ ] Acceptation de la signature électronique ?
- [ ] Délai de prise d'effet d'une modification de CGU/CGV ?
- [ ] Notification des modifications : email + affichage dans l'app ?
- [ ] Refus de nouvelles CGU = droit de résiliation sans pénalité ?

### Marketing et Prospection
- [ ] Utilisation de l'adresse email du client à des fins marketing ?
- [ ] Opt-in ou opt-out pour newsletters ?
- [ ] Partage de coordonnées avec partenaires : jamais, avec consentement ?
- [ ] Témoignages/avis clients : autorisation requise ?
- [ ] Utilisation du logo client comme référence : accord préalable ?

---

## 🎯 FONCTIONNALITÉS ET PÉRIMÈTRE

### Description des Services
- [ ] Liste exhaustive des modules (planning, facturation, gestion techniciens, inventaire) ?
- [ ] Fonctionnalités optionnelles/payantes ?
- [ ] Intégrations tierces proposées (comptabilité, ERP) ?
- [ ] API disponible pour le client ? Documentation ?
- [ ] Limites d'usage (nombre d'utilisateurs, stockage, requêtes API) ?

### Évolutions Futures
- [ ] Roadmap publique ou privée ?
- [ ] Client peut-il demander des développements spécifiques ? Coût ?
- [ ] Engagement sur le maintien de certaines fonctionnalités ?
- [ ] Droit de retirer des fonctionnalités avec préavis ?

---

## 🔒 CLAUSES DE DÉCHARGE MAXIMALE (Focus Protection)

### Sécurité et Cyberattaques
- [ ] **"Le Client reconnaît que la sécurité absolue n'existe pas en informatique"** ?
- [ ] **Exclusion de responsabilité en cas de cyberattaque malgré mesures raisonnables** ?
- [ ] **Client assume le risque résiduel de violation de données** ?
- [ ] **Obligation pour le client de souscrire sa propre assurance cyber** ?

### Force Majeure Étendue
- [ ] Définition large : panne fournisseur, attaque DDoS, catastrophe naturelle ?
- [ ] **Suspension du contrat sans pénalité en cas de force majeure prolongée (>30j)** ?

### Exonération pour Sous-Traitants
- [ ] **"Le Fournisseur ne peut être tenu responsable des défaillances de Hostinger/Supabase"** ?
- [ ] **Client doit se retourner directement contre le sous-traitant défaillant** ?

### Limitation Dommages
- [ ] **Dommages indirects exclus : perte de chiffre d'affaires, préjudice d'image, etc.** ?
- [ ] **Responsabilité plafonnée au montant payé sur 12 mois maximum** ?
- [ ] **Aucune indemnisation pour interruption de service < 24h** ?

### Acceptation des Risques
- [ ] **"Le Client utilise le Service à ses risques et périls"** ?
- [ ] **"Le Client est seul responsable de l'usage qu'il fait du Service"** ?
- [ ] **Clause de renonciation à recours collectifs (class action)** ?

---

## 📋 CHECKLIST FINALE

### Documents à Préparer
- [ ] CGU (Conditions Générales d'Utilisation)
- [ ] CGV (Conditions Générales de Vente)
- [ ] Politique de Confidentialité
- [ ] Contrat de Service (SLA)
- [ ] Annexe Technique (architecture, sécurité)
- [ ] DPA (Data Processing Agreement) pour clients B2B
- [ ] Formulaire d'exercice des droits RGPD
- [ ] Procédure de violation de données

### Validation Juridique
- [ ] **Relecture par un avocat spécialisé en droit numérique suisse** ?
- [ ] Validation par un DPO externe (si requis) ?
- [ ] Assurance E&O (Errors & Omissions) ou cyber envisagée ?

### Publication et Acceptation
- [ ] Date d'entrée en vigueur des CGU/CGV ?
- [ ] URL des documents sur votre site ?
- [ ] Case à cocher lors de l'inscription du client ?
- [ ] Archivage des versions successives ?
- [ ] Traduction en allemand/anglais nécessaire ?

---

## 🚨 POINTS D'ATTENTION CRITIQUES (Sans RC Pro)

### Risques Identifiés
1. **Fuite de données massives** → Limitation responsabilité + obligation assurance client
2. **Panne prolongée** → SLA clair + compensation limitée
3. **Bug causant perte de données client** → Sauvegardes démontrables + exonération partielle
4. **Utilisation frauduleuse par un utilisateur client** → Responsabilité exclusive du client
5. **Défaillance Supabase/Hostinger** → Exonération totale si vous n'avez pas choisi négligemment

### Recommandations de Protection
- ✅ **Clause de limitation à 12 mois d'abonnement**
- ✅ **Exclusion explicite des dommages indirects**
- ✅ **Force majeure incluant cyberattaques et pannes fournisseurs**
- ✅ **Obligation pour le client de souscrire assurance cyber**
- ✅ **Logs et preuves de sécurité à conserver (protection en cas de litige)**
- ✅ **Clause d'acceptation des risques par signature client**
- ⚠️ **Souscrire RC Pro dès que possible (budget 1000-2000 CHF/an)**
- ⚠️ **Audit de sécurité externe annuel (crédibilité)**
- ⚠️ **Fonds de réserve pour litiges (min 10'000 CHF)**

---

## 📞 PROCHAINES ÉTAPES

1. **Compléter ce questionnaire** avec toutes les réponses
2. **Consulter un avocat** spécialisé en droit numérique (budget : 2000-5000 CHF)
3. **Rédiger les documents** avec l'avocat
4. **Faire auditer** la sécurité technique (pentest) pour prouver diligence raisonnable
5. **Souscrire RC Pro** dès les premiers clients (priorité absolue)
6. **Mettre en place** un registre des traitements RGPD
7. **Former** les clients à la sécurité (clause de formation obligatoire ?)

---

**Date de création du questionnaire** : 12 janvier 2026  
**À réviser** : tous les 6 mois ou en cas de changement réglementaire majeur

---

*Ce questionnaire ne constitue pas un conseil juridique. Consultez impérativement un avocat suisse spécialisé avant de finaliser vos documents.*

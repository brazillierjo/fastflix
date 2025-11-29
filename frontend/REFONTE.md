# Design System FastFlix : Cinéma Immersif & Efficacité

## 1. 🎨 Palette de Couleurs (Dual Mode : Light & Dark)

Le Rouge Cinéma (#B80000) dérivé du logo est désormais intégré pour l'esthétique premium et le Bleu Astral (#008DFF) pour l'action IA.

| Catégorie | Description | Dark Mode | Light Mode | Usage Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Fond Principal** | Ambiance immersive (cinéma) / Propreté | #0A0A0A | #F9FAFB | Arrière-plan de la vue globale. |
| **Fond Secondaire** | Cartes, Modales, Champs de saisie | #171717 | #FFFFFF | Contenants d'information. |
| **Accent Principal (CTA)** | Boutons d'action (Générer, Valider) | #008DFF | #008DFF | Action, IA (Gemini). |
| **Accent Secondaire (Marque/Alerte)** | Logo, Abonnement Actif, Éléments Dramatiques | #B80000 | #B80000 | Couleur du logo, statut Premium. |
| **Texte Primaire** | Titres, Corps de texte principal | #F5F5F5 | #1F2937 | Haute lisibilité. |
| **Texte Secondaire** | Placeholder, Métadonnées, Descriptions | #A3A3A3 | #6B7280 | Information secondaire. |
| **Réussite/Note** | Badge de note de film, Confirmation de succès | #FFC700 | #FFC700 | Mise en valeur de la qualité et succès. |

## 2. 🖋️ Typographie

* **Police :** Inter ou Poppins (Sans-serif moderne).
* **Poids :** Utilisation de Medium, Semi-bold et Bold pour la hiérarchie.
* **Tailles :** Respecter l'échelle standard (Ex: `text-3xl` pour les titres, `text-sm` pour le corps).

## 3. 🖥️ Instructions UI/UX (Comportement et Design Attendu)

### A. Structure Générale

1.  **Thème :** Implémentation complète du **Dual Mode (Light & Dark)**. Le Dark Mode est l'option par défaut.
2.  **Barre de Navigation Inférieure (Tab Bar) :**
    * Doit être **fixe** et **opaque**.
    * Onglets : **"Film"** (Icône Bobine) et **"Profil"** (Icône Utilisateur).
    * L'icône de l'onglet actif est colorée en **Bleu Astral** (#008DFF).

### B. Onglet "Film" (Recherche & Résultats)

1.  **Champ de Saisie du Prompt :**
    * **Design :** Grand `textarea`, fond de couleur secondaire, avec des coins **largement arrondis**.
    * **Comportement UX (Focus) :** Lors de la saisie, le champ obtient un **contour lumineux** de couleur **Bleu Astral** (#008DFF) (effet d'illumination de l'IA).
2.  **Bouton CTA : "Générer les Suggestions"**
    * **Design :** Forme de **pilule** (arrondi complet), fond **Bleu Astral** (#008DFF).
    * **Comportement UX (Loading) :** Se transforme en **spinner** bleu avec le texte **"Recherche en cours..."** pour indiquer le délai de l'API.
3.  **Affichage du Solde de Prompts (Header) :**
    * Mis en évidence par une pastille (dot) ou un badge.
    * Couleur : **Rouge Cinéma** (#B80000) si solde **bas** (1 ou 0), **Or Étoile** (#FFC700) si solde **bon** (2 ou 3).
4.  **Cartes de Résultats :**
    * **Design :** Cartes rectangulaires sur fond `--color-bg-secondary`.
    * **Effet :** Utiliser une **ombre subtile** pour créer un effet de profondeur, comme si la carte "flottait" au-dessus du fond principal (effet écran de cinéma).
    * **Note :** Badge carré sur fond **Or Étoile** (#FFC700).

### C. Onglet "Profil" (Paramètres)

1.  **Design de Liste :** Utiliser des **lignes de séparation fines et subtiles** entre chaque élément de réglage pour une clarté maximale (style iOS Settings).
2.  **Statut Abonnement :**
    * Le statut "Premium/Payant" doit être mis en évidence par la couleur **Rouge Cinéma** (#B80000) pour rappeler le statut de la marque.
    * Afficher clairement le nombre de prompts gratuits restants pour les utilisateurs non payants.
3.  **Sélecteurs :** Les sélecteurs (Langue, Pays) doivent afficher la valeur sélectionnée à droite et utiliser une icône chevron (`>`) pour indiquer une action d'ouverture de menu/modal.
4.  **Transitions :** Utiliser des transitions `ease-in-out` sur les changements d'état (hover, focus, basculement de thème) pour une expérience utilisateur fluide.
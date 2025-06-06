# Palette de Couleurs Tailwind

Cette palette de couleurs a été créée pour assurer une cohérence visuelle dans l'application avec support des thèmes dark et light.

## Structure de la Palette

### Couleurs Principales
- **primary**: Bleu moderne (50-950) - Pour les éléments principaux et CTA
- **neutral**: Gris équilibrés (50-950) - Pour les textes et arrière-plans neutres

### Couleurs Sémantiques
- **success**: Vert (50-950) - Pour les messages de succès
- **warning**: Orange/Jaune (50-950) - Pour les avertissements
- **error**: Rouge (50-950) - Pour les erreurs

### Thèmes Prédéfinis

#### Thème Light
```css
background: light-background (#ffffff)
surface: light-surface (#f8fafc)
card: light-card (#ffffff)
border: light-border (#e2e8f0)
input: light-input (#f1f5f9)
primary: light-primary (#0f172a)
secondary: light-secondary (#64748b)
muted: light-muted (#94a3b8)
accent: light-accent (#0ea5e9)
destructive: light-destructive (#ef4444)
```

#### Thème Dark
```css
background: dark-background (#0f172a)
surface: dark-surface (#1e293b)
card: dark-card (#334155)
border: dark-border (#475569)
input: dark-input (#374151)
primary: dark-primary (#f8fafc)
secondary: dark-secondary (#cbd5e1)
muted: dark-muted (#64748b)
accent: dark-accent (#38bdf8)
destructive: dark-destructive (#f87171)
```

## Utilisation dans React Native avec NativeWind

### Exemples d'utilisation

```jsx
// Arrière-plan selon le thème
<View className="bg-light-background dark:bg-dark-background">

// Texte principal
<Text className="text-light-primary dark:text-dark-primary">

// Bouton principal
<TouchableOpacity className="bg-primary-500 hover:bg-primary-600">

// Carte avec bordure
<View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">

// Input
<TextInput className="bg-light-input dark:bg-dark-input text-light-primary dark:text-dark-primary">

// Texte secondaire
<Text className="text-light-secondary dark:text-dark-secondary">

// Bouton de succès
<TouchableOpacity className="bg-success-500 hover:bg-success-600">

// Texte d'erreur
<Text className="text-error-500">
```

### Migration des Couleurs Existantes

Remplacez les couleurs hardcodées par les classes Tailwind :

```jsx
// Avant
style={{ backgroundColor: '#ffffff' }}
// Après
className="bg-light-background dark:bg-dark-background"

// Avant
style={{ color: '#000' }}
// Après
className="text-light-primary dark:text-dark-primary"

// Avant
style={{ backgroundColor: '#f5f5f5' }}
// Après
className="bg-light-input dark:bg-dark-input"

// Avant
style={{ color: '#666' }}
// Après
className="text-light-secondary dark:text-dark-secondary"

// Avant
style={{ backgroundColor: '#007AFF' }}
// Après
className="bg-primary-500"
```

## Avantages de cette Palette

1. **Cohérence**: Toutes les couleurs sont harmonisées
2. **Accessibilité**: Contrastes optimisés pour la lisibilité
3. **Flexibilité**: Support natif des thèmes dark/light
4. **Maintenabilité**: Centralisée dans la configuration Tailwind
5. **Évolutivité**: Facile d'ajouter de nouvelles variantes

## Prochaines Étapes

1. Remplacer progressivement les styles inline par les classes Tailwind
2. Implémenter la détection automatique du thème système
3. Ajouter un toggle pour basculer entre les thèmes
4. Tester l'accessibilité avec les nouveaux contrastes
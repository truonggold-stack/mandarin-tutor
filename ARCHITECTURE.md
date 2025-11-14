# Mandarin Tutor - Modular Architecture

## 📁 Project Structure

```
mandarin-tutor/
├── index.html              # Main HTML file
├── styles.css              # All styles
├── script.js               # Legacy monolithic file (to be refactored)
├── ARCHITECTURE.md         # This file
├── README.md              # Project documentation
└── js/                    # Modular JavaScript files
    ├── config.js          # Configuration & constants ✅ Created
    ├── storage.js         # LocalStorage operations
    ├── audio.js           # Audio & speech synthesis
    ├── translation.js     # Translation functionality
    ├── practice.js        # Practice exercises
    ├── game.js            # Matching game logic
    ├── lessons.js         # Lesson management
    ├── ui.js              # UI updates & DOM manipulation
    └── main.js            # Application orchestration
```

## 🎯 Module Responsibilities

### 1. config.js ✅
**Purpose**: Store all configuration data and constants
- Translation dictionary (300+ words)
- Sample lesson data
- Application constants
**Exports**: `translationDictionary`, `sampleLessons`

### 2. storage.js
**Purpose**: Handle all localStorage operations
**Functions**:
- `saveLessons(lessons)`
- `loadLessons()`
- `saveTranslations(translations)`
- `loadTranslations()`
- `saveProgress(progressData)`
- `loadProgress()`
**Benefits**: Centralized data persistence, easy to switch to other storage methods

### 3. audio.js
**Purpose**: Handle audio playback and speech synthesis
**Functions**:
- `initializeAudioContext()`
- `speakChinese(text, rate = 0.8)`
- `startRecording(callback)`
- `stopRecording()`
- `playAudio(audioUrl)`
**Benefits**: Encapsulates all audio logic, reusable across features

### 4. translation.js
**Purpose**: Translation functionality
**Functions**:
- `translateWord(english)` - Returns translation object
- `addTranslation(translation)` - Saves to list
- `getTranslations()` - Returns all saved
- `clearTranslations()`
**Depends on**: `config.js`, `storage.js`

### 5. practice.js
**Purpose**: Pronunciation practice exercises
**Functions**:
- `loadExercise(lesson, index)`
- `generatePronunciationScore()` - Simulated scoring
- `savePronunciationRating(rating)`
- `displayFeedback(rating)`
**Depends on**: `audio.js`, `storage.js`

### 6. game.js
**Purpose**: Matching game logic
**Functions**:
- `startNewGame(difficulty)`
- `startCustomGame(translations)`
- `handleDragStart(event)`
- `handleDrop(event)`
- `checkMatch(card1, card2)`
- `endGame()`
**Depends on**: `config.js`, `audio.js`, `ui.js`

### 7. lessons.js
**Purpose**: Lesson creation and management
**Functions**:
- `createLessonFromTranslations(name, translations)`
- `createLessonFromAudio(name, audioFiles)`
- `deleteLesson(lessonId)`
- `getLessons()`
- `getLesson(lessonId)`
**Depends on**: `storage.js`

### 8. ui.js
**Purpose**: UI updates and DOM manipulation
**Functions**:
- `switchTab(tabName)`
- `displayTranslationResult(translation)`
- `displaySavedTranslations(translations)`
- `displayLessonList(lessons)`
- `showMessage(type, text)` - Success/error messages
- `updateProgressDisplay(progressData)`
**Benefits**: Separates UI logic from business logic

### 9. main.js
**Purpose**: Application initialization and coordination
**Functions**:
- `initializeApp()` - Set up application
- `setupEventListeners()` - Bind all events
- `coordinateModules()` - Connect modules together
**Depends on**: All other modules

## 🔄 Migration Strategy

### Phase 1: Infrastructure ✅
1. ✅ Create `js/` directory
2. ✅ Create `config.js` with constants
3. ✅ Create `ARCHITECTURE.md` documentation

### Phase 2: Core Modules (Next Steps)
1. Create `storage.js` - Extract localStorage operations
2. Create `audio.js` - Extract audio functionality
3. Create `ui.js` - Ex tract UI updates
4. Test each module independently

### Phase 3: Feature Modules
1. Create `translation.js` - Extract translation logic
2. Create `practice.js` - Extract practice features
3. Create `game.js` - Extract game logic
4. Create `lessons.js` - Extract lesson management

### Phase 4: Integration
1. Create `main.js` - Orchestrate all modules
2. Update `index.html` to use ES6 modules
3. Remove `script.js` (legacy)
4. Final testing

## 📝 Module Template

```javascript
// MODULE_NAME.js
import { dependency1, dependency2 } from './other-module.js';

// Module state (if needed)
let moduleState = {};

// Private functions
function privateHelper() {
    // Internal logic
}

// Public functions
export function publicFunction1() {
    // Implementation
}

export function publicFunction2() {
    // Implementation
}

// Initialize module if needed
export function initializeModule() {
    // Setup code
}
```

## 🎯 Benefits of Modular Architecture

### 1. **Maintainability**
- Each module has a single responsibility
- Easy to locate and fix bugs
- Clear code organization

### 2. **Testability**
- Each module can be tested independently
- Mock dependencies easily
- Unit tests per module

### 3. **Scalability**
- Add new features without affecting existing code
- Easy to extend functionality
- Modules can be reused

### 4. **Collaboration**
- Multiple developers can work on different modules
- Reduced merge conflicts
- Clear module boundaries

### 5. **Performance**
- Load only needed modules
- Easier code splitting
- Better caching strategies

## 🔧 Implementation Example

### Before (Monolithic):
```javascript
// script.js - 2000+ lines
let lessons = [];
let translations = [];
function translateWord() { /* 50 lines */ }
function startGame() { /* 100 lines */ }
function playAudio() { /* 30 lines */ }
// ... hundreds more lines
```

### After (Modular):
```javascript
// main.js
import { translateWord } from './translation.js';
import { startGame } from './game.js';
import { speakChinese } from './audio.js';

export function initializeApp() {
    setupEventListeners();
    loadSavedData();
}
```

## 📊 Current Status

- ✅ **config.js**: Complete - Configuration & constants
- ✅ **storage.js**: Complete - LocalStorage operations
- ✅ **audio.js**: Complete - Audio & speech synthesis
- ✅ **translation.js**: Complete - Translation functionality
- ✅ **practice.js**: Complete - Practice exercises
- ✅ **game.js**: Complete - Matching game logic
- ✅ **lessons.js**: Complete - Lesson management
- ✅ **ui.js**: Complete - UI updates & DOM manipulation
- ✅ **main.js**: Complete - Application orchestration

**🎉 All modules implemented! Modular architecture is ready.**

## 🚀 Quick Start for Implementation

1. **Copy** the module template above
2. **Extract** related functions from `script.js`
3. **Import** dependencies from other modules
4. **Export** public functions
5. **Test** the module

## 📚 Next Steps

To complete the modularization:

1. Review this architecture document
2. Implement remaining modules following the structure
3. Update `index.html` to use `type="module"`
4. Test each module independently
5. Integrate and test the complete application

## 🤝 Contributing

When adding new features:
1. Determine which module it belongs to
2. If no suitable module exists, consider creating one
3. Keep modules focused and cohesive
4. Update this document with changes

# Mandarin Tutor 🎓

A comprehensive web application for teaching Mandarin Chinese pronunciation to children through interactive lessons, practice exercises, and engaging games.

## 🌟 Features

### 1. **Translation System**
- 300+ word English-to-Mandarin dictionary
- Instant translation with pinyin and audio
- Save translations for later use
- Create custom lessons from translations
- Generate matching games from saved words

### 2. **Practice Exercises**
- Pronunciation practice with audio playback
- Record your voice for comparison
- **Azure Speech SDK integration** for professional pronunciation assessment
- Automated scoring with tone and clarity metrics
- Manual rating system with detailed metrics
- Progress tracking across sessions

### 3. **Matching Game**
- Drag-and-drop interface
- Match Chinese characters with images/emojis
- Multiple difficulty levels (Easy, Medium, Hard)
- Custom games from your translations
- Timer and move counter
- Audio pronunciation on card click

### 4. **Lesson Management**
- Create lessons from translations
- Upload audio files for custom lessons (simulated)
- Manage and delete lessons
- Practice any lesson at any time
- Track lesson completion

### 5. **Progress Tracking**
- Total exercises completed
- Average pronunciation scores
- Practice time tracking
- Performance history

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ installed
- npm (comes with Node.js)

### Quick Start
1. **Install dependencies**:
   ```bash
   cd mandarin-tutor
   npm install
   ```

2. **Start the local server** (required for ES6 modules and API endpoints):
   ```bash
   # Without Azure (demo mode):
   npm start
   
   # With Azure credentials (real pronunciation assessment):
   AZURE_SPEECH_KEY="your_key" AZURE_SPEECH_REGION="westus3" npm start
   ```

3. **Open your browser** to http://localhost:8000

4. **(Optional) Configure Azure Speech SDK** for real pronunciation assessment:
   - See [Azure Setup](#azure-speech-sdk-setup-optional-but-recommended) below
   - Get free Azure Speech Service credentials
   - Run server with AZURE_SPEECH_KEY and AZURE_SPEECH_REGION env vars
5. Start with the **Translate** tab
5. Enter English words to get Mandarin translations
6. Save translations and create lessons or games
7. Practice pronunciation in the **Practice** tab
8. Play matching games in the **Matching Game** tab

### Azure Speech SDK Setup (Optional but Recommended)

For professional-grade pronunciation assessment with real-time scoring:

1. **Create Azure Account**: Get a [free Azure account](https://azure.microsoft.com/en-us/free/)
2. **Create Speech Service Resource**: 
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new "Speech" resource
   - Choose a region (e.g., "West US 3")
   - Note your subscription key and region
3. **Run with credentials**:
   ```bash
   AZURE_SPEECH_KEY="your_subscription_key" AZURE_SPEECH_REGION="westus3" npm start
   ```

**Benefits of Azure Integration:**
- Real pronunciation scoring based on native Mandarin patterns
- Accurate tone assessment for Mandarin Chinese
- Word-level feedback highlighting specific pronunciation issues
- Professional-grade speech recognition technology

**Without Azure:**
- App still works with simulated scoring
- Great for testing and development
- No external dependencies required

### Alternative (Legacy Version)
If you prefer the monolithic version without a server:
1. Uncomment `<script src="script.js"></script>` in `index.html`
2. Comment out `<script type="module" src="js/main.js"></script>`
3. Open `index.html` directly in your browser

### Browser Requirements
- Modern browser with ES6 module support
- Audio/microphone permissions for pronunciation practice
- Speech Synthesis API for text-to-speech
- Local HTTP server for modular version (Node.js included)

## 📁 Project Structure

```
mandarin-tutor/
├── index.html           # Main application interface
├── styles.css           # Complete styling
├── script.js            # Current monolithic implementation
├── README.md           # This file
├── ARCHITECTURE.md     # Modular architecture documentation
└── js/                 # Modular refactoring (in progress)
    └── config.js       # Configuration and constants
```

## 🏗️ Architecture

### Current Status
The application currently uses a **monolithic architecture** with all logic in `script.js`. We've begun refactoring to a **modular architecture** to improve maintainability and scalability.

### Refactoring Progress
- ✅ Planning and documentation complete
- ✅ `js/` directory structure created
- ✅ `config.js` module extracted
- ⏳ Core modules (storage, audio, UI) - pending
- ⏳ Feature modules (translation, practice, game) - pending
- ⏳ Integration layer - pending

**See `ARCHITECTURE.md` for detailed modular architecture documentation.**

## 🎯 User Workflow

### Creating Content
1. **Translate Tab**: Enter English words → Get Mandarin translations
2. Click "📚 Create Lesson" to make a practice lesson
3. OR click "🎮 Create Game" to create a matching game

### Learning
1. **Practice Tab**: Select a lesson and practice pronunciation
2. Record your voice and get feedback
3. Move through exercises at your own pace

### Playing
1. **Matching Game Tab**: Click "🎲 New Game" for random words
2. OR create custom games from your translations
3. Drag Chinese cards to match with pictures
4. Click any card to hear pronunciation

## 💻 Technical Details

### Technologies Used
- **HTML5**: Structure and semantics
- **CSS3**: Styling with gradients, flexbox, grid
- **Vanilla JavaScript**: No frameworks - pure ES6+
- **Web APIs**:
  - Speech Synthesis API (text-to-speech)
  - MediaRecorder API (voice recording)
  - LocalStorage (data persistence)
  - Drag and Drop API (game interface)

### Data Storage
All data is stored locally in the browser using `localStorage`:
- `mandarinLessons`: All created lessons
- `savedTranslations`: Translation history
- `progressData`: Learning statistics

### Key Features
- **300+ Word Dictionary**: Comprehensive vocabulary across multiple categories
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Capable**: No internet required after initial load
- **Privacy Focused**: All data stays on your device

## 🎨 Customization

### Adding New Words
Edit the `translationDictionary` object in `script.js` (or `js/config.js` in modular version):

```javascript
export const translationDictionary = {
    'your word': { 
        chinese: '中文', 
        pinyin: 'zhōng wén', 
        emoji: '📝' 
    },
    // ... more words
};
```

### Styling
All styles are in `styles.css`. Key CSS variables:
- Primary color: `#667eea`
- Secondary color: `#764ba2`
- Success color: `#28a745`

## 🔧 Development

### Current Implementation
The app currently runs with a single `script.js` file. It's fully functional but can be difficult to maintain as it grows.

### Future Modular Structure
We're refactoring to separate concerns:
- **Config**: Constants and dictionaries
- **Storage**: Data persistence
- **Audio**: Speech and recording
- **Translation**: Translation logic
- **Practice**: Exercise management
- **Game**: Game mechanics
- **Lessons**: Lesson CRUD
- **UI**: DOM manipulation
- **Main**: Orchestration

### Migration Path
1. Extract modules one at a time
2. Test each module independently
3. Maintain backwards compatibility
4. Switch to modules when complete

See `ARCHITECTURE.md` for complete migration strategy.

## 📊 Performance

- **Load Time**: < 1 second
- **Dictionary Size**: 300+ words (expandable)
- **Storage**: ~1-5 MB localStorage
- **Memory**: Minimal footprint

## 🐛 Known Limitations

1. **Audio Quality**: Uses browser's built-in speech synthesis (quality varies by browser)
2. **Pronunciation Assessment**: Simulated (not real speech recognition)
3. **Dictionary Size**: Currently 300+ words (can be expanded)
4. **Browser Compatibility**: Requires modern browser with ES6 support

## 🔮 Future Enhancements

- [ ] Complete modular refactoring
- [ ] Add more words to dictionary
- [ ] Implement real speech recognition
- [ ] Add more game types
- [ ] Export/import lessons
- [ ] Shared lessons between users
- [ ] Unit tests for all modules
- [ ] Progressive Web App (PWA) features

## 📝 Contributing

To contribute to the modular refactoring:

1. Read `ARCHITECTURE.md` for structure
2. Choose a module to implement
3. Follow the module template
4. Test thoroughly
5. Update documentation

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Font: Noto Sans SC (Google Fonts) for Chinese characters
- Icons: Emoji for visual representation
- Inspiration: Making Mandarin learning fun and accessible

## 📞 Support

For issues or questions:
- Review `ARCHITECTURE.md` for technical details
- Check browser console for errors
- Ensure microphone permissions are granted
- Try different browsers if issues persist

---

**Built with ❤️ for language learners everywhere**

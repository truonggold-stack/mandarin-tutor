// Main Module
// Application orchestration and initialization

import { sampleLessons } from './config.js';
import { initializeAudio, speakChinese } from './audio.js';
import { initializeTranslation, translateWord, addTranslation, getTranslations, clearTranslations } from './translation.js';
import { initializeLessons, createLesson, getLessons, getLesson, deleteLesson } from './lessons.js';
import { initializePractice, loadLesson as loadPracticeLesson, getCurrentExercise, nextExercise, previousExercise, playReference, startPracticeRecording, stopPracticeRecording, isPracticeRecording, assessPronunciationWithAzure, generatePronunciationScore, savePronunciationRating } from './practice.js';
import { startNewGame, startCustomGame, getGameState, shuffleArray } from './game.js';
import { switchTab, displayTranslationResult, displaySavedTranslations, displayLessonList, populateLessonSelector, displayExercise, toggleExerciseContainer, updateProgressDisplay } from './ui.js';

/**
 * Initialize the application
 */
export function initializeApp() {
    console.log('Initializing Mandarin Tutor...');
    
    // Initialize all modules
    initializeAudio();
    const translations = initializeTranslation();
    let lessons = initializeLessons();
    const progress = initializePractice();
    
    // Load sample lesson if no lessons exist
    if (lessons.length === 0) {
        sampleLessons.forEach(lesson => {
            createLesson(lesson.name, lesson.exercises);
        });
        lessons = getLessons();
    }
    
    // Initialize UI
    displaySavedTranslations(translations);
    displayLessonList(lessons);
    populateLessonSelector(lessons);
    updateProgressDisplay(progress);
    
    // Setup event listeners
    setupEventListeners();
    
    // Expose global functions for inline event handlers
    setupGlobalFunctions();
    
    console.log('Mandarin Tutor initialized successfully!');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
            if (btn.dataset.tab === 'translate') {
                displayLessonList(getLessons());
            }
        });
    });
    
    // Translation
    const translateBtn = document.getElementById('translate-btn');
    const englishInput = document.getElementById('english-input');
    
    if (translateBtn) {
        translateBtn.addEventListener('click', handleTranslation);
    }
    
    if (englishInput) {
        englishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleTranslation();
        });
    }
    
    // Practice
    const lessonSelect = document.getElementById('lesson-select');
    if (lessonSelect) {
        lessonSelect.addEventListener('change', handleLessonSelect);
    }
    
    const playRefBtn = document.getElementById('play-reference');
    if (playRefBtn) {
        playRefBtn.addEventListener('click', playReference);
    }
    
    // Record button
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
        recordBtn.addEventListener('click', handleRecording);
    }
    
    const prevBtn = document.getElementById('prev-exercise');
    const nextBtn = document.getElementById('next-exercise');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (previousExercise()) {
                const exercise = getCurrentExercise();
                const lessons = getLessons();
                displayExercise(exercise, getCurrentExercise(), lessons.length);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (nextExercise()) {
                const exercise = getCurrentExercise();
                const lessons = getLessons();
                displayExercise(exercise, getCurrentExercise(), lessons.length);
            }
        });
    }
    
    // Game
    const newGameBtn = document.getElementById('new-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            const difficulty = document.getElementById('difficulty-select').value;
            startNewGame(difficulty);
            // Render game board (implementation depends on game module integration)  
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            const difficulty = document.getElementById('difficulty-select').value;
            startNewGame(difficulty);
        });
    }
}

/**
 * Handle translation request
 */
async function handleTranslation() {
    const input = document.getElementById('english-input').value.trim().toLowerCase();
    const translateBtn = document.getElementById('translate-btn');
    
    if (!input) {
        alert('Please enter an English phrase');
        return;
    }
    
    // Show loading state
    const originalBtnText = translateBtn ? translateBtn.textContent : '';
    if (translateBtn) {
        translateBtn.disabled = true;
        translateBtn.textContent = '🔄 Translating...';
    }
    
    try {
        const translation = await translateWord(input);
        
        if (translation) {
            displayTranslationResult(translation);
            
            // Setup button handlers
            document.getElementById('play-translation').onclick = () => speakChinese(translation.chinese);
            document.getElementById('add-to-exercises').onclick = () => {
                if (addTranslation(translation)) {
                    displaySavedTranslations(getTranslations());
                    alert('Added to saved translations!');
                } else {
                    alert('This translation is already saved.');
                }
            };
        } else {
            alert('Translation not found. Please try another phrase.');
        }
    } catch (error) {
        console.error('Translation error:', error);
        alert('Error translating. Please try again.');
    } finally {
        // Restore button state
        if (translateBtn) {
            translateBtn.disabled = false;
            translateBtn.textContent = originalBtnText;
        }
    }
}

/**
 * Handle lesson selection
 */
function handleLessonSelect(e) {
    const lessonId = e.target.value;
    const lesson = getLesson(lessonId);
    
    if (lesson) {
        loadPracticeLesson(lesson);
        const exercise = getCurrentExercise();
        if (exercise) {
            displayExercise(exercise, 0, lesson.exercises.length);
            toggleExerciseContainer(true);
        }
    }
}

/**
 * Handle recording button click
 */
let recordedAudioBlob = null;

async function handleRecording() {
    const recordBtn = document.getElementById('record-btn');
    const playRecordingBtn = document.getElementById('play-recording');
    
    if (!recordBtn) return;
    
    if (isPracticeRecording()) {
        // Stop recording
        stopPracticeRecording();
        recordBtn.textContent = '🎤 Record Your Voice';
        recordBtn.classList.remove('recording');
    } else {
        // Start recording
        const exercise = getCurrentExercise();
        if (!exercise) {
            alert('Please select a lesson first');
            return;
        }
        
        recordBtn.textContent = '⏹️ Stop Recording';
        recordBtn.classList.add('recording');
        
        const started = await startPracticeRecording((audioUrl, audioBlob) => {
            // Recording stopped callback
            recordBtn.textContent = '🎤 Record Your Voice';
            recordBtn.classList.remove('recording');
            
            // Store the blob for Azure assessment
            recordedAudioBlob = audioBlob;
            
            // Show play button
            if (playRecordingBtn) {
                playRecordingBtn.style.display = 'inline-block';
                playRecordingBtn.onclick = () => {
                    const audio = new Audio(audioUrl);
                    audio.play();
                };
            }
            
            // Perform Azure pronunciation assessment
            assessPronunciation(audioBlob, exercise.chinese);
        });
        
        if (!started) {
            recordBtn.textContent = '🎤 Record Your Voice';
            recordBtn.classList.remove('recording');
            alert('Failed to start recording. Please check microphone permissions.');
        }
    }
}

/**
 * Assess pronunciation using Azure or fallback
 */
async function assessPronunciation(audioBlob, referenceText) {
    try {
        // Show loading state
        const ratingDiv = document.getElementById('pronunciation-rating');
        if (ratingDiv) {
            ratingDiv.style.display = 'block';
            ratingDiv.innerHTML = '<div class="status warning">🔄 Analyzing pronunciation...</div>';
        }
        
        // Try Azure assessment first
        let result;
        try {
            result = await assessPronunciationWithAzure(audioBlob, referenceText);
            console.log('Azure assessment result:', result);
        } catch (error) {
            console.warn('Azure assessment failed, using fallback:', error);
            result = generatePronunciationScore();
        }
        
        // Display results
        displayPronunciationResults(result);
        
    } catch (error) {
        console.error('Pronunciation assessment error:', error);
        alert('Error assessing pronunciation. Please try again.');
    }
}

/**
 * Display pronunciation assessment results
 */
function displayPronunciationResults(result) {
    const ratingDiv = document.getElementById('pronunciation-rating');
    if (!ratingDiv) return;
    
    // Build stars HTML
    const starsHtml = '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars);
    
    // Display results
    ratingDiv.innerHTML = `
        <h3>📊 Pronunciation Assessment</h3>
        <div class="assessment-results">
            <div class="stars-result">${starsHtml}</div>
            <div class="scores-grid">
                <div class="score-item">
                    <label>Tone Accuracy:</label>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.toneScore}%"></div>
                    </div>
                    <span class="score-value">${result.toneScore}%</span>
                </div>
                <div class="score-item">
                    <label>Clarity:</label>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.clarityScore}%"></div>
                    </div>
                    <span class="score-value">${result.clarityScore}%</span>
                </div>
            </div>
            <div class="feedback-text">${result.feedback}</div>
            ${result.azureData ? `
                <div class="azure-details" style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px; font-size: 12px;">
                    <strong>Azure Speech SDK Results:</strong><br>
                    Recognized: ${result.azureData.recognizedText}<br>
                    Overall: ${result.azureData.overallScore}%
                </div>
            ` : ''}
            <button class="btn-primary" id="save-assessment-btn" style="margin-top: 15px;">
                ✅ Save Assessment
            </button>
        </div>
    `;
    
    ratingDiv.style.display = 'block';
    
    // Setup save button
    const saveBtn = document.getElementById('save-assessment-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const rating = {
                stars: result.stars,
                tone: result.toneScore,
                clarity: result.clarityScore,
                notes: result.feedback
            };
            
            if (savePronunciationRating(rating)) {
                alert('✅ Assessment saved!');
                ratingDiv.style.display = 'none';
            } else {
                alert('Failed to save assessment');
            }
        };
    }
}

/**
 * Setup global functions for inline event handlers
 * (Used by UI module for dynamically generated content)
 */
function setupGlobalFunctions() {
    // Global function for speaking Chinese (used in UI)
    window.speakChineseGlobal = (text) => {
        speakChinese(text);
    };
    
    // Global function for loading lesson in practice
    window.loadLessonInPracticeGlobal = (lessonId) => {
        switchTab('practice');
        const select = document.getElementById('lesson-select');
        if (select) {
            select.value = lessonId;
            const event = new Event('change');
            select.dispatchEvent(event);
        }
    };
    
    // Global function for deleting lesson
    window.deleteLessonGlobal = (lessonId) => {
        if (confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
            if (deleteLesson(lessonId)) {
                const lessons = getLessons();
                displayLessonList(lessons);
                populateLessonSelector(lessons);
                alert('Lesson deleted successfully!');
            }
        }
    };
    
    // Global function for creating lesson from translations
    window.createLessonFromTranslations = () => {
        const translations = getTranslations();
        
        if (translations.length === 0) {
            alert('Please add some translations first!');
            return;
        }
        
        const lessonName = prompt('Enter a name for your new lesson:');
        if (!lessonName || !lessonName.trim()) {
            return;
        }
        
        const exercises = translations.map(t => ({
            chinese: t.chinese,
            pinyin: t.pinyin,
            english: t.english,
            audioUrl: null
        }));
        
        createLesson(lessonName.trim(), exercises);
        
        const lessons = getLessons();
        populateLessonSelector(lessons);
        displayLessonList(lessons);
        
        alert(`✅ Lesson "${lessonName}" created with ${translations.length} exercises!`);
        
        if (confirm('Lesson created! Would you like to clear your saved translations to start fresh?')) {
            clearTranslations();
            displaySavedTranslations([]);
        }
    };
    
    // Global function for creating game from translations
    window.createGameFromTranslations = () => {
        const translations = getTranslations();
        
        if (translations.length === 0) {
            alert('Please add some translations first!');
            return;
        }
        
        if (translations.length < 3) {
            alert('You need at least 3 translations to create a matching game!');
            return;
        }
        
        switchTab('game');
        startCustomGame(translations);
        alert(`🎮 Custom game created with ${translations.length} pairs!`);
    };
}

/**
 * Application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

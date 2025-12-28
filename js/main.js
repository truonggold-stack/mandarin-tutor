// Main Module
// Application orchestration and initialization

import { sampleLessons } from './config.js';
import { initializeAudio, speakChinese, speakEnglish } from './audio.js';
import { initializeTranslation, translateWord, addTranslation, getTranslations, clearTranslations, deleteTranslation } from './translation.js';
import { initializeLessons, createLesson, getLessons, getLesson, deleteLesson } from './lessons.js';
import { initializePractice, loadLesson as loadPracticeLesson, getCurrentExercise, nextExercise, previousExercise, playReference, startPracticeRecording, stopPracticeRecording, isPracticeRecording, assessPronunciationWithAzure, generatePronunciationScore, savePronunciationRating, getCurrentLessonInfo } from './practice.js';
import { startNewGame, startCustomGame, getGameState, shuffleArray, handleDrop, handleDragStart, playPairAudio, endGame, isGameActive } from './game.js';
import { switchTab, displayTranslationResult, displaySavedTranslations, displayLessonList, populateLessonSelector, displayExercise, toggleExerciseContainer, updateProgressDisplay, displaySavedGames, renderGameBoard, updateGameStats, hideGameResult, showGameResult } from './ui.js';
import { saveGames, loadGames, saveProgress, loadProgress, saveGameResult } from './storage.js';

/**
 * Initialize the application
 */
export function initializeApp() {
    console.log('🚀 Initializing Mandarin Tutor...');
    
    // Clear saved translations from previous session
    clearTranslations();
    
    // Initialize all modules
    initializeAudio();
    const translations = initializeTranslation();
    let lessons = initializeLessons();
    const progress = loadProgress();
    
    // Load and display saved games
    const savedGames = loadGames();
    displaySavedGames(savedGames);
    
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
            if (btn.dataset.tab === 'progress') {
                const progress = loadProgress();
                updateProgressDisplay(progress);
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
            initializeNewGame(difficulty);
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            const difficulty = document.getElementById('difficulty-select').value;
            initializeNewGame(difficulty);
        });
    }
}

/**
 * Initialize a new game with rendering and event handlers
 * @param {string} difficulty - Game difficulty level
 */
function initializeNewGame(difficulty) {
    // Hide any previous game result
    hideGameResult();
    
    // Start new game
    const pairs = startNewGame(difficulty);
    
    // Shuffle pairs for display
    const chinesePairs = shuffleArray([...pairs]);
    const imagePairs = shuffleArray([...pairs]);
    
    // Render game board
    renderGameBoard(chinesePairs, imagePairs);
    
    // Set up drag and drop event listeners
    setupDragAndDrop();
    
    // Initialize stats display
    updateGameStats({
        moveCount: 0,
        matchedPairs: 0,
        totalPairs: pairs.length,
        formattedTime: '0:00'
    });
    
    // Set up game completion monitoring AFTER the game starts
    let gameTimerInterval = setInterval(() => {
        if (isGameActive()) {
            const state = getGameState();
            
            updateGameStats({
                moveCount: state.moveCount,
                matchedPairs: state.matchedPairs,
                totalPairs: state.pairs.length,
                formattedTime: state.formattedTime
            });
            
            // Check if game is complete
            if (state.isComplete) {
                console.log('🎉 TIMER DETECTED GAME COMPLETE! matchedPairs:', state.matchedPairs, '/', state.pairs.length);
                const result = endGame();
                console.log('📊 Game result object:', result);
                
                // Show game score modal with confetti
                showGameScoreModal(result);
                console.log('✅ Score modal shown');
                
                // Save game result to progress
                const saved = saveGameResult(result);
                console.log('💾 Game result saved:', saved);
                
                // Trigger confetti
                triggerConfetti();
                console.log('🎊 Confetti triggered');
                
                showGameResult({
                    time: result.formattedTime,
                    moves: result.moveCount
                });
                
                // Stop checking after game is complete
                clearInterval(gameTimerInterval);
            }
        }
    }, 100);
}

/**
 * Set up drag and drop event handlers
 */
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable');
    const dropTargets = document.querySelectorAll('.drop-target');
    
    let draggedPairId = null;
    
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggedPairId = parseInt(draggable.dataset.pairId);
            handleDragStart(draggedPairId);
            draggable.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedPairId);
        });
        
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            draggedPairId = null;
        });
        
        // Add click to play audio
        draggable.addEventListener('click', () => {
            const pairId = parseInt(draggable.dataset.pairId);
            playPairAudio(pairId);
        });
    });
    
    dropTargets.forEach(target => {
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            target.classList.add('drag-over');
        });
        
        target.addEventListener('dragleave', () => {
            target.classList.remove('drag-over');
        });
        
        // Add click to play English audio
        target.addEventListener('click', () => {
            // Get the English text from the card
            const labelElement = target.querySelector('.card-label');
            if (labelElement) {
                const englishText = labelElement.textContent;
                speakEnglish(englishText);
            }
        });
        
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            target.classList.remove('drag-over');
            
            const dropTargetId = parseInt(target.dataset.pairId);
            
            console.log('📥 Drop event: draggedPairId=' + draggedPairId + ', dropTargetId=' + dropTargetId);
            
            // Always call handleDrop to track attempts (both correct and incorrect)
            const result = handleDrop(dropTargetId);
            
            // Check if this is a match
            const isMatch = result.matched;
            
            if (isMatch) {
                // Mark cards as matched
                const draggedCard = document.querySelector(`.draggable[data-pair-id="${draggedPairId}"]`);
                if (draggedCard) {
                    draggedCard.classList.add('matched');
                    draggedCard.draggable = false;
                }
                target.classList.add('matched');
                
                // Play audio
                playPairAudio(draggedPairId);
                
                // Check if game is complete after this match
                if (result.isComplete) {
                    console.log('🎉 GAME COMPLETE DETECTED IN DROP HANDLER!');
                    const gameResult = endGame();
                    console.log('📊 Game result object:', gameResult);
                    
                    // Show game score modal with confetti
                    showGameScoreModal(gameResult);
                    console.log('✅ Score modal shown');
                    
                    // Save game result to progress
                    const saved = saveGameResult(gameResult);
                    console.log('💾 Game result saved:', saved);
                    
                    // Trigger confetti
                    triggerConfetti();
                    console.log('🎊 Confetti triggered');
                    
                    showGameResult({
                        time: gameResult.formattedTime,
                        moves: gameResult.moveCount
                    });
                }
            }
            
            // Update stats display
            const state = getGameState();
            updateGameStats({
                moveCount: state.moveCount,
                matchedPairs: state.matchedPairs,
                totalPairs: state.pairs.length,
                formattedTime: state.formattedTime
            });
        });
    });
}

/**
 * Show game score modal with confetti
 * @param {Object} gameResult - Game result object
 */
function showGameScoreModal(gameResult) {
    const modal = document.getElementById('game-score-modal');
    const percentageEl = document.getElementById('score-percentage');
    const firstTryEl = document.getElementById('first-try-matches');
    const timeEl = document.getElementById('game-completion-time');
    
    console.log('📱 showGameScoreModal called');
    console.log('   gameResult:', gameResult);
    console.log('   modal element:', modal);
    console.log('   modal id:', modal?.id);
    console.log('   modal current display:', modal?.style.display);
    
    if (!modal) {
        console.error('❌ MODAL NOT FOUND! Searched for id="game-score-modal"');
        return;
    }
    
    // Calculate first-try accuracy percentage
    const accuracy = gameResult.firstTryAccuracy || 0;
    
    // Update modal content
    if (percentageEl) {
        percentageEl.textContent = accuracy + '%';
        console.log('   Updated percentage to:', accuracy + '%');
    } else {
        console.error('❌ percentageEl not found');
    }
    
    if (firstTryEl) {
        firstTryEl.textContent = gameResult.firstTryMatches + ' / ' + gameResult.totalPairs;
        console.log('   Updated firstTry to:', gameResult.firstTryMatches + ' / ' + gameResult.totalPairs);
    } else {
        console.error('❌ firstTryEl not found');
    }
    
    if (timeEl) {
        timeEl.textContent = gameResult.formattedTime;
        console.log('   Updated time to:', gameResult.formattedTime);
    } else {
        console.error('❌ timeEl not found');
    }
    
    // Show modal
    console.log('📱 Setting modal.style.display to "flex"');
    modal.style.display = 'flex';
    console.log('   Modal display is now:', modal.style.display);
    console.log('   Computed style:', window.getComputedStyle(modal).display);
}

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
    if (typeof confetti === 'undefined') {
        console.warn('Confetti library not loaded');
        return;
    }
    
    // Multiple bursts for more impressive effect
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
    
    // Delayed second burst
    setTimeout(() => {
        confetti({
            particleCount: 50,
            spread: 90,
            origin: { y: 0.6 }
        });
    }, 150);
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
        
        console.log('🎯 Starting pronunciation assessment for text:', referenceText);
        
        // Try Azure assessment first
        let result;
        try {
            result = await assessPronunciationWithAzure(audioBlob, referenceText);
            
            // Check if it's a fallback score (no azureData)
            if (result.azureData) {
                console.log('✅ Using Azure assessment scores');
            } else {
                console.warn('⚠️ No Azure data in response - using fallback scoring');
            }
            
            console.log('📊 Assessment result:', result);
        } catch (error) {
            console.warn('⚠️ Azure assessment threw error, using fallback:', error);
            result = generatePronunciationScore();
        }
        
        // Display results
        displayPronunciationResults(result);
        
    } catch (error) {
        console.error('❌ Pronunciation assessment error:', error);
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
            
            // Save to lesson ratings (existing functionality)
            if (savePronunciationRating(rating)) {
                // Also save to pronunciation progress tracking
                const lessonInfo = getCurrentLessonInfo();
                if (lessonInfo) {
                    import('./storage.js').then(({ savePronunciationScore }) => {
                        savePronunciationScore({
                            lessonId: lessonInfo.lessonId,
                            lessonName: lessonInfo.lessonName,
                            task: lessonInfo.task,
                            score: Math.round((result.stars / 5) * 100),
                            stars: result.stars,
                            toneScore: result.toneScore,
                            clarityScore: result.clarityScore
                        });
                    });
                }
                
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
    
    // Global function for deleting translation
    window.deleteTranslationGlobal = (index) => {
        if (deleteTranslation(index)) {
            const translations = getTranslations();
            displaySavedTranslations(translations);
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
        
        // Prompt for game name
        const gameName = prompt('Enter a name for your game:');
        if (!gameName || !gameName.trim()) {
            return;
        }
        
        // Create game object
        const newGame = {
            id: Date.now(),
            name: gameName.trim(),
            createdAt: new Date().toISOString(),
            pairs: translations.map(t => ({
                english: t.english,
                chinese: t.chinese,
                pinyin: t.pinyin,
                emoji: t.emoji || '📝'
            })),
            bestTime: null,
            playCount: 0
        };
        
        // Save to storage
        const games = loadGames();
        games.push(newGame);
        saveGames(games);
        
        // Update display
        displaySavedGames(games);
        
        // Switch to game tab and start the game
        switchTab('game');
        startCustomGame(translations);
        
        alert(`🎮 Game "${gameName}" saved with ${translations.length} pairs!`);
    };
    
    // Global function to play a saved game
    window.playGame = (index) => {
        const games = loadGames();
        if (!games[index]) return;
        
        const game = games[index];
        
        // Update play count
        game.playCount = (game.playCount || 0) + 1;
        games[index] = game;
        saveGames(games);
        
        // Hide any previous game result
        hideGameResult();
        
        // Start the custom game
        const pairs = startCustomGame(game.pairs);
        
        // Shuffle pairs for display
        const chinesePairs = shuffleArray([...pairs]);
        const imagePairs = shuffleArray([...pairs]);
        
        // Render game board
        renderGameBoard(chinesePairs, imagePairs);
        
        // Set up drag and drop
        setupDragAndDrop();
        
        // Initialize stats
        updateGameStats({
            moveCount: 0,
            matchedPairs: 0,
            totalPairs: pairs.length,
            formattedTime: '0:00'
        });
        
        // Scroll to game board
        document.getElementById('game-board').scrollIntoView({ behavior: 'smooth' });
    };
    
    // Global function to delete a saved game
    window.deleteGame = (index) => {
        const games = loadGames();
        if (!games[index]) return;
        
        if (confirm(`Are you sure you want to delete "${games[index].name}"?`)) {
            games.splice(index, 1);
            saveGames(games);
            displaySavedGames(games);
            alert('Game deleted!');
        }
    };
}

/**
 * Application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

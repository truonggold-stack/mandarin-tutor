// Game Module
// Handles matching game logic and mechanics

import { translationDictionary } from './config.js';
import { speakChinese } from './audio.js';

// Module state
let gamePairs = [];
let draggedCard = null;
let matchedPairs = 0;
let moveCount = 0;
let gameTimer = null;
let gameStartTime = null;

/**
 * Start a new game with difficulty level
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array} Array of game pairs
 */
export function startNewGame(difficulty = 'medium') {
    const pairCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 9;
    
    // Reset game state
    resetGameState();
    
    // Select random pairs from dictionary
    const allWords = Object.keys(translationDictionary);
    const shuffled = allWords.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, pairCount);
    
    selected.forEach((word, index) => {
        const translation = translationDictionary[word];
        gamePairs.push({
            id: index,
            english: word,
            chinese: translation.chinese,
            pinyin: translation.pinyin,
            emoji: translation.emoji || '📝',
            matched: false
        });
    });
    
    // Start timer
    gameStartTime = Date.now();
    startGameTimer();
    
    return gamePairs;
}

/**
 * Start a custom game with specific translations
 * @param {Array} translations - Array of translation objects
 * @returns {Array} Array of game pairs
 */
export function startCustomGame(translations) {
    // Reset game state
    resetGameState();
    
    // Use translations for game pairs
    translations.forEach((translation, index) => {
        gamePairs.push({
            id: index,
            english: translation.english,
            chinese: translation.chinese,
            pinyin: translation.pinyin,
            emoji: translationDictionary[translation.english]?.emoji || '📝',
            matched: false
        });
    });
    
    // Start timer
    gameStartTime = Date.now();
    startGameTimer();
    
    return gamePairs;
}

/**
 * Reset game state
 */
function resetGameState() {
    gamePairs = [];
    draggedCard = null;
    matchedPairs = 0;
    moveCount = 0;
    stopGameTimer();
}

/**
 * Start game timer
 */
function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        // Timer tick - handled by UI
    }, 1000);
}

/**
 * Stop game timer
 */
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

/**
 * Get elapsed game time in seconds
 * @returns {number} Elapsed time in seconds
 */
export function getElapsedTime() {
    if (!gameStartTime) return 0;
    return Math.floor((Date.now() - gameStartTime) / 1000);
}

/**
 * Format elapsed time as MM:SS
 * @returns {string} Formatted time
 */
export function getFormattedTime() {
    const elapsed = getElapsedTime();
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Handle drag start
 * @param {number} pairId - ID of the pair being dragged
 */
export function handleDragStart(pairId) {
    draggedCard = pairId;
}

/**
 * Handle drag end
 */
export function handleDragEnd() {
    // Dragging ended
}

/**
 * Handle drop and check for match
 * @param {number} targetPairId - ID of the drop target
 * @returns {Object} Result object with match status
 */
export function handleDrop(targetPairId) {
    if (draggedCard === null) return { matched: false, error: 'No card dragged' };
    
    moveCount++;
    
    const isMatch = draggedCard === targetPairId;
    
    if (isMatch) {
        // Correct match
        const pair = gamePairs.find(p => p.id === draggedCard);
        if (pair) {
            pair.matched = true;
            matchedPairs++;
            
            // Play audio on match
            speakChinese(pair.chinese);
        }
        
        // Check if game is complete
        const isComplete = matchedPairs === gamePairs.length;
        if (isComplete) {
            stopGameTimer();
        }
        
        draggedCard = null;
        
        return {
            matched: true,
            moveCount,
            matchedPairs,
            totalPairs: gamePairs.length,
            isComplete
        };
    } else {
        // Incorrect match
        draggedCard = null;
        
        return {
            matched: false,
            moveCount,
            matchedPairs,
            totalPairs: gamePairs.length,
            isComplete: false
        };
    }
}

/**
 * Get current game state
 * @returns {Object} Game state object
 */
export function getGameState() {
    return {
        pairs: [...gamePairs],
        matchedPairs,
        moveCount,
        elapsedTime: getElapsedTime(),
        formattedTime: getFormattedTime(),
        isComplete: matchedPairs === gamePairs.length
    };
}

/**
 * Get shuffled array for rendering
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
    return [...array].sort(() => 0.5 - Math.random());
}

/**
 * Play audio for a specific pair
 * @param {number} pairId - ID of the pair
 */
export function playPairAudio(pairId) {
    const pair = gamePairs.find(p => p.id === pairId);
    if (pair && !pair.matched) {
        speakChinese(pair.chinese);
    }
}

/**
 * Get game statistics
 * @returns {Object} Statistics object
 */
export function getGameStats() {
    return {
        totalPairs: gamePairs.length,
        matchedPairs,
        remainingPairs: gamePairs.length - matchedPairs,
        moveCount,
        elapsedTime: getElapsedTime(),
        formattedTime: getFormattedTime(),
        accuracy: moveCount > 0 ? Math.round((matchedPairs / moveCount) * 100) : 0
    };
}

/**
 * End the game and get final results
 * @returns {Object} Final results object
 */
export function endGame() {
    stopGameTimer();
    const stats = getGameStats();
    
    return {
        ...stats,
        completed: true,
        score: calculateScore(stats)
    };
}

/**
 * Calculate game score
 * @param {Object} stats - Game statistics
 * @returns {number} Score (0-100)
 */
function calculateScore(stats) {
    // Score based on accuracy and speed
    const accuracyScore = stats.accuracy;
    const timeBonus = Math.max(0, 100 - stats.elapsedTime); // Bonus for speed
    
    return Math.round((accuracyScore * 0.7) + (timeBonus * 0.3));
}

/**
 * Check if game is currently active
 * @returns {boolean} True if game is active
 */
export function isGameActive() {
    return gameTimer !== null;
}

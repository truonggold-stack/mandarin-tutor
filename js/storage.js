// Storage Module
// Handles all localStorage operations for data persistence

const STORAGE_KEYS = {
    LESSONS: 'mandarinLessons',
    TRANSLATIONS: 'savedTranslations',
    PROGRESS: 'progressData',
    GAMES: 'savedGames'
};

/**
 * Save lessons to localStorage
 * @param {Array} lessons - Array of lesson objects
 */
export function saveLessons(lessons) {
    try {
        localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
        return true;
    } catch (error) {
        console.error('Failed to save lessons:', error);
        return false;
    }
}

/**
 * Load lessons from localStorage
 * @returns {Array} Array of lesson objects
 */
export function loadLessons() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.LESSONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load lessons:', error);
        return [];
    }
}

/**
 * Save translations to localStorage
 * @param {Array} translations - Array of translation objects
 */
export function saveTranslations(translations) {
    try {
        localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(translations));
        return true;
    } catch (error) {
        console.error('Failed to save translations:', error);
        return false;
    }
}

/**
 * Load translations from localStorage
 * @returns {Array} Array of translation objects
 */
export function loadTranslations() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load translations:', error);
        return [];
    }
}

/**
 * Save progress data to localStorage
 * @param {Object} progressData - Progress data object
 */
export function saveProgress(progressData) {
    try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));
        return true;
    } catch (error) {
        console.error('Failed to save progress:', error);
        return false;
    }
}

/**
 * Load progress data from localStorage
 * @returns {Object} Progress data object
 */
export function loadProgress() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        return data ? JSON.parse(data) : {
            totalExercises: 0,
            totalScore: 0,
            lessonsCompleted: 0,
            practiceTime: 0,
            gamesPlayed: 0,
            totalGameScore: 0,
            history: [],
            gameHistory: [],
            pronunciationScores: []
        };
    } catch (error) {
        console.error('Failed to load progress:', error);
        return {
            totalExercises: 0,
            totalScore: 0,
            lessonsCompleted: 0,
            practiceTime: 0,
            gamesPlayed: 0,
            totalGameScore: 0,
            history: [],
            gameHistory: [],
            pronunciationScores: []
        };
    }
}

/**
 * Save game result to progress
 * @param {Object} gameResult - Game result with score, time, etc.
 */
export function saveGameResult(gameResult) {
    try {
        const progress = loadProgress();
        
        // Add to game history
        progress.gameHistory = progress.gameHistory || [];
        progress.gameHistory.push({
            date: new Date().toISOString(),
            score: gameResult.firstTryAccuracy,
            firstTryMatches: gameResult.firstTryMatches,
            totalPairs: gameResult.totalPairs,
            time: gameResult.formattedTime,
            elapsedSeconds: gameResult.elapsedTime
        });
        
        // Update totals
        progress.gamesPlayed = (progress.gamesPlayed || 0) + 1;
        progress.totalGameScore = (progress.totalGameScore || 0) + gameResult.firstTryAccuracy;
        
        saveProgress(progress);
        return true;
    } catch (error) {
        console.error('Failed to save game result:', error);
        return false;
    }
}

/**
 * Clear all stored data
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.LESSONS);
        localStorage.removeItem(STORAGE_KEYS.TRANSLATIONS);
        localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        return true;
    } catch (error) {
        console.error('Failed to clear data:', error);
        return false;
    }
}

/**
 * Get storage usage information
 * @returns {Object} Storage info with used and available space
 */
export function getStorageInfo() {
    try {
        const lessons = localStorage.getItem(STORAGE_KEYS.LESSONS) || '';
        const translations = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS) || '';
        const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS) || '';
        
        const totalSize = lessons.length + translations.length + progress.length;
        
        return {
            lessonsSize: lessons.length,
            translationsSize: translations.length,
            progressSize: progress.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2)
        };
    } catch (error) {
        console.error('Failed to get storage info:', error);
        return null;
    }
}

/**
 * Save games to localStorage
 * @param {Array} games - Array of game objects
 */
export function saveGames(games) {
    try {
        localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
        return true;
    } catch (error) {
        console.error('Failed to save games:', error);
        return false;
    }
}

/**
 * Load games from localStorage
 * @returns {Array} Array of game objects
 */
export function loadGames() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.GAMES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load games:', error);
        return [];
    }
}

/**
 * Save pronunciation score to progress
 * Saves all attempts to track progress over time
 * @param {Object} scoreData - Score data with lesson, task, and score info
 */
export function savePronunciationScore(scoreData) {
    try {
        const progress = loadProgress();
        
        // Ensure pronunciationScores array exists
        progress.pronunciationScores = progress.pronunciationScores || [];
        
        // Always add the new score entry to track all attempts
        const newScoreEntry = {
            date: new Date().toISOString(),
            lessonId: scoreData.lessonId,
            lessonName: scoreData.lessonName,
            task: scoreData.task,
            score: scoreData.score,
            stars: scoreData.stars,
            toneScore: scoreData.toneScore,
            clarityScore: scoreData.clarityScore
        };
        
        progress.pronunciationScores.push(newScoreEntry);
        
        console.log('💾 Saving new pronunciation score:', newScoreEntry);
        console.log('💾 Total scores in array BEFORE save:', progress.pronunciationScores.length);
        
        // Keep only last 50 scores to avoid storage bloat
        if (progress.pronunciationScores.length > 50) {
            progress.pronunciationScores = progress.pronunciationScores.slice(-50);
        }
        
        saveProgress(progress);
        
        console.log('💾 Score saved successfully. Total scores now:', progress.pronunciationScores.length);
        console.log('💾 All scores:', progress.pronunciationScores.map(s => `${s.task} (${s.score}%)`));
        
        return true;
    } catch (error) {
        console.error('Failed to save pronunciation score:', error);
        return false;
    }
}

/**
 * Get pronunciation scores grouped by lesson
 * Returns last 10 lessons with their tasks
 * @returns {Array} Array of lessons with their task scores
 */
export function getPronunciationProgressByLesson() {
    try {
        const progress = loadProgress();
        const scores = progress.pronunciationScores || [];
        
        if (scores.length === 0) return [];
        
        // Group scores by lesson
        const lessonMap = new Map();
        
        scores.forEach(score => {
            const key = score.lessonId;
            if (!lessonMap.has(key)) {
                lessonMap.set(key, {
                    lessonId: score.lessonId,
                    lessonName: score.lessonName,
                    lastActivityDate: score.date,
                    tasks: new Map()
                });
            }
            
            const lesson = lessonMap.get(key);
            
            // Update last activity date if this is more recent
            if (new Date(score.date) > new Date(lesson.lastActivityDate)) {
                lesson.lastActivityDate = score.date;
            }
            
            // Group by task within lesson
            const taskKey = score.task;
            if (!lesson.tasks.has(taskKey)) {
                lesson.tasks.set(taskKey, []);
            }
            lesson.tasks.get(taskKey).push(score);
        });
        
        // Convert to array and get last 10 lessons by activity date
        const lessonArray = Array.from(lessonMap.values())
            .sort((a, b) => new Date(b.lastActivityDate) - new Date(a.lastActivityDate))
            .slice(0, 10);
        
        // Process each lesson's tasks
        const result = [];
        lessonArray.forEach(lesson => {
            const taskArray = [];
            
            lesson.tasks.forEach((scoreHistory, taskText) => {
                // Sort by date, most recent first
                const sortedScores = scoreHistory.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                
                // Return ALL scores for this task, not just the most recent
                sortedScores.forEach((currentScore, index) => {
                    const previous = index < sortedScores.length - 1 ? sortedScores[index + 1] : null;
                    
                    let improvement = null;
                    if (previous) {
                        const scoreDiff = currentScore.score - previous.score;
                        improvement = scoreDiff > 0 ? 'improved' : 
                                      scoreDiff < 0 ? 'declined' : 'same';
                    }
                    
                    taskArray.push({
                        task: taskText,
                        date: currentScore.date,
                        score: currentScore.score,
                        stars: currentScore.stars,
                        toneScore: currentScore.toneScore,
                        clarityScore: currentScore.clarityScore,
                        improvement: improvement,
                        previousScore: previous ? previous.score : null,
                        attemptNumber: sortedScores.length - index
                    });
                });
            });
            
            // Sort tasks by most recent date
            taskArray.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            result.push({
                lessonId: lesson.lessonId,
                lessonName: lesson.lessonName,
                tasks: taskArray
            });
        });
        
        console.log('📊 Pronunciation Progress Data:', {
            totalLessons: result.length,
            lessons: result.map(l => ({
                name: l.lessonName,
                taskCount: l.tasks.length,
                tasks: l.tasks.map(t => `${t.task} (Attempt #${t.attemptNumber})`)
            }))
        });
        
        return result;
    } catch (error) {
        console.error('Failed to get pronunciation progress:', error);
        return [];
    }
}


// Configuration and Constants

// API Configuration
// API keys are now stored securely on the server via Vercel environment variables
// Frontend calls serverless functions instead of Azure APIs directly

// API Endpoints - these will be serverless functions
export const apiEndpoints = {
    speechAssessment: '/api/speech-assessment',
    translate: '/api/translate',
    saveSharedLessons: '/api/save-shared-lessons'
};

// When running locally, use localhost
// When deployed to Vercel, these will be relative URLs
export const getApiUrl = (endpoint) => {
    // In local development (localhost), use the same origin
    // In production (Vercel/Netlify), use relative URLs
    const baseUrl = window.location.hostname === 'localhost' 
        ? `http://localhost:${window.location.port}` // Use current dev server port
        : ''; // Use relative URLs in production
    
    return `${baseUrl}${endpoint}`;
};

// Legacy configs kept for reference (NO KEYS - keys are on server now)
export const azureSpeechConfig = {
    language: 'zh-CN' // Mandarin Chinese
};

export const azureTranslatorConfig = {
    fromLanguage: 'en', // English
    toLanguage: 'zh-Hans' // Simplified Chinese
};

// Azure Pronunciation Assessment Configuration
export const pronunciationAssessmentConfig = {
    referenceText: '', // Will be set dynamically based on the exercise
    gradingSystem: 'HundredMark', // Options: HundredMark, FivePoint
    granularity: 'Phoneme', // Options: Phoneme, Word, FullText
    enableMiscue: true, // Detect mispronunciations
    phonemeAlphabet: 'IPA' // International Phonetic Alphabet
};

export const translationDictionary = {
    // Greetings & Basic Phrases (20)
    'hello': { chinese: '你好', pinyin: 'nǐ hǎo', emoji: '👋' },
    'hi': { chinese: '嗨', pinyin: 'hāi', emoji: '👋' },
    'goodbye': { chinese: '再见', pinyin: 'zài jiàn', emoji: '👋' },
    'bye': { chinese: '拜拜', pinyin: 'bài bài', emoji: '👋' },
    'thank you': { chinese: '谢谢', pinyin: 'xiè xiè', emoji: '🙏' },
    'thanks': { chinese: '谢谢', pinyin: 'xiè xiè', emoji: '🙏' },
    'please': { chinese: '请', pinyin: 'qǐng', emoji: '🙏' },
    'sorry': { chinese: '对不起', pinyin: 'duì bù qǐ', emoji: '🙇' },
    'excuse me': { chinese: '不好意思', pinyin: 'bù hǎo yì si', emoji: '🙇' },
    'yes': { chinese: '是', pinyin: 'shì', emoji: '✅' },
    'no': { chinese: '不是', pinyin: 'bù shì', emoji: '❌' },
    'ok': { chinese: '好的', pinyin: 'hǎo de', emoji: '👍' },
    'good morning': { chinese: '早上好', pinyin: 'zǎo shàng hǎo', emoji: '🌅' },
    'good afternoon': { chinese: '下午好', pinyin: 'xià wǔ hǎo', emoji: '☀️' },
    'good evening': { chinese: '晚上好', pinyin: 'wǎn shàng hǎo', emoji: '🌆' },
    'good night': { chinese: '晚安', pinyin: 'wǎn ān', emoji: '🌙' },
    'how are you': { chinese: '你好吗', pinyin: 'nǐ hǎo ma', emoji: '❓' },
    'i love you': { chinese: '我爱你', pinyin: 'wǒ ài nǐ', emoji: '❤️' },
    'welcome': { chinese: '欢迎', pinyin: 'huān yíng', emoji: '🎉' },
    'congratulations': { chinese: '恭喜', pinyin: 'gōng xǐ', emoji: '🎊' },
    
    // Family Members (20)
    'mother': { chinese: '妈妈', pinyin: 'mā ma', emoji: '👩' },
    'mom': { chinese: '妈妈', pinyin: 'mā ma', emoji: '👩' },
    'father': { chinese: '爸爸', pinyin: 'bà ba', emoji: '👨' },
    'dad': { chinese: '爸爸', pinyin: 'bà ba', emoji: '👨' },
    'parents': { chinese: '父母', pinyin: 'fù mǔ', emoji: '👨‍👩‍👦' },
    'child': { chinese: '孩子', pinyin: 'hái zi', emoji: '👶' },
    'son': { chinese: '儿子', pinyin: 'ér zi', emoji: '👦' },
    'daughter': { chinese: '女儿', pinyin: 'nǚ ér', emoji: '👧' },
    'brother': { chinese: '兄弟', pinyin: 'xiōng dì', emoji: '👦' },
    'older brother': { chinese: '哥哥', pinyin: 'gē ge', emoji: '👦' },
    'younger brother': { chinese: '弟弟', pinyin: 'dì di', emoji: '👦' },
    'sister': { chinese: '姐妹', pinyin: 'jiě mèi', emoji: '👧' },
    'older sister': { chinese: '姐姐', pinyin: 'jiě jie', emoji: '👧' },
    'younger sister': { chinese: '妹妹', pinyin: 'mèi mei', emoji: '👧' },
    'grandmother': { chinese: '奶奶', pinyin: 'nǎi nai', emoji: '👵' },
    'grandfather': { chinese: '爷爷', pinyin: 'yé ye', emoji: '👴' },
    'aunt': { chinese: '阿姨', pinyin: 'ā yí', emoji: '👩' },
    'uncle': { chinese: '叔叔', pinyin: 'shū shu', emoji: '👨' },
    'family': { chinese: '家庭', pinyin: 'jiā tíng', emoji: '👨‍👩‍👧‍👦' },
    'baby': { chinese: '宝宝', pinyin: 'bǎo bao', emoji: '👶' },
    
    // People (10)
    'friend': { chinese: '朋友', pinyin: 'péng yǒu', emoji: '👫' },
    'teacher': { chinese: '老师', pinyin: 'lǎo shī', emoji: '👨‍🏫' },
    'student': { chinese: '学生', pinyin: 'xué shēng', emoji: '🎓' },
    'classmate': { chinese: '同学', pinyin: 'tóng xué', emoji: '👥' },
    'boy': { chinese: '男孩', pinyin: 'nán hái', emoji: '👦' },
    'girl': { chinese: '女孩', pinyin: 'nǚ hái', emoji: '👧' },
    'person': { chinese: '人', pinyin: 'rén', emoji: '🧑' },
    'doctor': { chinese: '医生', pinyin: 'yī shēng', emoji: '👨‍⚕️' },
    'nurse': { chinese: '护士', pinyin: 'hù shi', emoji: '👩‍⚕️' },
    'police': { chinese: '警察', pinyin: 'jǐng chá', emoji: '👮' },
    
    // Body Parts (16)
    'head': { chinese: '头', pinyin: 'tóu', emoji: '🗣️' },
    'hair': { chinese: '头发', pinyin: 'tóu fa', emoji: '💇' },
    'face': { chinese: '脸', pinyin: 'liǎn', emoji: '😊' },
    'eye': { chinese: '眼睛', pinyin: 'yǎn jing', emoji: '👁️' },
    'ear': { chinese: '耳朵', pinyin: 'ěr duo', emoji: '👂' },
    'nose': { chinese: '鼻子', pinyin: 'bí zi', emoji: '👃' },
    'mouth': { chinese: '嘴巴', pinyin: 'zuǐ ba', emoji: '👄' },
    'tooth': { chinese: '牙齿', pinyin: 'yá chǐ', emoji: '🦷' },
    'hand': { chinese: '手', pinyin: 'shǒu', emoji: '✋' },
    'finger': { chinese: '手指', pinyin: 'shǒu zhǐ', emoji: '👆' },
    'arm': { chinese: '手臂', pinyin: 'shǒu bì', emoji: '💪' },
    'leg': { chinese: '腿', pinyin: 'tuǐ', emoji: '🦵' },
    'foot': { chinese: '脚', pinyin: 'jiǎo', emoji: '🦶' },
    'body': { chinese: '身体', pinyin: 'shēn tǐ', emoji: '🧍' },
    'heart': { chinese: '心', pinyin: 'xīn', emoji: '❤️' },
    'stomach': { chinese: '肚子', pinyin: 'dù zi', emoji: '🤰' },
    
    // Animals (20)
    'dog': { chinese: '狗', pinyin: 'gǒu', emoji: '🐕' },
    'cat': { chinese: '猫', pinyin: 'māo', emoji: '🐱' },
    'bird': { chinese: '鸟', pinyin: 'niǎo', emoji: '🐦' },
    'fish': { chinese: '鱼', pinyin: 'yú', emoji: '🐟' },
    'rabbit': { chinese: '兔子', pinyin: 'tù zi', emoji: '🐰' },
    'mouse': { chinese: '老鼠', pinyin: 'lǎo shǔ', emoji: '🐭' },
    'tiger': { chinese: '老虎', pinyin: 'lǎo hǔ', emoji: '🐯' },
    'lion': { chinese: '狮子', pinyin: 'shī zi', emoji: '🦁' },
    'elephant': { chinese: '大象', pinyin: 'dà xiàng', emoji: '🐘' },
    'monkey': { chinese: '猴子', pinyin: 'hóu zi', emoji: '🐵' },
    'panda': { chinese: '熊猫', pinyin: 'xióng māo', emoji: '🐼' },
    'bear': { chinese: '熊', pinyin: 'xióng', emoji: '🐻' },
    'horse': { chinese: '马', pinyin: 'mǎ', emoji: '🐴' },
    'cow': { chinese: '牛', pinyin: 'niú', emoji: '🐄' },
    'pig': { chinese: '猪', pinyin: 'zhū', emoji: '🐷' },
    'chicken': { chinese: '鸡', pinyin: 'jī', emoji: '🐔' },
    'duck': { chinese: '鸭子', pinyin: 'yā zi', emoji: '🦆' },
    'sheep': { chinese: '羊', pinyin: 'yáng', emoji: '🐑' },
    'animal': { chinese: '动物', pinyin: 'dòng wù', emoji: '🦁' },
    'pet': { chinese: '宠物', pinyin: 'chǒng wù', emoji: '🐾' },
    
    // Colors (12)
    'red': { chinese: '红色', pinyin: 'hóng sè', emoji: '🔴' },
    'blue': { chinese: '蓝色', pinyin: 'lán sè', emoji: '🔵' },
    'yellow': { chinese: '黄色', pinyin: 'huáng sè', emoji: '🟡' },
    'green': { chinese: '绿色', pinyin: 'lǜ sè', emoji: '🟢' },
    'black': { chinese: '黑色', pinyin: 'hēi sè', emoji: '⚫' },
    'white': { chinese: '白色', pinyin: 'bái sè', emoji: '⚪' },
    'orange': { chinese: '橙色', pinyin: 'chéng sè', emoji: '🟠' },
    'purple': { chinese: '紫色', pinyin: 'zǐ sè', emoji: '🟣' },
    'pink': { chinese: '粉色', pinyin: 'fěn sè', emoji: '🌸' },
    'brown': { chinese: '棕色', pinyin: 'zōng sè', emoji: '🟤' },
    'gray': { chinese: '灰色', pinyin: 'huī sè', emoji: '⚪' },
    'color': { chinese: '颜色', pinyin: 'yán sè', emoji: '🎨' },
    
    // Numbers (14)
    'zero': { chinese: '零', pinyin: 'líng', emoji: '0️⃣' },
    'one': { chinese: '一', pinyin: 'yī', emoji: '1️⃣' },
    'two': { chinese: '二', pinyin: 'èr', emoji: '2️⃣' },
    'three': { chinese: '三', pinyin: 'sān', emoji: '3️⃣' },
    'four': { chinese: '四', pinyin: 'sì', emoji: '4️⃣' },
    'five': { chinese: '五', pinyin: 'wǔ', emoji: '5️⃣' },
    'six': { chinese: '六', pinyin: 'liù', emoji: '6️⃣' },
    'seven': { chinese: '七', pinyin: 'qī', emoji: '7️⃣' },
    'eight': { chinese: '八', pinyin: 'bā', emoji: '8️⃣' },
    'nine': { chinese: '九', pinyin: 'jiǔ', emoji: '9️⃣' },
    'ten': { chinese: '十', pinyin: 'shí', emoji: '🔟' },
    'eleven': { chinese: '十一', pinyin: 'shí yī', emoji: '1️⃣1️⃣' },
    'hundred': { chinese: '百', pinyin: 'bǎi', emoji: '💯' },
    'thousand': { chinese: '千', pinyin: 'qiān', emoji: '🔢' },
    
    // Food & Drinks (24)
    'food': { chinese: '食物', pinyin: 'shí wù', emoji: '🍽️' },
    'water': { chinese: '水', pinyin: 'shuǐ', emoji: '💧' },
    'milk': { chinese: '牛奶', pinyin: 'niú nǎi', emoji: '🥛' },
    'juice': { chinese: '果汁', pinyin: 'guǒ zhī', emoji: '🧃' },
    'tea': { chinese: '茶', pinyin: 'chá', emoji: '🍵' },
    'coffee': { chinese: '咖啡', pinyin: 'kā fēi', emoji: '☕' },
    'rice': { chinese: '米饭', pinyin: 'mǐ fàn', emoji: '🍚' },
    'bread': { chinese: '面包', pinyin: 'miàn bāo', emoji: '🍞' },
    'noodles': { chinese: '面条', pinyin: 'miàn tiáo', emoji: '🍜' },
    'meat': { chinese: '肉', pinyin: 'ròu', emoji: '🥩' },
    'egg': { chinese: '鸡蛋', pinyin: 'jī dàn', emoji: '🥚' },
    'vegetable': { chinese: '蔬菜', pinyin: 'shū cài', emoji: '🥬' },
    'fruit': { chinese: '水果', pinyin: 'shuǐ guǒ', emoji: '🍎' },
    'apple': { chinese: '苹果', pinyin: 'píng guǒ', emoji: '🍎' },
    'banana': { chinese: '香蕉', pinyin: 'xiāng jiāo', emoji: '🍌' },
    'grape': { chinese: '葡萄', pinyin: 'pú táo', emoji: '🍇' },
    'watermelon': { chinese: '西瓜', pinyin: 'xī guā', emoji: '🍉' },
    'strawberry': { chinese: '草莓', pinyin: 'cǎo méi', emoji: '🍓' },
    'cake': { chinese: '蛋糕', pinyin: 'dàn gāo', emoji: '🎂' },
    'candy': { chinese: '糖果', pinyin: 'táng guǒ', emoji: '🍬' },
    'ice cream': { chinese: '冰淇淋', pinyin: 'bīng qí lín', emoji: '🍦' },
    'soup': { chinese: '汤', pinyin: 'tāng', emoji: '🍲' },
    'salt': { chinese: '盐', pinyin: 'yán', emoji: '🧂' },
    'sugar': { chinese: '糖', pinyin: 'táng', emoji: '🍬' }
};

export const sampleLessons = [
    {
        id: 'sample-1',
        name: 'Basic Greetings',
        date: new Date().toISOString(),
        exercises: [
            { chinese: '你好', pinyin: 'nǐ hǎo', english: 'Hello', audioUrl: null },
            { chinese: '再见', pinyin: 'zài jiàn', english: 'Goodbye', audioUrl: null },
            { chinese: '谢谢', pinyin: 'xiè xiè', english: 'Thank you', audioUrl: null },
            { chinese: '对不起', pinyin: 'duì bù qǐ', english: 'Sorry', audioUrl: null },
            { chinese: '请', pinyin: 'qǐng', english: 'Please', audioUrl: null }
        ]
    }
];

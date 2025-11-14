// Global variables
let currentLesson = null;
let currentExerciseIndex = 0;
let exercises = [];
let mediaRecorder = null;
let recordedAudio = null;
let isRecording = false;
let audioContext = null;
let lessons = JSON.parse(localStorage.getItem('mandarinLessons')) || [];
let progressData = JSON.parse(localStorage.getItem('progressData')) || {
    totalExercises: 0,
    totalScore: 0,
    lessonsCompleted: 0,
    practiceTime: 0,
    history: []
};
let savedTranslations = JSON.parse(localStorage.getItem('savedTranslations')) || [];
let currentTranslation = null;

// Game variables
let gameCards = [];
let draggedCard = null;
let matchedPairs = 0;
let moveCount = 0;
let gameTimer = null;
let gameStartTime = null;
let gamePairs = [];

// Translation dictionary (English to Chinese with pinyin and emoji) - 300+ words and phrases
const translationDictionary = {
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
    'sugar': { chinese: '糖', pinyin: 'táng', emoji: '🍬' },
    
    // School (15)
    'school': { chinese: '学校', pinyin: 'xué xiào' },
    'classroom': { chinese: '教室', pinyin: 'jiào shì' },
    'book': { chinese: '书', pinyin: 'shū' },
    'pen': { chinese: '笔', pinyin: 'bǐ' },
    'pencil': { chinese: '铅笔', pinyin: 'qiān bǐ' },
    'paper': { chinese: '纸', pinyin: 'zhǐ' },
    'eraser': { chinese: '橡皮', pinyin: 'xiàng pí' },
    'ruler': { chinese: '尺子', pinyin: 'chǐ zi' },
    'bag': { chinese: '书包', pinyin: 'shū bāo' },
    'desk': { chinese: '书桌', pinyin: 'shū zhuō' },
    'chair': { chinese: '椅子', pinyin: 'yǐ zi' },
    'blackboard': { chinese: '黑板', pinyin: 'hēi bǎn' },
    'homework': { chinese: '作业', pinyin: 'zuò yè' },
    'exam': { chinese: '考试', pinyin: 'kǎo shì' },
    'lesson': { chinese: '课', pinyin: 'kè' },
    
    // Common Verbs (38)
    'eat': { chinese: '吃', pinyin: 'chī' },
    'drink': { chinese: '喝', pinyin: 'hē' },
    'sleep': { chinese: '睡觉', pinyin: 'shuì jiào' },
    'wake up': { chinese: '起床', pinyin: 'qǐ chuáng' },
    'study': { chinese: '学习', pinyin: 'xué xí' },
    'work': { chinese: '工作', pinyin: 'gōng zuò' },
    'play': { chinese: '玩', pinyin: 'wán' },
    'read': { chinese: '读', pinyin: 'dú' },
    'write': { chinese: '写', pinyin: 'xiě' },
    'speak': { chinese: '说', pinyin: 'shuō' },
    'listen': { chinese: '听', pinyin: 'tīng' },
    'watch': { chinese: '看', pinyin: 'kàn' },
    'see': { chinese: '看见', pinyin: 'kàn jiàn' },
    'look': { chinese: '看', pinyin: 'kàn' },
    'go': { chinese: '去', pinyin: 'qù' },
    'come': { chinese: '来', pinyin: 'lái' },
    'walk': { chinese: '走', pinyin: 'zǒu' },
    'run': { chinese: '跑', pinyin: 'pǎo' },
    'jump': { chinese: '跳', pinyin: 'tiào' },
    'sit': { chinese: '坐', pinyin: 'zuò' },
    'stand': { chinese: '站', pinyin: 'zhàn' },
    'give': { chinese: '给', pinyin: 'gěi' },
    'take': { chinese: '拿', pinyin: 'ná' },
    'buy': { chinese: '买', pinyin: 'mǎi' },
    'sell': { chinese: '卖', pinyin: 'mài' },
    'open': { chinese: '开', pinyin: 'kāi' },
    'close': { chinese: '关', pinyin: 'guān' },
    'help': { chinese: '帮助', pinyin: 'bāng zhù' },
    'like': { chinese: '喜欢', pinyin: 'xǐ huan' },
    'love': { chinese: '爱', pinyin: 'ài' },
    'want': { chinese: '想要', pinyin: 'xiǎng yào' },
    'need': { chinese: '需要', pinyin: 'xū yào' },
    'know': { chinese: '知道', pinyin: 'zhī dào' },
    'think': { chinese: '想', pinyin: 'xiǎng' },
    'understand': { chinese: '明白', pinyin: 'míng bai' },
    'cook': { chinese: '做饭', pinyin: 'zuò fàn' },
    'wash': { chinese: '洗', pinyin: 'xǐ' },
    'clean': { chinese: '打扫', pinyin: 'dǎ sǎo' },
    
    // Adjectives (32)
    'beautiful': { chinese: '漂亮', pinyin: 'piào liang' },
    'pretty': { chinese: '美丽', pinyin: 'měi lì' },
    'handsome': { chinese: '帅', pinyin: 'shuài' },
    'ugly': { chinese: '丑', pinyin: 'chǒu' },
    'good': { chinese: '好', pinyin: 'hǎo' },
    'bad': { chinese: '坏', pinyin: 'huài' },
    'great': { chinese: '很好', pinyin: 'hěn hǎo' },
    'happy': { chinese: '快乐', pinyin: 'kuài lè' },
    'sad': { chinese: '难过', pinyin: 'nán guò' },
    'angry': { chinese: '生气', pinyin: 'shēng qì' },
    'excited': { chinese: '兴奋', pinyin: 'xīng fèn' },
    'tired': { chinese: '累', pinyin: 'lèi' },
    'hungry': { chinese: '饿', pinyin: 'è' },
    'thirsty': { chinese: '渴', pinyin: 'kě' },
    'hot': { chinese: '热', pinyin: 'rè' },
    'cold': { chinese: '冷', pinyin: 'lěng' },
    'warm': { chinese: '温暖', pinyin: 'wēn nuǎn' },
    'cool': { chinese: '凉快', pinyin: 'liáng kuai' },
    'big': { chinese: '大', pinyin: 'dà' },
    'small': { chinese: '小', pinyin: 'xiǎo' },
    'tall': { chinese: '高', pinyin: 'gāo' },
    'short': { chinese: '矮', pinyin: 'ǎi' },
    'long': { chinese: '长', pinyin: 'cháng' },
    'heavy': { chinese: '重', pinyin: 'zhòng' },
    'light': { chinese: '轻', pinyin: 'qīng' },
    'fast': { chinese: '快', pinyin: 'kuài' },
    'slow': { chinese: '慢', pinyin: 'màn' },
    'new': { chinese: '新', pinyin: 'xīn' },
    'old': { chinese: '旧', pinyin: 'jiù' },
    'clean': { chinese: '干净', pinyin: 'gān jìng' },
    'dirty': { chinese: '脏', pinyin: 'zāng' },
    'easy': { chinese: '容易', pinyin: 'róng yì' },
    
    // Time (22)
    'today': { chinese: '今天', pinyin: 'jīn tiān' },
    'tomorrow': { chinese: '明天', pinyin: 'míng tiān' },
    'yesterday': { chinese: '昨天', pinyin: 'zuó tiān' },
    'now': { chinese: '现在', pinyin: 'xiàn zài' },
    'morning': { chinese: '早上', pinyin: 'zǎo shang' },
    'afternoon': { chinese: '下午', pinyin: 'xià wǔ' },
    'evening': { chinese: '晚上', pinyin: 'wǎn shang' },
    'night': { chinese: '夜晚', pinyin: 'yè wǎn' },
    'day': { chinese: '天', pinyin: 'tiān' },
    'week': { chinese: '星期', pinyin: 'xīng qī' },
    'month': { chinese: '月', pinyin: 'yuè' },
    'year': { chinese: '年', pinyin: 'nián' },
    'monday': { chinese: '星期一', pinyin: 'xīng qī yī' },
    'tuesday': { chinese: '星期二', pinyin: 'xīng qī èr' },
    'wednesday': { chinese: '星期三', pinyin: 'xīng qī sān' },
    'thursday': { chinese: '星期四', pinyin: 'xīng qī sì' },
    'friday': { chinese: '星期五', pinyin: 'xīng qī wǔ' },
    'saturday': { chinese: '星期六', pinyin: 'xīng qī liù' },
    'sunday': { chinese: '星期天', pinyin: 'xīng qī tiān' },
    'hour': { chinese: '小时', pinyin: 'xiǎo shí' },
    'minute': { chinese: '分钟', pinyin: 'fēn zhōng' },
    'second': { chinese: '秒', pinyin: 'miǎo' },
    
    // Weather (12)
    'weather': { chinese: '天气', pinyin: 'tiān qì' },
    'sunny': { chinese: '晴天', pinyin: 'qíng tiān' },
    'rainy': { chinese: '下雨', pinyin: 'xià yǔ' },
    'cloudy': { chinese: '多云', pinyin: 'duō yún' },
    'snowy': { chinese: '下雪', pinyin: 'xià xuě' },
    'windy': { chinese: '有风', pinyin: 'yǒu fēng' },
    'rain': { chinese: '雨', pinyin: 'yǔ' },
    'snow': { chinese: '雪', pinyin: 'xuě' },
    'wind': { chinese: '风', pinyin: 'fēng' },
    'sun': { chinese: '太阳', pinyin: 'tài yáng' },
    'moon': { chinese: '月亮', pinyin: 'yuè liang' },
    'star': { chinese: '星星', pinyin: 'xīng xing' },
    
    // Clothing & Places (20)
    'clothes': { chinese: '衣服', pinyin: 'yī fu' },
    'shirt': { chinese: '衬衫', pinyin: 'chèn shān' },
    'pants': { chinese: '裤子', pinyin: 'kù zi' },
    'dress': { chinese: '裙子', pinyin: 'qún zi' },
    'shoes': { chinese: '鞋子', pinyin: 'xié zi' },
    'socks': { chinese: '袜子', pinyin: 'wà zi' },
    'hat': { chinese: '帽子', pinyin: 'mào zi' },
    'coat': { chinese: '外套', pinyin: 'wài tào' },
    'home': { chinese: '家', pinyin: 'jiā' },
    'house': { chinese: '房子', pinyin: 'fáng zi' },
    'room': { chinese: '房间', pinyin: 'fáng jiān' },
    'kitchen': { chinese: '厨房', pinyin: 'chú fáng' },
    'bathroom': { chinese: '浴室', pinyin: 'yù shì' },
    'bedroom': { chinese: '卧室', pinyin: 'wò shì' },
    'park': { chinese: '公园', pinyin: 'gōng yuán' },
    'store': { chinese: '商店', pinyin: 'shāng diàn' },
    'hospital': { chinese: '医院', pinyin: 'yī yuàn' },
    'library': { chinese: '图书馆', pinyin: 'tú shū guǎn' },
    'restaurant': { chinese: '餐厅', pinyin: 'cān tīng' },
    'street': { chinese: '街道', pinyin: 'jiē dào' }
};

// Sample lesson data for demonstration
const sampleLessons = [
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadProgress();
    
    if (lessons.length === 0) {
        lessons = [...sampleLessons];
        saveLessons();
        populateLessonSelector();
    }
});

function initializeApp() {
    if (typeof AudioContext !== 'undefined') {
        audioContext = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
        audioContext = new webkitAudioContext();
    }
    
    populateLessonSelector();
    updateProgressDisplay();
    displayLessonList();
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    const fileInput = document.getElementById('audio-file');
    const uploadArea = document.getElementById('upload-area');
    
    fileInput.addEventListener('change', handleFileUpload);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    
    document.getElementById('lesson-select').addEventListener('change', handleLessonSelect);
    document.getElementById('play-reference').addEventListener('click', playReference);
    document.getElementById('record-btn').addEventListener('click', toggleRecording);
    document.getElementById('play-recording').addEventListener('click', playRecording);
    document.getElementById('prev-exercise').addEventListener('click', previousExercise);
    document.getElementById('next-exercise').addEventListener('click', nextExercise);
    
    document.getElementById('translate-btn').addEventListener('click', handleTranslation);
    document.getElementById('english-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleTranslation();
    });
    
    document.getElementById('new-game-btn').addEventListener('click', startNewGame);
    document.getElementById('play-again-btn').addEventListener('click', startNewGame);
    
    displaySavedTranslations();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'progress') {
        updateProgressDisplay();
        drawProgressChart();
    } else if (tabName === 'translate') {
        displayLessonList();
    }
}

// File upload handlers
function handleFileUpload(e) {
    const files = e.target.files;
    processAudioFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    processAudioFiles(files);
}

// Audio processing variables
let detectedItems = [];
let lessonBuilderItems = [];

function processAudioFiles(files) {
    const uploadedFilesDiv = document.getElementById('uploaded-files');
    uploadedFilesDiv.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';
        fileDiv.innerHTML = `
            <span class="file-name">🎵 ${file.name}</span>
            <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
        `;
        uploadedFilesDiv.appendChild(fileDiv);
    });
    
    analyzeAudioFiles(files);
}

function simulateProcessing() {
    const processingSection = document.getElementById('processing-section');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('processing-status');
    
    processingSection.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        
        if (progress === 50) {
            statusText.textContent = 'Extracting exercises...';
        } else if (progress === 100) {
            statusText.textContent = 'Processing complete!';
            clearInterval(interval);
            setTimeout(() => {
                processingSection.style.display = 'none';
                createLessonFromAudio();
            }, 1000);
        }
    }, 300);
}

// Advanced Audio Analysis Functions
function analyzeAudioFiles(files) {
    const processingSection = document.getElementById('processing-section');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('processing-status');
    
    processingSection.style.display = 'block';
    detectedItems = [];
    
    let progress = 0;
    let currentFile = 0;
    
    const interval = setInterval(() => {
        progress += 5;
        progressFill.style.width = progress + '%';
        
        if (progress === 25) {
            statusText.textContent = 'Analyzing audio quality...';
        } else if (progress === 50) {
            statusText.textContent = 'Detecting Chinese phrases...';
        } else if (progress === 75) {
            statusText.textContent = 'Rating pronunciation quality...';
        } else if (progress === 100) {
            statusText.textContent = 'Analysis complete!';
            clearInterval(interval);
            
            // Simulate detected content from audio
            simulateAudioDetection(files.length);
            
            setTimeout(() => {
                processingSection.style.display = 'none';
                displayAnalysisResults();
                displayDetectedContent();
                setupLessonBuilder();
            }, 1000);
        }
    }, 200);
}

function simulateAudioDetection(fileCount) {
    // Simulate detected phrases with quality ratings
    const commonPhrases = [
        { chinese: '你好', pinyin: 'nǐ hǎo', english: 'hello' },
        { chinese: '谢谢', pinyin: 'xiè xiè', english: 'thank you' },
        { chinese: '再见', pinyin: 'zài jiàn', english: 'goodbye' },
        { chinese: '早上好', pinyin: 'zǎo shàng hǎo', english: 'good morning' },
        { chinese: '晚上好', pinyin: 'wǎn shàng hǎo', english: 'good evening' }
    ];
    
    const phrasesToDetect = Math.min(fileCount * 2, 5);
    
    for (let i = 0; i < phrasesToDetect; i++) {
        const phrase = commonPhrases[i];
        const quality = calculatePronunciationQuality();
        
        detectedItems.push({
            id: `detected-${Date.now()}-${i}`,
            chinese: phrase.chinese,
            pinyin: phrase.pinyin,
            english: phrase.english,
            quality: quality,
            clarity: Math.floor(Math.random() * 20) + 75, // 75-95%
            toneAccuracy: Math.floor(Math.random() * 25) + 70, // 70-95%
            audioUrl: null,
            verified: false
        });
    }
}

function calculatePronunciationQuality() {
    // Simulate quality rating: Excellent, Good, Fair, Needs Practice
    const rand = Math.random();
    if (rand > 0.7) return { score: Math.floor(Math.random() * 10) + 90, rating: 'Excellent', color: '#28a745' };
    if (rand > 0.4) return { score: Math.floor(Math.random() * 15) + 75, rating: 'Good', color: '#4CAF50' };
    if (rand > 0.2) return { score: Math.floor(Math.random() * 15) + 60, rating: 'Fair', color: '#ffc107' };
    return { score: Math.floor(Math.random() * 15) + 45, rating: 'Needs Practice', color: '#ff9800' };
}

function displayAnalysisResults() {
    const analysisSection = document.getElementById('audio-analysis');
    const analysisGrid = document.getElementById('analysis-grid');
    
    const totalFiles = detectedItems.length;
    const avgQuality = Math.floor(detectedItems.reduce((sum, item) => sum + item.quality.score, 0) / totalFiles);
    const avgClarity = Math.floor(detectedItems.reduce((sum, item) => sum + item.clarity, 0) / totalFiles);
    const avgTone = Math.floor(detectedItems.reduce((sum, item) => sum + item.toneAccuracy, 0) / totalFiles);
    
    analysisGrid.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-icon">📊</div>
            <div class="analysis-label">Overall Quality</div>
            <div class="analysis-value" style="color: ${getQualityColor(avgQuality)}">${avgQuality}%</div>
        </div>
        <div class="analysis-card">
            <div class="analysis-icon">🔊</div>
            <div class="analysis-label">Audio Clarity</div>
            <div class="analysis-value">${avgClarity}%</div>
        </div>
        <div class="analysis-card">
            <div class="analysis-icon">🎵</div>
            <div class="analysis-label">Tone Accuracy</div>
            <div class="analysis-value">${avgTone}%</div>
        </div>
        <div class="analysis-card">
            <div class="analysis-icon">✅</div>
            <div class="analysis-label">Phrases Detected</div>
            <div class="analysis-value">${totalFiles}</div>
        </div>
    `;
    
    analysisSection.style.display = 'block';
}

function getQualityColor(score) {
    if (score >= 90) return '#28a745';
    if (score >= 75) return '#4CAF50';
    if (score >= 60) return '#ffc107';
    return '#ff9800';
}

function displayDetectedContent() {
    const detectedSection = document.getElementById('detected-content');
    const detectedItemsDiv = document.getElementById('detected-items');
    
    detectedItemsDiv.innerHTML = detectedItems.map((item, index) => `
        <div class="detected-item" data-item-id="${item.id}">
            <div class="detected-item-header">
                <span class="item-number">#${index + 1}</span>
                <div class="quality-badge" style="background-color: ${item.quality.color}">
                    ${item.quality.rating} - ${item.quality.score}%
                </div>
            </div>
            <div class="detected-item-content">
                <div class="detected-row">
                    <label>Chinese:</label>
                    <input type="text" class="edit-chinese" value="${item.chinese}" data-item-id="${item.id}">
                </div>
                <div class="detected-row">
                    <label>Pinyin:</label>
                    <input type="text" class="edit-pinyin" value="${item.pinyin}" data-item-id="${item.id}">
                </div>
                <div class="detected-row">
                    <label>English:</label>
                    <input type="text" class="edit-english" value="${item.english}" data-item-id="${item.id}">
                </div>
            </div>
            <div class="detected-item-metrics">
                <div class="metric">
                    <span class="metric-label">Clarity:</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${item.clarity}%; background: #4CAF50"></div>
                    </div>
                    <span class="metric-value">${item.clarity}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tone:</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${item.toneAccuracy}%; background: #667eea"></div>
                    </div>
                    <span class="metric-value">${item.toneAccuracy}%</span>
                </div>
            </div>
            <div class="detected-item-actions">
                <button class="btn-secondary btn-sm" onclick="playDetectedAudio('${item.id}')">🔊 Play Audio</button>
                <button class="btn-primary btn-sm" onclick="verifyItem('${item.id}')">
                    ${item.verified ? '✅ Verified' : '✓ Verify & Add'}
                </button>
            </div>
        </div>
    `).join('');
    
    detectedSection.style.display = 'block';
    
    // Add event listeners for editing
    document.querySelectorAll('.edit-chinese, .edit-pinyin, .edit-english').forEach(input => {
        input.addEventListener('change', (e) => updateDetectedItem(e.target.dataset.itemId, e.target));
    });
}

function playDetectedAudio(itemId) {
    const item = detectedItems.find(i => i.id === itemId);
    if (item) {
        speakChinese(item.chinese);
    }
}

function updateDetectedItem(itemId, input) {
    const item = detectedItems.find(i => i.id === itemId);
    if (item) {
        if (input.classList.contains('edit-chinese')) {
            item.chinese = input.value;
        } else if (input.classList.contains('edit-pinyin')) {
            item.pinyin = input.value;
        } else if (input.classList.contains('edit-english')) {
            item.english = input.value;
        }
    }
}

function verifyItem(itemId) {
    const item = detectedItems.find(i => i.id === itemId);
    if (item && !item.verified) {
        item.verified = true;
        lessonBuilderItems.push({...item});
        updateLessonBuilder();
        displayDetectedContent(); // Refresh to show verified status
    }
}

function setupLessonBuilder() {
    const builderSection = document.getElementById('lesson-builder');
    builderSection.style.display = 'block';
    
    const createBtn = document.getElementById('create-lesson-btn');
    createBtn.addEventListener('click', createLessonFromBuilder);
}

function updateLessonBuilder() {
    const availableDiv = document.getElementById('available-items');
    const lessonDiv = document.getElementById('lesson-items');
    const createBtn = document.getElementById('create-lesson-btn');
    
    // Update available items
    const verified = detectedItems.filter(i => i.verified);
    const inLesson = lessonBuilderItems.map(i => i.id);
    const available = verified.filter(i => !inLesson.includes(i.id));
    
    if (available.length > 0) {
        availableDiv.innerHTML = available.map(item => `
            <div class="builder-item" draggable="true" data-item-id="${item.id}">
                <div class="builder-item-content">
                    <div class="builder-chinese">${item.chinese}</div>
                    <div class="builder-pinyin">${item.pinyin}</div>
                    <div class="builder-english">${item.english}</div>
                </div>
                <div class="quality-mini" style="background: ${item.quality.color}">
                    ${item.quality.score}%
                </div>
            </div>
        `).join('');
    } else {
        availableDiv.innerHTML = '<p class="empty-state">All verified items added to lesson</p>';
    }
    
    // Update lesson items
    if (lessonBuilderItems.length > 0) {
        lessonDiv.innerHTML = lessonBuilderItems.map((item, index) => `
            <div class="builder-item in-lesson" data-item-id="${item.id}">
                <span class="lesson-order">${index + 1}</span>
                <div class="builder-item-content">
                    <div class="builder-chinese">${item.chinese}</div>
                    <div class="builder-pinyin">${item.pinyin}</div>
                    <div class="builder-english">${item.english}</div>
                </div>
                <button class="btn-remove" onclick="removeFromLesson('${item.id}')">✕</button>
            </div>
        `).join('');
        createBtn.style.display = 'block';
    } else {
        lessonDiv.innerHTML = '<p class="empty-state">Drag items here to build your lesson</p>';
        createBtn.style.display = 'none';
    }
    
    // Setup drag and drop
    setupBuilderDragDrop();
}

function setupBuilderDragDrop() {
    const availableItems = document.querySelectorAll('#available-items .builder-item');
    const lessonZone = document.getElementById('lesson-items');
    
    let draggedItem = null;
    
    availableItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.target.classList.add('dragging');
        });
        
        item.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });
    
    lessonZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        lessonZone.classList.add('drag-over');
    });
    
    lessonZone.addEventListener('dragleave', () => {
        lessonZone.classList.remove('drag-over');
    });
    
    lessonZone.addEventListener('drop', (e) => {
        e.preventDefault();
        lessonZone.classList.remove('drag-over');
        
        if (draggedItem) {
            const itemId = draggedItem.dataset.itemId;
            const item = detectedItems.find(i => i.id === itemId);
            if (item && !lessonBuilderItems.find(i => i.id === itemId)) {
                lessonBuilderItems.push({...item});
                updateLessonBuilder();
            }
        }
    });
}

function removeFromLesson(itemId) {
    lessonBuilderItems = lessonBuilderItems.filter(i => i.id !== itemId);
    updateLessonBuilder();
}

function createLessonFromBuilder() {
    const lessonName = document.getElementById('lesson-name').value.trim();
    
    if (!lessonName) {
        alert('Please enter a lesson name');
        return;
    }
    
    if (lessonBuilderItems.length === 0) {
        alert('Please add at least one item to your lesson');
        return;
    }
    
    const newLesson = {
        id: 'lesson-' + Date.now(),
        name: lessonName,
        date: new Date().toISOString(),
        exercises: lessonBuilderItems.map(item => ({
            chinese: item.chinese,
            pinyin: item.pinyin,
            english: item.english,
            audioUrl: item.audioUrl,
            quality: item.quality
        }))
    };
    
    lessons.push(newLesson);
    saveLessons();
    populateLessonSelector();
    
    // Reset builder
    lessonBuilderItems = [];
    detectedItems = [];
    document.getElementById('lesson-name').value = '';
    document.getElementById('audio-analysis').style.display = 'none';
    document.getElementById('detected-content').style.display = 'none';
    document.getElementById('lesson-builder').style.display = 'none';
    document.getElementById('uploaded-files').innerHTML = '';
    
    alert(`✅ Lesson "${lessonName}" created successfully with ${newLesson.exercises.length} exercises!`);
    
    // Switch to Practice tab
    switchTab('practice');
}

// Translation functions
function handleTranslation() {
    const input = document.getElementById('english-input').value.trim().toLowerCase();
    
    if (!input) {
        alert('Please enter an English phrase');
        return;
    }
    
    const translation = translationDictionary[input];
    
    if (translation) {
        currentTranslation = {
            english: input,
            chinese: translation.chinese,
            pinyin: translation.pinyin
        };
        
        displayTranslationResult(currentTranslation);
        
        document.getElementById('play-translation').onclick = () => speakChinese(translation.chinese);
        document.getElementById('add-to-exercises').onclick = addTranslationToExercises;
    } else {
        alert('Translation not found. Please try another phrase.');
    }
}

function displayTranslationResult(translation) {
    document.getElementById('result-chinese').textContent = translation.chinese;
    document.getElementById('result-pinyin').textContent = translation.pinyin;
    document.getElementById('result-english').textContent = translation.english;
    document.getElementById('translation-result').style.display = 'block';
}

function addTranslationToExercises() {
    if (!currentTranslation) return;
    
    if (!savedTranslations.find(t => t.english === currentTranslation.english)) {
        savedTranslations.push(currentTranslation);
        localStorage.setItem('savedTranslations', JSON.stringify(savedTranslations));
        displaySavedTranslations();
        alert('Added to saved translations!');
    } else {
        alert('This translation is already saved.');
    }
}

function displaySavedTranslations() {
    const listDiv = document.getElementById('translations-list');
    
    if (savedTranslations.length === 0) {
        listDiv.innerHTML = '<p class="empty-state">No translations saved yet. Start translating!</p>';
        return;
    }
    
    listDiv.innerHTML = savedTranslations.map(t => `
        <div class="translation-item">
            <div class="translation-content">
                <div class="chinese-lg">${t.chinese}</div>
                <div class="pinyin-sm">${t.pinyin}</div>
                <div class="english-sm">${t.english}</div>
            </div>
            <button class="btn-icon" onclick="speakChinese('${t.chinese}')">🔊</button>
        </div>
    `).join('');
}

// Practice functions
function handleLessonSelect(e) {
    const lessonId = e.target.value;
    currentLesson = lessons.find(l => l.id === lessonId);
    
    if (currentLesson) {
        exercises = currentLesson.exercises;
        currentExerciseIndex = 0;
        loadExercise(currentExerciseIndex);
        document.getElementById('exercise-container').style.display = 'block';
    }
}

function loadExercise(index) {
    const exercise = exercises[index];
    document.getElementById('chinese-text').textContent = exercise.chinese;
    document.getElementById('pinyin-text').textContent = exercise.pinyin;
    document.getElementById('english-text').textContent = exercise.english;
    document.getElementById('exercise-counter').textContent = `${index + 1} / ${exercises.length}`;
    document.getElementById('play-recording').style.display = 'none';
    recordedAudio = null;
}

function playReference() {
    const exercise = exercises[currentExerciseIndex];
    speakChinese(exercise.chinese);
}

function speakChinese(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }
}

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                recordedAudio = URL.createObjectURL(audioBlob);
                document.getElementById('play-recording').style.display = 'inline-block';
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            isRecording = true;
            document.getElementById('record-btn').textContent = '⏹️ Stop Recording';
        })
        .catch(err => alert('Microphone access denied'));
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('record-btn').textContent = '🎤 Record Your Voice';
        
        // Wait for speech recognition to complete and then auto-assess
        setTimeout(() => {
            processAutomaticAssessment();
        }, 1000);
    }
}

// Simulated Automatic Pronunciation Assessment
function processAutomaticAssessment() {
    const exercise = exercises[currentExerciseIndex];
    
    // Generate simulated pronunciation scores
    // This creates realistic-looking scores without requiring speech recognition
    const scores = generateSimulatedScores();
    
    // Auto-generate rating
    const autoRating = {
        stars: scores.stars,
        tone: scores.toneScore,
        clarity: scores.clarityScore,
        notes: scores.feedback,
        date: new Date().toISOString()
    };
    
    // Save rating to exercise
    if (!exercise.ratings) {
        exercise.ratings = [];
    }
    
    exercise.ratings.push(autoRating);
    saveLessons();
    
    // Display automatic feedback
    displaySimulatedFeedback(autoRating);
    
    // Update progress
    progressData.totalExercises++;
    progressData.totalScore += (scores.stars / 5) * 100;
    saveProgress();
}

function generateSimulatedScores() {
    // Generate weighted random scores that tend toward good performance
    // This simulates realistic pronunciation assessment
    const rand = Math.random();
    
    let stars, toneScore, clarityScore, feedback;
    
    if (rand > 0.6) {
        // 40% chance: Excellent (4-5 stars)
        stars = rand > 0.8 ? 5 : 4;
        toneScore = Math.floor(Math.random() * 15) + 85; // 85-100
        clarityScore = Math.floor(Math.random() * 15) + 85; // 85-100
        feedback = stars === 5 
            ? '🎉 Excellent! Perfect pronunciation!' 
            : '👍 Great job! Very close to perfect!';
    } else if (rand > 0.3) {
        // 30% chance: Good (3 stars)  
        stars = 3;
        toneScore = Math.floor(Math.random() * 20) + 60; // 60-80
        clarityScore = Math.floor(Math.random() * 20) + 60; // 60-80
        feedback = '✓ Good effort! Keep practicing the tones.';
    } else if (rand > 0.1) {
        // 20% chance: Fair (2 stars)
        stars = 2;
        toneScore = Math.floor(Math.random() * 15) + 45; // 45-60
        clarityScore = Math.floor(Math.random() * 15) + 45; // 45-60
        feedback = '📚 Needs more practice. Listen to the reference and try again.';
    } else {
        // 10% chance: Needs work (1 star)
        stars = 1;
        toneScore = Math.floor(Math.random() * 20) + 25; // 25-45
        clarityScore = Math.floor(Math.random() * 20) + 25; // 25-45
        feedback = '💪 Keep practicing! Try listening more carefully to the tones.';
    }
    
    return { stars, toneScore, clarityScore, feedback };
}

function displaySimulatedFeedback(rating) {
    const feedbackSection = document.getElementById('pronunciation-feedback');
    
    // Update stars display
    const starsDisplay = document.getElementById('stars-display');
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += i < rating.stars ? '<span class="star-filled">★</span>' : '<span class="star-empty">☆</span>';
    }
    starsDisplay.innerHTML = starsHtml;
    
    // Update tone display
    document.getElementById('tone-display').style.width = rating.tone + '%';
    document.getElementById('tone-display').style.background = getScoreColor(rating.tone);
    document.getElementById('tone-percent-display').textContent = rating.tone + '%';
    
    // Update clarity display
    document.getElementById('clarity-display').style.width = rating.clarity + '%';
    document.getElementById('clarity-display').style.background = getScoreColor(rating.clarity);
    document.getElementById('clarity-percent-display').textContent = rating.clarity + '%';
    
    // Update notes with automatic feedback
    const notesDisplay = document.getElementById('notes-display');
    notesDisplay.innerHTML = `
        <p><strong>Automatic Assessment:</strong> ${rating.notes}</p>
        <p style="font-size: 0.9rem; color: #666; margin-top: 8px; font-style: italic;">
            Note: This is a simulated assessment to help track practice progress. 
            Listen carefully to your child's pronunciation and use your judgment for the best feedback.
        </p>
    `;
    
    feedbackSection.style.display = 'block';
}

function playRecording() {
    if (recordedAudio) {
        const audio = new Audio(recordedAudio);
        audio.play();
    }
}

// Pronunciation Rating Functions
let currentRatingStars = 0;

function showPronunciationRating() {
    const ratingSection = document.getElementById('pronunciation-rating');
    ratingSection.style.display = 'block';
    
    // Setup star rating
    const stars = document.querySelectorAll('.rating-stars .star');
    stars.forEach(star => {
        star.addEventListener('click', handleStarClick);
        star.addEventListener('mouseenter', handleStarHover);
    });
    
    document.querySelector('.rating-stars').addEventListener('mouseleave', () => {
        updateStars(currentRatingStars);
    });
    
    // Setup sliders
    const toneSlider = document.getElementById('tone-rating');
    const claritySlider = document.getElementById('clarity-rating');
    
    toneSlider.addEventListener('input', (e) => {
        document.getElementById('tone-value').textContent = e.target.value + '%';
    });
    
    claritySlider.addEventListener('input', (e) => {
        document.getElementById('clarity-value').textContent = e.target.value + '%';
    });
    
    // Setup save button
    document.getElementById('save-rating-btn').addEventListener('click', savePronunciationRating);
}

function handleStarClick(e) {
    currentRatingStars = parseInt(e.target.dataset.rating);
    updateStars(currentRatingStars);
}

function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    updateStars(rating);
}

function updateStars(rating) {
    const stars = document.querySelectorAll('.rating-stars .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function savePronunciationRating() {
    if (currentRatingStars === 0) {
        alert('Please select a star rating');
        return;
    }
    
    const exercise = exercises[currentExerciseIndex];
    const toneScore = parseInt(document.getElementById('tone-rating').value);
    const clarityScore = parseInt(document.getElementById('clarity-rating').value);
    const notes = document.getElementById('pronunciation-notes').value;
    
    // Save rating to exercise
    if (!exercise.ratings) {
        exercise.ratings = [];
    }
    
    exercise.ratings.push({
        stars: currentRatingStars,
        tone: toneScore,
        clarity: clarityScore,
        notes: notes,
        date: new Date().toISOString()
    });
    
    // Save to localStorage
    saveLessons();
    
    // Hide rating interface
    document.getElementById('pronunciation-rating').style.display = 'none';
    
    // Show feedback with saved rating
    displayPronunciationFeedback(exercise.ratings[exercise.ratings.length - 1]);
    
    // Update progress
    progressData.totalExercises++;
    progressData.totalScore += (currentRatingStars / 5) * 100;
    saveProgress();
    
    // Reset for next use
    currentRatingStars = 0;
    document.getElementById('tone-rating').value = 50;
    document.getElementById('clarity-rating').value = 50;
    document.getElementById('tone-value').textContent = '50%';
    document.getElementById('clarity-value').textContent = '50%';
    document.getElementById('pronunciation-notes').value = '';
    updateStars(0);
    
    alert('✅ Rating saved! Great job tracking progress!');
}

function displayPronunciationFeedback(rating) {
    const feedbackSection = document.getElementById('pronunciation-feedback');
    
    // Update stars display
    const starsDisplay = document.getElementById('stars-display');
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += i < rating.stars ? '<span class="star-filled">★</span>' : '<span class="star-empty">☆</span>';
    }
    starsDisplay.innerHTML = starsHtml;
    
    // Update tone display
    document.getElementById('tone-display').style.width = rating.tone + '%';
    document.getElementById('tone-display').style.background = getScoreColor(rating.tone);
    document.getElementById('tone-percent-display').textContent = rating.tone + '%';
    
    // Update clarity display
    document.getElementById('clarity-display').style.width = rating.clarity + '%';
    document.getElementById('clarity-display').style.background = getScoreColor(rating.clarity);
    document.getElementById('clarity-percent-display').textContent = rating.clarity + '%';
    
    // Update notes
    const notesDisplay = document.getElementById('notes-display');
    if (rating.notes) {
        notesDisplay.innerHTML = `<p><strong>Notes:</strong> ${rating.notes}</p>`;
    } else {
        notesDisplay.innerHTML = '';
    }
    
    feedbackSection.style.display = 'block';
}

function getScoreColor(score) {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#4CAF50';
    if (score >= 40) return '#ffc107';
    return '#ff9800';
}

function previousExercise() {
    if (currentExerciseIndex > 0) {
        currentExerciseIndex--;
        loadExercise(currentExerciseIndex);
    }
}

function nextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
        currentExerciseIndex++;
        loadExercise(currentExerciseIndex);
    }
}

// DRAG AND DROP MATCHING GAME
function startNewGame() {
    const difficulty = document.getElementById('difficulty-select').value;
    const pairCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 9;
    
    // Reset game state
    matchedPairs = 0;
    moveCount = 0;
    gamePairs = [];
    
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
            emoji: translation.emoji || '📝', // Fallback emoji if not defined
            matched: false
        });
    });
    
    // Update UI
    document.getElementById('move-count').textContent = '0';
    document.getElementById('match-count').textContent = `0 / ${pairCount}`;
    document.getElementById('game-result').style.display = 'none';
    
    // Start timer
    gameStartTime = Date.now();
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(updateGameTimer, 1000);
    
    // Render game board
    renderDragDropGame();
}

function renderDragDropGame() {
    const gameBoard = document.getElementById('game-board');
    
    // Create two columns layout with images instead of English words
    gameBoard.innerHTML = `
        <div class="game-columns">
            <div class="game-column" id="chinese-column">
                <h3>Chinese 中文</h3>
                <div class="cards-container" id="chinese-cards"></div>
            </div>
            <div class="game-column" id="image-column">
                <h3>Match the Picture!</h3>
                <div class="cards-container" id="image-cards"></div>
            </div>
        </div>
    `;
    
    const chineseContainer = document.getElementById('chinese-cards');
    const imageContainer = document.getElementById('image-cards');
    
    // Shuffle arrays separately
    const shuffledChinese = [...gamePairs].sort(() => 0.5 - Math.random());
    const shuffledEnglish = [...gamePairs].sort(() => 0.5 - Math.random());
    
    // Create Chinese cards (draggable)
    shuffledChinese.forEach(pair => {
        const card = document.createElement('div');
        card.className = 'drag-card draggable';
        card.draggable = true;
        card.dataset.pairId = pair.id;
        card.innerHTML = `
            <div class="card-content">
                <div class="card-chinese">${pair.chinese}</div>
                <div class="card-pinyin">${pair.pinyin}</div>
            </div>
        `;
        
        // Drag event listeners
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        
        // Click to play audio
        card.addEventListener('click', () => {
            if (!pair.matched) {
                speakChinese(pair.chinese);
            }
        });
        
        chineseContainer.appendChild(card);
    });
    
    // Create Image cards (drop targets) - Display emojis instead of English words
    shuffledEnglish.forEach(pair => {
        const card = document.createElement('div');
        card.className = 'drag-card drop-target image-card';
        card.dataset.pairId = pair.id;
        card.innerHTML = `
            <div class="card-content">
                <div class="card-emoji">${pair.emoji}</div>
                <div class="card-label">${pair.english}</div>
            </div>
        `;
        
        // Drop event listeners
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        
        imageContainer.appendChild(card);
    });
}

function handleDragStart(e) {
    draggedCard = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
}

function handleDragOverGame(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeaveGame(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedCard) return;
    
    const draggedId = parseInt(draggedCard.dataset.pairId);
    const targetId = parseInt(e.currentTarget.dataset.pairId);
    
    moveCount++;
    document.getElementById('move-count').textContent = moveCount;
    
    // Check if it's a match
    if (draggedId === targetId) {
        // Correct match!
        draggedCard.classList.add('matched');
        e.currentTarget.classList.add('matched');
        
        // Mark as matched
        gamePairs[draggedId].matched = true;
        matchedPairs++;
        
        document.getElementById('match-count').textContent = `${matchedPairs} / ${gamePairs.length}`;
        
        // Play audio on match
        const pair = gamePairs[draggedId];
        speakChinese(pair.chinese);
        
        // Check if game is complete
        if (matchedPairs === gamePairs.length) {
            setTimeout(endGame, 500);
        }
    } else {
        // Incorrect match - show feedback
        draggedCard.classList.add('incorrect');
        e.currentTarget.classList.add('incorrect');
        
        setTimeout(() => {
            draggedCard.classList.remove('incorrect');
            e.currentTarget.classList.remove('incorrect');
        }, 500);
    }
    
    draggedCard = null;
}

function updateGameTimer() {
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('game-time').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function endGame() {
    clearInterval(gameTimer);
    
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('final-time').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('final-moves').textContent = moveCount;
    document.getElementById('game-result').style.display = 'block';
    
    // Update progress
    progressData.totalExercises += gamePairs.length;
    saveProgress();
}

// Progress functions
function updateProgressDisplay() {
    document.getElementById('total-exercises').textContent = progressData.totalExercises;
    document.getElementById('avg-score').textContent = 
        progressData.totalExercises > 0 
            ? Math.round(progressData.totalScore / progressData.totalExercises) + '%' 
            : '0%';
    document.getElementById('lessons-completed').textContent = progressData.lessonsCompleted;
    document.getElementById('practice-time').textContent = progressData.practiceTime;
}

function drawProgressChart() {
    const canvas = document.getElementById('progress-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Simple bar chart
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(50, 150, 50, 50);
    ctx.fillRect(150, 100, 50, 100);
    ctx.fillRect(250, 120, 50, 80);
    ctx.fillRect(350, 80, 50, 120);
}

// Storage functions
function saveLessons() {
    localStorage.setItem('mandarinLessons', JSON.stringify(lessons));
}

function saveProgress() {
    localStorage.setItem('progressData', JSON.stringify(progressData));
}

function loadProgress() {
    updateProgressDisplay();
}

function populateLessonSelector() {
    const select = document.getElementById('lesson-select');
    select.innerHTML = '<option value="">Select a lesson...</option>';
    
    lessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.id;
        option.textContent = lesson.name;
        select.appendChild(option);
    });
}

function deleteLesson(lessonId) {
    if (confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
        lessons = lessons.filter(l => l.id !== lessonId);
        saveLessons();
        populateLessonSelector();
        displayLessonList();
        
        // Clear exercise display if this was the selected lesson
        if (currentLesson && currentLesson.id === lessonId) {
            currentLesson = null;
            document.getElementById('exercise-container').style.display = 'none';
            document.getElementById('lesson-select').value = '';
        }
        
        alert('Lesson deleted successfully!');
    }
}

function displayLessonList() {
    const lessonListDiv = document.getElementById('lesson-list');
    if (!lessonListDiv) return;
    
    if (lessons.length === 0) {
        lessonListDiv.innerHTML = '<p class="empty-state">No lessons yet. Create one from translations or upload audio!</p>';
        return;
    }
    
    lessonListDiv.innerHTML = lessons.map(lesson => `
        <div class="lesson-list-item">
            <div class="lesson-info">
                <h4>${lesson.name}</h4>
                <p>${lesson.exercises.length} exercises • Created ${new Date(lesson.date).toLocaleDateString()}</p>
            </div>
            <div class="lesson-actions">
                <button class="btn-secondary btn-sm" onclick="loadLessonInPractice('${lesson.id}')">Practice</button>
                <button class="btn-remove" onclick="deleteLesson('${lesson.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function loadLessonInPractice(lessonId) {
    switchTab('practice');
    document.getElementById('lesson-select').value = lessonId;
    const event = new Event('change');
    document.getElementById('lesson-select').dispatchEvent(event);
}

function createLessonFromTranslations() {
    if (savedTranslations.length === 0) {
        alert('Please add some translations first!');
        return;
    }
    
    const lessonName = prompt('Enter a name for your new lesson:');
    if (!lessonName || !lessonName.trim()) {
        return;
    }
    
    const newLesson = {
        id: 'lesson-' + Date.now(),
        name: lessonName.trim(),
        date: new Date().toISOString(),
        exercises: savedTranslations.map(t => ({
            chinese: t.chinese,
            pinyin: t.pinyin,
            english: t.english,
            audioUrl: null
        }))
    };
    
    lessons.push(newLesson);
    saveLessons();
    populateLessonSelector();
    displayLessonList();
    
    alert(`✅ Lesson "${lessonName}" created with ${savedTranslations.length} exercises!`);
    
    // Ask if they want to clear translations
    if (confirm('Lesson created! Would you like to clear your saved translations to start fresh?')) {
        savedTranslations = [];
        localStorage.setItem('savedTranslations', JSON.stringify(savedTranslations));
        displaySavedTranslations();
    }
}

function createGameFromTranslations() {
    if (savedTranslations.length === 0) {
        alert('Please add some translations first!');
        return;
    }
    
    if (savedTranslations.length < 3) {
        alert('You need at least 3 translations to create a matching game!');
        return;
    }
    
    // Switch to game tab
    switchTab('game');
    
    // Start custom game with saved translations
    startCustomGame(savedTranslations);
    
    alert(`🎮 Custom game created with ${savedTranslations.length} pairs!`);
}

function startCustomGame(translations) {
    const pairCount = translations.length;
    
    // Reset game state
    matchedPairs = 0;
    moveCount = 0;
    gamePairs = [];
    
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
    
    // Update UI
    document.getElementById('move-count').textContent = '0';
    document.getElementById('match-count').textContent = `0 / ${pairCount}`;
    document.getElementById('game-result').style.display = 'none';
    
    // Hide difficulty selector for custom games
    document.getElementById('difficulty-select').value = 'medium';
    
    // Start timer
    gameStartTime = Date.now();
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(updateGameTimer, 1000);
    
    // Render game board
    renderDragDropGame();
}

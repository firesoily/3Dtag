/**
 * TextProcessor - 文本处理模块
 * 负责：分词、停用词过滤、词频统计、词性识别
 */

/**
 * TextProcessor - 文本处理模块
 * 负责：分词、停用词过滤、词频统计、词性识别
 */

class TextProcessor {
    constructor() {
        // 内置中英文停用词表（扩展版）
        this.stopWordsCN = new Set([
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很',
            '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '她', '他', '它',
            '我们', '你们', '他们', '因为', '所以', '但是', '然后', '一些', '这个', '那个', '这些', '那些',
            '一下', '一点', '因为', '所以', '然而', '并且', '或者', '还是', '只有', '才能', '虽然', '尽管',
            '为了', '关于', '对于', '根据', '按照', '例如', '比如', '特别是', '尤其是', '包括', '以及',
            '其', '之', '于', '则', '即', '若', '如', '若', '因', '由', '向', '对', '给', '与', '同',
            '能', '可以', '能够', '会', '可能', '应该', '必须', '需要', '想要', '希望', '认为', '觉得',
            '知道', '了解', '发现', '认为', '感觉', '看', '见', '听到', '听说', '告诉', '说', '问',
            '年', '月', '日', '时', '分', '秒', '现在', '以后', '之前', '以前', '未来', '过去', '今天',
            '明天', '昨天', '早上', '晚上', '中午', '下午', '夜晚', '白天', '时刻', '时间', '时候',
            '这里', '那里', '哪里', '这边', '那边', '上方', '下方', '前面', '后面', '左面', '右面',
            '东西', '南北', '东', '西', '南', '北', '中', '内', '外', '间', '上边', '下边', '前边',
            '后边', '左边', '右边', '之间', '之中', '之外', '以上', '以下', '以前', '以后', '左右',
            '多', '少', '几', '各', '每', '全', '整', '整个', '全部', '所有', '所有', '一切', '凡',
            '任何', '无论', '既然', '既', '既', '又', '再', '又', '还', '仍', '总', '总是', ' continually',
            '始终', '一直', '从来', '向来', '早已', '已经', '曾经', '将要', '即将', '快要', '几乎',
            '大概', '也许', '或许', '可能', '难道', '岂', '竟', '偏偏', '偏偏', '单单', '仅仅', '只',
            '不过', '仅仅', '只是', '无非', '其实', '实际上', '事实上', '当然', '自然', '显然', '显然',
            '必然', '必定', '确实', '的确', '真的', '真', '实在', '确实', '诚然', '的确', '无疑',
            '大概', '大约', '约', '左右', '上下', '差不多', '几乎', '近乎', '接近', '近似', '大约',
            '或许', '或者', '也许', '可能', '怕', '恐怕', '说不定', '也许', '或者', '还是'
        ]);

        this.stopWordsEN = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on',
            'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
            'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make',
            'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
            'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
            'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
            'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'am', 'may', 'such', 'very',
            'more', 'much', 'too', 'here', 'where', 'why', 'how', 'each', 'both', 'few', 'many', 'through',
            'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'once',
            'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
            'too', 'very', 's', 't', 'don', 'now', 've', 'll', 're', 'aren', 'couldn', 'didn', 'doesn',
            'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn',
            'weren', 'won', 'wouldn', 'rt', 've', 'll', 'd', 'm', 'y', 're', 's', 't', 'b', 'c', 'e',
            'f', 'g', 'h', 'i', 'j', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 'u', 'v', 'w', 'x', 'z'
        ]);

        // 英文词干提取器 (Porter Stemmer 简化版)
        this.stemmer = this._createStemmer();

        // 常见英文词根映射（用于快速词干还原）
        this.stemMap = {
            'running': 'run', 'runs': 'run', 'ran': 'run',
            'jumping': 'jump', 'jumps': 'jump', 'jumped': 'jump',
            'walking': 'walk', 'walks': 'walk', 'walked': 'walk',
            'learning': 'learn', 'learns': 'learn', 'learned': 'learn',
            'teaching': 'teach', 'teaches': 'teach', 'taught': 'teach',
            'working': 'work', 'works': 'work', 'worked': 'work',
            'doing': 'do', 'does': 'do', 'did': 'do',
            'making': 'make', 'makes': 'make', 'made': 'make',
            'taking': 'take', 'takes': 'take', 'took': 'take',
            'giving': 'give', 'gives': 'give', 'gave': 'give',
            'using': 'use', 'uses': 'use', 'used': 'use',
            'having': 'have', 'has': 'have', 'had': 'have',
            'saying': 'say', 'says': 'say', 'said': 'say',
            'going': 'go', 'goes': 'go', 'went': 'go',
            'coming': 'come', 'comes': 'come', 'came': 'come',
            'seeing': 'see', 'sees': 'see', 'saw': 'see',
            'finding': 'find', 'finds': 'find', 'found': 'find',
            'thinking': 'think', 'thinks': 'think', 'thought': 'think',
            'telling': 'tell', 'tells': 'tell', 'told': 'tell',
            'asking': 'ask', 'asks': 'ask', 'asked': 'ask',
            'trying': 'try', 'tries': 'try', 'tried': 'try',
            'needing': 'need', 'needs': 'need', 'needed': 'need',
            'wanting': 'want', 'wants': 'want', 'wanted': 'want',
            'feeling': 'feel', 'feels': 'feel', 'felt': 'feel',
            'keeping': 'keep', 'keeps': 'keep', 'kept': 'keep',
            'leaving': 'leave', 'leaves': 'leave', 'left': 'leave',
            'living': 'live', 'lives': 'live', 'lived': 'live',
            'bringing': 'bring', 'brings': 'bring', 'brought': 'bring',
            'buying': 'buy', 'buys': 'buy', 'bought': 'buy',
            'selling': 'sell', 'sells': 'sell', 'sold': 'sell',
            'calling': 'call', 'calls': 'call', 'called': 'call',
            'turning': 'turn', 'turns': 'turn', 'turned': 'turn',
            'playing': 'play', 'plays': 'play', 'played': 'play'
        };

        // 中文复合词保护列表（不应拆分的词）
        this.protectedCNWords = new Set([
            '人工智能', '机器学习', '深度学习', '神经网络', '自然语言', '自然语言处理',
            '计算机视觉', '强化学习', '监督学习', '无监督学习', '半监督学习',
            '大数据', '云计算', '物联网', '区块链', '虚拟现实', '增强现实',
            '自动驾驶', '智能家居', '智能助手', '推荐系统', '搜索引擎',
            'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift',
            'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring',
            'TensorFlow', 'PyTorch', 'Keras', 'OpenCV', 'Docker', 'Kubernetes'
        ]);
    }

    /**
     * 简单的词干映射查找
     */
    _simpleStem(word) {
        const lower = word.toLowerCase();
        return this.stemMap[lower] || lower;
    }

    /**
     * 创建简化版 Porter Stemmer
     */
    _createStemmer() {
        return (word) => {
            // 优先使用预设映射
            const mapped = this.stemMap[word.toLowerCase()];
            if (mapped) return mapped;

            let w = word.toLowerCase();

            // 处理常见的英文后缀
            if (w.length > 3) {
                // 复数形式 -s, -es
                if (w.endsWith('ies') && w.length > 4) {
                    return w.slice(0, -3) + 'y';
                }
                if (w.endsWith('es') && !['be', 'she', 'he'].includes(w.slice(0, -2))) {
                    return w.slice(0, -2);
                }
                if (w.endsWith('s') && !['is', 'has', 'was'].includes(w)) {
                    return w.slice(0, -1);
                }

                // -ing, -ed
                if (w.endsWith('ing') && w.length > 5) {
                    const base = w.slice(0, -3);
                    // 双写字母处理（如 running -> run）
                    if (base.endsWith(base[base.length - 1])) {
                        return base.slice(0, -1);
                    }
                    return base;
                }
                if (w.endsWith('ed') && w.length > 4) {
                    const base = w.slice(0, -2);
                    if (base.endsWith(base[base.length - 1])) {
                        return base.slice(0, -1);
                    }
                    return base;
                }

                // -ly, -ful, -ness, -ment, -tion
                if (w.endsWith('ly')) return w.slice(0, -2);
                if (w.endsWith('ful')) return w.slice(0, -3);
                if (w.endsWith('ness')) return w.slice(0, -4);
                if (w.endsWith('ment')) return w.slice(0, -4);
                if (w.endsWith('tion')) return w.slice(0, -4);
                if (w.endsWith('ize')) return w.slice(0, -3);
                if (w.endsWith('ise')) return w.slice(0, -3);
            }

            return w;
        };
    }

    /**
     * 提取关键词
     * @param {string} text - 输入文本
     * @param {object} options - 配置选项
     * @returns {Array} 排序后的关键词数组 [{word, count, type}]
     */
    extractKeywords(text, options = {}) {
        const startTime = performance.now();

        // 1. 分词
        const words = this._tokenize(text);

        // 2. 过滤停用词
        const filtered = this._filterStopWords(words);

        // 3. 词干提取 (英文)
        const stemmed = this._applyStemming(filtered);

        // 4. 统计词频
        const frequencies = this._countFrequencies(stemmed);

        // 5. 识别词性
        const tagged = this._tagPOS(Object.keys(frequencies), text);

        // 6. 排序并限制数量
        const sorted = this._sortAndLimit(tagged, frequencies, options.limit || 50);

        const endTime = performance.now();
        console.log(`Text processing took ${(endTime - startTime).toFixed(2)}ms, words: ${words.length}, filtered: ${filtered.length}, result: ${sorted.length}`);

        return sorted;
    }

    /**
     * 应用词干提取（仅英文）
     */
    _applyStemming(words) {
        return words.map(word => {
            if (/^[a-zA-Z]+$/.test(word)) {
                return this.stemmer(word);
            }
            return word;
        });
    }

    /**
     * 分词：中英文混合，支持复合词保护
     */
    _tokenize(text) {
        const words = [];
        const protectedWords = this.protectedCNWords;

        // 保护复合词：优先匹配复合词
        let remainingText = text;
        for (const protectedWord of protectedWords) {
            if (remainingText.includes(protectedWord)) {
                // 移除已匹配的复合词（避免重复匹配子串）
                remainingText = remainingText.replace(new RegExp(protectedWord, 'g'), ' ');
            }
        }

        // 匹配连续的英文字母（长度>=2）
        const enRegex = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
        let match;
        while ((match = enRegex.exec(remainingText)) !== null) {
            const word = match[0].toLowerCase();
            if (word.length >= 2) {
                words.push(word);
            }
        }

        // 匹配中文字符（长度2-4，保护复合词已在上面处理）
        const cnRegex = /[\u4e00-\u9fa5]{2,4}/g;
        while ((match = cnRegex.exec(remainingText)) !== null) {
            words.push(match[0]);
        }

        return words;
    }

    /**
     * 过滤停用词
     */
    _filterStopWords(words) {
        return words.filter(word => {
            if (/^[\u4e00-\u9fa5]+$/.test(word)) {
                return !this.stopWordsCN.has(word);
            } else if (/^[a-zA-Z]+$/.test(word)) {
                return word.length >= 2 && !this.stopWordsEN.has(word);
            }
            return false;
        });
    }

    /**
     * 统计词频
     */
    _countFrequencies(words) {
        const freq = {};
        for (const word of words) {
            freq[word] = (freq[word] || 0) + 1;
        }
        return freq;
    }

    /**
     * 词性标注（基于规则和词典）
     * 改进：使用词干化后的词、考虑上下文、支持复合词
     */
    _tagPOS(wordList, originalText) {
        // 预定义词典（增强版）
        const knownNounsCN = new Set([
            '人工智能', '机器学习', '深度学习', '神经网络', '自然语言处理', '计算机视觉',
            '自动驾驶', '智能家居', '大数据', '云计算', '物联网', '区块链',
            'python', 'javascript', 'java', 'react', 'vue', 'angular', 'docker', 'kubernetes',
            '科技', '技术', '系统', '应用', '平台', '服务', '产品', '解决方案',
            '公司', '团队', '项目', '用户', '客户', '市场', '行业'
        ]);

        const knownVerbsEN = new Set([
            'run', 'learn', 'teach', 'work', 'make', 'take', 'give', 'use', 'have', 'say',
            'go', 'come', 'see', 'find', 'think', 'tell', 'ask', 'try', 'need', 'want',
            'feel', 'keep', 'leave', 'live', 'bring', 'buy', 'sell', 'call', 'turn', 'play'
        ]);

        const knownAdjsEN = new Set([
            'good', 'great', 'new', 'old', 'big', 'small', 'high', 'low', 'fast', 'slow',
            'smart', 'intelligent', 'automatic', 'digital', 'online', 'offline', 'real',
            'virtual', 'augmented', 'natural', 'language', 'deep', 'shallow', 'strong', 'weak'
        ]);

        return wordList.map(word => {
            let type = 'other';

            // 检查是否在已知词典中
            if (knownNounsCN.has(word)) {
                return { word, type: 'noun' };
            }
            if (knownVerbsEN.has(word)) {
                return { word, type: 'verb' };
            }
            if (knownAdjsEN.has(word)) {
                return { word, type: 'adj' };
            }

            // 规则推断
            if (/^[\u4e00-\u9fa5]+$/.test(word)) {
                // 中文：2-3字通常为名词，4字以上多为专有名词/术语
                if (word.length >= 4) {
                    type = 'noun';
                } else if (word.length === 2 || word.length === 3) {
                    // 简单判断：如果词以 "化"、"学"、"术"、"法" 结尾，可能是名词
                    if (/[(化)(学)(术)(法)(机)(系)(平)(台)(网)]$/.test(word)) {
                        type = 'noun';
                    } else {
                        type = 'noun'; // 默认名词
                    }
                }
            } else if (/^[a-zA-Z]+$/.test(word)) {
                // 英文：首字母大写通常是专有名词
                if (/^[A-Z]/.test(word)) {
                    type = 'noun';
                } else {
                    // 基于词尾判断（使用词干化后的词）
                    if (word.endsWith('ing') || word.endsWith('ed') || word === 'ize') {
                        type = 'verb';
                    } else if (word.endsWith('ly') || word.endsWith('ful') || word.endsWith('less') ||
                               word.endsWith('able') || word.endsWith('ible') || word.endsWith('ish') ||
                               word.endsWith('ous') || word.endsWith('al') || word.endsWith('y')) {
                        type = 'adj';
                    } else if (word.endsWith('tion') || word.endsWith('sion') || word.endsWith('ment') ||
                               word.endsWith('ness') || word.endsWith('ity') || word.endsWith('er') ||
                               word.endsWith('or') || word.endsWith('ist') || word.endsWith('ism')) {
                        type = 'noun';
                    } else {
                        // 常见动词原形
                        const commonVerbs = ['run', 'jump', 'walk', 'talk', 'read', 'write', 'code',
                                            'develop', 'design', 'create', 'build', 'test', 'deploy',
                                            'learn', 'teach', 'study', 'research', 'analyze', 'process'];
                        if (commonVerbs.includes(word)) {
                            type = 'verb';
                        } else {
                            type = 'other';
                        }
                    }
                }
            }

            return { word, type };
        });
    }

    /**
     * 排序并限制数量
     */
    _sortAndLimit(tagged, frequencies, limit) {
        return tagged
            .map(item => ({
                ...item,
                count: frequencies[item.word]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
}

// 导出（如果在模块环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextProcessor;
}
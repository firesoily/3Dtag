/**
 * TextProcessor - 文本处理模块
 * 负责：分词、停用词过滤、词频统计、词性识别
 */

class TextProcessor {
    constructor() {
        // 内置中英文停用词表
        this.stopWordsCN = new Set([
            '的', '了', '在', '是', '我', '有', '和', '就',
            '不', '人', '都', '一', '一个', '上', '也', '很',
            '到', '说', '要', '去', '你', '会', '着', '没有',
            '看', '好', '自己', '这', '那', '她', '他', '它',
            '我们', '你们', '他们', '因为', '所以', '但是', '然后',
            '一些', '一些', '这个', '那个', '这些', '那些',
            '一下', '一下', '一下', '一些', '一点', '一些'
        ]);

        this.stopWordsEN = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that',
            'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
            'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
            'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an',
            'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
            'which', 'go', 'me', 'when', 'make', 'can', 'like',
            'time', 'no', 'just', 'him', 'know', 'take', 'people',
            'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only',
            'come', 'its', 'over', 'think', 'also', 'back', 'after',
            'use', 'two', 'how', 'our', 'work', 'first', 'well',
            'way', 'even', 'new', 'want', 'because', 'any', 'these',
            'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been',
            'has', 'had', 'were', 'said', 'did', 'am', 'may', 'such',
            'very', 'more', 'much', 'too', 'here', 'where', 'why',
            'how', 'each', 'both', 'few', 'many', 'through', 'during'
        ]);
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

        // 3. 统计词频
        const frequencies = this._countFrequencies(filtered);

        // 4. 识别词性
        const tagged = this._tagPOS(Object.keys(frequencies), text);

        // 5. 排序并限制数量
        const sorted = this._sortAndLimit(tagged, frequencies, options.limit || 50);

        const endTime = performance.now();
        console.log(`Text processing took ${(endTime - startTime).toFixed(2)}ms`);

        return sorted;
    }

    /**
     * 分词：中英文混合
     */
    _tokenize(text) {
        const words = [];

        // 匹配连续的英文字母（长度>=2）
        const enRegex = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
        let match;
        while ((match = enRegex.exec(text)) !== null) {
            words.push(match[0].toLowerCase());
        }

        // 匹配中文字符（长度2-4）
        const cnRegex = /[\u4e00-\u9fa5]{2,4}/g;
        while ((match = cnRegex.exec(text)) !== null) {
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
     * 词性标注（基于简单规则）
     */
    _tagPOS(wordList, originalText) {
        return wordList.map(word => {
            let type = 'other';

            if (/^[\u4e00-\u9fa5]+$/.test(word)) {
                // 中文：2-3字多为名词，4字以上为专有名词
                if (word.length >= 4) {
                    type = 'noun';  // 专有名词
                } else if (word.length === 2 || word.length === 3) {
                    // 简单规则：如果句子中该词后面是"了"、"的"等，可能是动词
                    type = 'noun';  // 默认名词
                }
            } else if (/^[a-zA-Z]+$/.test(word)) {
                // 英文：首字母大写可能是专有名词
                if (/^[A-Z]/.test(word)) {
                    type = 'noun';
                } else {
                    // 动词以 ing, ed, ize 等结尾的简单判断
                    if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('ize')) {
                        type = 'verb';
                    } else if (word.endsWith('ly') || word.endsWith('ful') || word.endsWith('less')) {
                        type = 'adj';
                    } else {
                        type = 'other';
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
// server/src/services/retrieval/pubmedService.js
// PubMed API integration - FULLY FIXED WITH ALL EDGE CASES

const axios = require('axios');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const logger = require('../../config/logger');

const parseXMLAsync = promisify(parseString);

class PubMedService {
    constructor() {
        this.baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
        this.apiKey = process.env.NCBI_API_KEY || '';
        this.toolName = 'Curalink-Medical-Assistant';
        this.email = process.env.ADMIN_EMAIL || 'admin@curalink.com';
        this.requestsPerSecond = 3;
        this.lastRequestTime = 0;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / this.requestsPerSecond;
        
        if (timeSinceLastRequest < minInterval) {
            await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
    }

    // Safe string extractor for any PubMed field
    extractString(value) {
        if (!value) return '';
        if (typeof value === 'string') return value.trim();
        if (Array.isArray(value)) {
            const first = value[0];
            if (typeof first === 'string') return first.trim();
            if (first && typeof first === 'object') {
                return this.extractString(first._ || first['#text'] || first);
            }
        }
        if (typeof value === 'object') {
            // Handle { _: 'text', i: [...] } format
            if (value._) return String(value._).trim();
            if (value['#text']) return String(value['#text']).trim();
            // Handle { i: [...] } format - concatenate italic parts
            if (value.i && Array.isArray(value.i)) {
                return value.i.join(' ').trim();
            }
            // Handle { b: '...', i: '...' } mixed format
            const parts = [];
            if (value.b) parts.push(String(value.b));
            if (value.i) parts.push(Array.isArray(value.i) ? value.i.join(' ') : String(value.i));
            if (value.u) parts.push(String(value.u));
            if (value.sub) parts.push(String(value.sub));
            if (value.sup) parts.push(String(value.sup));
            if (parts.length > 0) return parts.join(' ').trim();
            return String(value);
        }
        return String(value || '');
    }

    // Safe author extraction
    extractAuthors(articleData) {
        const authors = [];
        try {
            if (articleData.AuthorList && articleData.AuthorList[0].Author) {
                articleData.AuthorList[0].Author.forEach(author => {
                    if (author.LastName && author.ForeName) {
                        authors.push(`${author.LastName[0]} ${author.ForeName[0]}`);
                    } else if (author.LastName) {
                        authors.push(author.LastName[0]);
                    } else if (author.CollectiveName) {
                        authors.push(author.CollectiveName[0]);
                    }
                });
            }
        } catch (e) {
            logger.warn('Error extracting authors:', e.message);
        }
        return authors.length > 0 ? authors : ['Unknown Authors'];
    }

    // Safe year extraction
    extractYear(articleData) {
        try {
            if (articleData.Journal && articleData.Journal[0].JournalIssue) {
                const pubDate = articleData.Journal[0].JournalIssue[0].PubDate[0];
                if (pubDate.Year) return parseInt(pubDate.Year[0]);
                if (pubDate.MedlineDate) {
                    const match = pubDate.MedlineDate[0].match(/\d{4}/);
                    if (match) return parseInt(match[0]);
                }
            }
            if (articleData.ArticleDate && articleData.ArticleDate[0]) {
                const date = articleData.ArticleDate[0];
                if (date.Year) return parseInt(date.Year[0]);
            }
        } catch (e) {
            logger.warn('Error extracting year:', e.message);
        }
        return null;
    }

    // Safe abstract extraction
    extractAbstract(articleData) {
        try {
            if (articleData.Abstract && articleData.Abstract[0].AbstractText) {
                const texts = articleData.Abstract[0].AbstractText.map(text => {
                    return this.extractString(text);
                }).filter(t => t.length > 0);
                return texts.join(' ') || 'No abstract available';
            }
        } catch (e) {
            logger.warn('Error extracting abstract:', e.message);
        }
        return 'No abstract available';
    }

    // Safe journal extraction
    extractJournal(articleData) {
        try {
            if (articleData.Journal) {
                const journal = articleData.Journal[0];
                if (journal.Title) return this.extractString(journal.Title);
                if (journal.ISOAbbreviation) return this.extractString(journal.ISOAbbreviation);
            }
        } catch (e) {
            logger.warn('Error extracting journal:', e.message);
        }
        return 'Unknown Journal';
    }

    // Safe DOI extraction
    extractDOI(pubmedData) {
        try {
            if (pubmedData.ArticleIdList && pubmedData.ArticleIdList[0].ArticleId) {
                const doiEntry = pubmedData.ArticleIdList[0].ArticleId.find(
                    id => id.$.IdType === 'doi'
                );
                if (doiEntry && doiEntry._) return doiEntry._;
            }
        } catch (e) {
            logger.warn('Error extracting DOI:', e.message);
        }
        return '';
    }

    // Format article with all safe extractors
    formatArticleData(article) {
        try {
            const medlineCitation = article.MedlineCitation[0];
            const articleData = medlineCitation.Article[0];
            const pubmedData = article.PubmedData?.[0] || {};
            const pmid = medlineCitation.PMID[0]._;
            
            // Extract all fields safely
            const title = this.extractString(articleData.ArticleTitle) || 'No title available';
            const authors = this.extractAuthors(articleData);
            const abstract = this.extractAbstract(articleData);
            const journal = this.extractJournal(articleData);
            const year = this.extractYear(articleData);
            const doi = this.extractDOI(pubmedData);
            
            return {
                id: `pmid:${pmid}`,
                title: title,
                authors: authors,
                abstract: abstract,
                journal: journal,
                year: year,
                doi: doi,
                url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
                source: 'pubmed',
                pmid: pmid
            };
        } catch (error) {
            logger.error('Error formatting PubMed article:', error);
            return null;
        }
    }

    // Retry wrapper for API calls
    async withRetry(fn, context) {
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                logger.warn(`${context} attempt ${attempt} failed:`, error.message);
                if (attempt < this.retryAttempts) {
                    await new Promise(r => setTimeout(r, this.retryDelay * attempt));
                }
            }
        }
        throw lastError;
    }

    async searchArticles(query, maxResults = 50) {
        return this.withRetry(async () => {
            await this.rateLimit();
            
            const params = new URLSearchParams({
                db: 'pubmed',
                term: query,
                retmax: maxResults,
                retmode: 'json',
                sort: 'relevance',
                tool: this.toolName,
                email: this.email
            });
            
            if (this.apiKey && this.apiKey !== 'your_ncbi_api_key_here') {
                params.append('api_key', this.apiKey);
            }
            
            const response = await axios.get(`${this.baseURL}/esearch.fcgi?${params}`, {
                timeout: 30000
            });
            
            return response.data.esearchresult.idlist || [];
        }, 'PubMed search');
    }

    async fetchArticleDetails(articleIds) {
        if (!articleIds || articleIds.length === 0) return [];
        
        return this.withRetry(async () => {
            await this.rateLimit();
            
            const params = new URLSearchParams({
                db: 'pubmed',
                id: articleIds.join(','),
                retmode: 'xml',
                tool: this.toolName,
                email: this.email
            });
            
            if (this.apiKey && this.apiKey !== 'your_ncbi_api_key_here') {
                params.append('api_key', this.apiKey);
            }
            
            const response = await axios.get(`${this.baseURL}/efetch.fcgi?${params}`, {
                timeout: 60000
            });
            
            const parsed = await parseXMLAsync(response.data);
            const articles = parsed.PubmedArticleSet.PubmedArticle || [];
            
            return articles
                .map(a => this.formatArticleData(a))
                .filter(a => a !== null);
        }, 'PubMed fetch');
    }

    async getPublications(query, maxResults = 50) {
        try {
            const articleIds = await this.searchArticles(query, maxResults);
            
            if (articleIds.length === 0) {
                logger.info('No PubMed articles found');
                return [];
            }
            
            const articles = await this.fetchArticleDetails(articleIds);
            logger.info(`Retrieved ${articles.length} PubMed publications`);
            return articles;
        } catch (error) {
            logger.error('PubMed getPublications error:', error.message);
            return [];
        }
    }
}

module.exports = new PubMedService();
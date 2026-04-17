// server/src/services/retrieval/openAlexService.js
// OpenAlex API integration for research publications - FULLY FIXED

const axios = require('axios');
const logger = require('../../config/logger');

class OpenAlexService {
    constructor() {
        this.baseURL = 'https://api.openalex.org/works';
        this.email = process.env.ADMIN_EMAIL || 'admin@curalink.com';
        
        // Rate limiting
        this.requestsPerSecond = 10;
        this.lastRequestTime = 0;
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

    // Search works in OpenAlex
    async searchWorks(query, options = {}) {
        try {
            await this.rateLimit();
            
            const params = {
                search: query,
                'per-page': options.perPage || 100,
                page: options.page || 1,
                sort: options.sort || 'relevance_score:desc',
                mailto: this.email
            };
            
            // Add date filter if provided
            if (options.fromDate || options.toDate) {
                const fromDate = options.fromDate || '2020-01-01';
                const toDate = options.toDate || new Date().toISOString().split('T')[0];
                params.filter = `from_publication_date:${fromDate},to_publication_date:${toDate}`;
            }
            
            const response = await axios.get(this.baseURL, {
                params,
                timeout: 30000,
                headers: {
                    'User-Agent': `Curalink-Medical-Assistant/1.0 (${this.email})`
                }
            });
            
            const results = response.data.results || [];
            const meta = response.data.meta || {};
            
            logger.info(`OpenAlex search returned ${results.length} results (total: ${meta.count})`);
            
            return {
                results: results.map(work => this.formatWorkData(work)).filter(w => w !== null),
                meta: {
                    total: meta.count,
                    page: meta.page,
                    perPage: meta.per_page,
                    hasMore: meta.page * meta.per_page < meta.count
                }
            };
        } catch (error) {
            logger.error('OpenAlex search error:', error.message);
            return { results: [], meta: { total: 0, page: 1, perPage: 100, hasMore: false } };
        }
    }

    // Format OpenAlex work data to standardized structure - FULLY FIXED
    formatWorkData(work) {
        try {
            // Extract authors - FIXED
            const authors = [];
            if (work.authorships && Array.isArray(work.authorships)) {
                work.authorships.forEach(authorship => {
                    if (authorship.author && authorship.author.display_name) {
                        authors.push(authorship.author.display_name);
                    } else if (authorship.raw_author_name) {
                        authors.push(authorship.raw_author_name);
                    }
                });
            }
            
            // If no authors found, use default
            if (authors.length === 0) {
                authors.push('Unknown Authors');
            }
            
            // Extract abstract - FIXED
            let abstract = '';
            if (work.abstract_inverted_index) {
                abstract = this.reconstructAbstract(work.abstract_inverted_index);
            } else if (work.abstract) {
                abstract = work.abstract;
            } else {
                abstract = 'No abstract available';
            }
            
            // Extract publication year
            const year = work.publication_year || null;
            
            // Extract journal/source name - FIXED
            let journal = 'Unknown Journal';
            if (work.primary_location && work.primary_location.source && work.primary_location.source.display_name) {
                journal = work.primary_location.source.display_name;
            } else if (work.host_venue && work.host_venue.display_name) {
                journal = work.host_venue.display_name;
            } else if (work.locations && work.locations.length > 0 && work.locations[0].source) {
                journal = work.locations[0].source.display_name || 'Unknown Journal';
            }
            
            // Extract DOI
            const doi = work.doi ? work.doi.replace('https://doi.org/', '') : '';
            
            // Get title - FIXED
            const title = work.title || work.display_name || 'No title available';
            
            return {
                id: work.id || `openalex_${Date.now()}`,
                title: title,
                authors: authors,
                abstract: abstract,
                journal: journal,
                year: year,
                doi: doi,
                url: work.doi || work.id || '#',
                source: 'openalex',
                openAccess: work.open_access?.is_oa || false,
                citedByCount: work.cited_by_count || 0,
                type: work.type || 'unknown'
            };
        } catch (error) {
            logger.error('Error formatting OpenAlex work:', error);
            return null;
        }
    }

    // Reconstruct abstract from inverted index format - FIXED
    reconstructAbstract(invertedIndex) {
        if (!invertedIndex || typeof invertedIndex !== 'object') {
            return 'No abstract available';
        }
        
        try {
            const wordPositions = [];
            
            for (const [word, positions] of Object.entries(invertedIndex)) {
                if (Array.isArray(positions)) {
                    positions.forEach(pos => {
                        wordPositions.push({ word, position: pos });
                    });
                }
            }
            
            if (wordPositions.length === 0) {
                return 'No abstract available';
            }
            
            wordPositions.sort((a, b) => a.position - b.position);
            
            return wordPositions.map(item => item.word).join(' ');
        } catch (error) {
            logger.error('Error reconstructing abstract:', error);
            return 'Abstract reconstruction failed';
        }
    }

    // Get publications with filtering and pagination
    async getPublications(query, maxResults = 50) {
        try {
            const allPublications = [];
            let page = 1;
            const perPage = Math.min(maxResults, 100);
            
            while (allPublications.length < maxResults) {
                const result = await this.searchWorks(query, {
                    perPage: perPage,
                    page: page,
                    sort: 'relevance_score:desc'
                });
                
                const validResults = result.results.filter(r => r !== null);
                allPublications.push(...validResults);
                
                if (!result.meta.hasMore || allPublications.length >= maxResults) {
                    break;
                }
                
                page++;
                
                // Safety limit
                if (page > 5) break;
            }
            
            // Limit to requested amount
            const limitedResults = allPublications.slice(0, maxResults);
            
            logger.info(`Retrieved ${limitedResults.length} OpenAlex publications`);
            
            return limitedResults;
        } catch (error) {
            logger.error('OpenAlex getPublications error:', error);
            return [];
        }
    }

    // Get works by author
    async getWorksByAuthor(authorName, maxResults = 20) {
        try {
            const query = `author.display_name:"${authorName}"`;
            return await this.getPublications(query, maxResults);
        } catch (error) {
            logger.error('OpenAlex getWorksByAuthor error:', error);
            return [];
        }
    }

    // Get recent works on a topic
    async getRecentWorks(query, yearsBack = 2, maxResults = 50) {
        try {
            const currentYear = new Date().getFullYear();
            const fromDate = `${currentYear - yearsBack}-01-01`;
            
            const result = await this.searchWorks(query, {
                perPage: maxResults,
                fromDate: fromDate,
                sort: 'publication_date:desc'
            });
            
            return result.results.filter(r => r !== null);
        } catch (error) {
            logger.error('OpenAlex getRecentWorks error:', error);
            return [];
        }
    }
}

module.exports = new OpenAlexService();
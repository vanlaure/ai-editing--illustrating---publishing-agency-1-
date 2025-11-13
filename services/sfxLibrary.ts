/**
 * SFX Library Service
 * Manages sound effects from free libraries with search, categorization, and preview
 */

export interface SoundEffect {
  id: string;
  name: string;
  category: string;
  tags: string[];
  duration: number; // in seconds
  fileSize: number; // in bytes
  format: 'mp3' | 'wav' | 'ogg';
  url: string;
  previewUrl?: string;
  license: string;
  attribution?: string;
  source: 'freesound' | 'zapsplat' | 'soundbible' | 'local';
  waveformUrl?: string;
}

export interface SFXCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  subcategories?: string[];
}

export interface SFXSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
  format?: string[];
  source?: string[];
  limit?: number;
}

export interface SFXLibrarySource {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
  requiresAttribution: boolean;
}

export class SFXLibraryService {
  private sources: SFXLibrarySource[] = [
    {
      id: 'freesound',
      name: 'Freesound.org',
      enabled: true,
      baseUrl: 'https://freesound.org/apiv2',
      requiresAttribution: true
    },
    {
      id: 'zapsplat',
      name: 'Zapsplat',
      enabled: true,
      baseUrl: 'https://www.zapsplat.com',
      requiresAttribution: true
    },
    {
      id: 'soundbible',
      name: 'SoundBible',
      enabled: true,
      baseUrl: 'https://soundbible.com',
      requiresAttribution: true
    },
    {
      id: 'local',
      name: 'Local Files',
      enabled: true,
      baseUrl: 'file://',
      requiresAttribution: false
    }
  ];

  private categories: SFXCategory[] = [
    { id: 'ambience', name: 'Ambience', icon: '🌅', count: 0, subcategories: ['nature', 'urban', 'indoor', 'weather'] },
    { id: 'foley', name: 'Foley', icon: '👣', count: 0, subcategories: ['footsteps', 'movement', 'cloth', 'impacts'] },
    { id: 'ui', name: 'UI Sounds', icon: '🔘', count: 0, subcategories: ['clicks', 'beeps', 'alerts', 'transitions'] },
    { id: 'creatures', name: 'Creatures', icon: '🐾', count: 0, subcategories: ['animals', 'monsters', 'insects', 'birds'] },
    { id: 'vehicles', name: 'Vehicles', icon: '🚗', count: 0, subcategories: ['cars', 'aircraft', 'boats', 'trains'] },
    { id: 'weapons', name: 'Weapons', icon: '⚔️', count: 0, subcategories: ['guns', 'swords', 'explosions', 'impacts'] },
    { id: 'magic', name: 'Magic & Sci-Fi', icon: '✨', count: 0, subcategories: ['spells', 'lasers', 'portals', 'energy'] },
    { id: 'household', name: 'Household', icon: '🏠', count: 0, subcategories: ['doors', 'appliances', 'objects', 'tools'] },
    { id: 'nature', name: 'Nature', icon: '🌳', count: 0, subcategories: ['water', 'fire', 'wind', 'earth'] },
    { id: 'human', name: 'Human', icon: '👤', count: 0, subcategories: ['voices', 'breathing', 'actions', 'crowds'] }
  ];

  private localLibrary: SoundEffect[] = [];
  private cache: Map<string, SoundEffect[]> = new Map();

  constructor() {
    this.initializeLocalLibrary();
  }

  /**
   * Initialize local SFX library from filesystem
   */
  private async initializeLocalLibrary(): Promise<void> {
    // TODO: Scan local directories for audio files
    // For now, use placeholder data
    this.localLibrary = [];
  }

  /**
   * Search for sound effects across enabled sources
   */
  async search(options: SFXSearchOptions): Promise<SoundEffect[]> {
    const cacheKey = JSON.stringify(options);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const results: SoundEffect[] = [];

    // Search local library
    if (!options.source || options.source.includes('local')) {
      const localResults = this.searchLocal(options);
      results.push(...localResults);
    }

    // Search online sources
    const enabledSources = this.sources.filter(s => 
      s.enabled && 
      s.id !== 'local' && 
      (!options.source || options.source.includes(s.id))
    );

    for (const source of enabledSources) {
      try {
        const sourceResults = await this.searchSource(source, options);
        results.push(...sourceResults);
      } catch (error) {
        console.error(`Error searching ${source.name}:`, error);
      }
    }

    // Apply limit
    const limited = results.slice(0, options.limit || 50);
    this.cache.set(cacheKey, limited);

    return limited;
  }

  /**
   * Search local library
   */
  private searchLocal(options: SFXSearchOptions): SoundEffect[] {
    let results = [...this.localLibrary];

    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(sfx => 
        sfx.name.toLowerCase().includes(query) ||
        sfx.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      results = results.filter(sfx => sfx.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(sfx => 
        options.tags!.some(tag => sfx.tags.includes(tag))
      );
    }

    if (options.minDuration !== undefined) {
      results = results.filter(sfx => sfx.duration >= options.minDuration!);
    }

    if (options.maxDuration !== undefined) {
      results = results.filter(sfx => sfx.duration <= options.maxDuration!);
    }

    if (options.format && options.format.length > 0) {
      results = results.filter(sfx => options.format!.includes(sfx.format));
    }

    return results;
  }

  /**
   * Search a specific online source
   */
  private async searchSource(source: SFXLibrarySource, options: SFXSearchOptions): Promise<SoundEffect[]> {
    // TODO: Implement actual API calls to various sources
    // For now, return mock data
    return this.generateMockResults(source.id, options.query || '', 10);
  }

  /**
   * Generate mock search results for development
   */
  private generateMockResults(source: string, query: string, count: number): SoundEffect[] {
    const mockSfx: SoundEffect[] = [];
    const categories = ['ambience', 'foley', 'creatures', 'weapons', 'magic', 'nature'];
    const formats: ('mp3' | 'wav' | 'ogg')[] = ['mp3', 'wav', 'ogg'];

    for (let i = 0; i < count; i++) {
      mockSfx.push({
        id: `${source}_${query}_${i}`,
        name: `${query} Sound ${i + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        tags: [query, 'sound', 'effect'],
        duration: Math.random() * 10 + 1,
        fileSize: Math.floor(Math.random() * 1000000) + 100000,
        format: formats[Math.floor(Math.random() * formats.length)],
        url: `https://example.com/sfx/${source}/${i}.mp3`,
        previewUrl: `https://example.com/sfx/${source}/${i}_preview.mp3`,
        license: 'CC BY 3.0',
        attribution: `${source} contributor`,
        source: source as any,
        waveformUrl: `https://example.com/sfx/${source}/${i}_waveform.png`
      });
    }

    return mockSfx;
  }

  /**
   * Get all available categories
   */
  getCategories(): SFXCategory[] {
    return this.categories;
  }

  /**
   * Get enabled sources
   */
  getSources(): SFXLibrarySource[] {
    return this.sources.filter(s => s.enabled);
  }

  /**
   * Enable/disable a source
   */
  toggleSource(sourceId: string, enabled: boolean): void {
    const source = this.sources.find(s => s.id === sourceId);
    if (source) {
      source.enabled = enabled;
      this.cache.clear(); // Clear cache when sources change
    }
  }

  /**
   * Set API key for a source
   */
  setSourceApiKey(sourceId: string, apiKey: string): void {
    const source = this.sources.find(s => s.id === sourceId);
    if (source) {
      source.apiKey = apiKey;
    }
  }

  /**
   * Download SFX to local library
   */
  async downloadSfx(sfx: SoundEffect, destinationPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement actual download logic
      console.log(`Downloading ${sfx.name} to ${destinationPath}`);
      
      // Add to local library
      this.localLibrary.push({
        ...sfx,
        url: destinationPath,
        source: 'local'
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Import local audio file as SFX
   */
  async importLocalSfx(filePath: string, metadata: {
    name: string;
    category: string;
    tags: string[];
  }): Promise<{ success: boolean; sfx?: SoundEffect; error?: string }> {
    try {
      // TODO: Extract audio metadata (duration, format, etc.)
      const sfx: SoundEffect = {
        id: `local_${Date.now()}`,
        name: metadata.name,
        category: metadata.category,
        tags: metadata.tags,
        duration: 0, // TODO: Extract from file
        fileSize: 0, // TODO: Get file size
        format: 'mp3', // TODO: Detect format
        url: filePath,
        license: 'Personal Use',
        source: 'local'
      };

      this.localLibrary.push(sfx);

      return { success: true, sfx };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }

  /**
   * Get popular/trending SFX
   */
  async getTrending(category?: string, limit: number = 20): Promise<SoundEffect[]> {
    // TODO: Implement actual trending logic
    return this.generateMockResults('trending', category || 'popular', limit);
  }

  /**
   * Get recommended SFX based on project context
   */
  async getRecommendations(context: {
    genre?: string;
    mood?: string;
    setting?: string;
  }, limit: number = 10): Promise<SoundEffect[]> {
    // TODO: Implement AI-powered recommendations
    const query = [context.genre, context.mood, context.setting].filter(Boolean).join(' ');
    return this.generateMockResults('recommendations', query, limit);
  }

  /**
   * Preview SFX (load audio for playback)
   */
  async previewSfx(sfx: SoundEffect): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    try {
      const url = sfx.previewUrl || sfx.url;
      return { success: true, audioUrl: url };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Preview failed'
      };
    }
  }

  /**
   * Generate waveform visualization for SFX
   */
  async generateWaveform(sfx: SoundEffect): Promise<{ success: boolean; waveformUrl?: string; error?: string }> {
    try {
      // TODO: Implement waveform generation using Web Audio API
      return { 
        success: true, 
        waveformUrl: sfx.waveformUrl || 'https://via.placeholder.com/400x80/1e293b/64748b?text=Waveform' 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Waveform generation failed'
      };
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const sfxLibraryService = new SFXLibraryService();
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage to return API key
vi.mock('./storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue({ openRouterApiKey: process.env.OPENROUTER_API_KEY || 'test-key' }),
  },
}));

// Import after mocking
import { generateImage, editImage, generateText } from './api';

describe('API Functions', () => {
  describe('Unit Tests (mocked)', () => {
    it('should throw error if API key is missing', async () => {
      // Override mock to return no API key
      const { storage } = await import('./storage');
      vi.mocked(storage.get).mockResolvedValueOnce(null);

      await expect(generateText([{ role: 'user', content: 'test' }], 'test-model'))
        .rejects.toThrow('API Key missing');
    });
  });

  // Integration tests - only run if API key is provided
  describe.skipIf(!process.env.OPENROUTER_API_KEY)('Integration Tests (requires API key)', () => {

    it('should generate an image with Gemini', async () => {
      const result = await generateImage(
        'A simple red circle on white background',
        'google/gemini-2.5-flash-image',
        '1:1'
      );

      // Should return a data URL or http URL
      expect(result).toBeTruthy();
      expect(result.startsWith('data:image') || result.startsWith('http')).toBe(true);
    }, 60000); // 60 second timeout for API call

    it('should generate text with a chat model', async () => {
      const result = await generateText(
        [{ role: 'user', content: 'Say hello in exactly 3 words' }],
        'deepseek/deepseek-v3.2',
        0.5,
        50
      );

      expect(result.content).toBeTruthy();
      expect(typeof result.content).toBe('string');
    }, 30000);

    it('should edit an image with Gemini', async () => {
      // First generate a test image
      const originalImage = await generateImage(
        'A simple blue square on white background',
        'google/gemini-2.5-flash-image',
        '1:1'
      );

      expect(originalImage).toBeTruthy();

      // Now try to edit it
      const editedImage = await editImage(
        originalImage,
        null, // no mask
        'Change the blue to red',
        'google/gemini-2.5-flash-image'
      );

      // Should return a data URL or http URL
      expect(editedImage).toBeTruthy();
      expect(editedImage.startsWith('data:image') || editedImage.startsWith('http')).toBe(true);
    }, 120000); // 2 minute timeout for two API calls
  });
});

describe('Model Configuration', () => {
  it('should have edit-capable models defined', async () => {
    const { EDIT_CAPABLE_MODELS } = await import('./models');

    expect(EDIT_CAPABLE_MODELS.length).toBeGreaterThan(0);

    // All edit-capable models should have supportsEditing: true
    for (const model of EDIT_CAPABLE_MODELS) {
      expect(model.supportsEditing).toBe(true);
    }
  });

  it('should include Gemini models in edit-capable list', async () => {
    const { EDIT_CAPABLE_MODELS } = await import('./models');

    const geminiModels = EDIT_CAPABLE_MODELS.filter(m => m.id.includes('gemini'));
    expect(geminiModels.length).toBeGreaterThan(0);
  });

  it('should NOT include FLUX models in edit-capable list', async () => {
    const { EDIT_CAPABLE_MODELS } = await import('./models');

    const fluxModels = EDIT_CAPABLE_MODELS.filter(m => m.id.includes('flux'));
    expect(fluxModels.length).toBe(0);
  });
});

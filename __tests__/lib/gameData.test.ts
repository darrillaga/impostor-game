import {
  categories,
  getRandomCategory,
  getRandomWord,
  Category,
} from '@/lib/gameData';

describe('Game Data', () => {
  describe('categories', () => {
    it('should have at least 10 categories', () => {
      expect(categories.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid category structure', () => {
      categories.forEach((category) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('words');
        expect(typeof category.name).toBe('string');
        expect(Array.isArray(category.words)).toBe(true);
        expect(category.words.length).toBeGreaterThan(0);
      });
    });

    it('should have valid word structure in all categories', () => {
      categories.forEach((category) => {
        category.words.forEach((word) => {
          expect(word).toHaveProperty('word');
          expect(word).toHaveProperty('wordEs');
          expect(word).toHaveProperty('impostorClue');
          expect(word).toHaveProperty('impostorClueEs');
          expect(typeof word.word).toBe('string');
          expect(typeof word.wordEs).toBe('string');
          expect(typeof word.impostorClue).toBe('string');
          expect(typeof word.impostorClueEs).toBe('string');
          expect(word.word.length).toBeGreaterThan(0);
          expect(word.wordEs.length).toBeGreaterThan(0);
          expect(word.impostorClue.length).toBeGreaterThan(0);
          expect(word.impostorClueEs.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have at least 5 words per category', () => {
      categories.forEach((category) => {
        expect(category.words.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should not have duplicate category names', () => {
      const names = categories.map((c) => c.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should not have duplicate words within a category', () => {
      categories.forEach((category) => {
        const words = category.words.map((w) => w.word);
        const uniqueWords = new Set(words);
        expect(words.length).toBe(uniqueWords.size);
      });
    });
  });

  describe('getRandomCategory', () => {
    it('should return a valid category', () => {
      const category = getRandomCategory();
      expect(categories).toContainEqual(category);
    });

    it('should return a category with name and words', () => {
      const category = getRandomCategory();
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('words');
      expect(Array.isArray(category.words)).toBe(true);
    });

    it('should potentially return different categories on multiple calls', () => {
      const categories = new Set();
      for (let i = 0; i < 20; i++) {
        categories.add(getRandomCategory().name);
      }
      // With 10+ categories, we should get at least 2 different ones in 20 tries
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  describe('getRandomWord', () => {
    let testCategory: Category;

    beforeEach(() => {
      testCategory = categories[0];
    });

    it('should return a word from the given category', () => {
      const word = getRandomWord(testCategory);
      expect(testCategory.words).toContainEqual(word);
    });

    it('should return a word with all required fields', () => {
      const word = getRandomWord(testCategory);
      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('wordEs');
      expect(word).toHaveProperty('impostorClue');
      expect(word).toHaveProperty('impostorClueEs');
    });

    it('should potentially return different words on multiple calls', () => {
      if (testCategory.words.length > 1) {
        const words = new Set();
        for (let i = 0; i < 20; i++) {
          words.add(getRandomWord(testCategory).word);
        }
        expect(words.size).toBeGreaterThan(1);
      }
    });

    it('should work with any category', () => {
      categories.forEach((category) => {
        const word = getRandomWord(category);
        expect(category.words).toContainEqual(word);
      });
    });
  });

  describe('category content validation', () => {
    it('should have Animals category with animal words', () => {
      const animals = categories.find((c) => c.name === 'Animals');
      expect(animals).toBeDefined();
      expect(animals!.words.length).toBeGreaterThan(0);
    });

    it('should have Countries category with country words', () => {
      const countries = categories.find((c) => c.name === 'Countries');
      expect(countries).toBeDefined();
      expect(countries!.words.length).toBeGreaterThan(0);
    });

    it('should have Food category with food words', () => {
      const food = categories.find((c) => c.name === 'Food');
      expect(food).toBeDefined();
      expect(food!.words.length).toBeGreaterThan(0);
    });

    it('should have Sports category with sport words', () => {
      const sports = categories.find((c) => c.name === 'Sports');
      expect(sports).toBeDefined();
      expect(sports!.words.length).toBeGreaterThan(0);
    });

    it('should have Professions category with profession words', () => {
      const professions = categories.find((c) => c.name === 'Professions');
      expect(professions).toBeDefined();
      expect(professions!.words.length).toBeGreaterThan(0);
    });
  });

  describe('bilingual content validation', () => {
    it('should have Spanish translations for all words', () => {
      categories.forEach((category) => {
        category.words.forEach((word) => {
          expect(word.wordEs).toBeTruthy();
          expect(typeof word.wordEs).toBe('string');
          expect(word.wordEs.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have Spanish translations for all impostor clues', () => {
      categories.forEach((category) => {
        category.words.forEach((word) => {
          expect(word.impostorClueEs).toBeTruthy();
        });
      });
    });

    it('should have reasonable length for all words', () => {
      categories.forEach((category) => {
        category.words.forEach((word) => {
          expect(word.word.length).toBeLessThan(50);
          expect(word.wordEs.length).toBeLessThan(50);
        });
      });
    });

    it('should have reasonable length for all clues', () => {
      categories.forEach((category) => {
        category.words.forEach((word) => {
          expect(word.impostorClue.length).toBeLessThan(100);
          expect(word.impostorClueEs.length).toBeLessThan(100);
        });
      });
    });
  });
});

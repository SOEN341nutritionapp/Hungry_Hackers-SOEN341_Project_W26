import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AiSuggestion = {
  id: string;
  title: string;
  reason?: string;
  source?: string;
  url?: string;
};

type AiChatResponse = {
  reply: string;
  suggestions?: AiSuggestion[];
};

type RecipeSummary = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string[];
  ingredients: string[];
};

type FridgeSummary = {
  name: string;
  availableAmount: number;
  unit: string | null;
};

type IngredientLike = {
  name: string;
};

type ReplyRequestDetails = {
  normalizedMessage: string;
  requestedTag: string | null;
  requestedServings: number | null;
  requestedDifficulty: string | null;
  suggestionCount: number;
  hasSuggestions: boolean;
};

type RankedRecipeSuggestion = {
  recipe: RecipeSummary;
  score: number;
  totalMinutes: number;
};

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async chat(userId?: string, message?: string): Promise<AiChatResponse> {
    const safeUserId = typeof userId === 'string' ? userId.trim() : '';
    const safeMessage = typeof message === 'string' ? message.trim() : '';

    if (!safeUserId) {
      return {
        reply:
          'Please sign in again so I can personalize recipe help for your account.',
      };
    }

    if (!safeMessage) {
      return {
        reply: 'Send me a recipe question and I will help you with it.',
      };
    }

    try {
      const [recipes, fridgeItems] = await Promise.all([
        this.getRecipeSummaries(safeUserId),
        this.getFridgeSummaries(safeUserId),
      ]);

      if (this.isUnsupportedRecipeCreationRequest(safeMessage)) {
        const suggestions = this.buildSuggestions(
          'easy quick saved recipes',
          safeUserId,
          recipes,
          fridgeItems,
          true,
        );

        return {
          reply:
            'Adding recipes through the AI chatbot is unavailable right now. Here are some similar recipes from your saved collection instead.',
          ...(suggestions.length ? { suggestions } : {}),
        };
      }

      const suggestions = this.buildSuggestions(
        safeMessage,
        safeUserId,
        recipes,
        fridgeItems,
      );
      const reply = this.buildReply(
        safeMessage,
        recipes,
        fridgeItems,
        suggestions,
      );

      return {
        reply:
          reply.trim() ||
          'I can help with easy recipes, quick recipes, and fridge-based recommendations from your saved collection.',
        ...(suggestions.length ? { suggestions } : {}),
      };
    } catch (error) {
      console.error('AI chat failed:', error);
      return {
        reply:
          'I can still help with recipe ideas. Try asking for an easy recipe, a 10-minute meal, or a meal based on what is in your fridge.',
      };
    }
  }

  private async getRecipeSummaries(userId: string): Promise<RecipeSummary[]> {
    try {
      const recipes = await this.prisma.recipe.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }],
        take: 25,
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          prepTime: true,
          cookTime: true,
          servings: true,
          dietaryTags: true,
          ingredients: true,
        },
      });

      return recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        difficulty: recipe.difficulty,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        dietaryTags: recipe.dietaryTags,
        ingredients: this.extractIngredientNames(recipe.ingredients),
      }));
    } catch (error) {
      console.error('Failed to load recipes for AI chat:', error);
      return [];
    }
  }

  private async getFridgeSummaries(userId: string): Promise<FridgeSummary[]> {
    try {
      const items = await this.prisma.fridgeItem.findMany({
        where: {
          userId,
          availableAmount: {
            gt: 0,
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 20,
        select: {
          name: true,
          availableAmount: true,
          unit: true,
        },
      });

      return items;
    } catch (error) {
      console.error('Failed to load fridge items for AI chat:', error);
      return [];
    }
  }

  private buildReply(
    message: string,
    recipes: RecipeSummary[],
    fridgeItems: FridgeSummary[],
    suggestions: AiSuggestion[],
  ): string {
    const details = this.getReplyRequestDetails(message, recipes, suggestions);
    const matchingReply = this.findMatchingReply(details, fridgeItems);

    return matchingReply ?? this.buildRecipeCountReply(recipes.length);
  }

  private getReplyRequestDetails(
    message: string,
    recipes: RecipeSummary[],
    suggestions: AiSuggestion[],
  ): ReplyRequestDetails {
    const normalizedMessage = message.toLowerCase();
    const suggestionCount = suggestions.length;

    return {
      normalizedMessage,
      requestedTag: this.findRequestedDietaryTag(normalizedMessage, recipes),
      requestedServings: this.extractRequestedServings(normalizedMessage),
      requestedDifficulty: this.findRequestedDifficulty(normalizedMessage),
      suggestionCount,
      hasSuggestions: suggestionCount > 0,
    };
  }

  private findMatchingReply(
    details: ReplyRequestDetails,
    fridgeItems: FridgeSummary[],
  ): string | null {
    const replyOptions = [
      this.buildTenMinuteReply(details),
      this.buildEasyRecipeReply(details),
      this.buildFridgeReply(details, fridgeItems),
      this.buildDifficultyReply(details),
      this.buildServingsReply(details),
      this.buildDietaryTagReply(details),
      this.buildGeneralSuggestionReply(details),
    ];

    return replyOptions.find((reply): reply is string => reply !== null) ?? null;
  }

  private buildTenMinuteReply(details: ReplyRequestDetails): string | null {
    if (!this.isTenMinuteRequest(details.normalizedMessage)) {
      return null;
    }

    if (!details.hasSuggestions) {
      return 'I could not find a strong 10-minute match in your saved recipes yet. Try asking for another quick recipe and I will keep looking through your saved collection.';
    }

    return this.pickReplyBySuggestionCount(
      details.suggestionCount,
      'Here is a quick option that should fit a 10-minute style meal or get you close with minimal prep.',
      'Here are a couple of quick options that should fit a 10-minute style meal or get you close with minimal prep.',
    );
  }

  private buildEasyRecipeReply(details: ReplyRequestDetails): string | null {
    if (!this.isEasyRecipeRequest(details.normalizedMessage)) {
      return null;
    }

    if (!details.hasSuggestions) {
      return 'I do not see any easy matches yet. Ask for a quick recipe or a recipe based on your fridge ingredients and I will use your saved collection.';
    }

    return this.pickReplyBySuggestionCount(
      details.suggestionCount,
      'Here is an easy recipe idea based on your saved recipes.',
      'Here are a couple of easy recipe ideas based on your saved recipes.',
    );
  }

  private buildFridgeReply(
    details: ReplyRequestDetails,
    fridgeItems: FridgeSummary[],
  ): string | null {
    if (!this.isFridgeRequest(details.normalizedMessage)) {
      return null;
    }

    const fridgePreview = this.buildFridgePreview(fridgeItems);

    if (details.hasSuggestions) {
      return fridgePreview
        ? `I checked your fridge items like ${fridgePreview} and matched them to your saved recipes.`
        : 'I looked for recipes that can work with your available ingredients.';
    }

    if (fridgePreview) {
      return `I found these fridge items: ${fridgePreview}. I do not have a close saved-recipe match yet, but I can still recommend an easy or quick recipe from your saved collection.`;
    }

    return 'Your fridge list looks empty right now, so I could not match ingredients yet. Ask for an easy recipe or a quick recipe from your saved collection.';
  }

  private buildDifficultyReply(details: ReplyRequestDetails): string | null {
    if (!details.requestedDifficulty || !details.hasSuggestions) {
      return null;
    }

    const difficulty = details.requestedDifficulty.toLowerCase();

    return this.pickReplyBySuggestionCount(
      details.suggestionCount,
      `Here is a ${difficulty} recipe from your saved collection.`,
      `Here are ${difficulty} recipe suggestions from your saved collection.`,
    );
  }

  private buildServingsReply(details: ReplyRequestDetails): string | null {
    if (details.requestedServings === null || !details.hasSuggestions) {
      return null;
    }

    return this.pickReplyBySuggestionCount(
      details.suggestionCount,
      `Here is a saved recipe that matches ${details.requestedServings} servings.`,
      `Here are saved recipes that match ${details.requestedServings} servings.`,
    );
  }

  private buildDietaryTagReply(details: ReplyRequestDetails): string | null {
    if (!details.requestedTag || !details.hasSuggestions) {
      return null;
    }

    const dietaryTag = details.requestedTag.toLowerCase();

    return this.pickReplyBySuggestionCount(
      details.suggestionCount,
      `Here is a ${dietaryTag} recipe from your saved collection.`,
      `Here are ${dietaryTag} recipe suggestions from your saved collection.`,
    );
  }

  private buildGeneralSuggestionReply(
    details: ReplyRequestDetails,
  ): string | null {
    if (!details.hasSuggestions) {
      return null;
    }

    return this.pickReplyBySuggestionCount(
      details.suggestionCount,
      'Here is a recipe idea from your saved collection that fits your message.',
      'Here are a couple of recipe ideas from your saved collection that fit your message.',
    );
  }

  private buildRecipeCountReply(recipeCount: number): string {
    if (recipeCount) {
      return `I found ${recipeCount} saved recipes in your account. Ask for an easy, hard, vegetarian, servings-based, quick, or fridge-based recipe and I can narrow them down.`;
    }

    return 'I am ready to help with recipe ideas. Ask for an easy, hard, vegetarian, servings-based, quick, or fridge-based recipe.';
  }

  private buildFridgePreview(fridgeItems: FridgeSummary[]): string {
    return fridgeItems
      .slice(0, 6)
      .map((item) => item.name)
      .join(', ');
  }

  private pickReplyBySuggestionCount(
    suggestionCount: number,
    singleSuggestionReply: string,
    multipleSuggestionsReply: string,
  ): string {
    return suggestionCount === 1
      ? singleSuggestionReply
      : multipleSuggestionsReply;
  }

  private buildSuggestions(
    message: string,
    userId: string,
    recipes: RecipeSummary[],
    fridgeItems: FridgeSummary[],
    allowFallbackRecommendations = false,
  ): AiSuggestion[] {
    const normalizedMessage = message.toLowerCase();
    const fridgeTokens = fridgeItems.flatMap((item) =>
      this.tokenize(item.name),
    );
    const requestedServings = this.extractRequestedServings(normalizedMessage);
    const requestedDifficulty = this.findRequestedDifficulty(normalizedMessage);
    const requestedTag = this.findRequestedDietaryTag(normalizedMessage, recipes);

    const ranked = recipes.map((recipe) => {
      const titleText = recipe.title.toLowerCase();
      const descriptionText = recipe.description?.toLowerCase() ?? '';
      const ingredientText = recipe.ingredients.join(' ').toLowerCase();
      const totalMinutes = Math.round(recipe.prepTime + recipe.cookTime);

      let score = 0;

      for (const token of this.tokenize(normalizedMessage)) {
        if (titleText.includes(token)) {
          score += 4;
        }
        if (descriptionText.includes(token)) {
          score += 2;
        }
        if (ingredientText.includes(token)) {
          score += 3;
        }
      }

      for (const token of fridgeTokens) {
        if (ingredientText.includes(token)) {
          score += 2;
        }
      }

      if (
        this.isEasyRecipeRequest(normalizedMessage) &&
        recipe.difficulty.toLowerCase().includes('easy')
      ) {
        score += 5;
      }

      if (
        requestedDifficulty &&
        recipe.difficulty.toLowerCase().includes(requestedDifficulty.toLowerCase())
      ) {
        score += 8;
      }

      if (requestedTag) {
        const normalizedTags = recipe.dietaryTags.map((tag) => tag.toLowerCase());
        if (
          normalizedTags.some(
            (tag) =>
              tag === requestedTag.toLowerCase() ||
              tag.includes(requestedTag.toLowerCase()) ||
              requestedTag.toLowerCase().includes(tag),
          )
        ) {
          score += 10;
        }
      }

      if (requestedServings !== null) {
        const servingDifference = Math.abs(recipe.servings - requestedServings);
        if (servingDifference === 0) {
          score += 10;
        } else if (servingDifference === 1) {
          score += 5;
        } else if (recipe.servings >= requestedServings) {
          score += 3;
        }
      }

      if (this.isTenMinuteRequest(normalizedMessage)) {
        if (totalMinutes <= 10) {
          score += 8;
        } else if (totalMinutes <= 20) {
          score += 4;
        }
      }

      if (this.isFridgeRequest(normalizedMessage) && fridgeTokens.length > 0) {
        score +=
          this.countIngredientMatches(recipe.ingredients, fridgeTokens) * 2;
      }

      if (
        score === 0 &&
        this.shouldUseFallbackScore(
          normalizedMessage,
          recipe,
          totalMinutes,
          requestedDifficulty,
          requestedTag,
        )
      ) {
        score = 2;
      }

      return {
        recipe,
        score,
        totalMinutes,
      };
    });

    const positiveRanked = ranked.filter((entry) => entry.score > 0);
    positiveRanked.sort((a, b) => this.comparePositiveRankedEntries(a, b));

    const fallbackRanked = allowFallbackRecommendations
      ? this.buildFallbackRankedEntries(ranked)
      : [];

    const selectedRanked = (
      positiveRanked.length ? positiveRanked : fallbackRanked
    ).slice(0, 2);

    return selectedRanked.map(({ recipe, totalMinutes }) => ({
      id: recipe.id,
      title: recipe.title,
      reason: this.buildSuggestionReason(
        message,
        recipe,
        fridgeItems,
        totalMinutes,
      ),
      source: 'Saved recipe',
      url: `/recipes/${userId}/${recipe.id}`,
    }));
  }

  private shouldUseFallbackScore(
    normalizedMessage: string,
    recipe: RecipeSummary,
    totalMinutes: number,
    requestedDifficulty: string | null,
    requestedTag: string | null,
  ): boolean {
    if (this.isEasyFallbackMatch(normalizedMessage, totalMinutes)) {
      return true;
    }

    if (this.isTenMinuteFallbackMatch(normalizedMessage, totalMinutes)) {
      return true;
    }

    if (this.matchesRequestedDifficulty(recipe, requestedDifficulty)) {
      return true;
    }

    return this.matchesRequestedTag(recipe, requestedTag);
  }

  private isEasyFallbackMatch(
    normalizedMessage: string,
    totalMinutes: number,
  ): boolean {
    return this.isEasyRecipeRequest(normalizedMessage) && totalMinutes <= 25;
  }

  private isTenMinuteFallbackMatch(
    normalizedMessage: string,
    totalMinutes: number,
  ): boolean {
    return this.isTenMinuteRequest(normalizedMessage) && totalMinutes <= 20;
  }

  private matchesRequestedDifficulty(
    recipe: RecipeSummary,
    requestedDifficulty: string | null,
  ): boolean {
    if (!requestedDifficulty) {
      return false;
    }

    return recipe.difficulty
      .toLowerCase()
      .includes(requestedDifficulty.toLowerCase());
  }

  private matchesRequestedTag(
    recipe: RecipeSummary,
    requestedTag: string | null,
  ): boolean {
    if (!requestedTag) {
      return false;
    }

    const normalizedTag = requestedTag.toLowerCase();

    return recipe.dietaryTags.some((tag) =>
      tag.toLowerCase().includes(normalizedTag),
    );
  }

  private comparePositiveRankedEntries(
    a: RankedRecipeSuggestion,
    b: RankedRecipeSuggestion,
  ): number {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.totalMinutes - b.totalMinutes;
  }

  private buildFallbackRankedEntries(
    ranked: RankedRecipeSuggestion[],
  ): RankedRecipeSuggestion[] {
    const fallbackRanked = [...ranked];
    fallbackRanked.sort((a, b) => this.compareFallbackRankedEntries(a, b));

    return fallbackRanked.filter(
      (entry, index, array) =>
        array.findIndex((item) => item.recipe.id === entry.recipe.id) === index,
    );
  }

  private compareFallbackRankedEntries(
    a: RankedRecipeSuggestion,
    b: RankedRecipeSuggestion,
  ): number {
    const difficultyComparison =
      Number(a.recipe.difficulty.toLowerCase().includes('easy')) -
      Number(b.recipe.difficulty.toLowerCase().includes('easy'));

    if (difficultyComparison !== 0) {
      return difficultyComparison * -1;
    }

    return a.totalMinutes - b.totalMinutes;
  }

  private buildSuggestionReason(
    message: string,
    recipe: RecipeSummary,
    fridgeItems: FridgeSummary[],
    totalMinutes: number,
  ): string {
    const normalizedMessage = message.toLowerCase();

    if (this.isFridgeRequest(normalizedMessage)) {
      const matches = fridgeItems
        .map((item) => item.name)
        .filter((name) =>
          recipe.ingredients.some(
            (ingredient) =>
              ingredient.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(ingredient.toLowerCase()),
          ),
        )
        .slice(0, 3);

      if (matches.length) {
        return `Uses ingredients that overlap with your fridge: ${matches.join(', ')}`;
      }
    }

    if (this.isTenMinuteRequest(normalizedMessage)) {
      return `Estimated total time is about ${totalMinutes} minutes`;
    }

    const requestedDifficulty = this.findRequestedDifficulty(normalizedMessage);
    if (
      requestedDifficulty &&
      recipe.difficulty.toLowerCase().includes(requestedDifficulty.toLowerCase())
    ) {
      return `${recipe.difficulty} difficulty and serves ${recipe.servings}`;
    }

    const requestedServings = this.extractRequestedServings(normalizedMessage);
    if (requestedServings !== null) {
      return `Serves ${recipe.servings} and is about ${totalMinutes} minutes total`;
    }

    const requestedTag = this.findRequestedDietaryTag(normalizedMessage, [recipe]);
    if (requestedTag) {
      return `${requestedTag} recipe that serves ${recipe.servings}`;
    }

    if (this.isEasyRecipeRequest(normalizedMessage)) {
      return `${recipe.difficulty} difficulty and about ${totalMinutes} minutes total`;
    }

    return `About ${totalMinutes} minutes total`;
  }

  private extractIngredientNames(ingredients: unknown): string[] {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    return ingredients
      .map((ingredient) => {
        if (typeof ingredient === 'string') {
          return ingredient;
        }

        if (this.isIngredientLike(ingredient)) {
          return ingredient.name;
        }

        return '';
      })
      .filter((value): value is string => Boolean(value.trim()));
  }

  private isIngredientLike(value: unknown): value is IngredientLike {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      typeof value.name === 'string'
    );
  }

  private tokenize(input: string): string[] {
    return input
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3);
  }

  private countIngredientMatches(
    ingredients: string[],
    tokens: string[],
  ): number {
    return ingredients.reduce((count, ingredient) => {
      const lower = ingredient.toLowerCase();
      return count + (tokens.some((token) => lower.includes(token)) ? 1 : 0);
    }, 0);
  }

  private isEasyRecipeRequest(message: string): boolean {
    return message.includes('easy');
  }

  private findRequestedDifficulty(message: string): string | null {
    if (message.includes('hard')) {
      return 'Hard';
    }

    if (message.includes('medium')) {
      return 'Medium';
    }

    if (message.includes('easy')) {
      return 'Easy';
    }

    return null;
  }

  private extractRequestedServings(message: string): number | null {
    const match =
      message.match(/(\d+)\s+servings?\b/i) ??
      message.match(/serves?\s+(\d+)\b/i) ??
      message.match(/for\s+(\d+)\s+(?:people|person)\b/i);

    if (!match) {
      return null;
    }

    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private findRequestedDietaryTag(
    message: string,
    recipes: RecipeSummary[],
  ): string | null {
    const knownTags = new Set(
      recipes.flatMap((recipe) => recipe.dietaryTags.map((tag) => tag.toLowerCase())),
    );
    const commonTags = [
      'vegetarian',
      'vegan',
      'gluten-free',
      'dairy-free',
      'keto',
      'paleo',
      'low-carb',
      'high-protein',
    ];

    for (const tag of [...knownTags, ...commonTags]) {
      if (message.includes(tag)) {
        return tag
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
      }
    }

    return null;
  }

  private isTenMinuteRequest(message: string): boolean {
    return (
      message.includes('10-minute') ||
      message.includes('10 minute') ||
      message.includes('ten minute') ||
      message.includes('quick')
    );
  }

  private isFridgeRequest(message: string): boolean {
    return (
      message.includes('fridge') ||
      message.includes('ingredients i have') ||
      message.includes('ingredients on hand') ||
      message.includes('use my ingredients')
    );
  }

  private isUnsupportedRecipeCreationRequest(message: string): boolean {
    const normalizedMessage = message.toLowerCase();

    return [
      'add recipe',
      'create recipe',
      'import recipe',
      'paste recipe',
      'save this recipe',
      'add this recipe',
      'generate a recipe card',
      'recipe card',
      'import this recipe',
      'save recipe',
      'add a recipe',
      'create a recipe',
    ].some((phrase) => normalizedMessage.includes(phrase));
  }
}

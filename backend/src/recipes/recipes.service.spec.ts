import { Test, TestingModule } from '@nestjs/testing';
import { RecipeService } from './recipes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException,ForbiddenException, BadRequestException, } from '@nestjs/common';

// ============================================================================
// RECIPE SERVICE UNIT TESTS
// ============================================================================
// Tests the RecipeService business logic for Sprint 2 (Recipe CRUD)
// ============================================================================
describe('RecipeService', () => {
  let service: RecipeService;

  // Mocked Prisma - replaces real database with fake functions
  let prisma: {
    recipe: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  // ========================================================================
  // SETUP - Runs before each test
  // ========================================================================
  // Creates a fresh testing environment for every test
  // Ensures tests don't interfere with each other
  // ========================================================================
  beforeEach(async () => {
    // Create fresh mock Prisma with all recipe methods
    prisma = {
      recipe: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        {
          provide: PrismaService,
          useValue: prisma, // Inject our mock instead of real Prisma
        },
      ],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
  });

  // ========================================================================
  // TEST GROUP: CREATE RECIPE
  // ========================================================================
  // Tests the create() method which adds a new recipe to the database
  // ========================================================================
  describe('create', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Create and Return a Recipe
    // ----------------------------------------------------------------------
    // Verifies that recipes are created with all the correct data
    // ----------------------------------------------------------------------
    it('should create and return a recipe', async () => {
      // ARRANGE: Prepare recipe data (what user sends)
      const dto = {
        title: 'Pasta',
        description: 'Creamy pasta',
        imageUrl: 'img.jpg',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        cost: 12,
        dietaryTags: ['vegetarian'],
        ingredients: ['pasta', 'cream'],
        instructions: ['Boil pasta', 'Add sauce'],
      };

      // Mock what database would return after creating recipe
      const createdRecipe = {
        id: 'r1',
        userId: 'u1',
        ...dto,
      };

      prisma.recipe.create.mockResolvedValue(createdRecipe);

      // ACT: Call the service method
      const result = await service.create('u1', dto as any);

      // ASSERT: Verify Prisma was called with correct data
      expect(prisma.recipe.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          ...dto,
          ingredients: dto.ingredients,
        },
      });

      // ASSERT: Verify the result matches what Prisma returned
      expect(result).toEqual(createdRecipe);
    });
  });

  // ========================================================================
  // TEST GROUP: GET ALL RECIPES
  // ========================================================================
  // Tests the findAll() method which retrieves all recipes for a user
  // ========================================================================
  describe('findAll', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Return All User's Recipes (Newest First)
    // ----------------------------------------------------------------------
    // Verifies proper filtering by user and ordering by creation date
    // ----------------------------------------------------------------------
    it('should return all recipes for a user ordered by newest first', async () => {
      // ARRANGE: Mock array of recipes
      const recipes = [{ id: 'r1' }, { id: 'r2' }];
      prisma.recipe.findMany.mockResolvedValue(recipes);

      // ACT: Fetch all recipes for user 'u1'
      const result = await service.findAll('u1');

      // ASSERT: Verify Prisma was called with correct filters
      expect(prisma.recipe.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },        // Only this user's recipes
        orderBy: { createdAt: 'desc' }, // Newest first
      });

      expect(result).toEqual(recipes);
    });
  });

  // ========================================================================
  // TEST GROUP: GET ONE RECIPE
  // ========================================================================
  // Tests the findOne() method which retrieves a single recipe by ID
  // Includes success and multiple error cases
  // ========================================================================
  describe('findOne', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Return Recipe When It Exists and Belongs to User
    // ----------------------------------------------------------------------
    it('should return the recipe when it exists and belongs to the user', async () => {
      // ARRANGE: Mock a recipe that exists
      const recipe = { id: 'r1', userId: 'u1', title: 'Pasta' };
      prisma.recipe.findUnique.mockResolvedValue(recipe);

      // ACT: Fetch the recipe
      const result = await service.findOne('r1', 'u1');

      // ASSERT: Verify correct database query
      expect(prisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });

      expect(result).toEqual(recipe);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Recipe Doesn't Exist
    // ----------------------------------------------------------------------
    // Error handling: What happens when recipe is not found?
    // ----------------------------------------------------------------------
    it('should throw NotFoundException when the recipe does not exist', async () => {
      // ARRANGE: Mock database returning null (not found)
      prisma.recipe.findUnique.mockResolvedValue(null);

      // ACT & ASSERT: Expect specific error type
      await expect(service.findOne('r1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Recipe Belongs to Another User
    // ----------------------------------------------------------------------
    // Security test: Users shouldn't access other users' recipes
    // ----------------------------------------------------------------------
    it('should throw ForbiddenException when the recipe belongs to another user', async () => {
      // ARRANGE: Mock recipe owned by different user
      prisma.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u2', // Different user!
      });

      // ACT & ASSERT: Should deny access
      await expect(service.findOne('r1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ========================================================================
  // TEST GROUP: UPDATE RECIPE
  // ========================================================================
  // Tests the update() method which modifies an existing recipe
  // ========================================================================
  describe('update', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Update Recipe With Valid Data
    // ----------------------------------------------------------------------
    it('should update and return the recipe when valid fields are provided', async () => {
      // ARRANGE: Mock that recipe exists and belongs to user
      // (update() calls findOne() internally first)
      prisma.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
      });

      // Mock the updated recipe
      prisma.recipe.update.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        title: 'Updated Pasta',
      });

      const dto = { title: 'Updated Pasta' };

      // ACT: Update the recipe
      const result = await service.update('r1', 'u1', dto as any);

      // ASSERT: Verify update was called correctly
      expect(prisma.recipe.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { title: 'Updated Pasta' },
      });

      expect(result).toEqual({
        id: 'r1',
        userId: 'u1',
        title: 'Updated Pasta',
      });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error If Recipe Doesn't Exist
    // ----------------------------------------------------------------------
    it('should throw NotFoundException if the recipe does not exist', async () => {
      prisma.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.update('r1', 'u1', { title: 'New Title' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error If Recipe Belongs to Another User
    // ----------------------------------------------------------------------
    // Security test: Can't update someone else's recipe
    // ----------------------------------------------------------------------
    it('should throw ForbiddenException if the recipe belongs to another user', async () => {
      prisma.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u2', // Different user
      });

      await expect(
        service.update('r1', 'u1', { title: 'New Title' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Reject Empty Updates
    // ----------------------------------------------------------------------
    it('should throw BadRequestException when no valid fields are provided', async () => {
      prisma.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
      });

      await expect(service.update('r1', 'u1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ========================================================================
  // TEST GROUP: DELETE RECIPE
  // ========================================================================
  // Tests the remove() method which deletes a recipe from the database
  // ========================================================================
  describe('remove', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Delete Recipe Successfully
    // ----------------------------------------------------------------------
    it('should delete the recipe and return a success message', async () => {
      // ARRANGE: Mock recipe exists and belongs to user
      prisma.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
      });

      prisma.recipe.delete.mockResolvedValue({ id: 'r1' });

      // ACT: Delete the recipe
      const result = await service.remove('r1', 'u1');

      // ASSERT: Verify delete was called
      expect(prisma.recipe.delete).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });

      // ASSERT: Verify success message returned
      expect(result).toEqual({
        message: 'Recipe deleted successfully',
        id: 'r1',
      });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error If Recipe Doesn't Exist
    // ----------------------------------------------------------------------
    it('should throw NotFoundException if the recipe does not exist', async () => {
      prisma.recipe.findUnique.mockResolvedValue(null);

      await expect(service.remove('r1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error If Recipe Belongs to Another User
    // ----------------------------------------------------------------------
    // Security test: Can't delete someone else's recipe
    // ----------------------------------------------------------------------
    it('should throw ForbiddenException if the recipe belongs to another user', async () => {
      prisma.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u2', // Different user
      });

      await expect(service.remove('r1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
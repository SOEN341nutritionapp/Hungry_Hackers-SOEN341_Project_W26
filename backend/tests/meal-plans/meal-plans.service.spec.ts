import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { MealPlansService } from '../../src/meal-plans/meal-plans.service';
import { PrismaService } from '../../src/prisma/prisma.service';

// ============================================================================
// MEAL PLANS SERVICE UNIT TESTS
// ============================================================================
// Tests the MealPlansService business logic for Sprint 3 (Weekly Calendar)
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS - reduce duplicated test setup
// ============================================================================

const createDto = (overrides = {}) => ({
  recipeId: 'r1',
  date: '2026-03-03',
  mealType: 'lunch',
  ...overrides,
});

const createTx = () => ({
  recipe: {
    findUnique: jest.fn(),
  },
  mealPlan: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  fridgeItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  mealPlanConsumption: {
    createMany: jest.fn(),
  },
});

describe('MealPlansService', () => {
  let service: MealPlansService;

  // Mocked Prisma - replaces real database with fake functions
  let prisma: {
    mealPlan: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockTransaction = (tx: any) => {
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
  };

  // ========================================================================
  // SETUP - Runs before each test
  // ========================================================================
  // Creates a fresh testing environment for every test
  // Ensures tests don't interfere with each other
  // ========================================================================
  beforeEach(async () => {
    prisma = {
      mealPlan: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MealPlansService>(MealPlansService);

    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // TEST GROUP: GET MEAL PLANS BY WEEK
  // ========================================================================
  // Tests the findByWeek() method which retrieves all meal plans for a user
  // for a given week
  // ========================================================================
  describe('findByWeek', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Return Meal Plans For the Given Week Ordered By Date
    // ----------------------------------------------------------------------
    it('should return all meal plans for a user and week ordered by date ascending', async () => {
      // ARRANGE: Mock meal plans returned by Prisma
      const mealPlans = [
        {
          id: 'm1',
          userId: 'u1',
          recipeId: 'r1',
          date: new Date('2026-03-03T00:00:00.000Z'),
          mealType: 'breakfast',
          recipe: { id: 'r1', title: 'Oatmeal' },
        },
        {
          id: 'm2',
          userId: 'u1',
          recipeId: 'r2',
          date: new Date('2026-03-05T00:00:00.000Z'),
          mealType: 'dinner',
          recipe: { id: 'r2', title: 'Pasta' },
        },
      ];

      prisma.mealPlan.findMany.mockResolvedValue(mealPlans);

      // ACT
      const result = await service.findByWeek('u1', '2026-03-02');

      // ASSERT
      expect(prisma.mealPlan.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'u1',
          weekStart: new Date(Date.UTC(2026, 2, 2, 0, 0, 0, 0)),
        },
        include: {
          recipe: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      expect(result).toEqual(mealPlans);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Return Empty Array When Prisma Query Fails
    // ----------------------------------------------------------------------
    it('should return an empty array when loading meal plans fails', async () => {
      // ARRANGE
      prisma.mealPlan.findMany.mockRejectedValue(new Error('Database error'));

      // ACT
      const result = await service.findByWeek('u1', '2026-03-02');

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // TEST GROUP: CREATE MEAL PLAN
  // ========================================================================
  // Tests the create() method which adds a recipe to the weekly calendar
  // ========================================================================
  describe('create', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Create and Return a Meal Plan
    // ----------------------------------------------------------------------
    it('should create and return a meal plan when recipe exists and is not already planned for the week', async () => {
      // ARRANGE
      const dto = createDto();

      const recipe = {
        id: 'r1',
        userId: 'u1',
        ingredients: [],
      };

      const createdMealPlan = {
        id: 'm1',
        userId: 'u1',
        recipeId: 'r1',
        date: new Date(Date.UTC(2026, 2, 3, 0, 0, 0, 0)),
        mealType: 'lunch',
        weekStart: new Date(Date.UTC(2026, 2, 2, 0, 0, 0, 0)),
        recipe,
      };

      const tx = createTx();
      tx.recipe.findUnique.mockResolvedValue(recipe);
      tx.mealPlan.findFirst.mockResolvedValue(null);
      tx.mealPlan.create.mockResolvedValue(createdMealPlan);
      tx.fridgeItem.findMany.mockResolvedValue([]);

      mockTransaction(tx);

      // ACT
      const result = await service.create('u1', dto as any);

      // ASSERT
      expect(tx.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });

      expect(tx.mealPlan.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'u1',
          recipeId: 'r1',
          weekStart: new Date(Date.UTC(2026, 2, 2, 0, 0, 0, 0)),
        },
      });

      expect(tx.mealPlan.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          recipeId: 'r1',
          date: new Date(Date.UTC(2026, 2, 3, 0, 0, 0, 0)),
          mealType: 'lunch',
          weekStart: new Date(Date.UTC(2026, 2, 2, 0, 0, 0, 0)),
        },
        include: {
          recipe: true,
        },
      });

      expect(result).toEqual(createdMealPlan);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Recipe Does Not Exist
    // ----------------------------------------------------------------------
    it('should throw NotFoundException when the recipe does not exist', async () => {
      // ARRANGE
      const dto = createDto({ mealType: 'dinner' });

      const tx = createTx();
      tx.recipe.findUnique.mockResolvedValue(null);

      mockTransaction(tx);

      // ACT & ASSERT
      await expect(service.create('u1', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Recipe Belongs To Another User
    // ----------------------------------------------------------------------
    it('should throw NotFoundException when the recipe belongs to another user', async () => {
      // ARRANGE
      const dto = createDto({ mealType: 'breakfast' });

      const tx = createTx();
      tx.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u2', // Different user
        ingredients: [],
      });

      mockTransaction(tx);

      // ACT & ASSERT
      await expect(service.create('u1', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Recipe Is Already Planned For The Week
    // ----------------------------------------------------------------------
    it('should throw ConflictException when the recipe is already planned for the same week', async () => {
      // ARRANGE
      const dto = createDto();

      const tx = createTx();
      tx.recipe.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        ingredients: [],
      });
      tx.mealPlan.findFirst.mockResolvedValue({
        id: 'mExisting',
        userId: 'u1',
        recipeId: 'r1',
      });

      mockTransaction(tx);

      // ACT & ASSERT
      await expect(service.create('u1', dto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    // ----------------------------------------------------------------------
    // TEST: Should Compute Monday As Week Start For A Midweek Date
    // ----------------------------------------------------------------------
    it('should compute the correct week start date when creating a meal plan', async () => {
      // ARRANGE
      const dto = createDto({
        date: '2026-03-05', // Thursday
        mealType: 'dinner',
      });

      const recipe = {
        id: 'r1',
        userId: 'u1',
        ingredients: [],
      };

      const tx = createTx();
      tx.recipe.findUnique.mockResolvedValue(recipe);
      tx.mealPlan.findFirst.mockResolvedValue(null);
      tx.mealPlan.create.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        recipeId: 'r1',
        date: new Date(Date.UTC(2026, 2, 5, 0, 0, 0, 0)),
        mealType: 'dinner',
        weekStart: new Date(Date.UTC(2026, 2, 2, 0, 0, 0, 0)),
        recipe,
      });
      tx.fridgeItem.findMany.mockResolvedValue([]);

      mockTransaction(tx);

      // ACT
      await service.create('u1', dto as any);

      // ASSERT
      expect(tx.mealPlan.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          recipeId: 'r1',
          date: new Date(Date.UTC(2026, 2, 5, 0, 0, 0, 0)),
          mealType: 'dinner',
          weekStart: new Date(Date.UTC(2026, 2, 2, 0, 0, 0, 0)),
        },
        include: {
          recipe: true,
        },
      });
    });
  });

  // ========================================================================
  // TEST GROUP: DELETE MEAL PLAN
  // ========================================================================
  // Tests the remove() method which deletes a meal plan from the weekly
  // calendar
  // ========================================================================
  describe('remove', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Delete Meal Plan Successfully
    // ----------------------------------------------------------------------
    it('should delete the meal plan when it exists and belongs to the user', async () => {
      // ARRANGE
      const mealPlan = {
        id: 'm1',
        userId: 'u1',
        consumptions: [],
      };

      const tx = createTx();
      tx.mealPlan.findUnique.mockResolvedValue(mealPlan);
      tx.mealPlan.delete.mockResolvedValue({ id: 'm1' });

      mockTransaction(tx);

      // ACT
      const result = await service.remove('u1', 'm1');

      // ASSERT
      expect(tx.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
        include: {
          consumptions: true,
        },
      });

      expect(tx.mealPlan.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });

      expect(result).toEqual({ id: 'm1' });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Meal Plan Does Not Exist
    // ----------------------------------------------------------------------
    it('should throw NotFoundException when the meal plan does not exist', async () => {
      // ARRANGE
      const tx = createTx();
      tx.mealPlan.findUnique.mockResolvedValue(null);

      mockTransaction(tx);

      // ACT & ASSERT
      await expect(service.remove('u1', 'm1')).rejects.toThrow(
        NotFoundException,
      );
    });

    // ----------------------------------------------------------------------
    // TEST: Should Throw Error When Meal Plan Belongs To Another User
    // ----------------------------------------------------------------------
    it('should throw NotFoundException when the meal plan belongs to another user', async () => {
      // ARRANGE
      const tx = createTx();
      tx.mealPlan.findUnique.mockResolvedValue({
        id: 'm1',
        userId: 'u2', // Different user
        consumptions: [],
      });

      mockTransaction(tx);

      // ACT & ASSERT
      await expect(service.remove('u1', 'm1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
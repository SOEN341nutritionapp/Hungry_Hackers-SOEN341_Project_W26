# Meal Major — Sprint Meeting Minutes


## Attendees
Dylan, Mouawad, Nigel, Ishika, Taras


# Meeting 1 — Sprint 3 Planning

## Purpose
- Define Sprint 3 scope and feature allocation
- Align on implementation strategy for meal planner system

## Discussion
- Reviewed Sprint 3 backlog (weekly meal planner + additional features)
- Agreed to implement full weekly planner with drag-and-drop interaction
- Discussed integration with existing recipe system
- Assigned roles based on prior sprint experience

## Role Distribution

### Nigel — Dev 1
- Weekly calendar grid (7 days × meal types)
- Week navigation (previous/next)
- Display meals in calendar
- Add/remove meals (UI interactions)
- MealPlan database table (Prisma schema)
- API endpoints: GET, POST, DELETE
- Integration with drag-and-drop

### Dylan — Dev 2
- Recipe sidebar with scrollable cards
- Fetch recipes from Recipe API
- Draggable recipe cards
- Drop handler for calendar slots
- Visual feedback during drag
- Search bar implementation
- Duplicate prevention logic

### Mouawad — Dev 3
- Sprint documentation
- Maintain consistency with previous sprint structure

### Taras — Dev 4
- Continue development of special feature (Metro integration)

### Ishika — Dev 5
- AI dashboard system implementation

## Decisions Made
- Use drag-and-drop as primary interaction for assigning meals
- Prevent duplicate meals within the same week
- Maintain separation between frontend and backend
- Reuse existing APIs for integration

---

# Meeting 2 — Progress Update

## Purpose
- Review progress on tasks
- Identify blockers and integration issues

## Progress Discussed

### Nigel
- Calendar grid implemented
- MealPlan schema completed
- API endpoints (GET, POST, DELETE) implemented

### Dylan
- Sidebar UI implemented
- Drag-and-drop functionality integrated
- Search bar completed
- Duplicate prevention logic added

### Mouawad
- Documentation in progress
- Ensuring consistency across sprint files

### Taras
- Continued work on special feature
- Integration improvements and testing

### Ishika
- AI dashboard system in progress
- Working on backend integration and UI

## Decisions Made
- Proceed with integration between sidebar and calendar
- Finalize UI interactions
- Validate duplicate prevention logic

## Next Steps
- Complete feature integration
- Test all user interactions
- Finalize documentation
- Prepare for submission

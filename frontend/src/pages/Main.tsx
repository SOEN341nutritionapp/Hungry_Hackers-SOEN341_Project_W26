import { useEffect, useState } from 'react'
import { Search, CalendarDays, ChefHat, Sparkles, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

interface Recipe {
  id: string
  title: string
  calories?: number | null
}

interface MealPlan {
  id: string
  date: string
  mealType: string
  recipe?: Recipe | null
}

interface UpcomingMealCard {
  id: string
  day: string
  date: string
  meal: string
  time: string
  calories: number | null
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export default function Main() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mealCount, setMealCount] = useState(0)
  const [recipeCount, setRecipeCount] = useState(0)
  const [plannedMeals, setPlannedMeals] = useState<MealPlan[]>([])
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hi! I'm your AI meal planning assistant. How can I help you today?",
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const API_URL = import.meta.env.VITE_API_URL

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'there'
  const userId = user?.id

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)

    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function formatMealDate(dateString: string) {
    const date = new Date(dateString)

    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    }
  }

  const upcomingMeals: UpcomingMealCard[] = plannedMeals
    .filter((meal) => meal.recipe?.title)
    .sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateCompare !== 0) {
        return dateCompare
      }

      const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack']
      return mealOrder.indexOf(a.mealType) - mealOrder.indexOf(b.mealType)
    })
    .map((meal) => {
      const formattedDate = formatMealDate(meal.date)

      return {
        id: meal.id,
        day: formattedDate.day,
        date: formattedDate.date,
        meal: meal.recipe?.title ?? 'Untitled Recipe',
        time: mealTypeLabels[meal.mealType] ?? meal.mealType,
        calories: typeof meal.recipe?.calories === 'number' ? meal.recipe.calories : null,
      }
    })

  useEffect(() => {
    if (!userId) {
      setMealCount(0)
      setRecipeCount(0)
      setPlannedMeals([])
      return
    }

    const fetchDashboardStats = async () => {
      const weekStart = getWeekStart(new Date()).toISOString().split('T')[0]

      const fetchMeals = async () => {
        try {
          const response = await fetch(`${API_URL}/meal-plans/${userId}/${weekStart}`)
          if (!response.ok) {
            throw new Error('Failed to fetch meals')
          }

          const data = await response.json()
          if (Array.isArray(data)) {
            setPlannedMeals(data)
            setMealCount(data.length)
          } else {
            setPlannedMeals([])
            setMealCount(0)
          }
        } catch (error) {
          console.error('Failed to fetch meal count:', error)
          setPlannedMeals([])
          setMealCount(0)
        }
      }

      const fetchRecipes = async () => {
        try {
          const response = await fetch(`${API_URL}/recipes/${userId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch recipes')
          }

          const data = await response.json()
          setRecipeCount(Array.isArray(data) ? data.length : 0)
        } catch (error) {
          console.error('Failed to fetch recipe count:', error)
          setRecipeCount(0)
        }
      }

      await Promise.allSettled([fetchMeals(), fetchRecipes()])
    }

    fetchDashboardStats()
  }, [userId])

  const quickStats = [
    {
      label: 'Meals Planned',
      value: String(mealCount),
      href: '/calendar',
      icon: CalendarDays,
      color: 'text-green-500',
    },
    {
      label: 'Recipes Saved',
      value: String(recipeCount),
      href: '/recipes',
      icon: ChefHat,
      color: 'text-green-500',
    },
  ]

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      return
    }

    setChatMessages((prev) => [...prev, { sender: 'user', text: inputMessage }])

    setTimeout(() => {
      const responses = [
        'That sounds like a great meal! Would you like me to help you add it to your calendar?',
        'I can help you find recipes that match your preferences. What type of cuisine are you interested in?',
        'Based on your meal history, I recommend trying Mediterranean dishes this week!',
        'I can generate a shopping list for your upcoming meals. Would you like me to do that?',
      ]

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: responses[Math.floor(Math.random() * responses.length)],
        },
      ])
    }, 1000)

    setInputMessage('')
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <label className="input input-bordered flex h-16 items-center gap-4 rounded-3xl border-base-300 bg-base-200/50 px-5">
        <Search className="h-6 w-6 text-base-content/50" />
        <input
          type="text"
          className="grow text-lg"
          placeholder="Search recipes, ingredients, or meal plans..."
        />
      </label>

      <section className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-base-content md:text-5xl">
          Welcome back, {firstName}!
        </h1>
        <p className="text-lg text-base-content/65 md:text-xl">
          Here&apos;s what&apos;s cooking this week
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quickStats.map((stat) => {
          const Icon = stat.icon

          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => navigate(stat.href)}
              className="rounded-[2rem] border-2 border-neutral bg-base-100 p-4 text-left shadow-sm transition hover:bg-base-200/50 focus:outline-none focus:ring-2 focus:ring-neutral/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-base-content/60">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-base-content">{stat.value}</p>
                </div>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </button>
          )
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.75fr_0.8fr]">
        <article className="rounded-[2rem] border border-base-300 bg-base-100 p-8 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-black">Upcoming Meals</h2>
            <p className="mt-2 text-lg leading-tight text-slate-500">
              Your scheduled meals for the week
            </p>
          </div>

          <div className="space-y-4">
            {upcomingMeals.length > 0 ? (
              upcomingMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between rounded-[1.6rem] border border-green-100 bg-[linear-gradient(90deg,rgba(236,253,245,0.65)_0%,rgba(255,255,255,0.96)_42%,rgba(255,255,255,1)_100%)] px-7 py-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 text-slate-500">
                      <span className="rounded-2xl bg-green-100 px-4 py-2 text-base font-semibold text-green-600">
                        {meal.day}
                      </span>
                      <span className="text-base">{meal.date}</span>
                      <span className="text-base">&bull;</span>
                      <span className="text-base">{meal.time}</span>
                    </div>

                    <h3 className="mt-2 text-base font-semibold leading-tight text-slate-900">
                      {meal.meal}
                    </h3>
                  </div>

                  {meal.calories !== null && (
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-xl font-medium leading-none text-slate-700">
                        {meal.calories}
                      </p>
                      <p className="mt-1 text-base leading-none text-slate-500">calories</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-base-300 bg-base-200/30 px-6 py-8 text-center text-base text-slate-500">
                No meals planned for this week yet.
              </div>
            )}
          </div>
        </article>

        <article className="flex min-h-[42rem] flex-col rounded-[2rem] border border-base-300 bg-base-100 p-8 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="mb-8">
            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-black">
              <Sparkles className="h-6 w-6 text-green-600" />
              AI Assistant
            </h2>
            <p className="mt-3 max-w-[16ch] text-lg leading-snug text-slate-500">
              Ask me anything about meal planning
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-[1.6rem] px-6 py-5 ${
                    message.sender === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-base leading-[1.45]">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
              placeholder="Type your message..."
              className="h-16 flex-1 rounded-[1.35rem] border-2 border-base-300 bg-base-100 px-6 text-base text-base-content outline-none transition placeholder:text-slate-400 focus:border-green-600"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-green-600 text-white transition hover:bg-green-700"
              aria-label="Send message"
            >
              <Send className="h-7 w-7" />
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}

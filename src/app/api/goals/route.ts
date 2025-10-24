import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'
import { goalsService } from '@/lib/database/goals'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/goals - Get all goals for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const withProgress = searchParams.get('withProgress') === 'true'

    let goals
    if (withProgress) {
      goals = await goalsService.getGoalsWithProgress(user.id)
    } else {
      goals = await goalsService.getGoals(user.id, includeInactive)
    }

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const { type, target_hours, start_date } = body
    if (!type || !target_hours || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, target_hours, start_date' },
        { status: 400 }
      )
    }

    // Validate goal type
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid goal type. Must be daily, weekly, or monthly' },
        { status: 400 }
      )
    }

    // Validate target hours
    if (typeof target_hours !== 'number' || target_hours <= 0 || target_hours > 24) {
      return NextResponse.json(
        { error: 'Target hours must be a number between 0 and 24' },
        { status: 400 }
      )
    }

    const goalData = {
      user_id: user.id,
      type,
      target_hours,
      category_id: body.category_id || null,
      start_date,
      end_date: body.end_date || null,
      is_active: body.is_active !== false // Default to true
    }

    const goal = await goalsService.createGoal(goalData)

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
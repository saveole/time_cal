import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'
import { goalsService } from '@/lib/database/goals'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/goals/[id] - Get a specific goal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const goalId = params.id

    // Get the goal with progress if requested
    const { searchParams } = new URL(request.url)
    const withProgress = searchParams.get('withProgress') === 'true'

    if (withProgress) {
      const progress = await goalsService.getGoalProgress(goalId, user.id)
      const goal = await goalsService.getGoal(goalId, user.id)

      if (!goal) {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ goal, progress })
    } else {
      const goal = await goalsService.getGoal(goalId, user.id)

      if (!goal) {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ goal })
    }
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    )
  }
}

// PUT /api/goals/[id] - Update a goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const goalId = params.id
    const body = await request.json()

    // Validate goal type if provided
    if (body.type && !['daily', 'weekly', 'monthly'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid goal type. Must be daily, weekly, or monthly' },
        { status: 400 }
      )
    }

    // Validate target hours if provided
    if (body.target_hours !== undefined) {
      if (typeof body.target_hours !== 'number' || body.target_hours <= 0 || body.target_hours > 24) {
        return NextResponse.json(
          { error: 'Target hours must be a number between 0 and 24' },
          { status: 400 }
        )
      }
    }

    const updatedGoal = await goalsService.updateGoal(goalId, user.id, body)

    return NextResponse.json({ goal: updatedGoal })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const goalId = params.id
    const { searchParams } = new URL(request.url)
    const softDelete = searchParams.get('softDelete') !== 'false' // Default to soft delete

    if (softDelete) {
      await goalsService.deactivateGoal(goalId, user.id)
    } else {
      await goalsService.deleteGoal(goalId, user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
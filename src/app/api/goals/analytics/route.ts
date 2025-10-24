import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'
import { goalsService } from '@/lib/database/goals'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/goals/analytics - Get goal analytics and insights
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
    const weeks = parseInt(searchParams.get('weeks') || '8')

    if (weeks < 1 || weeks > 52) {
      return NextResponse.json(
        { error: 'Weeks parameter must be between 1 and 52' },
        { status: 400 }
      )
    }

    const analytics = await goalsService.getGoalAnalytics(user.id, weeks)

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching goal analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goal analytics' },
      { status: 500 }
    )
  }
}
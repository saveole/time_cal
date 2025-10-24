import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'
import { profileService } from '@/lib/database/profiles'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/profile - Get user profile
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
    const includeStats = searchParams.get('includeStats') === 'true'
    const sanitize = searchParams.get('sanitize') === 'true'

    let profile
    if (sanitize) {
      profile = await profileService.getProfileWithGitHub(user.id)
      if (profile) {
        profile = profileService.sanitizeProfileForDisplay(profile)
      }
    } else {
      profile = await profileService.getProfileWithGitHub(user.id)
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    let stats = null
    if (includeStats) {
      stats = await profileService.getUserStats(user.id)
    }

    return NextResponse.json({ profile, stats })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate email if provided
    if (body.email && !profileService.isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate timezone if provided
    if (body.timezone && !profileService.isValidTimezone(body.timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone format' },
        { status: 400 }
      )
    }

    // Don't allow updating GitHub OAuth fields directly
    const {
      github_username,
      github_id,
      auth_provider,
      ...allowedUpdates
    } = body

    if (github_username !== undefined || github_id !== undefined || auth_provider !== undefined) {
      return NextResponse.json(
        { error: 'Cannot update GitHub OAuth fields directly' },
        { status: 400 }
      )
    }

    const updatedProfile = await profileService.updateProfile(user.id, allowedUpdates)

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
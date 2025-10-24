import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'
import { userPreferencesService } from '@/lib/database/preferences'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/preferences - Get user preferences
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
    const createDefault = searchParams.get('createDefault') === 'true'

    let preferences
    if (createDefault) {
      preferences = await userPreferencesService.getPreferencesWithDefaults(user.id)
    } else {
      preferences = await userPreferencesService.getPreferences(user.id)
    }

    if (!preferences && !createDefault) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// POST /api/preferences - Create or update user preferences
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

    // Validate theme if provided
    if (body.theme && !['light', 'dark', 'system'].includes(body.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme. Must be light, dark, or system' },
        { status: 400 }
      )
    }

    // Validate language if provided
    if (body.language && !['en', 'zh', 'es', 'fr', 'de', 'ja'].includes(body.language)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      )
    }

    // Validate time format if provided
    if (body.time_format && !['12h', '24h'].includes(body.time_format)) {
      return NextResponse.json(
        { error: 'Invalid time format. Must be 12h or 24h' },
        { status: 400 }
      )
    }

    const preferences = await userPreferencesService.updatePreferences(user.id, body)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/preferences - Update specific preferences
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

    // Handle specific preference updates with validation
    let preferences
    if (body.theme) {
      preferences = await userPreferencesService.updateTheme(user.id, body.theme)
    } else if (body.language) {
      preferences = await userPreferencesService.updateLanguage(user.id, body.language)
    } else if (body.time_format) {
      preferences = await userPreferencesService.updateTimeFormat(user.id, body.time_format)
    } else if (body.date_format) {
      preferences = await userPreferencesService.updateDateFormat(user.id, body.date_format)
    } else if (body.default_reminders) {
      preferences = await userPreferencesService.updateDefaultReminders(user.id, body.default_reminders)
    } else {
      // Generic update
      preferences = await userPreferencesService.updatePreferences(user.id, body)
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

// DELETE /api/preferences - Reset preferences to defaults
export async function DELETE(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const preferences = await userPreferencesService.resetToDefaults(user.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error resetting preferences:', error)
    return NextResponse.json(
      { error: 'Failed to reset preferences' },
      { status: 500 }
    )
  }
}
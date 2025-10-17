import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAccessToken = cookieStore.get('admin_access_token')?.value;

    if (!adminAccessToken) {
      console.log('No admin access token found in cookies');
      return NextResponse.json(
        { error: 'No admin authentication token found' },
        { status: 401 }
      );
    }
    
    console.log('Admin access token found, checking profile');

    // Call the profile API to verify token
    const profileRes = await fetch('https://journal.saraftech.com/api/v1/users/auth/profile/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Profile API Response Status:', profileRes.status);
    
    if (profileRes.status === 403 || profileRes.status === 401) {
      console.log('Authentication failed for profile API');
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: profileRes.status }
      );
    }

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      console.error('Profile API error:', profileRes.status, errorText);
      return NextResponse.json(
        { error: `Profile API error: ${profileRes.status} - ${errorText}` },
        { status: profileRes.status }
      );
    }

    const profileData = await profileRes.json();
    console.log('Profile data received:', profileData);
    return NextResponse.json(profileData, { status: 200 });

  } catch (error) {
    console.error('Profile API error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error - Unable to connect to API' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

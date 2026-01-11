import { handleAuthResponse } from './authUtils';
import { getApiPath } from '../config/paths';
import { Profile } from '../entities/Profile';

interface ProfileCreateData {
    name: string;
    icon?: string;
    color?: string;
    is_default?: boolean;
}

interface ProfileUpdateData {
    name?: string;
    icon?: string;
    color?: string;
    is_default?: boolean;
    order?: number;
}

interface ProfilesResponse {
    profiles: Profile[];
}

interface ProfileResponse {
    profile: Profile;
}

/**
 * Fetch all profiles for the current user.
 */
export const fetchProfiles = async (): Promise<Profile[]> => {
    const response = await fetch(getApiPath('profiles'), {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });
    await handleAuthResponse(response, 'Failed to fetch profiles.');
    const data: ProfilesResponse = await response.json();
    return data.profiles;
};

/**
 * Fetch the active profile for the current user.
 */
export const fetchActiveProfile = async (): Promise<Profile> => {
    const response = await fetch(getApiPath('profiles/active'), {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });
    await handleAuthResponse(response, 'Failed to fetch active profile.');
    const data: ProfileResponse = await response.json();
    return data.profile;
};

/**
 * Fetch a single profile by UID.
 */
export const fetchProfile = async (uid: string): Promise<Profile> => {
    const response = await fetch(getApiPath(`profiles/${uid}`), {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });
    await handleAuthResponse(response, 'Failed to fetch profile.');
    const data: ProfileResponse = await response.json();
    return data.profile;
};

/**
 * Create a new profile.
 */
export const createProfile = async (
    profileData: ProfileCreateData
): Promise<Profile> => {
    const response = await fetch(getApiPath('profiles'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(profileData),
    });
    await handleAuthResponse(response, 'Failed to create profile.');
    const data: ProfileResponse = await response.json();
    return data.profile;
};

/**
 * Update an existing profile.
 */
export const updateProfile = async (
    uid: string,
    profileData: ProfileUpdateData
): Promise<Profile> => {
    const response = await fetch(getApiPath(`profiles/${uid}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(profileData),
    });
    await handleAuthResponse(response, 'Failed to update profile.');
    const data: ProfileResponse = await response.json();
    return data.profile;
};

/**
 * Switch to a different profile.
 */
export const switchProfile = async (uid: string): Promise<Profile> => {
    const response = await fetch(getApiPath(`profiles/switch/${uid}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    await handleAuthResponse(response, 'Failed to switch profile.');
    const data: ProfileResponse = await response.json();
    return data.profile;
};

/**
 * Delete a profile (and all its data!).
 */
export const deleteProfile = async (uid: string): Promise<void> => {
    const response = await fetch(getApiPath(`profiles/${uid}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });
    await handleAuthResponse(response, 'Failed to delete profile.');
};

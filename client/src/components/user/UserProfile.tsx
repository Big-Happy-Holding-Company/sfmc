/**
 * User Profile Component - PlayFab Integration
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * User profile management with display name and avatar updates.
 * Direct integration with PlayFab services - no simulation.
 * 
 * HOW IT WORKS:
 * - Uses existing playFabAuth and playFabProfiles services
 * - Provides UI for display name updates
 * - Handles avatar URL management
 * - Shows current player profile information
 * 
 * HOW THE PROJECT USES IT:
 * - Integrates with leaderboards for profile display
 * - Allows users to convert from anonymous to personalized profiles
 * - Maintains DRY/SRP compliance using existing services
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Camera, Save } from 'lucide-react';
import { playFabAuth } from '@/services/playfab/auth';
import { playFabProfiles, PlayFabProfiles } from '@/services/playfab/profiles';
import type { PlayerProfile } from '@/types/playfab';

interface UserProfileProps {
  className?: string;
  onProfileUpdate?: (profile: PlayerProfile) => void;
}

export function UserProfile({ className, onProfileUpdate }: UserProfileProps) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current profile on mount
  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Explicit PlayFab initialization check
      if (!playFabAuth.isAuthenticated()) {
        console.log('🎖️ Initializing PlayFab for User Profile...');
        // Ensure authenticated (this will initialize PlayFab if needed)
        await playFabAuth.ensureAuthenticated();
      }
      
      // Get current profile
      const currentProfile = await playFabProfiles.getCurrentPlayerProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        setDisplayName(currentProfile.DisplayName || '');
        setAvatarUrl(currentProfile.AvatarUrl || '');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Ensure PlayFab is ready before profile operations
      await playFabAuth.ensureAuthenticated();
      
      await playFabAuth.setDisplayName(displayName.trim());
      
      // Refresh profile to get updated data
      await loadCurrentProfile();
      
      setSuccess('Display name updated successfully');
      
      // Notify parent component
      if (onProfileUpdate && profile) {
        onProfileUpdate({ ...profile, DisplayName: displayName.trim() });
      }
    } catch (err) {
      setError('Failed to update display name');
      console.error('Display name update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!avatarUrl.trim()) {
      setError('Avatar URL cannot be empty');
      return;
    }

    // Validate URL format using the static method
    if (!PlayFabProfiles.isValidAvatarUrl(avatarUrl)) {
      setError('Please enter a valid image URL (http/https with .jpg, .png, .gif, .webp extension)');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Ensure PlayFab is ready before profile operations
      await playFabAuth.ensureAuthenticated();
      
      await playFabProfiles.setPlayerAvatar(avatarUrl.trim());
      
      // Refresh profile to get updated data
      await loadCurrentProfile();
      
      setSuccess('Avatar updated successfully');
      
      // Notify parent component
      if (onProfileUpdate && profile) {
        onProfileUpdate({ ...profile, AvatarUrl: avatarUrl.trim() });
      }
    } catch (err) {
      setError('Failed to update avatar');
      console.error('Avatar update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getPlayerInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          Manage your display name and avatar for the leaderboards
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Profile Display */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.AvatarUrl} alt={profile?.DisplayName} />
            <AvatarFallback>
              {profile?.DisplayName ? getPlayerInitials(profile.DisplayName) : 'UN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{profile?.DisplayName || 'Unknown Player'}</h3>
            <p className="text-sm text-muted-foreground">PlayFab ID: {profile?.PlayFabId}</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Display Name Section */}
        <div className="space-y-3">
          <Label htmlFor="displayName">Display Name</Label>
          <div className="flex gap-2">
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              disabled={isSaving}
            />
            <Button 
              onClick={handleUpdateDisplayName}
              disabled={isSaving || !displayName.trim()}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="space-y-3">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <div className="flex gap-2">
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              disabled={isSaving}
            />
            <Button 
              onClick={handleUpdateAvatar}
              disabled={isSaving || !avatarUrl.trim()}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, GIF, WebP. Must be a public URL starting with http/https.
          </p>
        </div>

        {/* Refresh Profile */}
        <Button 
          onClick={loadCurrentProfile}
          variant="outline"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Refresh Profile
        </Button>
      </CardContent>
    </Card>
  );
}

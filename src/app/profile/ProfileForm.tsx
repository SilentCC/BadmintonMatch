'use client';

import { useState, useRef } from 'react';
import { trpc } from '~/app/_trpc/client';
import { toast } from 'sonner';
import { uploadAvatar } from '~/server/avatar';

type Session = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    nickname?: string | null;
    image?: string | null;
    provider?: string | null;
  };
};

type Ranking = {
  rank: number;
  points: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfileForm({
  session,
  singlePlayerRanking,
  doublePlayerRanking
}: {
  session: Session,
  singlePlayerRanking: Ranking,
  doublePlayerRanking: Ranking
}) {
  const [nickname, setNickname] = useState(session?.user?.nickname ?? session?.user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(session?.user?.image ?? null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const nicknameUpdateMutation = trpc.user.updateNickname.useMutation({
    onSuccess: () => {
      toast.success('Nickname updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update nickname: ${error.message}`);
    }
  });

  const passwordUpdateMutation = trpc.user.updatePassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(`Failed to update password: ${error.message}`);
    }
  });

  const emailUpdateMutation = trpc.user.updateEmail.useMutation({
    onSuccess: () => {
      toast.success('Email updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleNicknameUpdate = () => {
    if (!session?.user?.id) return;

    nicknameUpdateMutation.mutate({
      userId: session.user.id,
      nickname
    });
  };

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!session?.user?.id) return;

    passwordUpdateMutation.mutate({
      userId: session.user.id,
      currentPassword,
      newPassword
    });
  };

  const handleEmailUpdate = () => {
    if (!session?.user?.id) return;

    emailUpdateMutation.mutate({
      userId: session.user.id,
      email
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size should be less than 5MB');
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Only .jpg, .jpeg, .png and .webp formats are supported');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!session?.user?.id) return;
    if (!avatarPreview) {
      toast.error('Please select an avatar');
      return;
    }

    setIsAvatarUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(avatarPreview);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');

      // Use server action to upload avatar
      const result = await uploadAvatar(formData);

      if (result.success) {
        toast.success('Avatar updated successfully');
        // Update the avatar preview with the new avatar URL
        setAvatarPreview(result.avatarUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(result.error ?? 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // Check if the user is from a third-party provider
  const isThirdPartyProvider = session?.user?.email &&
    ['github', 'google', 'twitter'].includes(session.user.provider ?? '');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Rankings Card - Moved to the top */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Rankings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Single Player Ranking</h3>
                <p>Rank: {singlePlayerRanking?.rank ?? 'N/A'}</p>
                <p>Points: {singlePlayerRanking?.points ?? 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Double Player Ranking</h3>
                <p>Rank: {doublePlayerRanking?.rank ?? 'N/A'}</p>
                <p>Points: {doublePlayerRanking?.points ?? 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Profile Information</h2>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                value={session.user.name ?? ''}
                className="input input-bordered w-full"
                disabled
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <div className="flex items-center">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                  required
                />
                <button
                  type="button"
                  onClick={handleEmailUpdate}
                  className="btn btn-primary ml-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Nickname (Optional)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input input-bordered w-full"
                />
                <button
                  onClick={handleNicknameUpdate}
                  className="btn btn-primary"
                >
                  Update
                </button>
              </div>
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Avatar</span>
              </label>
              <div className="flex flex-col items-center space-y-4">
                <div className="avatar group relative">
                  {avatarPreview ? (
                    <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white text-sm">Change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-base-200 rounded-full flex items-center justify-center text-base-content/50">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-12 h-12 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".jpg, .jpeg, .png, .webp"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {avatarPreview && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAvatarUpload}
                      className="btn btn-primary btn-sm"
                      disabled={isAvatarUploading}
                    >
                      {isAvatarUploading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Upload Avatar'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarPreview(session?.user?.image ?? null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="text-sm text-base-content/70 text-center">
                  <p>JPG, PNG, or WEBP</p>
                  <p>Max 5MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditionally render password change section only for credentials users */}
        {!isThirdPartyProvider && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Change Password</h2>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Current Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control mt-4">
                <button
                  onClick={handlePasswordUpdate}
                  className="btn btn-primary"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client'

import { z } from 'zod';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadAvatarForNewUser } from '~/server/avatar';
import { trpc } from '~/app/_trpc/client';
import Image from 'next/image';

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const registerSchema = z
  .object({
    name: z.string().min(1, 'name cannot be empty'),
    nickname: z.string().min(1, 'nickname cannot be empty').optional(),
    password: z.string().min(1, 'password must be at least 1 characters'),
    confirmPassword: z
      .string()
      .min(1, 'password must be at least 1 characters'),
    avatar: z
      .any()
      .refine((files) => !files?.[0] || files?.[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB')
      .refine(
        (files) => !files?.[0] || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        'Only .jpg, .jpeg, .png and .webp formats are supported'
      )
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'password is not the same as confirmPassword',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

const addRank = trpc.rank.updateSingleScore.useMutation({
  onSuccess: (result) => {
    console.log('Mutation successful:', result);
  },
  onError: (error) => {
    console.error('Mutation failed:', error);
  },
});


  const { mutateAsync: registerUser, isPending } = trpc.user.add.useMutation({
    onSuccess: (data) => {
      console.log(data.name);
       // Call the TRPC mutation to create a new SinglePlayerRanking
       addRank.mutate({
        userId: data.id,
        score: 200, // Set the initial score to 0
       });

    },
    onError: (error) => {
      setError(error.message || 'register failed');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size should be less than 5MB');
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Only .jpg, .jpeg, .png and .webp formats are supported');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      const result = await registerUser({
        name: data.name,
        nickname: data.nickname,
        password: data.password,
        image: 'https://cs110032000d3024da4.blob.core.windows.net/avatars/badmintonplayer.png'
      });

      // If avatar exists, upload it
      if (avatarPreview && fileInputRef.current?.files?.[0]) {
        // Convert file to base64
        const file = fileInputRef.current.files[0];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        const avatarResult = await uploadAvatarForNewUser(result.id, base64);
        if (avatarResult.error) {
          console.log(avatarResult.error);
          throw new Error(avatarResult.error);
        }
      }

      router.push('/login');
    } catch (err) {
      console.log(err);
      console.error(err);
      setError('Failed to register');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-bold">Register</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Avatar (optional)</span>
              </label>
              <div className="flex flex-col items-center gap-4">
                {avatarPreview ? (
                  <div className="avatar">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        width={96}
                        height={96}
                        className="rounded-full"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : (
                  <div className="avatar placeholder">
                    <div className="w-24 rounded-full bg-neutral-focus text-neutral-content">
                      <span className="text-3xl">?</span>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  className="file-input file-input-bordered w-full"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  {...register('avatar')}
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
                {errors.avatar && (
                  <span className="text-sm text-error">{errors.avatar.message as string}</span>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">User Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="input input-bordered w-full"
                {...register('name')}
              />
              {errors.name && (
                <span className="text-sm text-error">{errors.name.message}</span>
              )}
            </div>

            {/* Nickname Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Nickname</span>
              </label>
              <input
                type="text"
                placeholder="Enter your nickname"
                className="input input-bordered w-full"
                {...register('nickname')}
              />
              {errors.nickname && (
                <span className="text-sm text-error">{errors.nickname.message}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                {...register('password')}
              />
              {errors.password && (
                <span className="text-sm text-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="input input-bordered w-full"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="text-sm text-error">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="card-actions justify-end">
              <button
                type="submit"
                className={`btn btn-primary ${isPending ? 'loading' : ''}`}
                disabled={isPending}
              >
                {isPending ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

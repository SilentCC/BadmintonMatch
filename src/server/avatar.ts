'use server';

import { auth } from '~/auth';
import { uploadAvatarToAzureBlob, deleteAvatarFromAzureBlob } from '~/lib/azure-storage';
import { prisma } from '~/server/prisma';
import { Buffer } from 'buffer';

export async function uploadAvatarForNewUser(userId: string, base64Image: string) {
  if (!base64Image) {
    return { error: 'No image uploaded' };
  }

  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Determine file type from base64 prefix
    const matches = base64Image.match(/^data:(image\/(\w+));base64,/);
    const fileType = matches ? matches[1] : 'jpeg';

    // Create File from buffer
    const file = new File([imageBuffer], `avatar.${fileType}`, { type: `image/${fileType}` });

    // Upload new avatar
    const avatarUrl = await uploadAvatarToAzureBlob(file, userId);

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: { image: avatarUrl }
    });

    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { error: 'Failed to upload avatar' };
  }
}

export async function uploadAvatar(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const file = formData.get('avatar') as File;
  
  if (!file || !(file instanceof File)) {
    return { error: 'No file uploaded' };
  }

  try {
    // Delete existing avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    if (user?.image) {
      await deleteAvatarFromAzureBlob(user.image);
    }

    // Upload new avatar
    const avatarUrl = await uploadAvatarToAzureBlob(file, session.user.id ?? '');

    // Update user in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl }
    });

    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { error: 'Failed to upload avatar' };
  }
}

export async function deleteAvatar() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    if (user?.image) {
      await deleteAvatarFromAzureBlob(user.image);
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: null }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Avatar deletion error:', error);
    return { error: 'Failed to delete avatar' };
  }
}

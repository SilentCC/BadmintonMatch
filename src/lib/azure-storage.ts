'use server';

import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

// Ensure these are set in your .env.local
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING ?? null;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'avatars';

export async function uploadAvatarToAzureBlob(file: File, userId: string) {
  console.log('Uploading avatar for user:', userId);
  console.log('Connection string:', AZURE_STORAGE_CONNECTION_STRING);
  console.log('Container name:', AZURE_STORAGE_CONTAINER_NAME);

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    console.error('Azure Storage connection string is not defined');
    console.error('Environment variables:', process.env);
    throw new Error('Azure Storage connection string is not defined');
  }

  try {
    // Create the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);

    // Create the container if it doesn't exist
    await containerClient.createIfNotExists();

    // Generate a unique filename
    const fileExtension = mime.extension(file.type) || 'jpg';
    const blobName = `${userId}-${uuidv4()}.${fileExtension}`;

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload data to the blob
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });

    // Return the URL of the uploaded blob
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function deleteAvatarFromAzureBlob(blobUrl: string) {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('Azure Storage connection string is not defined');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );

  const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
  
  // Extract blob name from URL
  const blobName = new URL(blobUrl).pathname.split('/').pop();
  
  if (!blobName) {
    throw new Error('Invalid blob URL');
  }

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    await blockBlobClient.delete();
    return true;
  } catch (error) {
    console.error('Error deleting blob:', error);
    return false;
  }
}

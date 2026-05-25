/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  description?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  localBlobUrl?: string; // Cache-populated local blob URL
}

const blobCache = new Map<string, string>();

/**
 * Searches for or creates a folder called 'Shubhangi & Ishan Wedding' in Google Drive
 */
export async function getOrCreateWeddingFolder(accessToken: string): Promise<string> {
  try {
    // 1. Search for existing folder
    const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and name = 'Shubhangi & Ishan Wedding' and trashed = false");
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!searchRes.ok) {
      throw new Error(`Folder search failed: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // 2. Folder does not exist, create it
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Shubhangi & Ishan Wedding',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Collaborative folder for Shubhangi & Ishan Wedding invitation photos and guest wishes!'
      })
    });

    if (!createRes.ok) {
      throw new Error(`Folder creation failed: ${createRes.statusText}`);
    }

    const folder = await createRes.json();
    return folder.id;
  } catch (error) {
    console.error('Error in getOrCreateWeddingFolder:', error);
    throw error;
  }
}

/**
 * Lists image files inside the specified Google Drive folder
 */
export async function listWeddingPhotos(accessToken: string, folderId: string): Promise<DriveFile[]> {
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime%20desc&fields=files(id,name,mimeType,size,createdTime,description,thumbnailLink,webContentLink)&pageSize=30`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to list photos: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing wedding photos:', error);
    throw error;
  }
}

/**
 * Downloads a secure/private file from Google Drive and converts it to a local Object URL
 */
export async function fetchFileBlobUrl(accessToken: string, fileId: string): Promise<string> {
  if (blobCache.has(fileId)) {
    return blobCache.get(fileId)!;
  }

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file media: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    blobCache.set(fileId, blobUrl);
    return blobUrl;
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    throw error;
  }
}

/**
 * Uploads a photo with description metadata using a compliant Google Drive Multipart request
 */
export async function uploadPhoto(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileType: string,
  fileBlob: Blob,
  description?: string
): Promise<any> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: description || 'Uploaded via Wedding Moments Hub'
  };

  const boundary = 'wedding_invitation_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n';

  const mediaPartHeader = delimiter +
    `Content-Type: ${fileType}\r\n\r\n`;

  const multipartBody = new Blob([
    metadataPart,
    mediaPartHeader,
    fileBlob,
    closeDelim
  ], { type: `multipart/related; boundary=${boundary}` });

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,description', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed to complete: ${errorText}`);
  }

  return response.json();
}

/**
 * Deletes a file from Google Drive (requires user confirmation before calling)
 */
export async function deleteWeddingFile(accessToken: string, fileId: string): Promise<boolean> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }

  // Remove from cache
  if (blobCache.has(fileId)) {
    const localUrl = blobCache.get(fileId);
    if (localUrl) URL.revokeObjectURL(localUrl);
    blobCache.delete(fileId);
  }

  return true;
}

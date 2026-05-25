/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Image as ImageIcon, LogOut, Loader2, Trash2, 
  Plus, X, HelpCircle, Heart, Calendar, Sparkles, CheckCircle, ChevronRight, Eye 
} from 'lucide-react';
import { 
  initAuth, googleSignIn, logout, setCachedAccessToken, getAccessToken 
} from '../lib/firebaseAuth';
import { 
  getOrCreateWeddingFolder, listWeddingPhotos, fetchFileBlobUrl, uploadPhoto, deleteWeddingFile, type DriveFile 
} from '../lib/googleDriveService';
import type { User } from 'firebase/auth';

export default function WeddingGallery() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  
  // Photo states
  const [photos, setPhotos] = useState<DriveFile[]>([]);
  const [photoBlobUrls, setPhotoBlobUrls] = useState<Record<string, string>>({});
  const [loadingBlobs, setLoadingBlobs] = useState<Record<string, boolean>>({});
  
  // Upload panel states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Lightbox / Zoom
  const [activePhoto, setActivePhoto] = useState<DriveFile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        initializeDriveSpace(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set up space on credential changes
  const initializeDriveSpace = async (token: string) => {
    setLoadingFolder(true);
    setErrorMsg(null);
    try {
      const fid = await getOrCreateWeddingFolder(token);
      setFolderId(fid);
      await loadWeddingPhotos(token, fid);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sync Google Drive wedding space. Make sure you accepted high-level drive permissions.');
    } finally {
      setLoadingFolder(false);
    }
  };

  const loadWeddingPhotos = async (token: string, fid: string) => {
    setLoadingPhotos(true);
    try {
      const list = await listWeddingPhotos(token, fid);
      setPhotos(list);
      
      // Async trigger blob download for images in order to render them beautifully and securely
      list.forEach(file => {
        downloadFileBlob(token, file.id);
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not fetch wedding album images.');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const downloadFileBlob = async (token: string, fileId: string) => {
    if (photoBlobUrls[fileId]) return;
    
    setLoadingBlobs(prev => ({ ...prev, [fileId]: true }));
    try {
      const bUrl = await fetchFileBlobUrl(token, fileId);
      setPhotoBlobUrls(prev => ({ ...prev, [fileId]: bUrl }));
    } catch (err) {
      console.error(`Blob fetching failed for file ${fileId}`, err);
    } finally {
      setLoadingBlobs(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        await initializeDriveSpace(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      setErrorMsg('Authorization failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    // Revoke any created guest object URLs to clean memory
    Object.values(photoBlobUrls).forEach(url => URL.revokeObjectURL(url));
    setPhotoBlobUrls({});
    await logout();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setPhotos([]);
    setFolderId(null);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupFile(e.target.files[0]);
    }
  };

  const setupFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are supported in the wedding album!');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setUploadSuccess(false);
  };

  const triggerUpload = async () => {
    if (!accessToken || !folderId || !selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(20);
    
    try {
      const res = await uploadPhoto(
        accessToken,
        folderId,
        selectedFile.name,
        selectedFile.type,
        selectedFile,
        description
      );
      
      setUploadProgress(70);
      
      // Auto-refresh photo list
      const refreshedList = await listWeddingPhotos(accessToken, folderId);
      setPhotos(refreshedList);
      
      // Download newly added image blob immediately
      if (res && res.id) {
        await downloadFileBlob(accessToken, res.id);
      }
      
      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      setFilePreview(null);
      setDescription('');
      
      // Clear success notification after delay
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed uploading wedding moment.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Mandatory: confirmation check before deletions
  const handleDeletePhoto = async (fileId: string, fileName: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${fileName}" from the wedding album?\nThis action will delete the photo permanent from your Google Drive folder.`
    );
    
    if (!isConfirmed) return;
    if (!accessToken) return;

    try {
      await deleteWeddingFile(accessToken, fileId);
      setPhotos(prev => prev.filter(p => p.id !== fileId));
      if (activePhoto?.id === fileId) {
        setActivePhoto(null);
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete photo. Please try again.');
    }
  };

  return (
    <section className="mt-20 py-16 px-4 max-w-7xl mx-auto border-t border-wedding-gold/10" id="wedding-gallery-hub">
      <div className="text-center mb-16 relative">
        <div className="absolute inset-x-0 -top-8 flex justify-center items-center pointer-events-none opacity-20">
          <Heart size={120} className="text-wedding-gold animate-pulse" />
        </div>
        <Sparkles className="text-wedding-gold mx-auto mb-4 animate-spin-slow" size={28} />
        <h2 className="text-4xl md:text-5xl font-display text-wedding-gold uppercase tracking-[0.2em] text-shimmer">
          Wedding Moments Hub
        </h2>
        <p className="text-gray-400 font-serif italic text-base md:text-lg max-w-2xl mx-auto mt-4">
          "Join Shubhangi and Ishan's digital wedding album. Access photos of our ceremonies or share your captured wedding smiles into our shared Google Drive."
        </p>
      </div>

      {errorMsg && (
        <div className="mb-10 max-w-3xl mx-auto bg-red-950/40 border border-red-500/40 rounded-2xl p-5 text-red-100 text-sm flex items-center gap-4">
          <span className="p-3 bg-red-900/40 rounded-full">🛈</span>
          <div>
            <p className="font-semibold text-lg">Sync Status Notice</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {needsAuth ? (
        /* AUTH SECTION - Elegant visual card */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto rounded-3xl border border-wedding-gold/20 bg-gradient-to-b from-neutral-900/90 to-black/90 p-10 md:p-14 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-wedding-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-wedding-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-wedding-gold/10 border border-wedding-gold/30 flex items-center justify-center mx-auto mb-8">
            <ImageIcon className="text-wedding-gold" size={32} />
          </div>
          
          <h3 className="text-2xl font-semibold text-white font-display uppercase tracking-widest mb-4">
            Connect to Co-create our Album
          </h3>
          <p className="text-gray-400 font-sans text-sm md:text-base leading-relaxed mb-10 max-w-md mx-auto">
            Authorize connection to Google Drive using your Google account to browse collaborative wedding photos. You can upload snapshots & write heart-warming ceremonies wishes for the couple safely!
          </p>

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button mx-auto py-3 px-6 rounded-full hover:scale-105 active:scale-95 transition-all text-sm font-semibold flex items-center justify-center gap-3 bg-white text-black font-display tracking-wider border border-white hover:bg-neutral-100"
          >
            {isLoggingIn ? (
              <Loader2 size={18} className="animate-spin text-black" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            Sign in with Google
          </button>
        </motion.div>
      ) : (
        /* CONNECTED INTERFACE - Upload and Live Photo Dashboard */
        <div className="space-y-16">
          {/* User Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-6 bg-neutral-900/60 border border-wedding-gold/10 rounded-2xl py-4 px-6 max-w-5xl mx-auto backdrop-blur-md">
            <div className="flex items-center gap-4">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Guest'} 
                  className="w-10 h-10 rounded-full border border-wedding-gold/30"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <p className="text-gray-400 text-xs">Connected Guest</p>
                <p className="text-white font-medium text-sm font-sans">{user.displayName || user.email}</p>
              </div>
              <span className="h-5 w-px bg-wedding-gold/20" />
              <div className="hidden sm:flex items-center gap-2 text-xs text-wedding-gold bg-wedding-gold/5 px-3 py-1 rounded-full border border-wedding-gold/15">
                <CheckCircle size={12} /> Google Drive Synced
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-display text-gray-400 hover:text-white hover:bg-neutral-800 py-2 px-4 rounded-full border border-transparent hover:border-neutral-700 transition-all cursor-pointer"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
            {/* LEFT COLUMN: Upload Card (Drag-and-Drop + Messages panel) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-wedding-gold/15 bg-neutral-900/40 p-6 md:p-8 space-y-6 relative overflow-hidden backdrop-blur-md shadow-xl">
                <h3 className="text-xl font-display text-white font-semibold flex items-center gap-2 tracking-wide uppercase">
                  <Upload className="text-wedding-gold mr-1" size={18} /> Share a Wedding Moment
                </h3>
                
                {/* Drag zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative ${
                    dragActive 
                    ? "border-wedding-gold bg-wedding-gold/5" 
                    : filePreview 
                      ? "border-emerald-500/40 bg-emerald-950/5" 
                      : "border-neutral-700 hover:border-wedding-gold/40 hover:bg-neutral-800/20"
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />

                  {filePreview ? (
                    <div className="relative group w-full aspect-video rounded-xl overflow-hidden mt-1">
                      <img 
                        src={filePreview} 
                        alt="Upload Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white uppercase tracking-wider font-display font-medium">Click to replace photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-gray-400 group-hover:text-wedding-gold">
                        <Plus size={20} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-sans font-medium">Click to select photo</p>
                        <p className="text-xs text-gray-400 mt-1 font-serif italic">or drag and drop your image file here</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Upload Meta Inputs */}
                {selectedFile && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-display text-gray-400 uppercase tracking-widest mb-2">
                        Wish / Note (Attached Message)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Type a greeting wish, sharing ceremony thoughts, or memorable moments..."
                        className="w-full text-sm rounded-xl bg-black border border-neutral-800 py-3 px-4 text-white focus:outline-none focus:border-wedding-gold/70 h-24 resize-none transition-colors"
                        maxLength={250}
                      />
                      <p className="text-right text-[10px] text-gray-500 mt-1">{description.length}/250 characters</p>
                    </div>

                    <button
                      onClick={triggerUpload}
                      disabled={isUploading}
                      className="w-full rounded-full py-4 px-6 bg-gradient-to-r from-wedding-gold to-yellow-600 text-white text-sm font-display tracking-widest uppercase font-semibold hover:shadow-2xl hover:shadow-wedding-gold/20 flex items-center justify-center gap-3 transition-all"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Uploading {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="animate-pulse" />
                          Upload to Shared Album
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="w-full py-2 text-center text-xs text-gray-500 hover:text-white focus:outline-none"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}

                {uploadSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-emerald-100 text-xs flex items-center gap-3"
                  >
                    <CheckCircle className="text-emerald-400" size={18} />
                    <div>
                      <p className="font-semibold">Photo added successfully!</p>
                      <p className="text-gray-400">Synced directly to Google Drive album.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Photo Stream Grid */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <h3 className="text-xl font-display text-wedding-gold uppercase tracking-widest flex items-center gap-2 font-semibold">
                  <ImageIcon size={20} /> Moments Stream ({photos.length})
                </h3>
                <button 
                  onClick={() => folderId && loadWeddingPhotos(accessToken!, folderId)}
                  disabled={loadingPhotos || loadingFolder}
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Refresh Album
                </button>
              </div>

              {loadingFolder || loadingPhotos ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                  <Loader2 className="animate-spin text-wedding-gold" size={36} />
                  <p className="text-sm font-serif italic">Accessing Shubhangi & Ishan wedding space...</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-20 px-8 rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/10">
                  <ImageIcon className="mx-auto text-neutral-600 mb-4" size={48} />
                  <p className="font-serif italic text-white text-lg">"Be the first to share a wedding memory!"</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                    No images are inside the shared folder yet. Pick or drop any snapshot on the left to pin it in the ceremony card.
                  </p>
                </div>
              ) : (
                /* CSS Masonry-styled Photo Grid */
                <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                  {photos.map((photo) => {
                    const isBlobLoading = loadingBlobs[photo.id];
                    const localUrl = photoBlobUrls[photo.id];
                    const hasBlob = !!localUrl;

                    return (
                      <motion.div 
                        key={photo.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="break-inside-avoid relative rounded-2xl overflow-hidden bg-neutral-900/40 border border-neutral-800/40 group hover:border-wedding-gold/20 transition-all duration-300 shadow-lg"
                      >
                        {/* Loading Preamble or High-Res Image Display */}
                        <div className="relative aspect-auto min-h-[200px] bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
                          {isBlobLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 gap-2">
                              <Loader2 className="animate-spin text-wedding-gold text-xs" size={16} />
                              <span className="text-[10px] text-gray-400">Downloading...</span>
                            </div>
                          )}

                          {hasBlob ? (
                            <img 
                              src={localUrl} 
                              alt={photo.name} 
                              className="w-full h-auto object-cover max-h-[450px] group-hover:scale-[1.03] transition-transform duration-500 cursor-pointer"
                              onClick={() => setActivePhoto(photo)}
                            />
                          ) : (
                            /* Fallback to drive thumbnail link if available */
                            photo.thumbnailLink ? (
                              <img 
                                src={photo.thumbnailLink.replace(/=s\d+/, '=s400')} 
                                alt={photo.name} 
                                className="w-full h-auto object-cover blur-[2px] cursor-pointer"
                                onClick={() => setActivePhoto(photo)}
                              />
                            ) : (
                              <div className="py-12 flex flex-col items-center gap-2">
                                <ImageIcon className="text-neutral-700" size={32} />
                                <button 
                                  onClick={() => downloadFileBlob(accessToken!, photo.id)}
                                  className="text-xs text-wedding-gold bg-wedding-gold/5 px-3 py-1 rounded-full hover:bg-wedding-gold/15"
                                >
                                  Trigger Load Media
                                </button>
                              </div>
                            )
                          )}

                          {/* Quick Interactive Hover Frame Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 pointer-events-none">
                            <div className="flex self-end gap-2 shrink-0 pointer-events-auto">
                              <button 
                                onClick={() => setActivePhoto(photo)}
                                className="p-2 rounded-full bg-black/80 hover:bg-wedding-gold text-white hover:text-black transition-colors"
                                title="Zoom Gallery Lightbox"
                              >
                                <Eye size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeletePhoto(photo.id, photo.name)}
                                className="p-2 rounded-full bg-black/80 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                                title="Delete Photo"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Title details & guest message metadata card */}
                        <div className="p-4 space-y-2">
                          {photo.description ? (
                            <p className="text-white text-xs font-sans italic leading-relaxed font-medium">
                              "{photo.description}"
                            </p>
                          ) : (
                            <p className="text-gray-500 text-xs font-serif italic">
                              Shared without message banner.
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-neutral-800/60 pt-2 font-mono">
                            <span>Uploaded by Guest</span>
                            <span>
                              {new Date(photo.createdTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL TRIGGER */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setActivePhoto(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white transition-colors z-50"
            >
              <X size={20} />
            </button>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl max-h-[80vh] relative z-40 bg-neutral-950/40 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800"
            >
              <img 
                src={photoBlobUrls[activePhoto.id] || activePhoto.thumbnailLink?.replace(/=s\d+/, '=s1200')} 
                alt={activePhoto.name}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              <div className="bg-neutral-900 p-6 md:p-8 border-t border-neutral-800 text-center">
                {activePhoto.description && (
                  <p className="text-white text-sm md:text-base italic max-w-2xl mx-auto font-sans">
                    "{activePhoto.description}"
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400 font-mono mt-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> 
                    {new Date(activePhoto.createdTime).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span>Shared with Love</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

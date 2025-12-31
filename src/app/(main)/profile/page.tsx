"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Linkedin,
  Twitter,
  Loader2,
  Save,
  X,
  Shield,
  Edit2,
  Camera,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import api from "@/lib/axios";
import { setUser } from "@/redux/slices/user";
import toast from "react-hot-toast";

interface SocialLinks {
  linkedIn?: string;
  twitter?: string;
}

interface UserProfile {
  bio?: string;
  avatar?: {
    fileId: string;
    url: string;
  };
  socialLinks?: SocialLinks;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  profile: UserProfile;
}

export default function ProfilePage() {
  const [user, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    linkedIn: "",
    twitter: "",
  });

  const dispatch = useAppDispatch();

  // Imagekit

  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const abortController = new AbortController();

  const authenticator = async () => {
    try {
      const response = await fetch("/api/imagekit-auth");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  const handleUpload = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    const file = fileInput.files[0];

    let authParams;
    try {
      authParams = await authenticator();
    } catch (authError) {
      console.error("Failed to authenticate for upload:", authError);
      return;
    }
    const { signature, expire, token, publicKey } = authParams;

    try {
      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name,
        onProgress: (event) => {
          setProgress((event.loaded / event.total) * 100);
        },
        abortSignal: abortController.signal,
      });
      console.log("Upload response:", uploadResponse);

      const response = await api.patch("/api/users/profile/update-avatar", {
        imagekit: uploadResponse,
      });

      setUserData(response.data.data);

      dispatch(setUser(response.data.data));
    } catch (error) {
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
      } else {
        console.error("Upload error:", error);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users/profile");
      if (response.data.success) {
        const userData = response.data.data;
        setUserData(userData);
        setFormData({
          name: userData.name || "",
          bio: userData.profile?.bio || "",
          linkedIn: userData.profile?.socialLinks?.linkedIn || "",
          twitter: userData.profile?.socialLinks?.twitter || "",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch profile", err);
      toast.error("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.patch("/api/users/profile", formData);
      if (response.data.success) {
        setUserData(response.data.data);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      console.error("Failed to update profile", err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 text-gray-500">
        User not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group cursor-pointer">
                <div className="h-32 w-32 rounded-full border-4 border-gray-50 overflow-hidden bg-gray-100">
                  {user.profile?.avatar?.url ? (
                    <img
                      src={user.profile.avatar.url}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                      <User className="h-16 w-16" />
                    </div>
                  )}
                </div>
                <div
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>

              <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                <Shield className="h-3 w-3" />
                {user.role}
              </div>
            </div>

            {/* Edit Toggle (Desktop - if we want it separate, but let's put it in main area for better flow or keep here) 
                    Decision: Keep main editing controls in the content area for context, or a global toggle.
                    Let's use a "Edit Profile" button here that toggles the mode for the whole page.
                */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {isEditing ? (
                  <>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bio"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        id="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 bg-gray-50/50 focus:bg-white transition-all resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <p className="text-gray-900 font-medium">{user.name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Email
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Bio
                      </label>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {user.profile?.bio || (
                          <span className="text-gray-400 italic">
                            No bio provided.
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Social Profiles
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label
                        htmlFor="linkedIn"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        LinkedIn Profile
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Linkedin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="linkedIn"
                          id="linkedIn"
                          value={formData.linkedIn}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="twitter"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Twitter Profile
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Twitter className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="twitter"
                          id="twitter"
                          value={formData.twitter}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {user.profile?.socialLinks?.linkedIn ? (
                      <a
                        href={user.profile.socialLinks.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group w-full sm:w-auto"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Linkedin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            LinkedIn
                          </p>
                          <p className="text-xs text-gray-500 group-hover:text-blue-600">
                            View Profile
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 opacity-60 w-full sm:w-auto">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <Linkedin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            LinkedIn
                          </p>
                          <p className="text-xs text-gray-400">Not connected</p>
                        </div>
                      </div>
                    )}

                    {user.profile?.socialLinks?.twitter ? (
                      <a
                        href={user.profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all group w-full sm:w-auto"
                      >
                        <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                          <Twitter className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Twitter
                          </p>
                          <p className="text-xs text-gray-500 group-hover:text-sky-600">
                            View Profile
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 opacity-60 w-full sm:w-auto">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <Twitter className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Twitter
                          </p>
                          <p className="text-xs text-gray-400">Not connected</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

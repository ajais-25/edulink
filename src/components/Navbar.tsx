"use client";

import Link from "next/link";
import { Search, Bell, User, LogOut, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useState, useRef, useEffect } from "react";
import { clearUser, setUser } from "@/redux/slices/user";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import api from "@/lib/axios";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchQuery(search);
    } else if (pathname === "/courses" && !search) {
      setSearchQuery("");
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false);
      await api.post("/api/auth/logout");
      dispatch(clearUser());
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleChangeRole = async () => {
    try {
      setIsChangingRole(true);
      const response = await api.patch("/api/users/change-role");
      if (response.data.success) {
        if (user) {
          const newRole = user.role === "student" ? "instructor" : "student";
          dispatch(setUser({ ...user, role: newRole }));
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Role change failed", error);
    } finally {
      setIsChangingRole(false);
      setIsDropdownOpen(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // If input is cleared and we are on courses page, clear the search filter
    if (value === "" && pathname === "/courses") {
      router.push("/courses");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Branding */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-indigo-600">EduLink</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden flex-1 items-center justify-center px-6 lg:flex">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearch}
              className="block w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="Search for courses..."
            />
          </div>
        </div>

        {/* Right: User Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/courses"
            className={`hidden text-sm font-medium md:block ${
              pathname === "/courses"
                ? "text-indigo-600"
                : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            Browse Courses
          </Link>
          <Link
            href="/my-courses"
            className={`hidden text-sm font-medium md:block ${
              pathname?.startsWith("/my-courses")
                ? "text-indigo-600"
                : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            My Courses
          </Link>

          <button
            type="button"
            className="rounded-full bg-white p-1 text-gray-500 hover:text-indigo-600 focus:outline-none"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
              className={`flex rounded-full bg-white text-sm cursor-pointer focus:outline-none ${
                user?.role === "instructor"
                  ? "ring-2 ring-indigo-600 ring-offset-2"
                  : ""
              }`}
            >
              <span className="sr-only">Open user menu</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 overflow-hidden">
                {user?.profile?.avatar?.url ? (
                  <img
                    src={user.profile.avatar.url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-semibold">
                    {user?.name ? (
                      user.name.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    Hi, {user?.name?.split(" ")[0]}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-500 capitalize">
                    {user?.role || "Guest"}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleChangeRole}
                    disabled={isChangingRole}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isChangingRole ? "animate-spin" : ""}`}
                    />
                    {isChangingRole ? "Switching..." : "Switch Role"}
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

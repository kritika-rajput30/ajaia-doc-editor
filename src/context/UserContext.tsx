"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  fetchWithUser: (url: string, options?: RequestInit) => Promise<Response>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);

          // Check if previously stored user
          const savedUserId = localStorage.getItem("ajaia_user_id");
          const found = data.users.find((u: User) => u.id === savedUserId);
          const active = found || data.users.find((u: User) => u.id === "usr_kritika") || data.users[0];

          if (active) {
            setCurrentUser(active);
            localStorage.setItem("ajaia_user_id", active.id);
            document.cookie = `ajaia_user_id=${active.id}; path=/; max-age=31536000`;
          }
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem("ajaia_user_id", target.id);
      document.cookie = `ajaia_user_id=${target.id}; path=/; max-age=31536000`;
    }
  };

  const fetchWithUser = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (currentUser?.id) {
      headers.set("x-user-id", currentUser.id);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        switchUser,
        fetchWithUser,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

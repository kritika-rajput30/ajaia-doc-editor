"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { ChevronDown, Check, UserCircle, Shield, Sparkles } from "lucide-react";

export function UserSwitcher() {
  const { currentUser, users, switchUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Switch simulated team user"
      >
        <img
          src={currentUser.avatar_url}
          alt={currentUser.name}
          className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
        />
        <div className="text-left hidden sm:block">
          <div className="font-semibold text-slate-800 leading-tight flex items-center gap-1.5">
            {currentUser.name}
            {currentUser.id === "usr_kritika" && (
              <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                Primary
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 leading-none">{currentUser.role}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-2 border-b border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" />
              Simulated Team Session
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch users to test ownership and sharing permissions live:
            </p>
          </div>

          <div className="py-1">
            {users.map((user) => {
              const isActive = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 ${
                    isActive ? "bg-blue-50/70" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        {user.name}
                        {user.id === "usr_kritika" && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-semibold">
                            Candidate
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{user.role}</div>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Instant RBAC demo — changes reflect immediately</span>
          </div>
        </div>
      )}
    </div>
  );
}

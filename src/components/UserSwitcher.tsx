"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Check, Shield, Sparkles } from "lucide-react";

export function UserSwitcher() {
  const { currentUser, users, switchUser } = useUser();

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          title="Switch simulated team user"
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={currentUser.avatar_url} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
          </Avatar>
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
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-2">
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
              <DropdownMenuItem
                key={user.id}
                onClick={() => switchUser(user.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs cursor-pointer ${
                  isActive ? "bg-blue-50/70" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
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
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <div className="px-3 py-1.5 text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50/50 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>Instant RBAC demo — changes reflect live</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

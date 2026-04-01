"use client";

import { User, LogOut, Clock } from "lucide-react";

export function AccountSettings() {
  return (
    <section className="bg-surface-container-low p-5 space-y-6 border border-outline-variant/10">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-cyan" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          Account
        </h2>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center">
            <span className="text-lg font-heading font-bold text-cyan">K</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-heading font-bold text-on-surface">
              Kinetic User
            </p>
            <p className="text-[10px] text-on-surface-variant tracking-wider">
              kinetic@terminal.io
            </p>
          </div>
        </div>

        {/* Session Timeout */}
        <div className="bg-surface-container p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                Session Timeout
              </span>
            </div>
            <select className="bg-surface-container-high text-on-surface text-xs px-2 py-1 border border-outline-variant/20 focus:border-cyan focus:outline-none">
              <option>30 min</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </div>
        </div>

        {/* 2FA */}
        <div className="bg-surface-container p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface">
                Two-Factor Auth
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Protect your account with 2FA
              </p>
            </div>
            <ToggleSwitch defaultOn={false} />
          </div>
        </div>

        {/* Sign out */}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container text-on-surface-variant hover:text-crimson hover:bg-surface-container-high transition-colors text-xs font-bold uppercase tracking-widest">
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </section>
  );
}

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        defaultChecked={defaultOn}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-surface-container-high peer-checked:bg-cyan/30 transition-colors relative">
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-on-surface-variant peer-checked:bg-cyan transition-all peer-checked:translate-x-4" />
      </div>
    </label>
  );
}

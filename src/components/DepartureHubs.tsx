import React from 'react';
import { DepartureHub } from '../types';

interface DepartureHubsProps {
  hubs: DepartureHub[];
  selectedHub: string;
  onSelectHub: (hubId: string) => void;
}

export const DepartureHubs: React.FC<DepartureHubsProps> = ({
  hubs,
  selectedHub,
  onSelectHub,
}) => {
  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-blue-100 text-blue-700 text-sm">✈️</span>
          <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
            Hub Keberangkatan Aktif
          </h2>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          {hubs.length} Hub Terjadwal
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {hubs.map((hub) => {
          const isSelected = selectedHub === hub.countryCode;
          return (
            <button
              key={hub.id}
              onClick={() => onSelectHub(isSelected ? 'all' : hub.countryCode)}
              className={`shrink-0 px-4 py-3 rounded-2xl text-left flex flex-col min-w-[180px] transition-all duration-200 active:scale-95 shadow-sm snap-start border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 shadow-md ring-2 ring-blue-600/30'
                  : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <span>{hub.flag}</span>
                  {hub.city}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {hub.shoppersCount} Shoppers
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium mt-1 ${
                  isSelected ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                <span>Terbang: {hub.flightDate}</span>
                <span>•</span>
                <span className={`font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  Sisa {hub.capacityLeftKg}kg
                </span>
              </div>
              <div className="mt-2 text-[10px] opacity-75 font-mono">{hub.flightCode}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";

const LOGO_URL = "https://customer-assets-lxgj4vgw.emergentagent.net/job_quizspark/artifacts/dzfh3zjf_image.png";

export const BrandMark = ({ compact = false }) => (
  <div className="flex items-center gap-3" data-testid="brand-mark">
    <img
      src={LOGO_URL}
      alt="Soluzione"
      className="h-9 w-auto object-contain select-none"
      draggable={false}
    />
    {!compact && (
      <div className="leading-none border-l border-black/10 pl-3">
        <div className="font-display text-lg text-stone-900">SolzQuiz</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">internal knowledge check</div>
      </div>
    )}
  </div>
);

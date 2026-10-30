import type { Tool } from '../game/types.ts';

let coinSerial=0;
export function coinArt(cls='') {
  const gradient=`coin-face-${++coinSerial}`;
  return `<svg class="coin-art ${cls}" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0c1"/><stop offset=".48" stop-color="#e5bc73"/><stop offset="1" stop-color="#a9793b"/></linearGradient></defs><path d="M6 27c0-6 28-6 28 0v5c0 6-28 6-28 0z" fill="#946329"/><ellipse cx="20" cy="27" rx="14" ry="5" fill="#d6ab64"/><path d="M9 31v3m5-2v4m6-3v3m6-4v3m5-6v4" stroke="#f1d391" stroke-width="1.2"/><circle cx="20" cy="17" r="14" fill="#976a34"/><circle cx="20" cy="15" r="14" fill="url(#${gradient})"/><circle cx="20" cy="15" r="10.8" fill="none" stroke="#fff1c6" stroke-width="1"/><path d="M20 22v-9m0 5c-5 0-7-4-7-6 5 0 7 2 7 6m0-3c5 0 7-4 7-6-5 0-7 2-7 6" fill="none" stroke="#8b6132" stroke-width="1.6" stroke-linecap="round"/><path d="m10 7 3-2m15 19 3-3" stroke="#fff5d3" stroke-width="2" stroke-linecap="round"/></svg>`;
}

export function toolArt(tool:Tool) {
  const shapes:Record<Tool,string>={
    hand:'<path d="M13 23V11a2 2 0 0 1 4 0v7-11a2 2 0 0 1 4 0v11-9a2 2 0 0 1 4 0v10-6a2 2 0 0 1 4 0v12c0 7-4 11-10 11-4 0-7-3-9-6l-4-6c-2-3 1-5 3-3l4 3z" fill="#e8cf9f" stroke="#947951"/>',
    hoe:'<path d="m11 31 13-23" stroke="#bd9159" stroke-width="4" stroke-linecap="round"/><path d="m20 7 11 6-3 7-12-6z" fill="#bdc7c0" stroke="#647874" stroke-width="1.4"/><path d="m18 11 11 5" stroke="#f1e8cc" stroke-width="1.5"/>',
    water:'<path d="M9 16h15v15H9z" fill="#a9c4c4" stroke="#537b7d" stroke-width="1.5"/><path d="M9 20C1 9 15 7 15 16M24 19l7-6 4 3-8 9" fill="none" stroke="#b5d0cc" stroke-width="3"/><path d="m31 21 2 4m-5 0 1 3m7-6 1 4" stroke="#c3e9e6" stroke-width="1.8" stroke-linecap="round"/><path d="M13 20v7" stroke="#ddecdb" stroke-width="1.8"/>',
    seed:'<path d="M11 18h18l-2 16H13z" fill="#d9b984" stroke="#927348" stroke-width="1.4"/><path d="M20 26V14m0 6c-7 0-8-7-8-7 7 0 8 4 8 7m0-3c7 0 8-8 8-8-7 0-8 4-8 8" fill="#9fae79" stroke="#647450" stroke-width="1.3"/>',
    axe:'<path d="m12 33 12-25" stroke="#bc8c54" stroke-width="4" stroke-linecap="round"/><path d="m23 6 11 6-3 10-13-7z" fill="#b8c6c5" stroke="#647979" stroke-width="1.4"/><path d="m33 13-3 8" stroke="#f1ebd7" stroke-width="2"/>',
    pickaxe:'<path d="m15 32 9-23" stroke="#be925c" stroke-width="4" stroke-linecap="round"/><path d="M8 17c3-12 16-15 25-2-7-7-16-7-25 2z" fill="#bbceca" stroke="#647a76" stroke-width="1.4"/>',
    rod:'<path d="M10 32 24 5" stroke="#c5a36c" stroke-width="2.7" stroke-linecap="round"/><path d="M24 5q12 4 7 23" fill="none" stroke="#e7deba" stroke-width="1.2"/><path d="M29 26h4v6h-4z" fill="#ddb17b"/><path d="M29 29h4" stroke="#a86854" stroke-width="2"/>'
  };
  return `<svg class="tool-art" viewBox="0 0 40 40" aria-hidden="true">${shapes[tool]}</svg>`;
}


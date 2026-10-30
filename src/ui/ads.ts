import type { AdState } from '../ads.ts';
import type { ViewContext } from './views.ts';
import { button } from './views.ts';
import { escape as e, icon } from './i18n.ts';

export function adPreviews(ctx:ViewContext,state:AdState,message='') {
  const en=ctx.lang==='en',ready=(yes:boolean)=>yes?(en?'Ready':'Siap'):(en?'Not ready':'Belum siap');
  return `<p class="eyebrow">${en?'GOOGLE DEMO ADS':'IKLAN DEMO GOOGLE'}</p><h2>${en?'Ad previews':'Pratinjau iklan'}</h2><div class="ad-preview-list">${[
    ['rectangle','Banner',en?'Only on menus':'Hanya di menu',state.bannerReady,'ad-banner'],
    ['stack','Interstitial',en?'Between days':'Antarhari',state.interstitialReady,'ad-interstitial'],
    ['lightning',en?'Rewarded':'Berhadiah',en?'Optional energy':'Energi opsional',state.rewardedReady,'ad-rewarded'],
  ].map(([ico,title,description,loaded,action])=>`<article class="ad-preview-row"><span>${icon(String(ico))}</span><div><h3>${title}</h3><p>${description}</p><small>${ready(Boolean(loaded))}</small></div>${button(en?'Preview':'Lihat',String(action),'button button-small button-subtle',!loaded&&action!=='ad-banner'?'disabled':'')}</article>`).join('')}</div><p class="ad-preview-message" role="status">${e(message|| (en?'Previews do not change your farm. Ad audio is muted.':'Pratinjau tidak mengubah farm. Suara iklan dibisukan.'))}</p><div class="modal-actions">${button(en?'Refresh':'Segarkan','ad-refresh','button button-subtle')}${state.privacyRequired?button(en?'Privacy choices':'Pilihan privasi','ad-privacy','button button-subtle'):''}</div>`;
}

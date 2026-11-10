// 广告抽象层：游戏只调 Ads.rewarded(placement) / Ads.interstitial(placement)，不关心平台。
// rewarded 返回 Promise<boolean>：true=看完发奖，false=中途关闭或拉取失败（失败时不发奖，也不卡进度）。
// 平台：微信小游戏(wx) / 抖音小游戏(tt) / 网页假广告(web)。广告位 ID 上线前在 AD_UNITS 里填。
(function(){
  const AD_UNITS={ // TODO 上线前填真实广告位
    wx:{rewarded:'adunit-xxxxxxxx',interstitial:'adunit-yyyyyyyy'},
    tt:{rewarded:'xxxxxxxx',interstitial:'yyyyyyyy'}
  };
  const env=typeof wx!=='undefined'&&wx.createRewardedVideoAd?'wx':typeof tt!=='undefined'&&tt.createRewardedVideoAd?'tt':'web';
  const log=[];
  function track(e){log.push({...e,at:Date.now()});}
  function platformRewarded(api,unit){return new Promise(res=>{
    const ad=api.createRewardedVideoAd({adUnitId:unit});
    const onClose=r=>{ad.offClose(onClose);res(!!(r&&r.isEnded));};
    ad.onClose(onClose);
    ad.show().catch(()=>ad.load().then(()=>ad.show())).catch(()=>{ad.offClose(onClose);res(false);});
  });}
  const Ads={
    env,log,
    // 网页假广告：由游戏注册一个画面钩子，返回 Promise<boolean>
    fakeUI:null,
    rewarded(placement){track({type:'rewarded',placement});
      if(env==='wx')return platformRewarded(wx,AD_UNITS.wx.rewarded);
      if(env==='tt')return platformRewarded(tt,AD_UNITS.tt.rewarded);
      return Ads.fakeUI?Ads.fakeUI(placement,3):Promise.resolve(true);},
    interstitial(placement){track({type:'interstitial',placement});
      const api=env==='wx'?wx:env==='tt'?tt:null;
      if(api&&api.createInterstitialAd){try{const ad=api.createInterstitialAd({adUnitId:AD_UNITS[env].interstitial});return ad.show().catch(()=>{});}catch(e){}}
      return Promise.resolve();}
  };
  window.Ads=Ads;
})();

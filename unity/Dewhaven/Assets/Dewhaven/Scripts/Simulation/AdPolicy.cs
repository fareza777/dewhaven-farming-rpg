namespace Dewhaven
{
    public sealed class AdPolicy
    {
        public long LastFullscreenAt,LastInterstitialAt;
        public bool Busy;
        private bool Eligible(GameState s,long now,out string message,bool checkCooldown=true)
        {
            message="";if(s==null||s.energy>=s.maxEnergy){message="Your energy is already full.";return false;}
            if(checkCooldown&&now-LastFullscreenAt<180){message="Another quiet rest will be available in a few minutes.";return false;}
            int day=s.stats.TryGetValue("ad-reward-day",out var d)?d:-1,count=s.stats.TryGetValue("ad-reward-count",out var n)?n:0;
            if(day==s.totalDays&&count>=3){message="Three optional rests are enough for today.";return false;}
            return true;
        }
        public bool CanReward(GameState s,long now,out string message)
        {if(Busy){message="An ad is already open.";return false;}return Eligible(s,now,out message);}
        public bool Grant(GameState s,string receipt,long now,out string message,bool earnedDuringRequest=false)
        {
            message="";
            if(string.IsNullOrEmpty(receipt)||receipt.Length>80||s==null||s.receipts.Contains("ad:"+receipt)){message="No new reward was earned.";return false;}
            if(!Eligible(s,now,out message,!earnedDuringRequest))return false;
            int count=s.stats.TryGetValue("ad-reward-day",out int day)&&day==s.totalDays&&s.stats.TryGetValue("ad-reward-count",out int n)?n:0;
            s.stats["ad-reward-day"]=s.totalDays;s.stats["ad-reward-count"]=count+1;s.receipts.Add("ad:"+receipt);s.energy=System.Math.Min(s.maxEnergy,s.energy+25);LastFullscreenAt=now;
            message="Quiet rest  ·  +25 energy";return true;
        }
        public bool CanInterstitial(GameState s,long now,float sessionAge)
        {return !Busy&&s!=null&&s.totalDays>=2&&sessionAge>=180&&now-LastFullscreenAt>=180&&now-LastInterstitialAt>=600&&(!s.stats.TryGetValue("ad-interstitial-day",out int day)||day!=s.totalDays);}
    }
}

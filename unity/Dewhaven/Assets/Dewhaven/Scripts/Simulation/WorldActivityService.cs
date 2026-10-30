using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace Dewhaven
{
    public static class WorldActivityService
    {
        public static bool Available(GameState s,JToken site)
        {
            string required=(string)site["requires"];
            return required==null||s.accepted.Contains(required)||s.completed.Contains(required)||(string)QuestService.ActiveMain(s)?["id"]==required;
        }
        public static bool Work(GameState s,JToken site,Vector2 position,out string message)
        {
            message="";
            if(site==null||s.area!=(string)site["area"]||Vector2.Distance(position,new Vector2((float)site["position"][0],(float)site["position"][1]))>1.85f){message="Walk to the work site.";return false;}
            string id=(string)site["id"],receipt="site:"+id;
            if(s.receipts.Contains(receipt)){message="This work is already finished.";return false;}
            if(!Available(s,site)){message="Ask the local resident about this work first.";return false;}
            int energy=(int?)site["energy"]??0;
            if(s.energy<energy){message="Rest before doing this work.";return false;}
            if(!FarmingService.Exchange(s,site["materials"].ToObject<Dictionary<string,int>>(),new Dictionary<string,int>(),0,0,out message))return false;
            s.energy-=energy;s.receipts.Add(receipt);s.Count((string)site["stat"]);
            if(id.StartsWith("convoy-")&&s.stats.TryGetValue("convoy-packed",out int packed)&&packed==3)s.stats["convoy-pickup-day"]=s.totalDays+1;
            if(id.StartsWith("shared-room-"))s.upgrades[id]=1;
            message=(string)site["copy"];return true;
        }
    }
}

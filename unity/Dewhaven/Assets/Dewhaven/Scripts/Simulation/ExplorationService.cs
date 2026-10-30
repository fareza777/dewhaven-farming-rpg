using UnityEngine;
using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
namespace Dewhaven
{
    public static class ExplorationService
    {
        public static string Complex(string area)=>area!=null&&area.Contains("-vault-")?area.Substring(0,area.LastIndexOf('-')):null;
        public static int Floor(string area)=>area!=null&&int.TryParse(area.Substring(area.LastIndexOf('-')+1),out int n)?n:1;
        public static JToken Definition(string area)=>ContentRegistry.Read("dungeons").FirstOrDefault(d=>(string)d["id"]==Complex(area));
        public static JToken Puzzle(string area)=>ContentRegistry.Read("vault-puzzles").FirstOrDefault(p=>(string)p["area"]==area);
        public static int Value(GameState s,string key)=>s.mechanisms.TryGetValue(key,out int n)?n:0;
        public static bool Solved(GameState s,string area)=>Value(s,Complex(area)+":system-"+Floor(area))==1;
        public static bool CanTravel(GameState s,string target,out string message)
        {
            message="";string complex=Complex(target);if(complex==null)return true;
            if(Complex(s.area)==complex)
            {
                int from=Floor(s.area),to=Floor(target);
                if(to>from&&from>=2&&from<=4&&!Solved(s,s.area)){message="Open this room's gate at the mechanism first.";return false;}
                return true;
            }
            string upgrade=complex=="tide-vault"?"winch":complex=="ember-vault"?"quarry":"upper-stair";
            if(ValueUpgrade(s,upgrade)<1){message=complex=="tide-vault"?"Basil must repair the landing winch first.":complex=="ember-vault"?"Ask Pavel to reopen the quarry approach.":"Ask Vesper to repair the sheltered upper stair.";return false;}
            return true;
        }
        private static int ValueUpgrade(GameState s,string key)=>s.upgrades.TryGetValue(key,out int n)?n:0;
        public static bool Interact(GameState s,WorldAnchor anchor,Vector2 position,out string message)
        {
            message="";string complex=Complex(s.area);
            if(complex==null||Vector2.Distance(position,anchor.position)>1.85f){message="Stand beside the mechanism.";return false;}
            if(anchor.kind=="inspect")
            {
                s.stats["inspect:"+complex]=1;var def=Definition(s.area);message=(string)def["chambers"][0]["objective"]+" The exit stair remains open.";return true;
            }
            if(anchor.kind=="treasure")
            {
                if(Floor(s.area)!=5||Enumerable.Range(2,3).Any(i=>Value(s,complex+":system-"+i)!=1)){message="The case is locked to the three room systems.";return false;}
                string receipt="relic:"+complex;
                if(s.receipts.Contains(receipt)){message="This instrument is already yours. The return shortcut is open.";return false;}
                string relic=(string)Definition(s.area)["relic"];
                if(!FarmingService.Exchange(s,new Dictionary<string,int>(),new Dictionary<string,int>{{relic,1},{"crystal",2}},0,0,out message))return false;
                s.receipts.Add(receipt);s.Count("vaults");s.stats[complex=="tide-vault"?"tideVault":complex=="ember-vault"?"emberVault":"skyVault"]=1;
                message="Recovered "+ContentRegistry.ItemName(relic)+". The return shortcut is open.";return true;
            }
            var puzzle=Puzzle(s.area);if(puzzle==null)return false;
            if(Solved(s,s.area)){message=(string)puzzle["success"];return false;}
            string key=s.area+":";
            if(anchor.id=="reset")
            {
                for(int i=0;i<puzzle["controls"].Count();i++)s.mechanisms[key+"control-"+i]=0;
                s.mechanisms[key+"sequence"]=0;message="This room is reset. Earlier rooms are kept.";return true;
            }
            if(anchor.id.StartsWith("control-")&&int.TryParse(anchor.id.Substring(8),out int control)&&control>=0&&control<puzzle["controls"].Count())
            {
                if((string)puzzle["kind"]=="sequence")
                {
                    int step=Value(s,key+"sequence");var target=puzzle["target"];
                    if(control!=(int)target[step]){s.mechanisms[key+"sequence"]=0;message="The sequence releases safely. Start again from the first marked control.";return true;}
                    step++;s.mechanisms[key+"sequence"]=step;
                    if(step==target.Count()){s.mechanisms[complex+":system-"+Floor(s.area)]=1;message=(string)puzzle["success"];}
                    else message="Aligned "+step+" / "+target.Count()+". Follow the next plate.";
                    return true;
                }
                int count=puzzle["controls"][control]["states"].Count(),value=(Value(s,key+anchor.id)+1)%count;s.mechanisms[key+anchor.id]=value;
                message=(string)puzzle["controls"][control]["label"]+"  ·  "+(string)puzzle["controls"][control]["states"][value];return true;
            }
            if(anchor.id=="release")
            {
                bool match=Enumerable.Range(0,puzzle["target"].Count()).All(i=>Value(s,key+"control-"+i)==(int)puzzle["target"][i]);
                if(!match){message="The brake holds. Check the room diagram and try again.";return false;}
                s.mechanisms[complex+":system-"+Floor(s.area)]=1;message=(string)puzzle["success"];return true;
            }
            return false;
        }
    }
}

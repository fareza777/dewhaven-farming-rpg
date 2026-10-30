using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
namespace Dewhaven
{
    public static class FarmingService
    {
        private static int ToolLevel(GameState s)=>s.upgrades.TryGetValue("tools",out int level)?Math.Max(0,Math.Min(3,level)):0;
        public static float ToolSpeed(GameState s)=>1-ToolLevel(s)*.12f;
        public static int ResourceEnergy(GameState s)=>Math.Max(1,3-ToolLevel(s));
        public static bool InSeason(GameState s,string crop)
        {
            var definition=ContentRegistry.Crops[crop];
            return definition!=null&&(definition["seasons"].Values<int>().Contains(s.season)||s.upgrades.TryGetValue("greenhouse",out int level)&&level>0);
        }
        public static bool Work(GameState s,PlotState p,string tool,out string message)
        {
            message="";
            if(tool=="hand" && !string.IsNullOrEmpty(p.crop))
            {
                var crop=ContentRegistry.Crops[p.crop];
                if(p.growth<(int)crop["days"]){message="Still growing.";return false;}
                int amount=FarmEquipment.Yield(s,p);if(!InventoryRules.Add(s,p.crop,amount)){message="Your bag is full.";return false;}
                message="+"+amount+" "+ContentRegistry.ItemName(p.crop);s.Count("harvested",amount);s.Count("farming-xp",12);
                int regrow=(int?)crop["regrow"]??0;if(regrow>0)p.growth=(int)crop["days"]-regrow;else{p.crop=null;p.growth=0;}
                return true;
            }
            int cost=tool=="hoe"&&ToolLevel(s)==0?2:1;
            if(s.energy<cost){message="Rest at your bed.";return false;}
            if(tool=="hoe" && string.IsNullOrEmpty(p.crop)&&!p.tilled){p.tilled=true;s.energy-=cost;return true;}
            if(tool=="water" && p.tilled&&!p.watered){p.watered=true;s.energy--;s.Count("watered");return true;}
            if(tool=="seed" && p.tilled&&string.IsNullOrEmpty(p.crop))
            {
                var crop=ContentRegistry.Crops[s.selectedSeed];
                if(crop==null)return false;
                bool valid=InSeason(s,s.selectedSeed);
                if(!valid){message="Choose seeds for this season.";return false;}
                if(!InventoryRules.Remove(s,s.selectedSeed+"_seed")){message="No seeds left. Visit Mira's Seedhouse.";return false;}
                p.crop=s.selectedSeed;p.growth=0;
                if(s.weather=="rain"||s.upgrades.TryGetValue("sprinkler",out int legacy)&&legacy>0)p.watered=true;
                s.energy--;s.Count("planted");s.Count("farming-xp",5);return true;
            }
            message=tool=="seed"&&!p.tilled?"Till the soil first.":tool=="water"&&p.watered?"Already watered.":"";
            return false;
        }
        public static bool Exchange(GameState s,Dictionary<string,int> consume,Dictionary<string,int> produce,int goldCost,int rewardGold,out string message)
        {
            message="";
            if(goldCost<0||rewardGold<0||s.gold<goldCost){message="You need more gold.";return false;}
            var candidate=new Dictionary<string,int>(s.inventory);
            foreach(var p in consume)
            {
                if(p.Value<1||!candidate.TryGetValue(p.Key,out int count)||count<p.Value){message="You need more "+ContentRegistry.ItemName(p.Key)+".";return false;}
                if(count==p.Value)candidate.Remove(p.Key);else candidate[p.Key]-=p.Value;
            }
            foreach(var p in produce)
            {
                int count=candidate.TryGetValue(p.Key,out int n)?n:0;
                if(p.Value<1||ContentRegistry.Items[p.Key]==null||count+p.Value>999){message="Make room in your bag.";return false;}
                candidate[p.Key]=count+p.Value;
            }
            if(candidate.Count>s.capacity){message="Make room in your bag.";return false;}
            if((long)s.gold-goldCost+rewardGold>int.MaxValue){message="Gold limit reached.";return false;}
            s.inventory=candidate;s.gold=s.gold-goldCost+rewardGold;return true;
        }
        public static bool Craft(GameState s,JToken recipe,out string message)
        {
            var cost=recipe["ingredients"].ToObject<Dictionary<string,int>>();
            var output=new Dictionary<string,int>{{(string)recipe["output"],(int)recipe["quantity"]}};
            if(!Exchange(s,cost,output,0,0,out message))return false;
            s.Count("crafted");message="Made "+ContentRegistry.ItemName((string)recipe["output"])+".";return true;
        }
        public static bool Care(GameState s,AnimalState animal,string activity,out string message)
        {
            message="";
            if(activity=="feed")
            {
                if(animal.fed){message="Already fed.";return false;}
                if(!InventoryRules.Remove(s,"feed")){message="Buy feed at Nora's ranch.";return false;}
                animal.fed=true;s.Count("care");message=animal.name+" is fed.";return true;
            }
            if(activity=="pet")
            {
                if(animal.petted){message=animal.name+" is comfortable.";return false;}
                animal.petted=true;animal.hearts=Math.Min(10,animal.hearts+1);s.Count("care");message=animal.name+" enjoyed that.";return true;
            }
            if(activity=="collect")
            {
                string item=animal.kind=="pig"?"truffle":animal.kind=="rabbit"?"wool":"egg";
                if(!animal.product){message="Nothing to collect yet.";return false;}
                if(!InventoryRules.Add(s,item)){message="Your bag is full.";return false;}
                animal.product=false;s.Count("care");s.Count(item=="egg"?"eggs-collected":"truffles-collected");message="+1 "+ContentRegistry.ItemName(item);return true;
            }
            return false;
        }
    }
}

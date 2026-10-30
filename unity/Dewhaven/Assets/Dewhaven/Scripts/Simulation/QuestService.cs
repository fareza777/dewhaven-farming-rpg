using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
namespace Dewhaven
{
    public static class QuestService
    {
        public static JToken ActiveMain(GameState state)=>ContentRegistry.Read("quests")["main"].FirstOrDefault(q=>!state.completed.Contains((string)q["id"]));
        public static JArray All => (JArray)ContentRegistry.Read("campaign")["quests"];
        public static JToken Rules(string id)=>All.FirstOrDefault(q=>(string)q["id"]==id);
        public static string GiverId(string name)
        {
            return name!=null&&(name.IndexOf("letter",StringComparison.OrdinalIgnoreCase)>=0||name.IndexOf("Grandmother",StringComparison.OrdinalIgnoreCase)>=0)?"letter":ContentRegistry.Residents.FirstOrDefault(r=>string.Equals((string)r["name"],name,StringComparison.OrdinalIgnoreCase))?["id"]?.ToString();
        }
        public static int Progress(GameState state,JToken requirement)
        {
            if(requirement["item"]!=null)return InventoryRules.Count(state,(string)requirement["item"]);
            if(requirement["visit"]!=null)return state.discoveries.Contains((string)requirement["visit"])?1:0;
            if(requirement["stat"]!=null)return state.stats.TryGetValue((string)requirement["stat"],out var value)?value:0;
            return state.upgrades.TryGetValue((string)requirement["upgrade"]??"",out var level)?level:0;
        }
        public static string RequirementName(JToken r)
        {
            if(r["label"]!=null)return (string)r["label"];
            if(r["item"]!=null)return ContentRegistry.ItemName((string)r["item"])+((bool?)r["keep"]==true?" · kept":"");
            if(r["visit"]!=null){string id=(string)r["visit"];var room=ContentRegistry.Find(ContentRegistry.Interiors,id);var region=ContentRegistry.Read("world")["exteriors"].FirstOrDefault(x=>(string)x["id"]==id);return "Visit "+(string)((room??region)?["name"]);}
            return ((string)r["upgrade"]??"Progress").Replace('-',' ');
        }
        public static bool Ready(GameState state,JToken quest,out string message)
        {
            message="";string id=(string)quest["id"];
            if(state.completed.Contains(id)){message="Already complete.";return false;}
            var rules=Rules(id);
            if(rules==null){message="Follow the current journal objective.";return false;}
            foreach(var requirement in rules["requirements"])
            {
                int amount=(int)requirement["amount"],actual=Progress(state,requirement);
                if(actual<amount){message=RequirementName(requirement)+"  ·  "+actual+" / "+amount;return false;}
            }
            return true;
        }
        public static bool HandIn(GameState state,JToken quest,string giver,out string message)
        {
            string id=(string)quest["id"];var main=ActiveMain(state);
            bool isMain=ContentRegistry.Read("quests")["main"].Any(q=>(string)q["id"]==id);
            if(isMain&&main!=(object)quest && (string)main?["id"]!=id){message="Complete the earlier chapter first.";return false;}
            var rules=Rules(id);
            if(rules==null||GiverId((string)rules["giver"])!=giver){message="Meet the person who made this request.";return false;}
            if(!Ready(state,quest,out message))return false;
            var consume=new Dictionary<string,int>();
            foreach(var r in rules["requirements"].Where(r=>r["item"]!=null&&(bool?)r["keep"]!=true))consume[(string)r["item"]]=(int)r["amount"];
            var produce=rules["reward"]?["items"]?.ToObject<Dictionary<string,int>>()??new Dictionary<string,int>();
            int gold=(int?)rules["reward"]?["gold"]??0;
            if(!FarmingService.Exchange(state,consume,produce,0,gold,out message))return false;
            state.completed.Add(id);state.accepted.Remove(id);
            string restoration=(string)rules["restoration"];
            if(!string.IsNullOrEmpty(restoration)){state.upgrades[restoration]=1;state.Count("restored");}
            message="Request complete  ·  +"+gold+" gold";return true;
        }
    }
}

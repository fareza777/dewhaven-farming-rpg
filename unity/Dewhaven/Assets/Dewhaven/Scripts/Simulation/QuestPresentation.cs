using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Dewhaven
{
    /// <summary>Read-only journal queries; acceptance and rewards belong to the physical giver.</summary>
    public static class QuestPresentation
    {
        public static string Status(GameState state,JToken quest)
        {
            string id=(string)quest["id"];
            if(state.completed.Contains(id))return "Completed";
            bool main=(bool?)quest["main"]==true;
            if(main&&(string)QuestService.ActiveMain(state)?["id"]!=id)return "Later chapter";
            if(!main&&!state.accepted.Contains(id))return "Available";
            return QuestService.Ready(state,quest,out _)?"Ready to hand in":"In progress";
        }
        public static IEnumerable<JToken> SideQuests(GameState state,string filter)
        {
            var side=QuestService.All.Where(q=>(bool?)q["main"]!=true);
            if(filter=="completed")return side.Where(q=>state.completed.Contains((string)q["id"]));
            if(filter=="active")return side.Where(q=>state.accepted.Contains((string)q["id"])&&!state.completed.Contains((string)q["id"]));
            return side.Where(q=>!state.completed.Contains((string)q["id"])&&!state.accepted.Contains((string)q["id"])&&KnownGiver(state,q));
        }
        private static bool KnownGiver(GameState state,JToken quest)
        {var person=ContentRegistry.Find(ContentRegistry.Residents,QuestService.GiverId((string)quest["giver"]));return person!=null&&state.discoveries.Contains((string)person["town"]);}
        public static string Progress(GameState state,JToken quest)
        {
            var requirements=quest["requirements"].ToArray();int done=requirements.Count(r=>QuestService.Progress(state,r)>=(int)r["amount"]);
            return done+" / "+requirements.Length+" objectives";
        }
        public static string Rewards(JToken quest)
        {
            var parts=new List<string>();int gold=(int?)quest["reward"]?["gold"]??0;if(gold>0)parts.Add(gold+" gold");
            if(quest["reward"]?["items"] is JObject items)foreach(var pair in items)parts.Add((int)pair.Value+" × "+ContentRegistry.ItemName(pair.Key));
            if(!string.IsNullOrEmpty((string)quest["restoration"]))parts.Add("Valley restoration");return string.Join(" · ",parts);
        }
    }
}

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace Dewhaven
{
    public sealed class ImportPreview { public bool Success;public string Error,Original;public GameState Candidate; }
    public static class LegacyImporter
    {
        private static int Number(JToken token,int min,int max,string field)
        {if(token==null||token.Type!=JTokenType.Integer)throw new InvalidDataException("Invalid "+field+".");long n=(long)token;if(n<min||n>max)throw new InvalidDataException("Invalid "+field+".");return (int)n;}
        private static Dictionary<string,int> Items(JToken value)
        {
            if(!(value is JObject o))throw new InvalidDataException("Invalid inventory.");var result=new Dictionary<string,int>();
            foreach(var p in o.Properties()){if(ContentRegistry.Items[p.Name]==null)throw new InvalidDataException("Unknown item: "+p.Name);result[p.Name]=Number(p.Value,1,999,p.Name);}
            return result;
        }
        public static ImportPreview Preview(string json)
        {
            try
            {
                if(string.IsNullOrEmpty(json)||System.Text.Encoding.UTF8.GetByteCount(json)>250000)throw new InvalidDataException("Choose a Dewhaven save smaller than 250 KB.");
                JObject root;using(var reader=new JsonTextReader(new StringReader(json)){MaxDepth=32,DateParseHandling=DateParseHandling.None})root=JObject.Load(reader,new JsonLoadSettings{DuplicatePropertyNameHandling=DuplicatePropertyNameHandling.Error});
                if((int?)root["format"]==2){var native=SaveService.Decode(json);return new ImportPreview{Success=true,Candidate=native,Original=json};}
                if((int?)root["version"]!=1||!(root["state"] is JObject old))throw new InvalidDataException("This is not a supported Dewhaven save.");
                string name=(string)old["playerName"],farm=(string)old["farmName"];
                if(name==null||name.Length>20||farm==null||farm.Length>24)throw new InvalidDataException("Invalid farm names.");
                string[] looks={"look-fieldkeeper","look-sunfarer","look-wayfarer","look-trailkeeper"};
                var s=GameState.New(name,farm,looks[Number(old["avatar"],0,3,"traveller")],Number(old["slot"],0,2,"slot"));
                s.day=Number(old["day"],1,28,"day");s.season=Number(old["season"],0,3,"season");s.year=Number(old["year"],1,9999,"year");s.totalDays=Number(old["totalDays"],1,1000000,"elapsed days")-1;s.minute=Number(old["time"],360,1440,"time");
                s.gold=Number(old["gold"],0,1000000000,"gold");s.maxEnergy=Number(old["maxEnergy"],100,220,"energy limit");s.energy=Number(old["energy"],0,s.maxEnergy,"energy");s.capacity=Number(old["capacity"],24,40,"bag size");
                s.inventory=Items(old["inventory"]);s.shipping=Items(old["shipping"]);if(s.inventory.Count>s.capacity)throw new InvalidDataException("This bag contains too many different items.");
                s.weather=(string)old["weather"];if(!new[]{"rain","sunny","cloudy","snow"}.Contains(s.weather))throw new InvalidDataException("Invalid weather.");
                if(!(old["plots"] is JArray plots)||(plots.Count!=32&&plots.Count!=50))throw new InvalidDataException("Invalid growing beds.");
                s.plots.Clear();int i=0;
                foreach(var p in plots)
                {
                    if(!(p is JObject))throw new InvalidDataException("Invalid growing-bed entry.");
                    string crop=(string)p["crop"];if(crop!=null&&ContentRegistry.Crops[crop]==null)throw new InvalidDataException("Unknown crop.");
                    s.plots.Add(new PlotState{id=i<32?"plot-"+i:"extra-"+(i-32),crop=crop,growth=Number(p["growth"],0,1000,"crop growth"),tilled=(bool?)p["tilled"]??false,watered=(bool?)p["watered"]??false,fertilizer=(bool?)p["fertilizer"]??false});i++;
                }
                s.animals.Clear();var animals=old["animals"] as JArray;if(animals==null||animals.Count>9)throw new InvalidDataException("Invalid animals.");
                foreach(var a in animals)
                {
                    if(!(a is JObject))throw new InvalidDataException("Invalid animal entry.");
                    string kind=(string)a["kind"],id=(string)a["id"],animalName=(string)a["name"];
                    if(!new[]{"chicken","pig","rabbit"}.Contains(kind)||string.IsNullOrEmpty(id)||id.Length>60||animalName==null||animalName.Length>20||s.animals.Any(x=>x.id==id))throw new InvalidDataException("Invalid animal.");
                    s.animals.Add(new AnimalState{id=id,kind=kind,name=GameState.CleanName(animalName,20,"Pip"),age=Number(a["age"],0,1000000,"animal age"),hearts=(int?)a["hearts"]??0,fed=(bool?)a["fed"]??false,petted=(bool?)a["petted"]??false,product=(bool?)a["product"]??false});
                }
                if(!(old["friendships"] is JObject friendships))throw new InvalidDataException("Invalid friendships.");
                foreach(var p in friendships.Properties())
                {
                    if(!(p.Value is JObject))throw new InvalidDataException("Invalid friendship entry.");
                    if(!s.friends.TryGetValue(p.Name,out var f))throw new InvalidDataException("Unknown resident.");
                    f.points=Number(p.Value["points"],0,1000,"friendship");f.met=(bool?)p.Value["met"]??f.points>0;f.talkedDay=(bool?)p.Value["talked"]==true?s.totalDays:-1;f.giftedDay=(bool?)p.Value["gifted"]==true?s.totalDays:-1;
                }
                s.stats.Clear();if(old["stats"] is JObject stats)foreach(var p in stats.Properties()){if(p.Name.Length>70)throw new InvalidDataException("Invalid progress.");s.stats[p.Name]=Number(p.Value,0,1000000000,"progress");}
                s.stats["met"]=s.friends.Values.Count(f=>f.met);
                s.completed.Clear();s.accepted.Clear();
                foreach(var id in old["completed"]?.Values<string>()??Enumerable.Empty<string>()){if(QuestService.Rules(id)==null)throw new InvalidDataException("Unknown request.");s.completed.Add(id);}
                foreach(var id in old["accepted"]?.Values<string>()??Enumerable.Empty<string>()){if(QuestService.Rules(id)==null)throw new InvalidDataException("Unknown request.");s.accepted.Add(id);}
                var main=ContentRegistry.Read("quests")["main"].ToArray();int last=Array.FindLastIndex(main,q=>s.completed.Contains((string)q["id"]));
                for(i=0;i<=last;i++)s.completed.Add((string)main[i]["id"]); // Access only; no hand-in or rewards are run.
                s.upgrades.Clear();if(old["upgrades"] is JObject upgrades)foreach(var p in upgrades.Properties())s.upgrades[p.Name]=Number(p.Value,0,3,"upgrade");
                var restorations=new Dictionary<string,string>{{"mend-bridge","bridge"},{"garden-awakens","greenhouse"},{"safe-harbour","winch"},{"the-quarry-gate","quarry"},{"the-upper-road","upper-stair"}};
                foreach(var p in restorations)if(s.completed.Contains(p.Key))s.upgrades[p.Value]=1;
                foreach(var d in ContentRegistry.Read("dungeons"))
                {
                    string id=(string)d["id"],relic=(string)d["relic"],stat=id=="tide-vault"?"tideVault":id=="ember-vault"?"emberVault":"skyVault";
                    if(InventoryRules.Count(s,relic)>0||(s.stats.TryGetValue(stat,out var n)&&n>0))
                    {
                        if(InventoryRules.Count(s,relic)==0&&!InventoryRules.Add(s,relic))throw new InvalidDataException("Make space in the old save for its recovered atlas instrument.");
                        s.receipts.Add("relic:"+id);s.stats[stat]=1;for(i=2;i<=4;i++)s.mechanisms[id+":system-"+i]=1;
                    }
                }
                s.stats["vaults"]=s.receipts.Count(receipt=>receipt.StartsWith("relic:",StringComparison.Ordinal));
                foreach(var oldId in old["discoveries"]?.Values<string>()??Enumerable.Empty<string>())
                {
                    var b=ContentRegistry.Read("bonds").FirstOrDefault(x=>(string)x["legacyId"]==oldId);
                    if(b!=null)for(i=1;i<=(int)b["chapter"];i++)s.completed.Add("bond-"+(string)b["person"]+"-chapter-"+i);
                }
                s.partner=(string)old["partner"];if(s.partner!=null&&(bool?)ContentRegistry.Find(ContentRegistry.Residents,s.partner)?["romance"]!=true)throw new InvalidDataException("Invalid partner.");
                if(s.partner!=null)for(i=1;i<=6;i++)s.completed.Add("bond-"+s.partner+"-chapter-"+i);
                string area=(string)old["player"]?["area"]??"farmhouse";
                if(area=="mine")area="mine-floor-"+Math.Max(1,Math.Min(5,(int?)old["mineFloor"]??1));
                else if(new[]{"tide-vault","ember-vault","sky-vault"}.Contains(area))area+="-1";
                if(!ContentRegistry.AreaIds.Contains(area))throw new InvalidDataException("Unknown saved location.");
                var adef=RegionAuthoring.Create(area,s);s.area=area;s.x=adef.entry.x;s.y=adef.entry.y;
                s.selectedSeed=(string)old["selectedSeed"]??"turnip";if(ContentRegistry.Crops[s.selectedSeed]==null)throw new InvalidDataException("Unknown seeds.");
                s.selectedTool=(string)old["selectedTool"]=="pickaxe"?"pick":(string)old["selectedTool"]??"hand";
                if(old["adHistory"] is JObject ad)
                {
                    s.stats["ad-reward-day"]=(int?)ad["rewardDay"]-1??-1;s.stats["ad-reward-count"]=(int?)ad["rewardCount"]??0;
                    foreach(string receipt in ad["receipts"]?.Values<string>()??Enumerable.Empty<string>())if(receipt.Length<=80&&!s.receipts.Contains("ad:"+receipt))s.receipts.Add("ad:"+receipt);
                }
                SaveService.Validate(s);return new ImportPreview{Success=true,Candidate=s,Original=json};
            }
            catch(Exception e) when(e is JsonException||e is InvalidDataException||e is FormatException||e is ArgumentException||e is InvalidCastException||e is OverflowException)
            {return new ImportPreview{Success=false,Error=e.Message};}
        }
    }
}

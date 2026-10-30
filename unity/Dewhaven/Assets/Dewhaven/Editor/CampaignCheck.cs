using System;
using System.Collections;
using System.IO;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using Newtonsoft.Json;
namespace Dewhaven.Editor
{
    public static class CampaignCheck
    {
        public static string Start()
        {
            EditorBridge.EnsureProject();var g=DewhavenGame.Instance;if(!g||!g.UI)throw new InvalidOperationException("Start Dewhaven first.");
            typeof(DewhavenGame).GetProperty("Saves").SetValue(g,new SaveService(Path.Combine(Path.GetTempPath(),"Dewhaven-campaign-integration")));
            g.StartCoroutine(Drive(g));return "One native vault/campaign integration pass started in temporary save storage.";
        }
        private static void Check(bool value,string message){if(!value)throw new InvalidOperationException(message);}
        private static IEnumerator Drive(DewhavenGame g)
        {
            string error=null;var steps=Steps(g);
            while(true)
            {
                object wait=null;bool more;try{more=steps.MoveNext();if(more)wait=steps.Current;}catch(Exception e){more=false;error=e.ToString();}
                if(!more)break;yield return wait;
            }
            File.WriteAllText("E:/Harvest Moon GPT 61/docs/unity/native-campaign-check.json",JsonConvert.SerializeObject(new{passed=error==null,error,checks=new[]{"three real approach confirmations","15 loaded native vault chambers","nine real control sequences and locked gates","three unique relics and return shortcuts","save/reload keeps all three rewards","24 chapter-rule hand-ins using satisfied fixtures"},device=false,touchTraversal=false},Formatting.Indented));
            Debug.Log("Native campaign integration: "+(error==null?"PASS":error));
        }
        private static WorldAnchor Anchor(DewhavenGame g,string id)=>g.World.Area.anchors.First(a=>a.id==id);
        private static void Use(DewhavenGame g,string id)
        {
            var a=Anchor(g,id);Check(NavGrid.Route(g.World.Area,g.Player.MapPosition,a.position,12000).Count>0,"No walking route to "+g.State.area+" / "+id);
            g.Player.Warp(a.position);g.Act();
        }
        private static IEnumerator Steps(DewhavenGame g)
        {
            g.UI.ClosePanel();g.NewGame("Campaign Check","Amber","look-fieldkeeper",2);g.BeginDay(false);g.State.capacity=100;g.State.minute=600;
            g.State.upgrades["winch"]=1;g.State.upgrades["quarry"]=1;g.State.upgrades["upper-stair"]=1;
            foreach(var dungeon in ContentRegistry.Read("dungeons"))
            {
                string complex=(string)dungeon["id"],relic=(string)dungeon["relic"];
                g.EnterArea((string)dungeon["approach"],VaultAuthoring.ApproachLanding(dungeon));Use(g,"vault-gate");
                yield return new WaitForSecondsRealtime(.25f);
                var enter=g.UI.Canvas.GetComponentsInChildren<Button>(false).First(b=>b.GetComponentsInChildren<TextMeshProUGUI>().Any(t=>t.text=="Enter"));enter.onClick.Invoke();yield return null;
                Check(g.State.area==complex+"-1","Approach did not enter "+complex);Use(g,"diagram");g.UI.ClosePanel();Use(g,"deeper");yield return null;
                for(int floor=2;floor<=4;floor++)
                {
                    Check(g.State.area==complex+"-"+floor,"Wrong room after travel.");Check(!ExplorationService.CanTravel(g.State,complex+"-"+(floor+1),out _),"Unsolved gate allowed travel.");
                    var puzzle=ExplorationService.Puzzle(g.State.area);var target=puzzle["target"];
                    if((string)puzzle["kind"]=="sequence")foreach(var control in target){Use(g,"control-"+(int)control);yield return null;}
                    else
                    {
                        for(int i=0;i<target.Count();i++)for(int n=0;n<(int)target[i];n++){Use(g,"control-"+i);yield return null;}
                        Use(g,"release");yield return null;
                    }
                    Check(ExplorationService.Solved(g.State,g.State.area),"Puzzle did not latch: "+g.State.area);Use(g,"deeper");yield return null;
                }
                Use(g,"relic");Check(InventoryRules.Count(g.State,relic)==1,"Missing unique instrument.");Use(g,"relic");Check(InventoryRules.Count(g.State,relic)==1,"Duplicate instrument awarded.");Use(g,"shortcut");yield return null;
                Check(g.State.area==(string)dungeon["approach"],"Return shortcut failed.");
            }
            Check(g.Save(),"Campaign save failed.");var loaded=g.Saves.Load(2,out var loadError);Check(loaded!=null&&loaded.stats["vaults"]==3,"Campaign reload failed: "+loadError);
            var story=GameState.New("Rules Check","Amber","look-fieldkeeper");story.capacity=100;
            foreach(var chapter in ContentRegistry.Read("quests")["main"])
            {
                var rules=QuestService.Rules((string)chapter["id"]);
                foreach(var r in rules["requirements"])
                {
                    if(r["item"]!=null)story.inventory[(string)r["item"]]=(int)r["amount"];
                    else if(r["stat"]!=null)story.stats[(string)r["stat"]]=(int)r["amount"];
                    else if(r["visit"]!=null)story.discoveries.Add((string)r["visit"]);
                    else if(r["upgrade"]!=null)story.upgrades[(string)r["upgrade"]]=(int)r["amount"];
                }
                Check(QuestService.HandIn(story,chapter,QuestService.GiverId((string)chapter["giver"]),out var message),(string)chapter["id"]+": "+message);
            }
            Check(QuestService.ActiveMain(story)==null&&story.upgrades["atlas"]==1,"The atlas ending did not complete.");
            g.UI.ClosePanel();g.EnterArea("farmhouse",new Vector2(12,9.5f));g.UI.ShowHud();
        }
    }
}

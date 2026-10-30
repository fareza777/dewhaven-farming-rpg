using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Reflection;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Dewhaven.Editor
{
    // One focused end-to-end check in the actual Unity player loop, using its real UI.
    // This editor utility and its saved evidence are not part of the Android player.
    public static class NativeDayCheck
    {
        private static bool priorInstant;
        public static string Start()
        {
            EditorBridge.EnsureProject();var game=DewhavenGame.Instance;
            if(!game||!game.UI)throw new InvalidOperationException("Start the native game first.");
            priorInstant=game.Preferences.instantText;game.Preferences.instantText=true;
            game.StartCoroutine(Drive(game));return "One native farming-day check started.";
        }
        private static IEnumerator Drive(DewhavenGame game)
        {
            var steps=Steps(game);string error=null;
            while(true)
            {
                object wait=null;bool more;
                try{more=steps.MoveNext();if(more)wait=steps.Current;}catch(Exception e){more=false;error=e.ToString();}
                if(!more)break;yield return wait;
            }
            game.Preferences.instantText=priorInstant;
            string path="E:/Harvest Moon GPT 61/docs/unity/native-day-check.json";
            var report=new Report{passed=error==null,error=error,day=game.State.day,gold=game.State.gold,checks=new[]{"till-plant-water physical impacts","automatic ripe harvest","real shop purchase UI","daily social credit once","physical shipping and sleep UI","one-day growth/payment and reload","fence blocks a long movement step","failed save preserves feedback and current game","background invalidates shop and releases pause once"}};
            File.WriteAllText(path,JsonUtility.ToJson(report,true));Debug.Log("Dewhaven native day: "+(report.passed?"PASS":"FAIL")+" · "+path);
        }
        [Serializable] private sealed class Report{public bool passed;public string error;public int day,gold;public string[] checks;}
        private static void Check(bool value,string message){if(!value)throw new InvalidOperationException(message);}
        private static void Click(DewhavenGame game,string label)
        {
            var button=game.UI.Canvas.GetComponentsInChildren<Button>(false).FirstOrDefault(b=>b.interactable&&b.GetComponentsInChildren<TextMeshProUGUI>().Any(t=>t.text==label));
            if(!button)throw new InvalidOperationException("Missing active UI action: "+label);
            button.onClick.Invoke();
        }
        private static IEnumerator Steps(DewhavenGame game)
        {
            game.NewGame("Unity Preview","Amber","look-fieldkeeper",2);game.BeginDay();
            game.EnterArea("farm",new Vector2(68.5f,43.3f));var plot=game.State.plots[4];
            game.State.selectedTool="hoe";game.Act();game.Player.Tool.Advance(1);Check(plot.tilled,"Hoe did not till the target plot.");
            game.State.selectedTool="seed";game.Act();game.Player.Tool.Advance(1);Check(plot.crop=="turnip"&&game.State.inventory["turnip_seed"]==11,"Seed was not committed once.");
            game.State.selectedTool="water";game.Act();game.Player.Tool.Advance(1);Check(plot.watered&&game.State.energy==96,"Water impact did not update soil and energy.");
            game.Player.Warp(new Vector2(64.5f,43.3f));game.Act();game.Player.Tool.Advance(1);Check(InventoryRules.Count(game.State,"turnip")==1,"Ripe crop did not gather automatically.");
            game.State.minute=550;game.EnterArea("market",new Vector2(10,11.2f));game.Act();
            yield return new WaitForSecondsRealtime(.22f);Click(game,"Buy");
            Check(game.State.gold==480&&InventoryRules.Count(game.State,"turnip_seed")==12,"The real shop UI did not buy one seed packet.");
            yield return new WaitForSecondsRealtime(.22f);Click(game,"Talk to Mira");
            Check(game.State.friends["mira"].met&&game.State.friends["mira"].points==15,"Counter conversation did not meet Mira.");
            game.UI.Conversation("mira");Check(game.State.friends["mira"].points==15,"A second conversation granted daily credit twice.");
            game.UI.ClosePanel();game.EnterArea("farm",new Vector2(54.7f,40));game.Act();
            yield return new WaitForSecondsRealtime(.22f);Click(game,"Turnip");
            yield return new WaitForSecondsRealtime(.22f);Click(game,"Ship one");
            Check(game.State.shipping.TryGetValue("turnip",out var shipped)&&shipped==1&&InventoryRules.Count(game.State,"turnip")==0,"The shipping UI did not move exactly one crop.");
            game.UI.ClosePanel();game.EnterArea("farmhouse",new Vector2(12,9.5f));game.Act();
            yield return new WaitForSecondsRealtime(.22f);Click(game,"Sleep until morning");
            Check(game.State.day==2&&game.State.gold==545&&game.State.plots[4].growth==1,"Dawn payment or watered growth is incorrect.");
            var loaded=game.Saves.Load(2,out var error);Check(loaded!=null&&loaded.day==2&&loaded.gold==545&&loaded.plots[4].growth==1,"Saved farming day did not reload: "+error);
            game.Continue(2);game.EnterArea("farm",new Vector2(64.5f,43.3f));
            typeof(PlayerMotor).GetMethod("Move",BindingFlags.NonPublic|BindingFlags.Instance).Invoke(game.Player,new object[]{Vector2.up*20});
            Check(game.Player.MapPosition.y>42,"A slow movement step crossed the garden fence.");
            var saveProperty=typeof(DewhavenGame).GetProperty("Saves");var store=game.Saves;
            string blocker=Path.Combine(Application.temporaryCachePath,"dewhaven-save-check-"+Guid.NewGuid().ToString("N"));
            File.WriteAllText(blocker,"Temporary storage failure check");
            try
            {
                saveProperty.SetValue(game,new SaveService(blocker));
                typeof(GameUI).GetMethod("SaveToSlot",BindingFlags.NonPublic|BindingFlags.Instance).Invoke(game.UI,new object[]{0});
                Check(game.State.slot==2,"A failed save changed the active slot.");
                Check(game.UI.Canvas.GetComponentsInChildren<TextMeshProUGUI>(false).Any(t=>t.text.StartsWith("Couldn't save.")),"A failed save was reported as successful.");
                game.ToTitle();Check(game.Playing,"A failed save discarded the open game.");
            }
            finally{saveProperty.SetValue(game,store);File.Delete(blocker);}
            game.State.minute=550;game.EnterArea("market",new Vector2(10,11.2f));game.UI.Shop(game.World.Area.anchors.First(a=>a.kind=="shop"));
            var applicationPause=typeof(DewhavenGame).GetMethod("OnApplicationPause",BindingFlags.NonPublic|BindingFlags.Instance);
            applicationPause.Invoke(game,new object[]{true});applicationPause.Invoke(game,new object[]{true});
            Check(!game.UI.HasPanel&&game.Clock.IsPaused,"Background left the shop open.");
            applicationPause.Invoke(game,new object[]{false});Check(!game.Clock.IsPaused,"Background pause ownership leaked.");
            game.EnterArea("farmhouse",new Vector2(12,9.5f));
        }
    }
}

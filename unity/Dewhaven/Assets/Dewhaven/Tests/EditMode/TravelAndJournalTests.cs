using System;
using System.Collections;
using System.Linq;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEngine;

namespace Dewhaven.Tests
{
    public sealed class TravelAndJournalTests
    {
        private static Type Feature(string name)
        {var type=typeof(GameState).Assembly.GetType("Dewhaven."+name);Assert.That(type,Is.Not.Null,name+" is required.");return type;}

        [Test] public void CompactTownsKeepEveryBuildingAndReachableFrontDoor()
        {
            Assert.That(ContentRegistry.Towns.Sum(t=>t["buildings"].Count()),Is.EqualTo(44));
            var state=GameState.New("Survey","Amber","look-fieldkeeper");
            foreach(var town in ContentRegistry.Towns)
            {
                Assert.That((int)town["size"][0],Is.LessThanOrEqualTo(76),(string)town["id"]);
                Assert.That((int)town["size"][1],Is.LessThanOrEqualTo(76),(string)town["id"]);
                var area=RegionAuthoring.Create((string)town["id"],state);
                foreach(var door in area.anchors.Where(a=>a.kind=="door"))
                    Assert.That(NavGrid.Route(area,area.entry,door.position).Count,Is.GreaterThan(0),area.id+" / "+door.id);
            }
        }

        [Test] public void EveryExteriorRoadHasAnOpposingReciprocalSafeArrival()
        {
            var passages=Feature("WorldPassages");var arrival=passages.GetMethod("Arrival");
            var state=GameState.New("Survey","Amber","look-fieldkeeper");
            foreach(var link in ContentRegistry.Read("world")["links"])
                foreach(var pair in new[]{new[]{(string)link[0],(string)link[1]},new[]{(string)link[1],(string)link[0]}})
                {
                    var source=RegionAuthoring.Create(pair[0],state);var target=RegionAuthoring.Create(pair[1],state);
                    var gate=source.anchors.Single(a=>a.kind=="travel"&&a.target==pair[1]);var reverse=target.anchors.Single(a=>a.kind=="travel"&&a.target==pair[0]);
                    Assert.That((bool)typeof(WorldAnchor).GetField("automatic").GetValue(gate),Is.True);
                    var outward=(Vector2)typeof(WorldAnchor).GetField("outward").GetValue(gate);
                    Assert.That(outward,Is.EqualTo(-(Vector2)typeof(WorldAnchor).GetField("outward").GetValue(reverse)));
                    var landing=(Vector2)arrival.Invoke(null,new object[]{pair[1],pair[0]});
                    Assert.That(target.Walkable((int)landing.x,(int)landing.y),Is.True,pair[0]+" -> "+pair[1]);
                    Assert.That(((Rect)typeof(WorldAnchor).GetField("trigger").GetValue(reverse)).Contains(landing),Is.False,"Arrival must leave the trigger.");
                }
        }

        [Test] public void RoadCrossingRequiresOutwardMotionAndRespectsPauseBusyAndCooldown()
        {
            var type=Feature("RoadTravelPolicy");var policy=Activator.CreateInstance(type);
            var gate=new WorldAnchor{kind="travel",target="aster-quay",position=new Vector2(70,35)};
            typeof(WorldAnchor).GetField("automatic").SetValue(gate,true);typeof(WorldAnchor).GetField("outward").SetValue(gate,Vector2.right);typeof(WorldAnchor).GetField("trigger").SetValue(gate,new Rect(68,32,4,6));
            Func<Vector2,Vector2,float,bool,bool,bool> start=(p,m,t,paused,busy)=>(bool)type.GetMethod("TryStart").Invoke(policy,new object[]{gate,p,m,t,paused,busy});
            var at=new Vector2(70,35);
            Assert.That(start(new Vector2(60,35),Vector2.right,1,false,false),Is.False);
            Assert.That(start(at,Vector2.left,1,false,false),Is.False);Assert.That(start(at,Vector2.up,1,false,false),Is.False);
            Assert.That(start(at,Vector2.right,1,true,false),Is.False);Assert.That(start(at,Vector2.right,1,false,true),Is.False);
            Assert.That(start(at,Vector2.right,1,false,false),Is.True);Assert.That(start(at,Vector2.right,1.1f,false,false),Is.False);
            type.GetMethod("Finish").Invoke(policy,new object[]{2f});
            Assert.That(start(at,Vector2.right,2.1f,false,false),Is.False);Assert.That(start(at,Vector2.right,3f,false,false),Is.True);
        }

        [Test] public void QuestStatusAndSideFiltersNeverAcceptOrPayWhileBrowsing()
        {
            var type=Feature("QuestPresentation");var state=GameState.New("Survey","Amber","look-fieldkeeper");
            var main=QuestService.All.Where(q=>(bool?)q["main"]==true).ToArray();var status=type.GetMethod("Status");
            Assert.That(status.Invoke(null,new object[]{state,main[1]}),Is.EqualTo("Later chapter"));
            foreach(var r in main[0]["requirements"])
            {int n=(int)r["amount"];if(r["item"]!=null)state.inventory[(string)r["item"]]=n;else if(r["stat"]!=null)state.stats[(string)r["stat"]]=n;else if(r["visit"]!=null)state.discoveries.Add((string)r["visit"]);else state.upgrades[(string)r["upgrade"]]=n;}
            Assert.That(status.Invoke(null,new object[]{state,main[0]}),Is.EqualTo("Ready to hand in"));
            state.completed.Add((string)main[0]["id"]);Assert.That(status.Invoke(null,new object[]{state,main[0]}),Is.EqualTo("Completed"));
            state.discoveries.Add("village");int gold=state.gold,accepted=state.accepted.Count;
            var available=((IEnumerable)type.GetMethod("SideQuests").Invoke(null,new object[]{state,"available"})).Cast<JToken>().ToArray();
            Assert.That(available.Length,Is.GreaterThan(0));Assert.That(available.All(q=>(bool?)q["main"]!=true),Is.True);
            Assert.That(state.accepted.Count,Is.EqualTo(accepted));Assert.That(state.gold,Is.EqualTo(gold));
            string id=(string)available[0]["id"];state.accepted.Add(id);
            Assert.That(((IEnumerable)type.GetMethod("SideQuests").Invoke(null,new object[]{state,"active"})).Cast<JToken>().Any(q=>(string)q["id"]==id),Is.True);
        }
        [Test] public void RoadArrivalRetainsMovementAvailabilityAndHonorsOtherPauseOwners()
        {
            foreach(bool backgrounded in new[]{false,true})
            {
                var root=new GameObject("Road input regression");
                try
                {
                    var game=root.AddComponent<DewhavenGame>();var input=root.AddComponent<TouchInput>();var clock=new GameClock(GameState.New("Survey","Amber","look-fieldkeeper"));
                    typeof(DewhavenGame).GetProperty("Clock").SetValue(game,clock);typeof(DewhavenGame).GetProperty("Controls").SetValue(game,input);
                    var road=clock.Pause("Road crossing");var other=backgrounded?clock.Pause("Android background"):null;
                    input.Enabled=false;input.PreserveDuringTravel=true;
                    typeof(DewhavenGame).GetMethod("ReleaseRoadControls",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game,new object[]{road});
                    Assert.That(input.Enabled,Is.EqualTo(!backgrounded),"The next TouchInput.Update must not clear a held finger after an ordinary road arrival.");
                    Assert.That(input.PreserveDuringTravel,Is.False);Assert.That(clock.IsPaused,Is.EqualTo(backgrounded));other?.Dispose();
                }
                finally{UnityEngine.Object.DestroyImmediate(root);}
            }
        }
        [Test] public void AQuestWithoutRestorationDoesNotPromiseARestorationReward()
        {
            var reward=(string)Feature("QuestPresentation").GetMethod("Rewards").Invoke(null,new object[]{QuestService.Rules("new-roots")});
            Assert.That(reward,Does.Contain("150 gold"));Assert.That(reward,Does.Not.Contain("Valley restoration"));
        }
    }
}

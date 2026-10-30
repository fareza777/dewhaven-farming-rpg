using System;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using UnityEngine;

namespace Dewhaven.Tests
{
    public sealed class QuietWorldTests
    {
        [Test] public void PickedTrailForageReturnsAfterTheNextDawn()
        {
            var state=GameState.New("Survey","Amber","look-fieldkeeper");
            var forage=RegionAuthoring.Create("forest",state).props.First(p=>p.resource=="berry"||p.resource=="flower"||p.resource=="mushroom");
            state.removed.Add(forage.id);Assert.That(RegionAuthoring.Create("forest",state).props.Any(p=>p.id==forage.id),Is.False);
            new FarmRules().FinishDay(state,state.totalDays);
            Assert.That(RegionAuthoring.Create("forest",state).props.Any(p=>p.id==forage.id),Is.True);
        }
        [Test] public void PurchasedForestBridgeOpensTheOptionalCrossing()
        {
            var state=GameState.New("Survey","Amber","look-fieldkeeper");
            Assert.That(RegionAuthoring.Create("forest",state).ground[60,18],Is.EqualTo(2));
            state.upgrades["bridge"]=1;
            Assert.That(RegionAuthoring.Create("forest",state).ground[60,18],Is.EqualTo(7));
        }
        [Test] public void WildernessFootprintsAreCompactAndEveryDestinationIsReachable()
        {
            var state=GameState.New("Survey","Amber","look-fieldkeeper");
            foreach(var definition in ContentRegistry.Read("world")["exteriors"])
            {
                string id=(string)definition["id"];if(ContentRegistry.Find(ContentRegistry.Towns,id)!=null)continue;
                var a=RegionAuthoring.Create(id,state);
                Assert.That(a.width,Is.LessThanOrEqualTo(id=="farm"?104:80),id);
                Assert.That(a.height,Is.LessThanOrEqualTo(80),id);
                foreach(var anchor in a.anchors.Where(n=>n.kind!="travel"))
                    Assert.That(NavGrid.Route(a,a.entry,anchor.position).Count,Is.GreaterThan(0),id+" / "+anchor.id);
            }
        }

        [Test] public void CottageAndDungeonReturnsLandBesideTheActualEntrance()
        {
            var state=GameState.New("Survey","Amber","look-fieldkeeper");
            foreach(string room in new[]{"farmhouse","barn","ranger-house","lake-house","mine-floor-1","tide-vault-1","ember-vault-1","sky-vault-1"})
            {
                var interior=RegionAuthoring.Create(room,state);var exit=interior.anchors.First(n=>n.kind=="door"&&(n.id=="outside"||n.id=="return"));
                var outside=RegionAuthoring.Create(exit.target,state);var entrance=outside.anchors.First(n=>n.target==room);
                Assert.That(Vector2.Distance(exit.arrival,entrance.position),Is.InRange(1f,4f),room);
                Assert.That(outside.Walkable((int)exit.arrival.x,(int)exit.arrival.y),Is.True,room);
            }
        }

        [Test] public void LegacyPreferencesGainQuietMusicAndInvalidVolumesAreClamped()
        {
            var field=typeof(UserPreferences).GetField("musicVolume");Assert.That(field,Is.Not.Null);
            var legacy=UserPreferences.FromJson("{\"floating\":false,\"natureVolume\":0.43,\"voiceVolume\":0.7}");
            Assert.That((float)field.GetValue(legacy),Is.InRange(.15f,.3f));
            Assert.That(legacy.floating,Is.False);Assert.That(legacy.natureVolume,Is.EqualTo(.43f).Within(.001f));
            Assert.That((float)field.GetValue(UserPreferences.FromJson("{\"musicVolume\":99}")),Is.EqualTo(1));
            Assert.That((float)field.GetValue(UserPreferences.FromJson("{\"musicVolume\":-2}")),Is.EqualTo(0));
        }

        [Test] public void SoundscapesNeverSelectContinuousBirdsAndKeepNarrativeSpace()
        {
            var type=typeof(GameState).Assembly.GetType("Dewhaven.Soundscape");Assert.That(type,Is.Not.Null);
            var select=type.GetMethod("Select",BindingFlags.Public|BindingFlags.Static);
            foreach(string area in new[]{"farm","village","forest","lake","farmhouse","mine-floor-1","tide-vault-1"})
                foreach(int minute in new[]{360,720,1260})
                    foreach(string weather in new[]{"clear","rain"})
                    {
                        object mix=select.Invoke(null,new object[]{area,weather,minute});
                        Assert.That((string)type.GetField("nature").GetValue(mix),Is.Not.EqualTo("birds"));
                        Assert.That(new[]{"daylight","evening","trail","cavern"},Does.Contain((string)type.GetField("music").GetValue(mix)));
                        Assert.That((float)type.GetField("natureLevel").GetValue(mix),Is.LessThanOrEqualTo(.26f));
                    }
        }
    }
}

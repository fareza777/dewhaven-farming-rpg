using System;
using System.Collections.Generic;
using System.IO;
using NUnit.Framework;

namespace Dewhaven.Tests
{
    public sealed class DomainTests
    {
        [Test] public void NestedPausesRequireBothOwnersToRelease()
        {
            var clock=new GameClock();
            var menu=clock.Pause("menu"); var dialogue=clock.Pause("dialogue");
            clock.Advance(10); Assert.That(clock.MinuteOfDay,Is.EqualTo(360));
            menu.Dispose(); menu.Dispose(); clock.Advance(10);
            Assert.That(clock.MinuteOfDay,Is.EqualTo(360));
            dialogue.Dispose(); clock.Advance(10);
            Assert.That(clock.MinuteOfDay,Is.EqualTo(370));
        }
        [Test] public void SleepPaysShipmentAndGrowsOnlyWateredPlotsOnce()
        {
            var state=new GameState(); state.shipping["turnip"]=3;
            state.plots.Add(new PlotState{id="wet",crop="potato",tilled=true,watered=true});
            state.plots.Add(new PlotState{id="dry",crop="potato",tilled=true});
            var farm=new FarmRules();
            Assert.That(farm.FinishDay(state,0),Is.True);
            Assert.That(state.gold,Is.EqualTo(695));
            Assert.That(state.plots[0].growth,Is.EqualTo(1));
            Assert.That(state.plots[1].growth,Is.Zero);
            Assert.That(state.day,Is.EqualTo(2));
            Assert.That(farm.FinishDay(state,0),Is.False);
            Assert.That(state.gold,Is.EqualTo(695));
        }
        [Test] public void SuccessfulTradeCommitsButAClosedSessionCannotTradeAgain()
        {
            var state=new GameState();
            var trade=new TradeSession(state,"market","market",1,500,new Dictionary<string,int>{{"turnip_seed",20}});
            Assert.That(trade.Buy("turnip_seed",2,out _),Is.True);
            Assert.That(state.gold,Is.EqualTo(460));
            Assert.That(state.inventory["turnip_seed"],Is.EqualTo(2));
            trade.Dispose(); Assert.That(trade.Buy("turnip_seed",1,out _),Is.False);
            Assert.That(state.gold,Is.EqualTo(460));
        }
        [Test] public void FullBagLeavesGoldAndInventoryUntouched()
        {
            var state=new GameState{capacity=1}; state.inventory["wood"]=1;
            var trade=new TradeSession(state,"market","market",1,500,new Dictionary<string,int>{{"turnip_seed",20}});
            Assert.That(trade.Buy("turnip_seed",1,out _),Is.False);
            Assert.That(state.gold,Is.EqualTo(500));
            Assert.That(state.inventory.Count,Is.EqualTo(1));
        }
        [Test] public void ToolImpactOccursExactlyOnceAcrossASlowFrame()
        {
            var sequence=new ToolSequence(); int impacts=0;
            sequence.Start(.9f,()=>impacts++); sequence.Advance(2); sequence.Advance(2);
            Assert.That(impacts,Is.EqualTo(1)); Assert.That(sequence.Busy,Is.False);
            sequence.Start(.9f,()=>impacts++); sequence.Cancel(); sequence.Advance(2);
            Assert.That(impacts,Is.EqualTo(1));
        }
        [Test] public void CorruptPrimaryLoadsThePreviousValidatedBackup()
        {
            string directory=Path.Combine(Path.GetTempPath(),"dewhaven-test-"+Guid.NewGuid());
            try
            {
                var store=new SaveService(directory); var state=new GameState();
                Assert.That(store.Save(0,state,out _),Is.True);
                state.gold=700; Assert.That(store.Save(0,state,out _),Is.True);
                File.WriteAllText(Path.Combine(directory,"slot-0.json"),"{corrupt");
                var recovered=store.Load(0,out var message);
                Assert.That(recovered,Is.Not.Null); Assert.That(recovered.gold,Is.EqualTo(500));
                Assert.That(message,Does.Contain("backup"));
                state.gold=900;Assert.That(store.Save(0,state,out _),Is.True);
                File.Delete(store.PathFor(0));
                Assert.That(store.HasSlot(0),Is.True,"A backup-only slot must remain occupied.");
                Assert.That(store.Load(0,out _).gold,Is.EqualTo(500),"Saving after recovery must keep the valid backup.");
                state.inventory["wood"]=-1;
                Assert.That(store.Save(0,state,out _),Is.False);
            }
            finally { if(Directory.Exists(directory)) Directory.Delete(directory,true); }
        }
    }
}

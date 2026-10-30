using System.Linq;
using NUnit.Framework;
using UnityEngine;
namespace Dewhaven.Tests
{
    public sealed class FarmLifeTests
    {
        [Test] public void AnUnpurchasedGreenhouseDoesNotPermitOutOfSeasonSeeds()
        {
            var s=GameState.New("Robin","Amber","look-fieldkeeper");s.season=1;s.upgrades["greenhouse"]=0;
            var bed=s.plots[4];bed.crop=null;bed.tilled=true;int seeds=InventoryRules.Count(s,"turnip_seed"),energy=s.energy;
            Assert.That(FarmingService.Work(s,bed,"seed",out _),Is.False);
            Assert.That(InventoryRules.Count(s,"turnip_seed"),Is.EqualTo(seeds));Assert.That(s.energy,Is.EqualTo(energy));
        }
        [Test] public void SeasonRolloverClearsExpiredCropsButKeepsGreenhouseCrops()
        {
            foreach(bool restored in new[]{false,true})
            {
                var s=GameState.New("Robin","Amber","look-fieldkeeper");s.day=28;s.totalDays=27;s.upgrades["greenhouse"]=restored?1:0;
                var bed=s.plots[4];bed.crop="turnip";bed.tilled=true;bed.growth=1;bed.watered=true;
                Assert.That(new FarmRules().FinishDay(s,27),Is.True);Assert.That(s.season,Is.EqualTo(1));
                Assert.That(bed.crop,Is.EqualTo(restored?"turnip":null));Assert.That(bed.growth,Is.EqualTo(restored?2:0));
            }
        }
        [Test] public void AFullBagKeepsStoredItemsAndStoringFreesSpaceAtomically()
        {
            var s=new GameState{capacity=1,area="farmhouse"};s.inventory["wood"]=5;s.storage["berry"]=3;
            Assert.That(InventoryRules.Store(s,"berry",3,true,out _),Is.False);Assert.That(s.storage["berry"],Is.EqualTo(3));
            Assert.That(InventoryRules.Store(s,"wood",5,false,out _),Is.True);Assert.That(s.inventory,Is.Empty);
            Assert.That(InventoryRules.Store(s,"berry",3,true,out _),Is.True);Assert.That(s.inventory["berry"],Is.EqualTo(3));
            s.area="village";Assert.That(InventoryRules.Store(s,"berry",1,false,out _),Is.False);Assert.That(s.inventory["berry"],Is.EqualTo(3));
        }
        [Test] public void ASeedExchangeCannotConsumeAnUnrelatedContribution()
        {
            var s=new GameState{day=7,area="village",minute=1000,capacity=1};s.inventory["flower"]=2;
            Assert.That(CalendarService.Attend(s,"seed-exchange",out _),Is.False);
            Assert.That(s.inventory["flower"],Is.EqualTo(2));Assert.That(s.receipts,Is.Empty);
            s.inventory.Clear();s.inventory["turnip_seed"]=3;
            Assert.That(CalendarService.Attend(s,"seed-exchange",out _),Is.True);
            Assert.That(s.inventory["carrot_seed"],Is.EqualTo(4));Assert.That(s.inventory.ContainsKey("turnip_seed"),Is.False);
        }
        [Test] public void FarmEquipmentMustBePlacedNearbyAndSprinklersWaterAtDawn()
        {
            var s=GameState.New("Robin","Amber","look-fieldkeeper");s.area="farm";s.inventory["sprinkler"]=1;
            Assert.That(FarmEquipment.Place(s,"sprinkler",s.plots[0],new Vector2(10,10),out _),Is.False);
            Assert.That(s.inventory["sprinkler"],Is.EqualTo(1));
            Assert.That(FarmEquipment.Place(s,"sprinkler",s.plots[0],new Vector2(64.5f,43.5f),out _),Is.True);
            s.plots.ForEach(p=>p.watered=false);FarmEquipment.Dawn(s);
            Assert.That(s.plots[0].watered,Is.True);Assert.That(s.plots[1].watered,Is.True);Assert.That(s.plots[31].watered,Is.False);
        }
    }
}

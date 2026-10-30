using System;
using System.Linq;
using System.IO;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
namespace Dewhaven.Tests
{
    public sealed class MigrationAndAdsTests
    {
        [Test] public void NullNativePlotIsRejectedAsInvalidData()
        {
            var s=new GameState();s.plots.Add(null);
            Assert.Throws<InvalidDataException>(()=>SaveService.Validate(s));
        }
        [Test] public void MalformedLegacyEntriesFailPreviewWithoutThrowing()
        {
            foreach(string shape in new[]{"null","3","[]"})
            {
                var old=JObject.Parse(OldSave());old["state"]["plots"][0]=JToken.Parse(shape);
                ImportPreview preview=null;Assert.DoesNotThrow(()=>preview=LegacyImporter.Preview(old.ToString()));Assert.That(preview.Success,Is.False);
                old=JObject.Parse(OldSave());old["state"]["animals"]=new JArray(JToken.Parse(shape));
                Assert.DoesNotThrow(()=>preview=LegacyImporter.Preview(old.ToString()));Assert.That(preview.Success,Is.False);
                old=JObject.Parse(OldSave());old["state"]["friendships"]["mira"]=JToken.Parse(shape);
                Assert.DoesNotThrow(()=>preview=LegacyImporter.Preview(old.ToString()));Assert.That(preview.Success,Is.False);
            }
        }
        [Test] public void ReplacingAnImportedSlotKeepsTheOldHomesteadOutsideRotatingBackups()
        {
            string directory=Path.Combine(Path.GetTempPath(),"dewhaven-import-"+Guid.NewGuid());
            try
            {
                var store=new SaveService(directory);var old=new GameState{gold=777};Assert.That(store.Save(0,old,out _),Is.True);
                var preview=LegacyImporter.Preview(OldSave());Assert.That(store.Import(0,preview,out _),Is.True);
                var loaded=store.Load(0,out _);Assert.That(loaded.gold,Is.EqualTo(4321));loaded.gold=4500;Assert.That(store.Save(0,loaded,out _),Is.True);
                string prior=Directory.GetFiles(Path.Combine(directory,"imported-originals"),"*.previous.json").Single();
                Assert.That(SaveService.Decode(File.ReadAllText(prior)).gold,Is.EqualTo(777));
            }
            finally{if(Directory.Exists(directory))Directory.Delete(directory,true);}
        }
        private static string OldSave()
        {
            var old=new JObject{{"playerName","Robin"},{"farmName","Amber"},{"avatar",2},{"slot",1},{"day",8},{"season",1},{"year",1},{"totalDays",36},{"time",740},{"weather","rain"},{"gold",4321},{"energy",80},{"maxEnergy",100},{"capacity",24},
                {"inventory",new JObject{{"wood",4},{"ancient_chart",1}}},{"shipping",new JObject()},
                {"plots",new JArray(Enumerable.Range(0,32).Select(i=>new JObject{{"id","plot-"+i},{"crop",null},{"tilled",false},{"watered",false},{"fertilizer",false},{"growth",0}}))},
                {"animals",new JArray()},{"friendships",new JObject{{"mira",new JObject{{"points",400},{"met",true},{"talked",true},{"gifted",false}}}}},
                {"stats",new JObject{{"tideVault",1}}},{"completed",new JArray("new-roots","first-harvest","good-neighbors","market-day","mend-bridge","garden-awakens","lantern-promise","letters-across-water","tide-remembers")},
                {"accepted",new JArray()},{"discoveries",new JArray("bond-mira-0")},{"upgrades",new JObject{{"bridge",1}}},{"player",new JObject{{"area","aster-quay"},{"x",18},{"y",15}}},{"selectedSeed","turnip"},{"selectedTool","pickaxe"}};
            return new JObject{{"version",1},{"state",old}}.ToString();
        }
        [Test] public void LegacyImportPreservesRewardsAndBackfillsAccessWithoutPayingAgain()
        {
            // A connector reward on import, missing new residents, or a repeated relic breaks migration.
            var p=LegacyImporter.Preview(OldSave());Assert.That(p.Success,Is.True,p.Error);var s=p.Candidate;
            Assert.That(s.gold,Is.EqualTo(4321));Assert.That(s.completed.Contains("safe-harbour"),Is.True);
            Assert.That(s.upgrades["winch"],Is.EqualTo(1));Assert.That(s.area,Is.EqualTo("aster-quay"));
            Assert.That(s.friends.Count,Is.EqualTo(25));Assert.That(s.friends["mira"].points,Is.EqualTo(400));
            Assert.That(s.completed.Contains("bond-mira-chapter-2"),Is.True);Assert.That(s.receipts.Contains("relic:tide-vault"),Is.True);
            Assert.That(s.inventory["ancient_chart"],Is.EqualTo(1));
            Assert.That(s.stats["vaults"],Is.EqualTo(1),"Imported unique relics must count toward exploration requests.");
            var invalid=JObject.Parse(OldSave());invalid["state"]["inventory"]["wood"]=-1;
            Assert.That(LegacyImporter.Preview(invalid.ToString()).Success,Is.False);
        }
        [Test] public void AnImportedFarmKeepsItsPreviouslyPurchasedWholeFieldSprinkler()
        {
            var old=JObject.Parse(OldSave());old["state"]["upgrades"]["sprinkler"]=1;
            var p=LegacyImporter.Preview(old.ToString());Assert.That(p.Success,Is.True,p.Error);
            p.Candidate.plots.ForEach(b=>{b.tilled=true;b.watered=false;});FarmEquipment.Dawn(p.Candidate);
            Assert.That(p.Candidate.plots.All(b=>b.watered),Is.True);
        }
        [Test] public void RewardNeedsAReceiptAndCannotRepeatAcrossSlotsOrFullEnergy()
        {
            // An unearned or duplicate callback must not grant energy, even if a different slot is loaded.
            var s=new GameState{energy=100};var policy=new AdPolicy();
            Assert.That(policy.CanReward(s,1000,out _),Is.False);
            s.energy=40;Assert.That(policy.CanReward(s,1000,out _),Is.True);
            Assert.That(policy.Grant(s,"",1000,out _),Is.False);
            Assert.That(policy.Grant(s,"earned-once",1000,out _),Is.True);
            Assert.That(s.energy,Is.EqualTo(65));
            Assert.That(policy.Grant(s,"earned-once",2000,out _),Is.False);
            Assert.That(s.energy,Is.EqualTo(65));
            Assert.That(policy.CanReward(new GameState{slot=2,energy=40},1001,out _),Is.False);
        }
    }
}

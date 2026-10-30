using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using UnityEngine;

namespace Dewhaven.Tests
{
    public sealed class CampaignTests
    {
        [Test] public void ReloadingAMinedFloorDoesNotRecreateInvisibleHarvestableOre()
        {
            var s=new GameState();var floor=MineAuthoring.Create("mine-floor-1",s);var ore=floor.props.First(p=>p.resource!=null);s.removed.Add(ore.id);
            var reloaded=MineAuthoring.Create("mine-floor-1",s);
            Assert.That(reloaded.props.Any(p=>p.id==ore.id),Is.False);
            Assert.That(reloaded.blocked[(int)ore.position.x,(int)ore.position.y],Is.False);
        }
        [Test] public void NewChaptersUseRealRequirementsAndPreserveAtlasInstruments()
        {
            // A missing connector or treating a chart as consumable blocks the later atlas chapter.
            var s=GameState.New("Robin","Amber","look-fieldkeeper");
            foreach(var q in ContentRegistry.Read("quests")["main"].Take(8))s.completed.Add((string)q["id"]);
            var q9=ContentRegistry.Read("quests")["main"][8];
            s.inventory["wood"]=10;s.inventory["copper"]=3;
            Assert.That(QuestService.HandIn(s,q9,"basil",out _),Is.False);
            s.inventory["copper"]=4;
            Assert.That(QuestService.HandIn(s,q9,"basil",out _),Is.True);
            Assert.That(s.upgrades["winch"],Is.EqualTo(1));
            Assert.That(s.inventory.ContainsKey("wood"),Is.False);
            int gold=s.gold;
            Assert.That(QuestService.HandIn(s,q9,"basil",out _),Is.False);
            Assert.That(s.gold,Is.EqualTo(gold));
            foreach(var q in ContentRegistry.Read("quests")["main"].Take(16))s.completed.Add((string)q["id"]);
            s.discoveries.Add("briar-hollow");s.inventory["ancient_chart"]=1;s.inventory["glass_lens"]=1;
            Assert.That(QuestService.HandIn(s,ContentRegistry.Read("quests")["main"][16],"ilan",out _),Is.True);
            Assert.That(s.inventory["ancient_chart"],Is.EqualTo(1));
            Assert.That(s.inventory["glass_lens"],Is.EqualTo(1));
        }

        [Test] public void VaultChestRequiresSolvedSystemsAndDoesNotLoseAFullBagReward()
        {
            // Bypassing a gate or issuing a receipt before inventory reservation must fail.
            var s=new GameState{area="tide-vault-5",capacity=1};s.inventory["wood"]=2;
            var chest=new WorldAnchor{kind="treasure",id="relic",position=new Vector2(20,12)};
            Assert.That(ExplorationService.Interact(s,chest,chest.position,out _),Is.False);
            s.mechanisms["tide-vault:system-2"]=1;s.mechanisms["tide-vault:system-3"]=1;s.mechanisms["tide-vault:system-4"]=1;
            Assert.That(ExplorationService.Interact(s,chest,chest.position,out _),Is.False);
            Assert.That(s.receipts,Is.Empty);Assert.That(s.inventory["wood"],Is.EqualTo(2));
            s.capacity=8;
            Assert.That(ExplorationService.Interact(s,chest,chest.position,out _),Is.True);
            Assert.That(s.inventory["ancient_chart"],Is.EqualTo(1));
            Assert.That(s.stats["tideVault"],Is.EqualTo(1));
            Assert.That(ExplorationService.Interact(s,chest,chest.position,out _),Is.False);
            Assert.That(s.inventory["ancient_chart"],Is.EqualTo(1));
        }

        [Test] public void GatheringNeedsPlaceTimeAndOneOfferingPerDay()
        {
            // A remote, early or repeated gathering must not consume food or award credit.
            var s=new GameState{totalDays=1,day=2,minute=1100,area="farm"};s.inventory["soup"]=2;
            Assert.That(CalendarService.Attend(s,"village-table",out _),Is.False);
            s.area="village";s.minute=1000;
            Assert.That(CalendarService.Attend(s,"village-table",out _),Is.False);
            s.minute=1100;
            Assert.That(CalendarService.Attend(s,"village-table",out _),Is.True);
            Assert.That(s.inventory["soup"],Is.EqualTo(1));
            Assert.That(s.stats["communityEvents"],Is.EqualTo(1));
            Assert.That(CalendarService.Attend(s,"village-table",out _),Is.False);
            Assert.That(s.inventory["soup"],Is.EqualTo(1));
        }

        [Test] public void BondChoiceCannotReplayOrRunAwayFromItsMeetingPlace()
        {
            // Remote and duplicate scene responses cannot create friendship or relationship progress.
            var s=GameState.New("Robin","Amber","look-fieldkeeper");s.friends["mira"].points=150;s.area="farm";
            Assert.That(BondService.Complete(s,"bond-mira-chapter-1",0,out _),Is.False);
            s.area="market";
            Assert.That(BondService.Complete(s,"bond-mira-chapter-1",0,out _),Is.True);
            int points=s.friends["mira"].points;
            Assert.That(BondService.Complete(s,"bond-mira-chapter-1",1,out _),Is.False);
            Assert.That(s.friends["mira"].points,Is.EqualTo(points));
            Assert.That(s.stats["bondEvents"],Is.EqualTo(1));
        }
    }
}

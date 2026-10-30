using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TMPro;
using static Dewhaven.UIFactory;
namespace Dewhaven
{
    public sealed partial class GameUI
    {
        public void Storage(bool withdraw=false,int pageIndex=0)
        {
            if(game.Context()?.kind!="storage"||game.State.area!="farmhouse"){Toast("Use your farmhouse chest.");return;}
            var p=Open("Farmhouse storage");Button(p,"Store from bag",24,112,(W-56)/2,52,()=>Storage(false),!withdraw);Button(p,"Take from chest",W/2+4,112,(W-56)/2,52,()=>Storage(true),withdraw);
            var items=(withdraw?game.State.storage:game.State.inventory).OrderBy(x=>x.Key).ToArray();int perPage=H<780?2:3;
            for(int i=pageIndex*perPage;i<Math.Min(items.Length,pageIndex*perPage+perPage);i++)
            {
                var item=items[i];float y=192+(i-pageIndex*perPage)*156;
                Image(p,"Stored item",24,y,76,80,ArtBank.Item(item.Key)).preserveAspect=true;Text(p,ContentRegistry.ItemName(item.Key)+" ×"+item.Value,122,y,W-146,64,20);
                Action<int> transfer=count=>{if(game.Context()?.kind!="storage"){Toast("Return to the chest.");return;}if(InventoryRules.Store(game.State,item.Key,count,withdraw,out var message)){game.Save();Storage(withdraw,0);}Toast(message);};
                Button(p,"One",122,y+78,100,48,()=>transfer(1));Button(p,"All",W-124,y+78,100,48,()=>transfer(item.Value),true);
            }
            if(items.Length==0)Text(p,withdraw?"The chest is empty.":"Everything is stored.",24,240,W-48,100,20,Muted);
            Pager(p,pageIndex,Mathf.CeilToInt(items.Length/(float)perPage),n=>Storage(withdraw,n));
        }
        private JToken StorySpeaker(string id)=>id=="letter"?new JObject{{"id","letter"},{"name","Grandmother's letter"},{"role","From the farmhouse ledger"},{"sprite",""}}:ContentRegistry.Find(ContentRegistry.Residents,id);
        private void Narrate(string key,string text)
        {if(NarrationCatalog.Matches(key,text)){voicedPanel=true;game.Sound.Voice.Play(key);}}
        private void Notice(string title,string copy,Action after=null,int pageIndex=0,string voiceKey=null)
        {
            bool narrated=NarrationCatalog.Matches(voiceKey,copy);var p=Open(title);float top=narrated?176:148;
            var body=Text(p,"",24,top,W-48,Mathf.Max(220,H-top-142),20);
            var voicePages=narrated?NarrationCatalog.Pages(voiceKey,text=>body.GetPreferredValues(text,W-48,Mathf.Infinity).y<=body.rectTransform.rect.height):null;
            var pages=narrated?voicePages.Select(v=>v.Text).ToList():WrapDialogue(copy,body);pageIndex=Mathf.Clamp(pageIndex,0,pages.Count-1);body.text=pages[pageIndex];
            if(narrated){var clips=voicePages[pageIndex].Clips;voicedPanel=true;game.Sound.Voice.PlayPage(voiceKey,clips);Button(p,"Replay voice",W-158,108,134,48,()=>game.Sound.Voice.PlayPage(voiceKey,clips));}
            Button(p,pageIndex<pages.Count-1?"Continue":"Back to the day",24,H-82,W-48,52,()=>{if(pageIndex<pages.Count-1)Notice(title,copy,after,pageIndex+1,voiceKey);else if(after!=null)after();else ClosePanel();},true);
        }
        private void RequestNotebook(int pageIndex)
        {SideNotebook("active",pageIndex);}
        private void WeeklyTables(int pageIndex)
        {
            var tables=ContentRegistry.Read("quests")["weekly"].ToArray();var g=tables[pageIndex];var p=Open("Every week in the valley");
            string[] weekdays={"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"};
            Text(p,(string)g["name"],24,144,W-48,100,30,Ink,true);Text(p,weekdays[(int)g["weekday"]]+" · 18:00–20:00",24,272,W-48,56,20,Bronze);
            Text(p,"Bring a dish, a crop, or flowers. Meet the host at the outdoor shared table.",24,368,W-48,140,20,Muted);
            Button(p,"Show the way",24,H-146,W-48,52,()=>RouteTo((string)g["area"]),true);Pager(p,pageIndex,tables.Length,n=>WeeklyTables(n));
        }
        public void Worksite(JToken site)
        {
            if(site==null)return;
            var p=Open((string)site["label"]);bool done=game.State.receipts.Contains("site:"+(string)site["id"]);
            Text(p,(string)site["copy"],24,144,W-48,196,20);
            float y=366;
            foreach(var pair in (JObject)site["materials"]){Text(p,ContentRegistry.ItemName(pair.Key),24,y,W-136,42,18);Text(p,InventoryRules.Count(game.State,pair.Key)+" / "+pair.Value,W-108,y,84,42,18,Muted,false,TextAlignmentOptions.TopRight);y+=48;}
            if(!WorldActivityService.Available(game.State,site))
            {
                var q=QuestService.Rules((string)site["requires"]);Text(p,"Ask "+(string)q?["giver"]+" about “"+(string)q?["title"]+"”.",24,H-224,W-48,72,16,Muted);
            }
            Button(p,done?"Work complete":"Complete this work",24,H-146,W-48,52,()=>
            {
                if(WorldActivityService.Work(game.State,site,game.Player.MapPosition,out var message))
                {game.Sound.Play("pick");game.RefreshWorld();game.Save();Notice((string)site["label"],message);}
                else Toast(message);
            },true).interactable=!done;
            Button(p,"Leave it for now",24,H-82,W-48,48,ClosePanel);
        }
        private void Convoy(int pageIndex=0)
        {
            var boxes=ContentRegistry.Read("worksites").Where(x=>((string)x["id"]).StartsWith("convoy-")).ToArray();
            var p=Open("The first convoy");var box=boxes[pageIndex];
            Text(p,(string)box["label"],24,142,W-48,66,30,Ink,true);
            Text(p,(string)box["copy"],24,232,W-48,120,18);float y=378;
            foreach(var pair in (JObject)box["materials"]){Text(p,ContentRegistry.ItemName(pair.Key),24,y,W-140,44,18);Text(p,InventoryRules.Count(game.State,pair.Key)+" / "+pair.Value,W-112,y,88,44,18,Muted,false,TextAlignmentOptions.TopRight);y+=48;}
            bool done=game.State.receipts.Contains("site:"+(string)box["id"]);
            Button(p,done?"Packed for the morning cart":"Pack this box",24,H-146,W-48,52,()=>
            {if(WorldActivityService.Work(game.State,box,game.Player.MapPosition,out var message)){game.Save();Convoy(pageIndex);Toast("Box packed. Aya collects the complete set at dawn.");}else Toast(message);},true).interactable=!done;
            Pager(p,pageIndex,boxes.Length,n=>Convoy(n));
        }
        public void Puzzle(WorldAnchor anchor)
        {
            var puzzle=ExplorationService.Puzzle(game.State.area);if(puzzle==null)return;
            var p=Open((string)puzzle["name"]);Text(p,(string)puzzle["hint"],24,142,W-48,190,20);
            float y=352;
            for(int i=0;i<puzzle["controls"].Count();i++)
            {
                var c=puzzle["controls"][i];int value=ExplorationService.Value(game.State,game.State.area+":control-"+i);
                Text(p,(string)c["label"],24,y,W-48,40,20,Ink,true);
                Text(p,(string)puzzle["kind"]=="sequence"?"Fixed control · follow the plate order":(string)c["states"][Mathf.Clamp(value,0,c["states"].Count()-1)],24,y+44,W-48,40,16,Muted);y+=90;
            }
            Button(p,"Return to the controls",24,H-82,W-48,52,ClosePanel,true);
        }
        public void Gathering(int pageIndex=0)
        {
            var today=ContentRegistry.Read("quests")["weekly"].Concat(ContentRegistry.Read("quests")["events"]).Where(x=>(string)x["area"]==game.State.area&&CalendarService.IsToday(game.State,x)).ToArray();
            if(today.Length==0){Notice("The shared table","The table is ready for the next gathering. Check the calendar for the date and the host's evening hours.");return;}
            var g=CalendarService.Definition((string)today[Mathf.Clamp(pageIndex,0,today.Length-1)]["id"]);var p=Open((string)g["name"]);
            Text(p,(string)g["activity"]??"Bring a dish or a small harvest. There is a place for you at this evening's table.",24,150,W-48,160,22,Ink,true);
            int from=(int?)g["from"]??960,to=(int?)g["to"]??1200;Text(p,from/60+":00–"+to/60+":00",24,336,W-48,44,18,Bronze);
            string food=CalendarService.Offering(game.State);
            string contribution=g["consume"] is JObject cost?string.Join("\n",cost.Properties().Select(x=>ContentRegistry.ItemName(x.Name)+"  "+InventoryRules.Count(game.State,x.Name)+" / "+x.Value)):food==null?"Bring food, a crop, or flowers to share.":"Your contribution  ·  "+ContentRegistry.ItemName(food);
            Text(p,contribution,24,416,W-48,110,18,Muted);
            Button(p,"Take a place at the table",24,H-146,W-48,52,()=>
            {
                if(game.Context()?.kind!="gathering"){Toast("Return to the shared table.");return;}
                if(CalendarService.Attend(game.State,(string)g["id"],out var message)){game.Save();Notice((string)g["name"],GatheringStory((string)g["id"]));Toast(message);}else Toast(message);
            },true);
            Pager(p,pageIndex,today.Length,n=>Gathering(n));
        }
        private static string GatheringStory(string id)
        {
            switch(id)
            {
                case "village-table":return "Cleo makes room beside the window. Aya brings a letter from the ridge; Gareth passes a repaired bowl down the table. Nobody makes a speech. Before you leave, someone asks what you'll plant next.";
                case "quay-fair":return "Sera arrives with sawdust on her sleeves. Marin brings a pot from the inn, and Basil puts the tide list away. For an hour the harbour measures the evening in empty plates instead of departing boats.";
                case "orchard-fair":return "Tamsin unfolds the last blanket. Ada sets another jar on the table, and Cedar arrives with two neighbours from the lower rows. A place that used to wait for visitors is full of ordinary conversation again.";
                case "archive-fair":return "Ilan clears the maps from the long desk. Jun tells the story of a route that looked easy on paper. Bea passes the warm bowls around. By the end of supper, tomorrow's walk has three more volunteers.";
                default:return "The hosts find another place for your basket. Neighbours compare the season's work, pass the warm dishes, and make plans for the next delivery. You leave with a little more energy and more people to greet tomorrow.";
            }
        }
        public void LocalRest(WorldAnchor anchor)
        {
            var p=Open("A quiet rest");int price=anchor.id=="clinic-rest"?80:anchor.id=="guest-rest"?60:0;
            Text(p,"Take an hour indoors. Recover 40 energy before returning to your day.",24,152,W-48,170,22,Ink,true);
            Text(p,price==0?"A room kept open for travellers.":price+" gold",24,366,W-48,58,20,Bronze);
            Button(p,"Rest for an hour",24,H-146,W-48,52,()=>
            {
                if(game.Context()?.id!=anchor.id){Toast("Return to the rest place.");return;}
                if(game.State.gold<price){Toast("You need "+price+" gold.");return;}
                if(game.State.minute>=1500){Toast("Turn in for the night instead.");return;}
                game.State.gold-=price;game.State.energy=Mathf.Min(game.State.maxEnergy,game.State.energy+40);game.State.minute=Mathf.Min(1560,game.State.minute+60);game.Save();ClosePanel();Toast("Rested  ·  +40 energy");
            },true);Button(p,"Stay a while longer",24,H-82,W-48,48,ClosePanel);
        }
        public void Adoption(int kind=0)
        {
            if(game.State.area!="ranch"){Toast("Visit Nora's ranch counter.");return;}
            var p=Open("A companion for the barn");string animal=kind==0?"chicken":kind==1?"pig":"rabbit";int price=kind==0?380:kind==1?1200:860;
            Image(p,"Animal",W/2-48,140,96,116,ArtBank.Get((kind==0?"bird":kind==1?"pig":"rabbit")+"/down/1")).preserveAspect=true;
            Text(p,kind==0?"A young hen":kind==1?"A truffle pig":"A wool rabbit",24,286,W-48,58,30,Ink,true,TextAlignmentOptions.Center);
            Text(p,kind==0?"Daily feed and care bring fresh eggs.":kind==1?"Daily feed and care bring truffles.":"Gentle daily care brings soft wool.",24,368,W-48,90,20,Muted,false,TextAlignmentOptions.Center);
            Text(p,price+" gold · "+game.State.animals.Count+" / 9 barn places",24,486,W-48,54,18,Bronze,false,TextAlignmentOptions.Center);
            Button(p,"Welcome to the farm",24,H-146,W-48,52,()=>
            {
                var counter=game.World.Area.anchors.FirstOrDefault(x=>x.kind=="shop");
                if(counter==null||Vector2.Distance(game.Player.MapPosition,counter.position)>1.85f||game.State.minute<480||game.State.minute>=1080){Toast("Visit Nora's counter during opening hours.");return;}
                if(game.State.animals.Count>=9){Toast("The barn has room for nine animals.");return;}
                if(game.State.gold<price){Toast("You need "+price+" gold.");return;}
                game.State.gold-=price;int n=game.State.animals.Count+1;game.State.animals.Add(new AnimalState{id=Guid.NewGuid().ToString("N"),kind=animal,name=(kind==0?"Clover ":"Bramble ")+n,age=0,product=false});game.Save();ClosePanel();Toast("Your new companion is waiting in the barn.");
            },true);Pager(p,kind,3,n=>Adoption(n));
        }
        public void Household()
        {
            var person=ContentRegistry.Find(ContentRegistry.Residents,game.State.partner);if(person==null)return;
            var p=Open("At home with "+(string)person["name"]);
            string[] labels={"Share breakfast","An evening conversation","Help tomorrow · Water eight beds","Help tomorrow · Care for animals"};
            for(int i=0;i<4;i++){int n=i;Button(p,labels[i],24,160+i*84,W-48,60,()=>
            {
                if(game.State.area!="farmhouse"||!NearResident(game.State.partner)){Toast("Meet your partner at the farmhouse table.");return;}
                if(n>=2){game.State.mechanisms["household-task"]=n-2;game.Save();Toast("Tomorrow's shared task is chosen.");return;}
                if(BondService.Household(game.State,n==0?"breakfast":"evening",out var message)){game.Save();Dialogue(person,message,new[]{"I'm glad you're here."},_=>ClosePanel());}else Toast(message);
            },i==0);}
        }
    }
}

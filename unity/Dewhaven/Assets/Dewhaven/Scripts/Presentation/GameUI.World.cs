using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using static Dewhaven.UIFactory;
namespace Dewhaven
{
    public sealed partial class GameUI
    {
        private RenderTexture mapTexture;
        private void Map()
        {MapAt(game.Player.MapPosition,Mathf.Min(56,Mathf.Max(game.World.Area.width,game.World.Area.height)+4));}
        private void MapAt(Vector2 focus,float span)
        {
            if(!game.Playing)return;
            var p=Open(game.World.Area.name);
            Button(p,"This place",24,112,(W-56)/2,48,Map,true);Button(p,"Valley",W/2+4,112,(W-56)/2,48,ValleyMap);
            if(mapTexture)Destroy(mapTexture);mapTexture=new RenderTexture(720,720,16,RenderTextureFormat.ARGB32);
            var camera=game.Camera;var target=camera.targetTexture;var position=camera.transform.position;float size=camera.orthographicSize,aspect=camera.aspect;
            focus=new Vector2(Mathf.Clamp(focus.x,0,game.World.Area.width),Mathf.Clamp(focus.y,0,game.World.Area.height));
            try{camera.targetTexture=mapTexture;camera.aspect=1;camera.transform.position=new Vector3(focus.x,-focus.y,-10);camera.orthographicSize=span/2;camera.Render();}
            finally{camera.targetTexture=target;camera.aspect=aspect;camera.transform.position=position;camera.orthographicSize=size;}
            var image=Rect(p,"Town map",24,184,W-48,W-48).gameObject.AddComponent<RawImage>();image.texture=mapTexture;image.raycastTarget=false;
            var caption=Text(p,"Choose a door to set a walking route.",24,538,W-48,60,20,Ink,true);
            WorldAnchor selected=null;
            foreach(var anchor in game.World.Area.anchors.Where(a=>a.kind=="door"||a.kind=="travel"||a.kind=="shop"||a.kind=="gathering"||a.kind=="worksite"&&WorldActivityService.Available(game.State,a.data)&&!game.State.receipts.Contains("site:"+a.id)))
            {
                float px=24+(anchor.position.x-focus.x+span/2)/span*(W-48);
                float py=184+(anchor.position.y-focus.y+span/2)/span*(W-48);
                if(px<42||px>W-42||py<202||py>184+W-66)continue;
                var b=Button(p,"",px-24,py-24,48,48,()=>{selected=anchor;var room=ContentRegistry.Find(ContentRegistry.Interiors,anchor.target);caption.text=room==null?anchor.label??"Walking route":(string)room["name"];});b.GetComponent<Image>().color=Color.clear;
                Image(b.transform,"Door marker",17,17,14,14,ArtBank.Shape("circle"),Bronze);
            }
            float bottom=184+W-48;
            Button(p,"+",W-82,194,48,48,()=>MapAt(focus,Mathf.Max(24,span*.65f)));
            Button(p,"−",W-82,248,48,48,()=>MapAt(focus,Mathf.Min(208,span/ .65f)));
            Button(p,"‹",34,bottom-58,48,48,()=>MapAt(focus+Vector2.left*span*.45f,span));
            Button(p,"›",W-82,bottom-58,48,48,()=>MapAt(focus+Vector2.right*span*.45f,span));
            Button(p,"↑",34,194,48,48,()=>MapAt(focus+Vector2.down*span*.45f,span));
            Button(p,"↓",88,bottom-58,48,48,()=>MapAt(focus+Vector2.up*span*.45f,span));
            Button(p,"Set walking route",24,H-82,W-48,52,()=>
            {
                if(selected==null){Toast("Choose a door on the map.");return;}
                SetRoute(selected.position);
            },true);
        }
        private void SetRoute(Vector2 destination)
        {
            var route=NavGrid.Route(game.World.Area,game.Player.MapPosition,destination,8192);
            if(route.Count==0){Toast("Use the connected streets to reach this place.");return;}
            game.World.ShowRoute(route);ClosePanel();Toast("Walking route set.");
        }
        private void ValleyMap()
        {
            var p=Open("The valley");Button(p,"This place",24,112,(W-56)/2,48,Map);Button(p,"Valley",W/2+4,112,(W-56)/2,48,ValleyMap,true);
            var regions=ContentRegistry.Read("world")["exteriors"].ToArray();
            for(int i=0;i<regions.Length;i++)
            {
                var region=regions[i];string id=(string)region["id"];int row=i/2,col=i%2;
                var b=Button(p,(string)region["name"],24+col*(W-40)/2,184+row*68,(W-56)/2,58,()=>RouteTo(id));
                foreach(var label in b.GetComponentsInChildren<TextMeshProUGUI>())label.fontSize=16*FontScale;
            }
        }
        private void RouteTo(string destination)
        {
            var area=game.World.Area;
            if(destination==area.id){ClosePanel();return;}
            if(area.interior){var door=area.anchors.FirstOrDefault(a=>a.id=="outside"||a.id=="return");if(door!=null)SetRoute(door.position);return;}
            var frontier=new Queue<string>();frontier.Enqueue(area.id);var came=new Dictionary<string,string>{{area.id,null}};
            var links=ContentRegistry.Read("world")["links"].Select(x=>new[]{(string)x[0],(string)x[1]}).ToArray();
            while(frontier.Count>0)
            {
                string current=frontier.Dequeue();if(current==destination)break;
                foreach(var edge in links)
                {
                    string next=edge[0]==current?edge[1]:edge[1]==current?edge[0]:null;
                    if(next==null||came.ContainsKey(next))continue;came[next]=current;frontier.Enqueue(next);
                }
            }
            if(!came.ContainsKey(destination)){Toast("Find this region's approach road first.");return;}
            string hop=destination;while(came[hop]!=area.id&&came[hop]!=null)hop=came[hop];
            var exit=area.anchors.FirstOrDefault(a=>a.target==hop);if(exit!=null)SetRoute(exit.position);else Toast("Return to the outdoor road first.");
        }
        private void RouteToRoom(string room)
        {
            if(game.World.Area.id==room){var counter=game.World.Area.anchors.FirstOrDefault(a=>a.kind=="shop");SetRoute(counter?.position??game.World.Area.entry);return;}
            var roomDef=ContentRegistry.Find(ContentRegistry.Interiors,room);
            if(roomDef==null){RouteTo(room);return;}
            if(game.World.Area.id==(string)roomDef["town"])
            {
                var door=game.World.Area.anchors.FirstOrDefault(a=>a.target==room);if(door!=null)SetRoute(door.position);
            }
            else RouteTo((string)roomDef["town"]);
        }
        private void Journal(int pageIndex)
        {MainJournal(pageIndex);}
        private bool NearResident(string id)
        {
            if(game.Residents.Nearest(game.Player.MapPosition)?.target==id)return true;
            var counter=game.World.Area.anchors.FirstOrDefault(x=>x.kind=="shop"&&Vector2.Distance(x.position,game.Player.MapPosition)<=1.5f);
            var shop=counter==null?null:ContentRegistry.Find(ContentRegistry.Shops,counter.target);return shop!=null&&(string)shop["owner"]==id;
        }
        public void Conversation(string id)
        {
            if(!NearResident(id)){Toast("Walk over to speak with them.");return;}
            var resident=ContentRegistry.Find(ContentRegistry.Residents,id);if(resident==null)return;
            if(!game.State.friends.TryGetValue(id,out var friend)){friend=new FriendState();game.State.friends[id]=friend;}
            bool first=!friend.met;if(first){friend.met=true;game.State.Count("met");}
            if(friend.talkedDay!=game.State.totalDays){friend.talkedDay=game.State.totalDays;friend.points=Math.Min(1000,friend.points+15);}
            game.Save();
            if(id=="mira"&&first)
            {
                Dialogue(resident,"You must be "+game.State.playerName+". Aya said someone had opened the old farmhouse. How did the garden look?",new[]{"Some crops are ready.","I'm finding my way."},choice=>
                {
                    Dialogue(resident,choice==0?"Gather those first. They will pay for your next seed packets. Keep the new rows watered each day.":"Start with turnips. The packets are here on the counter, and the village road takes you straight back to the farm.",new[]{"Let's talk.","See you later."},c=>{if(c==0)Topics(id);else ClosePanel();});
                });return;
            }
            var lines=resident["dialogue"].Values<string>().ToArray();int index=game.State.weather=="rain"?Math.Min(1,lines.Length-1):(game.State.totalDays+friend.points/15)%lines.Length;
            Dialogue(resident,lines[index],new[]{"Let's talk.","See you later."},choice=>{if(choice==0)Topics(id);else ClosePanel();});
        }
        private void Dialogue(JToken person,string message,string[] choices,Action<int> choose,int textPage=0,string voiceKey=null)
        {
            bool narrated=NarrationCatalog.Matches(voiceKey,message);
            var p=Open((string)person["name"],true);game.Residents.Reserved=(string)person["id"];
            var portrait=Image(p,"Illustrated speaker",16,10,132,154,ArtBank.Portrait((string)person["id"]));portrait.preserveAspect=true;
            var speaker=Text(p,(string)person["id"]=="letter"?"Grandmother":(string)person["name"],160,24,W-226,76,25,Ink,true);
            float nameHeight=speaker.GetPreferredValues(speaker.text,W-226,Mathf.Infinity).y;
            if(!narrated)Text(p,(string)person["role"],160,Mathf.Max(72,30+nameHeight),W-184,74,16,Muted);
            Icon(p,"close",W-60,12,48,ClosePanel);
            var probe=Text(p,"",0,0,W-80,100,16);float buttonHeight=52;
            foreach(string choice in choices)buttonHeight=Mathf.Max(buttonHeight,probe.GetPreferredValues(choice,W-80,Mathf.Infinity).y+18);
            Destroy(probe.gameObject);
            float bodyNeeded=100;
            if(narrated)
            {
                var measurement=Text(p,"",0,0,W-48,100,18);
                bodyNeeded=Mathf.Max(100,NarrationCatalog.Entry(voiceKey)["segments"].Max(s=>measurement.GetPreferredValues((string)s["text"],W-48,Mathf.Infinity).y)+8);
                Destroy(measurement.gameObject);
            }
            float bodyTop=180;
            float needed=bodyTop+bodyNeeded+Math.Min(2,choices.Length)*(buttonHeight+8)+28;
            float height=Mathf.Min(H-80,Mathf.Max(p.rect.height,needed));p.anchoredPosition=new Vector2(0,-(H-height));p.sizeDelta=new Vector2(W,height);
            float reserve=Math.Min(2,choices.Length)*(buttonHeight+8)+28;
            var body=Text(p,"",24,bodyTop,W-48,Mathf.Max(96,height-reserve-bodyTop),18);
            var voicePages=narrated?NarrationCatalog.Pages(voiceKey,text=>body.GetPreferredValues(text,W-48,Mathf.Infinity).y<=body.rectTransform.rect.height):null;
            var pages=narrated?voicePages.Select(v=>v.Text).ToList():WrapDialogue(message,body);textPage=Mathf.Clamp(textPage,0,pages.Count-1);body.text=pages[textPage];
            if(narrated)
            {
                var clips=voicePages[textPage].Clips;voicedPanel=true;game.Sound.Voice.PlayPage(voiceKey,clips);
                Button(p,"Replay",160,Mathf.Max(96,34+nameHeight),W-184,48,()=>game.Sound.Voice.PlayPage(voiceKey,clips));
            }
            if(!game.Preferences.instantText)StartCoroutine(Reveal(body));
            int count=textPage<pages.Count-1?1:Math.Min(2,choices.Length);
            for(int i=0;i<count;i++)
            {
                int index=i;string label=textPage<pages.Count-1?"Continue":choices[i];
                var response=Button(p,label,24,p.rect.height-count*(buttonHeight+8)-20+i*(buttonHeight+8),W-48,buttonHeight,()=>
                {
                    if(body.maxVisibleCharacters<body.text.Length){body.maxVisibleCharacters=int.MaxValue;return;}
                    if(textPage<pages.Count-1)Dialogue(person,message,choices,choose,textPage+1,voiceKey);else choose(index);
                },i==0);
                foreach(var t in response.GetComponentsInChildren<TextMeshProUGUI>())t.fontSize=16*FontScale;
            }
        }
        private static List<string> WrapDialogue(string message,TextMeshProUGUI body)
        {
            var pages=new List<string>();string current="";
            foreach(var sentence in System.Text.RegularExpressions.Regex.Split(message,"(?<=[.!?])\\s+"))
            {
                string candidate=current+(current.Length>0?" ":"")+sentence;
                if(body.GetPreferredValues(candidate,body.rectTransform.rect.width,Mathf.Infinity).y<=body.rectTransform.rect.height){current=candidate;continue;}
                if(current.Length>0){pages.Add(current);current="";}
                foreach(var word in sentence.Split(' '))
                {
                    candidate=current+(current.Length>0?" ":"")+word;
                    if(current.Length>0&&body.GetPreferredValues(candidate,body.rectTransform.rect.width,Mathf.Infinity).y>body.rectTransform.rect.height){pages.Add(current);current=word;}
                    else current=candidate;
                }
            }
            if(current.Length>0||pages.Count==0)pages.Add(current);return pages;
        }
        private IEnumerator Reveal(TextMeshProUGUI body)
        {
            body.maxVisibleCharacters=0;
            while(body&&body.maxVisibleCharacters<body.text.Length)
            {body.maxVisibleCharacters++;yield return new WaitForSecondsRealtime(.014f);}
        }
        private void Topics(string id)
        {
            if(!NearResident(id)){ClosePanel();return;}
            var person=ContentRegistry.Find(ContentRegistry.Residents,id);var p=Open("With "+(string)person["name"]);
            Image(p,"Portrait",W/2-36,116,72,90,ArtBank.Get((string)person["sprite"]+"/down/1")).preserveAspect=true;
            var topics=new List<KeyValuePair<string,Action>>
            {
                new KeyValuePair<string,Action>("Talk about the day",()=>Conversation(id)),
                new KeyValuePair<string,Action>("Requests",()=>Requests(id)),
                new KeyValuePair<string,Action>("Give a gift",()=>Gifts(id,0))
            };
            if((bool?)person["romance"]==true)topics.Add(new KeyValuePair<string,Action>("Spend time together",()=>Bond(id)));
            if((bool?)person["romance"]==true&&game.State.partner==null&&game.State.completed.Contains("bond-"+id+"-chapter-6"))topics.Add(new KeyValuePair<string,Action>("Make a promise",()=>Confirm("Share a life together?","Offer a promise ring. You will keep your work, share the farmhouse, and choose a daily household task.",()=>{if(!NearResident(id)){Toast("Meet them in person.");return;}if(BondService.Propose(game.State,id,out var response)){game.Save();Dialogue(person,response,new[]{"Let's begin."},_=>ClosePanel());}else Toast(response);}))); 
            var counter=game.World.Area.anchors.FirstOrDefault(a=>a.kind=="shop"&&Vector2.Distance(a.position,game.Player.MapPosition)<=1.5f);
            if(counter!=null)topics.Add(new KeyValuePair<string,Action>("Browse this counter",()=>Shop(counter)));
            float step=Mathf.Min(70,(H-344)/topics.Count);
            for(int i=0;i<topics.Count;i++)Button(p,topics[i].Key,24,244+i*step,W-48,52,topics[i].Value,i==0);
            Button(p,"Goodbye",24,H-82,W-48,52,ClosePanel);
        }
        public void Requests(string id,int pageIndex=0)
        {
            if(id!="letter"&&!NearResident(id)){ClosePanel();return;}
            var all=QuestService.All.Where(q=>QuestService.GiverId((string)q["giver"])==id&&!game.State.completed.Contains((string)q["id"])&&((bool?)q["main"]!=true||(string)QuestService.ActiveMain(game.State)?["id"]==(string)q["id"])).ToArray();
            var p=Open(id=="letter"?"Grandmother's ledger":"Requests");
            if(all.Length==0){Flow(p,id=="letter"?"Keep the first garden rows watered. Mira will want to hear how they grow.":"Nothing is needed today. There is still time for a conversation.",160,20,Muted);return;}
            pageIndex=Mathf.Clamp(pageIndex,0,all.Length-1);var quest=all[pageIndex];bool main=(bool?)quest["main"]==true;
            game.State.accepted.Add((string)quest["id"]);game.Save();
            float y=Flow(p,(main?"MAIN QUEST":"SIDE QUEST")+"  ·  "+QuestPresentation.Status(game.State,quest),126,16,Bronze);
            y=Flow(p,ContentRegistry.Text(quest["title"]),y+10,26,Ink,true);y=Flow(p,(string)quest["objective"],y+12,19);
            Flow(p,QuestPresentation.Progress(game.State,quest),y+12,16,Muted);
            string questVoice="quest-"+(string)quest["id"];if(main)Narrate(questVoice+"-objective",(string)quest["objective"]);
            int selectedPage=pageIndex;
            Button(p,"Objectives & rewards",24,H-270,W-48,48,()=>QuestDetails(quest,()=>Requests(id,selectedPage)));
            Button(p,"Hear the story",24,H-208,W-48,48,()=>Dialogue(StorySpeaker(id),(string)quest["opening"],new[]{"I'll see to it.","Back to the request."},_=>Requests(id,selectedPage),voiceKey:main?questVoice+"-opening":null));
            var handIn=Button(p,"Hand over & complete",24,H-146,W-48,52,()=>
            {
                if(id!="letter"&&!NearResident(id)){Toast("Return to the person who asked.");return;}
                if(id=="letter"&&game.Context()?.kind!="letter"){Toast("Return to Grandmother's ledger.");return;}
                bool changed=QuestService.HandIn(game.State,quest,id,out var message);bool saved=!changed||game.Save();
                if(changed){game.RefreshWorld();Dialogue(StorySpeaker(id),(string)quest["completion"],new[]{"Until next time."},_=>ClosePanel(),voiceKey:main?questVoice+"-completion":null);}
                if(saved)Toast(message);
            },true);
            handIn.interactable=QuestService.Ready(game.State,quest,out _);
            Pager(p,pageIndex,all.Length,n=>Requests(id,n));
        }
        private void Gifts(string id,int pageIndex)
        {
            if(!NearResident(id)){ClosePanel();return;}
            var person=ContentRegistry.Find(ContentRegistry.Residents,id);var p=Open("A gift for "+(string)person["name"]);
            var items=game.State.inventory.Where(x=>!x.Key.EndsWith("_seed")&&ContentRegistry.SellPrice(x.Key)>0).ToArray();
            for(int i=pageIndex*3;i<Math.Min(items.Length,pageIndex*3+3);i++)
            {
                var item=items[i];float y=150+(i-pageIndex*3)*156;Image(p,"Gift",24,y,86,94,ArtBank.Item(item.Key)).preserveAspect=true;
                Text(p,ContentRegistry.ItemName(item.Key),132,y,W-156,64,20);
                Button(p,"Give one",132,y+80,W-156,48,()=>
                {
                    var friend=game.State.friends[id];if(!NearResident(id)){Toast("Walk over to give this gift.");return;}
                    if(friend.giftedDay==game.State.totalDays){Toast("One thoughtful gift is enough for today.");return;}
                    if(!InventoryRules.Remove(game.State,item.Key))return;
                    bool loves=person["loves"].Values<string>().Contains(item.Key);friend.points=Math.Min(1000,friend.points+(loves?80:25));friend.giftedDay=game.State.totalDays;game.State.Count("gifts");game.Save();
                    Dialogue(person,loves?"You remembered. Thank you—I'll put this to good use.":"Thank you for thinking of me.",new[]{"See you soon."},_=>ClosePanel());
                },true);
            }
            if(items.Length==0)Text(p,"Bring something you have grown, gathered or made.",24,180,W-48,120,18,Muted);
            Pager(p,pageIndex,Mathf.CeilToInt(items.Length/3f),n=>Gifts(id,n));
        }
        private void Bond(string id)
        {
            if(!NearResident(id))return;
            var person=ContentRegistry.Find(ContentRegistry.Residents,id);
            var scene=BondService.Next(game.State,id);
            if(scene==null){Dialogue(person,"It's good to have a little time together.",new[]{"Stay a while."},_=>ClosePanel());return;}
            if(!BondService.CanMeet(game.State,scene,out var reason)){Dialogue(person,reason,new[]{"I will."},_=>ClosePanel());return;}
            var choices=scene["choices"].Values<string>().ToArray();
            Dialogue(person,(string)scene["line"],choices,choice=>
            {
                if(!NearResident(id))return;
                if(!BondService.Complete(game.State,(string)scene["id"],choice,out var response)){Toast(response);return;}game.Save();
                Dialogue(person,response,new[]{"Until next time."},_=>ClosePanel());
            });
        }
        private void ResidentsPage(int pageIndex)
        {
            var p=Open("People of the valley");var people=ContentRegistry.Residents.ToArray();
            int perPage=H<780?3:4;
            for(int i=pageIndex*perPage;i<Math.Min(people.Length,pageIndex*perPage+perPage);i++)
            {
                var person=people[i];float y=140+(i-pageIndex*perPage)*140;
                Image(p,"Resident",24,y,52,74,ArtBank.Get((string)person["sprite"]+"/down/1")).preserveAspect=true;
                Text(p,(string)person["name"],98,y,W-122,42,24,Ink,true);Text(p,(string)person["role"],98,y+46,W-122,42,14,Muted);
                Button(p,"Find on the map",98,y+86,W-122,48,()=>RouteToRoom(game.Residents.CurrentArea(person)));
            }
            Pager(p,pageIndex,Mathf.CeilToInt(people.Length/(float)perPage),n=>ResidentsPage(n));
        }
        private void Calendar()
        {CalendarDay(game.State.day);}
        private void CalendarDay(int selected)
        {
            var p=Open("The season ahead");string[] seasons={"Spring","Summer","Autumn","Winter"};
            Text(p,seasons[game.State.season]+" · Year "+game.State.year,24,132,W-48,56,28,Ink,true);
            for(int day=1;day<=28;day++)
            {
                int n=day;int col=(day-1)%7,row=(day-1)/7;float size=(W-48)/7;
                var b=Button(p,day.ToString(),24+col*size,200+row*56,size,52,()=>CalendarDay(n),day==selected);
            }
            var events=ContentRegistry.Read("quests")["events"].Where(e=>(string)e["date"]==seasons[game.State.season]+" "+selected).ToArray();
            Text(p,seasons[game.State.season]+" "+selected,24,442,W-48,40,22,Ink,true);
            if(events.Length==0)Text(p,"A quiet day in the valley.",24,496,W-48,60,18,Muted);
            else Button(p,(string)events[0]["name"],24,496,W-48,52,()=>Notice((string)events[0]["name"],(string)events[0]["activity"]+" Meet at the local shared table, 16:00–20:00. Bring a contribution."));
            Button(p,"Weekly tables",24,H-82,W-48,52,()=>WeeklyTables(0));
        }
        public void DungeonEntrance(WorldAnchor anchor)
        {
            var dungeon=ContentRegistry.Read("dungeons").FirstOrDefault(d=>anchor.target.StartsWith((string)d["id"]));
            var p=Open(dungeon==null?"Copperleaf Mine":(string)dungeon["name"]);
            Text(p,dungeon==null?"The old cart track reaches a copper seam. Bring a pick and leave enough energy for the walk home.":(string)dungeon["entryCopy"],24,156,W-48,270,20);
            Text(p,"Your bag is kept. Read the room diagrams; the return stairs stay open.",24,490,W-48,100,16,Muted);
            Button(p,"Enter",24,H-146,W-48,52,()=>game.Travel(anchor),true);Button(p,"Stay outside",24,H-80,W-48,48,ClosePanel);
        }
        public void Exploration(WorldAnchor anchor)
        {
            bool changed=ExplorationService.Interact(game.State,anchor,game.Player.MapPosition,out var message);
            if(changed){game.Sound.Play(anchor.kind=="treasure"?"seed":"pick");game.RefreshWorld();game.Save();}
            if(anchor.kind=="inspect")Notice("Archive diagram",message);else Toast(message,4);
        }
    }
}

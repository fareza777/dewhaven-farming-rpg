using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using static Dewhaven.UIFactory;

namespace Dewhaven
{
    public sealed partial class GameUI
    {
        private void JournalTabs(RectTransform p,bool main)
        {Button(p,"Main quest",24,108,(W-56)/2,48,()=>Journal(-1),main);Button(p,"Side quests",W/2+4,108,(W-56)/2,48,()=>SideNotebook("active",0),!main);}
        private float Flow(RectTransform p,string copy,float y,float size=18,Color? color=null,bool heading=false,float width=0)
        {
            if(width<=0)width=W-48;var text=Text(p,copy,24,y,width,100,size,color??Ink,heading);
            float height=text.GetPreferredValues(copy,width,Mathf.Infinity).y+6;text.rectTransform.sizeDelta=new Vector2(width,height);return y+height;
        }
        private void MainJournal(int index)
        {
            var chapters=ContentRegistry.Read("quests")["main"].ToArray();
            if(index<0){var active=QuestService.ActiveMain(game.State);index=active==null?chapters.Length-1:Array.FindIndex(chapters,c=>(string)c["id"]==(string)active["id"]);}
            index=Mathf.Clamp(index,0,chapters.Length-1);var chapter=chapters[index];var quest=QuestService.Rules((string)chapter["id"]);
            var p=Open("Your journal");JournalTabs(p,true);
            float y=Flow(p,"CHAPTER "+(index+1)+" / "+chapters.Length+"  ·  "+QuestPresentation.Status(game.State,quest),172,16,Bronze);
            y=Flow(p,(string)quest["title"],y+8,27,Ink,true);y=Flow(p,(string)quest["objective"],y+12,19);
            Flow(p,QuestPresentation.Progress(game.State,quest)+"  ·  "+(string)quest["giver"],y+14,16,Muted);
            Narrate("quest-"+(string)quest["id"]+"-objective",(string)quest["objective"]);
            int page=index;
            Button(p,"Objectives & rewards",24,H-208,W-48,48,()=>QuestDetails(quest,()=>Journal(page)),true);
            bool completed=game.State.completed.Contains((string)quest["id"]);
            Button(p,completed?"Read this memory":"Find quest giver",24,H-146,W-48,52,()=>{if(completed)Notice((string)quest["title"],(string)quest["completion"],voiceKey:"quest-"+(string)quest["id"]+"-completion");else FindQuestGiver(quest);});
            Pager(p,index,chapters.Length,n=>Journal(n));
        }
        private void SideNotebook(string filter,int index)
        {
            var p=Open("Your journal");JournalTabs(p,false);
            string[] filters={"active","available","completed"},labels={"Active","Available","Done"};
            for(int i=0;i<3;i++){string selected=filters[i];Button(p,labels[i],24+i*(W-44)/3,168,(W-56)/3,48,()=>SideNotebook(selected,0),selected==filter);}
            var quests=QuestPresentation.SideQuests(game.State,filter).ToArray();int perPage=H<780||FontScale>1.15f?1:2;
            int pages=Mathf.Max(1,Mathf.CeilToInt(quests.Length/(float)perPage));index=Mathf.Clamp(index,0,pages-1);
            Text(p,quests.Length+" "+(quests.Length==1?"request":"requests"),24,230,W-48,32,16,Muted);
            if(quests.Length==0)Flow(p,filter=="active"?"Meet your neighbours to take on a request. Browse Available to find someone nearby.":filter=="available"?"Explore another town to meet more neighbours.":"Your finished requests will be remembered here.",294,20,Muted);
            for(int i=index*perPage;i<Math.Min(quests.Length,(index+1)*perPage);i++)
            {
                var q=quests[i];float y=278+(i-index*perPage)*234;
                y=Flow(p,(string)q["title"],y,23,Ink,true);y=Flow(p,GiverLocation(q),y+6,16,Muted);
                y=Flow(p,QuestPresentation.Status(game.State,q)+"  ·  "+QuestPresentation.Progress(game.State,q),y+6,16,Bronze);
                int returnPage=index;Button(p,"View request",24,y+10,W-48,48,()=>QuestDetails(q,()=>SideNotebook(filter,returnPage)),true);
            }
            Pager(p,index,pages,n=>SideNotebook(filter,n));
        }
        private string GiverLocation(JToken quest)
        {
            string id=QuestService.GiverId((string)quest["giver"]);if(id=="letter")return "Grandmother's ledger · Farmhouse";
            var person=ContentRegistry.Find(ContentRegistry.Residents,id);if(person==null)return (string)quest["giver"];
            string area=game.Residents.CurrentArea(person);var room=ContentRegistry.Find(ContentRegistry.Interiors,area);var region=ContentRegistry.Read("world")["exteriors"].FirstOrDefault(r=>(string)r["id"]==area);
            return (string)person["name"]+" · "+(string)((room??region)?["name"]);
        }
        private void FindQuestGiver(JToken quest)
        {
            string id=QuestService.GiverId((string)quest["giver"]);if(id=="letter"){RouteToRoom("farmhouse");return;}
            var person=ContentRegistry.Find(ContentRegistry.Residents,id);if(person==null)return;
            if(game.Residents.TryPosition(id,out var position)){SetRoute(position);return;}
            RouteToRoom(game.Residents.CurrentArea(person));
        }
        private void QuestDetails(JToken quest,Action back,int pageIndex=0)
        {
            var p=Open((bool?)quest["main"]==true?"Main quest":"Side quest");
            Icon(p,"back",24,108,48,back);Text(p,QuestPresentation.Status(game.State,quest),84,114,W-108,38,17,Bronze);
            float y=Flow(p,(string)quest["title"],172,26,Ink,true);y=Flow(p,GiverLocation(quest),y+5,16,Muted);
            var requirements=quest["requirements"].ToArray();int perPage=H<780||FontScale>1.15f?2:3;int pages=Mathf.Max(1,Mathf.CeilToInt(requirements.Length/(float)perPage));pageIndex=Mathf.Clamp(pageIndex,0,pages-1);
            y+=18;
            foreach(var r in requirements.Skip(pageIndex*perPage).Take(perPage))
            {
                int amount=(int)r["amount"],actual=Mathf.Min(amount,QuestService.Progress(game.State,r));
                y=Flow(p,QuestService.RequirementName(r),y,18);
                y=Flow(p,(actual>=amount?"Done  ·  ":"")+actual+" / "+amount,y,16,Bronze)+10;
            }
            string rewards=QuestPresentation.Rewards(quest);if(!string.IsNullOrEmpty(rewards))Flow(p,"REWARD\n"+rewards,y+8,16,Muted);
            bool done=game.State.completed.Contains((string)quest["id"]);
            Button(p,done?"Back to journal":"Show the way",24,H-146,W-48,52,()=>{if(done)back();else FindQuestGiver(quest);},true);
            if(pages>1)Pager(p,pageIndex,pages,n=>QuestDetails(quest,back,n));else Button(p,"Back",24,H-82,W-48,48,back);
        }
    }
}

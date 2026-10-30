using System;
using System.Linq;
using Newtonsoft.Json.Linq;
namespace Dewhaven
{
    public static class BondService
    {
        public static JToken Next(GameState s,string person)=>ContentRegistry.Read("bond-scenes").FirstOrDefault(x=>(string)x["person"]==person&&!s.completed.Contains((string)x["id"]));
        public static bool CanMeet(GameState s,JToken scene,out string message)
        {
            message="";if(scene==null){message="All six memories are written.";return false;}
            if(s.completed.Contains((string)scene["id"])){message="This memory is already in your journal.";return false;}
            if(s.area!=(string)scene["area"]){message="Meet at "+(string)scene["place"]+" for this moment.";return false;}
            if(!s.friends.TryGetValue((string)scene["person"],out var f)||f.points<(int)scene["points"]){message="Spend more ordinary days together first.";return false;}
            if((int)scene["chapter"]>1&&!s.completed.Contains("bond-"+(string)scene["person"]+"-chapter-"+((int)scene["chapter"]-1))){message="Make time for the earlier memory first.";return false;}
            if(s.stats.TryGetValue("bond-day:"+(string)scene["person"],out int day)&&day==s.totalDays+1){message="Let today's memory settle. Come back tomorrow.";return false;}
            return true;
        }
        public static bool Complete(GameState s,string id,int choice,out string message)
        {
            message="Choose a response.";
            var scene=ContentRegistry.Read("bond-scenes").FirstOrDefault(x=>(string)x["id"]==id);
            if(choice<0||choice>1||!CanMeet(s,scene,out message))return false;
            s.completed.Add(id);s.mechanisms[(string)scene["memoryKey"]]=choice;s.stats["bond-day:"+(string)scene["person"]]=s.totalDays+1;
            var f=s.friends[(string)scene["person"]];f.points=Math.Min(1000,f.points+20);s.Count("bondEvents");
            message=(string)scene["responses"][choice];return true;
        }
        public static bool Propose(GameState s,string person,out string message)
        {
            message="";var resident=ContentRegistry.Find(ContentRegistry.Residents,person);
            if(resident==null||(bool?)resident["romance"]!=true||s.partner!=null){message="This promise needs two people who are ready.";return false;}
            if(s.area!=(string)resident["work"]&&s.area!=(string)resident["home"]){message="Visit them at home or at work.";return false;}
            if(!s.friends.TryGetValue(person,out var f)||f.points<800||!s.completed.Contains("bond-"+person+"-chapter-6")){message="Reach eight hearts and finish your six shared memories first.";return false;}
            if(!InventoryRules.Remove(s,"ring")){message="Bring a promise ring from Ellis's shop.";return false;}
            s.partner=person;s.mechanisms["household-task"]=0;message="Yes. Let's make a home that has room for both our lives.";return true;
        }
        public static bool Household(GameState s,string action,out string message)
        {
            message="";if(string.IsNullOrEmpty(s.partner)||s.area!="farmhouse"){message="Meet your partner at home.";return false;}
            string key="home:"+action+":"+s.totalDays;
            if(s.receipts.Contains(key)){message="You already made time for this today.";return false;}
            if(action=="breakfast"&&s.minute>=540){message="Breakfast is shared before 09:00.";return false;}
            if(action=="evening"&&s.minute<1140){message="Settle in together after 19:00.";return false;}
            s.receipts.Add(key);s.energy=Math.Min(s.maxEnergy,s.energy+10);s.friends[s.partner].points=Math.Min(1000,s.friends[s.partner].points+10);
            message=action=="breakfast"?"A quiet breakfast before you each begin the day.":"The work can wait until tomorrow. There is time to listen.";return true;
        }
    }
}

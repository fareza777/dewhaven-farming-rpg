using System;
using System.Linq;
using Newtonsoft.Json.Linq;
namespace Dewhaven
{
    public static class CalendarService
    {
        public static string[] Seasons={"Spring","Summer","Autumn","Winter"};
        public static JToken Definition(string id)=>ContentRegistry.Read("quests")["weekly"].Concat(ContentRegistry.Read("calendar-activities")).FirstOrDefault(x=>(string)x["id"]==id);
        public static bool IsToday(GameState s,JToken gathering)=>gathering["weekday"]!=null?s.totalDays%7==(int)gathering["weekday"]:(string)gathering["date"]==Seasons[s.season]+" "+s.day;
        public static bool Open(GameState s,JToken gathering)=>IsToday(s,gathering)&&s.minute>=((int?)gathering["from"]??960)&&s.minute<((int?)gathering["to"]??1200);
        public static string Offering(GameState s)=>new[]{"soup","stew","fish_dinner","omelet","jam","turnip","carrot","flower"}.FirstOrDefault(id=>InventoryRules.Count(s,id)>0);
        public static bool Attend(GameState s,string id,out string message)
        {
            message="";var g=Definition(id);
            if(g==null||s.area!=(string)g["area"]){message="Join the host at the town's shared table.";return false;}
            if(!Open(s,g)){message="Gatherings run "+(((int?)g["from"]??960)/60)+":00–"+(((int?)g["to"]??1200)/60)+":00 on the marked date.";return false;}
            string receipt="gathering:"+id+":"+s.totalDays;
            if(s.receipts.Contains(receipt)){message="You already shared this table today.";return false;}
            if(g["consume"]!=null)
            {
                if(!FarmingService.Exchange(s,g["consume"].ToObject<System.Collections.Generic.Dictionary<string,int>>(),g["produce"].ToObject<System.Collections.Generic.Dictionary<string,int>>(),0,0,out message))return false;
            }
            else
            {
                string offering=Offering(s);if(offering==null){message="Bring a dish, a crop, or flowers to share.";return false;}
                InventoryRules.Remove(s,offering);
            }
            s.receipts.Add(receipt);s.Count("communityEvents");s.Count("attended:"+id);
            foreach(var resident in ContentRegistry.Residents.Where(r=>(string)r["town"]==s.area))
                if(s.friends.TryGetValue((string)resident["id"],out var f))f.points=Math.Min(1000,f.points+10);
            s.energy=Math.Min(s.maxEnergy,s.energy+12);message="A place at the table  ·  +12 energy";return true;
        }
    }
}

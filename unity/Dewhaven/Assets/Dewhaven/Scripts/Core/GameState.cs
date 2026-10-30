using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
namespace Dewhaven
{
    [Serializable] public sealed class PlotState
    {
        public string id, crop;
        public bool tilled, watered;
        public int growth;
        public bool fertilizer;
    }
    [Serializable] public sealed class FriendState { public int points, talkedDay=-1, giftedDay=-1; public bool met; }
    [Serializable] public sealed class AnimalState { public string id="chicken-1",kind="chicken",name="Pip"; public int age=3,hearts=1;public bool fed,petted,product=true; }
    [Serializable] public sealed class GameState
    {
        public int version = 2, day = 1, season, year = 1, totalDays, minute = 360;
        public int gold = 500, energy = 100, maxEnergy = 100, capacity = 30;
        public string playerName = "Ash", farmName = "Amber", area = "farmhouse", appearance = "look-fieldkeeper";
        public float x = 14, y = 14;
        public Dictionary<string,int> inventory = new Dictionary<string,int>();
        public Dictionary<string,int> shipping = new Dictionary<string,int>();
        public Dictionary<string,int> storage = new Dictionary<string,int>();
        public List<PlotState> plots = new List<PlotState>();
        public List<string> receipts = new List<string>();
        public List<AnimalState> animals = new List<AnimalState>();
        public Dictionary<string,FriendState> friends = new Dictionary<string,FriendState>();
        public Dictionary<string,int> stats = new Dictionary<string,int>();
        public Dictionary<string,int> upgrades = new Dictionary<string,int>();
        public HashSet<string> completed = new HashSet<string>();
        public HashSet<string> accepted = new HashSet<string>();
        public HashSet<string> discoveries = new HashSet<string>();
        public HashSet<string> removed = new HashSet<string>();
        public Dictionary<string,int> mechanisms = new Dictionary<string,int>();
        public Dictionary<string,string> equipment = new Dictionary<string,string>();
        public string weather="sunny",selectedTool="hand",selectedSeed="turnip",partner;
        public int slot;
        public void Count(string key,int amount=1) { stats[key]=(stats.TryGetValue(key,out int n)?n:0)+amount; }
        public static GameState New(string name,string farm,string appearance,int slot=0)
        {
            var s=new GameState {playerName=CleanName(name,20,"Robin"),farmName=CleanName(farm,24,"Amber"),appearance=appearance,capacity=24,slot=slot,x=12,y=9.5f};
            foreach(var pair in new Dictionary<string,int>{{"turnip_seed",12},{"carrot_seed",6},{"potato_seed",4},{"feed",8},{"berry",3},{"wood",5},{"stone",3}}) s.inventory[pair.Key]=pair.Value;
            for(int i=0;i<32;i++) s.plots.Add(new PlotState{id="plot-"+i,tilled=i%8<4});
            int[] indices={0,1,2,3,8,9,10,11,16,17,18,19};
            string[] crops={"turnip","turnip","carrot","cabbage","turnip","potato","carrot","cabbage","turnip","potato","carrot","cabbage"};
            int[] growth={3,3,4,6,1,2,2,3,1,1,1,1};
            for(int i=0;i<indices.Length;i++) { var p=s.plots[indices[i]];p.crop=crops[i];p.growth=growth[i];p.watered=i>3; }
            s.animals.Add(new AnimalState());
            foreach(var resident in ContentRegistry.Residents) s.friends[(string)resident["id"]]=new FriendState();
            s.discoveries.Add("farm"); s.discoveries.Add("village");s.accepted.Add("new-roots");
            return s;
        }
        public static string CleanName(string value,int max,string fallback)
        {
            value=(value??"").Replace("<","").Replace(">","").Trim();
            return value.Length==0?fallback:value.Substring(0,Math.Min(max,value.Length));
        }
    }
    public sealed class FarmRules
    {
        public bool FinishDay(GameState state, int expectedTotalDays)
        {
            if(state.totalDays!=expectedTotalDays) return false;
            int payment=state.shipping.Sum(x=>ContentRegistry.SellPrice(x.Key)*x.Value);
            state.gold+=payment;state.Count("earned",payment);state.shipping.Clear();
            foreach(var p in state.plots)
            {
                if(!string.IsNullOrEmpty(p.crop) && p.watered) p.growth+=p.fertilizer?2:1;
                p.watered=false;
            }
            foreach(var animal in state.animals)
            {
                animal.age++;animal.product=animal.fed;animal.fed=false;animal.petted=false;
            }
            state.totalDays++;state.day++;if(state.day>28){state.day=1;state.season++;if(state.season>3){state.season=0;state.year++;}}
            foreach(var bed in state.plots)
                if(!string.IsNullOrEmpty(bed.crop)&&!FarmingService.InSeason(state,bed.crop)){bed.crop=null;bed.growth=0;}
            if(state.stats.TryGetValue("convoy-pickup-day",out int pickup)&&state.totalDays>=pickup&&state.stats.TryGetValue("convoy-packed",out int packed)&&packed==3)state.stats["convoy-delivered"]=1;
            state.removed.RemoveWhere(id=>id.Contains("forage-")||(state.totalDays%3==0&&id.Contains("-ore-"))||(state.totalDays%14==0&&id.Contains("farm-resource-")));
            if(!string.IsNullOrEmpty(state.partner))
            {
                int task=state.mechanisms.TryGetValue("household-task",out int chosen)?chosen:0;
                if(task==0)foreach(var p in state.plots.Where(p=>p.tilled).Take(8))p.watered=true;
                else foreach(var animal in state.animals){animal.fed=true;animal.petted=true;}
            }
            state.weather=(state.totalDays*17+13)%7<2?"rain":"sunny";
            if(state.weather=="rain")foreach(var p in state.plots) if(p.tilled) p.watered=true;
            FarmEquipment.Dawn(state);
            state.minute=360;state.energy=state.maxEnergy;
            state.area="farmhouse";state.x=12;state.y=9.5f;
            return true;
        }
    }
    public sealed class TradeSession : IDisposable
    {
        private readonly GameState state;
        private readonly Dictionary<string,int> stock;
        private readonly Func<bool> canContinue;
        private bool valid;
        public TradeSession(GameState state,string room,string requiredRoom,float distance,int minute,Dictionary<string,int> stock,int open=480,int close=1080,Func<bool> canContinue=null)
        {
            this.state=state;this.stock=stock;this.canContinue=canContinue;
            valid=room==requiredRoom && distance<=1.5f && distance>=0 && minute>=open && minute<close;
        }
        public bool Buy(string item,int quantity,out string reason)
        {
            reason="";
            if(!valid || (canContinue!=null&&!canContinue())) {reason="This counter is closed.";return false;}
            if(quantity<1||quantity>999||!stock.TryGetValue(item,out int price)||price<1||ContentRegistry.Items[item]==null) {reason="Choose a stocked item.";return false;}
            long cost=(long)price*quantity;
            if(cost>state.gold){reason="You need more gold.";return false;}
            if(!InventoryRules.CanAdd(state,item,quantity)){reason="Make room in your bag.";return false;}
            InventoryRules.Add(state,item,quantity);state.gold-=(int)cost;state.Count("bought",quantity);return true;
        }
        public void Dispose() { valid=false; }
    }
    public sealed class ToolSequence
    {
        public bool Busy { get; private set; }
        private float time,duration;
        private bool impacted;
        private Action impact;
        public float Progress => duration>0?Mathf.Clamp01(time/duration):0;
        public bool Start(float duration,Action impact)
        {
            if(Busy || duration<=0) return false;
            this.duration=duration;this.impact=impact;time=0;impacted=false;Busy=true;return true;
        }
        public void Advance(float elapsed)
        {
            if(!Busy || elapsed<=0 || float.IsNaN(elapsed))return;
            time+=elapsed;
            if(!impacted && time>=duration*.48f){impacted=true;impact?.Invoke();}
            if(time>=duration){Busy=false;impact=null;}
        }
        public void Cancel() { Busy=false;impact=null; }
    }
    public static class InventoryRules
    {
        public static bool Store(GameState s,string item,int count,bool withdraw,out string message)
        {
            message="";if(s.area!="farmhouse"){message="Use your farmhouse storage chest.";return false;}
            var source=withdraw?s.storage:s.inventory;var target=withdraw?s.inventory:s.storage;int limit=withdraw?s.capacity:100;
            if(count<1||count>999||ContentRegistry.Items[item]==null||!source.TryGetValue(item,out int available)||available<count){message="Choose an available quantity.";return false;}
            int held=target.TryGetValue(item,out int n)?n:0;
            if(held+count>999||held==0&&target.Count>=limit){message=withdraw?"Make room in your bag.":"The chest is full.";return false;}
            if(count==available)source.Remove(item);else source[item]=available-count;target[item]=held+count;
            message=withdraw?"Moved to your bag.":"Stored safely at home.";return true;
        }
        public static int Count(GameState s,string id) => s.inventory.TryGetValue(id,out int count)?count:0;
        public static bool CanAdd(GameState s,string id,int count=1) => count>0 && count<=999 && ContentRegistry.Items[id]!=null && (s.inventory.ContainsKey(id)||s.inventory.Count<s.capacity) && Count(s,id)+count<=999;
        public static bool Add(GameState s,string id,int count=1)
        {
            if(!CanAdd(s,id,count))return false;s.inventory[id]=Count(s,id)+count;return true;
        }
        public static bool Remove(GameState s,string id,int count=1)
        {
            if(count<=0||Count(s,id)<count)return false;
            int remaining=Count(s,id)-count;if(remaining==0)s.inventory.Remove(id);else s.inventory[id]=remaining;return true;
        }
    }
}

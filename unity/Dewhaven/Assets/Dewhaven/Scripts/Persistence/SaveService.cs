using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
namespace Dewhaven
{
    public sealed class SaveService
    {
        private readonly string folder;
        private static readonly JsonSerializerSettings Settings=new JsonSerializerSettings{TypeNameHandling=TypeNameHandling.None,MaxDepth=32};
        [Serializable] private sealed class Envelope { public int format=2;public string checksum,body; }
        public SaveService(string folder) { this.folder=folder; }
        public bool Save(int slot,GameState state,out string error)
        {
            error="";
            try
            {
                CheckSlot(slot);Validate(state);
                string body=JsonConvert.SerializeObject(state,Settings);
                var data=Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new Envelope{body=body,checksum=Hash(body)},Settings));
                if(data.Length>250000)throw new InvalidDataException("Save is too large.");
                Directory.CreateDirectory(folder);string path=PathFor(slot),temp=path+".tmp";
                using(var stream=new FileStream(temp,FileMode.Create,FileAccess.Write,FileShare.None)){stream.Write(data,0,data.Length);stream.Flush(true);}
                Read(temp);
                if(File.Exists(path))
                {
                    string previous=path+".bak";
                    try{Read(path);}catch(Exception e) when(IsReadFailure(e)){previous=path+".invalid";}
                    File.Replace(temp,path,previous,true);
                }
                else File.Move(temp,path);
                return true;
            }
            catch(Exception e) when(e is IOException || e is InvalidDataException || e is UnauthorizedAccessException || e is JsonException || e is ArgumentException)
            {error="Could not save: "+e.Message;return false;}
        }
        public GameState Load(int slot,out string error)
        {
            error="";CheckSlot(slot);string path=PathFor(slot);
            if(!HasSlot(slot))return null;
            try{return Read(path);}catch(Exception e) when(IsReadFailure(e))
            {
                try{var recovered=Read(path+".bak");error="Recovered the previous backup.";return recovered;}
                catch(Exception backup) when(IsReadFailure(backup)){error="This save could not be read. Your files have been kept.";return null;}
            }
        }
        public string PathFor(int slot) => Path.Combine(folder,"slot-"+slot+".json");
        public bool Import(int slot,ImportPreview preview,out string error)
        {
            error="";
            try
            {
                CheckSlot(slot);if(preview==null||!preview.Success||string.IsNullOrEmpty(preview.Original))throw new InvalidDataException("Preview a valid homestead first.");
                Validate(preview.Candidate);string archive=Path.Combine(folder,"imported-originals");Directory.CreateDirectory(archive);
                string prefix=DateTime.UtcNow.ToString("yyyyMMdd-HHmmss")+"-slot-"+slot+"-"+Guid.NewGuid().ToString("N").Substring(0,8);
                File.WriteAllText(Path.Combine(archive,prefix+".source.json"),preview.Original);
                string primary=PathFor(slot);if(File.Exists(primary))File.Copy(primary,Path.Combine(archive,prefix+".previous.json"));
                if(File.Exists(primary+".bak"))File.Copy(primary+".bak",Path.Combine(archive,prefix+".backup.json"));
                preview.Candidate.slot=slot;return Save(slot,preview.Candidate,out error);
            }
            catch(Exception e) when(IsReadFailure(e)){error="The import was not saved: "+e.Message;return false;}
        }
        public bool HasSlot(int slot){CheckSlot(slot);string path=PathFor(slot);return File.Exists(path)||File.Exists(path+".bak");}
        private static bool IsReadFailure(Exception e)=>e is IOException||e is InvalidDataException||e is UnauthorizedAccessException||e is JsonException||e is ArgumentException;
        private static void CheckSlot(int slot){if(slot<0||slot>2)throw new ArgumentOutOfRangeException(nameof(slot));}
        private static GameState Read(string path)
        {
            if(new FileInfo(path).Length>250000)throw new InvalidDataException("Save is too large.");
            return Decode(File.ReadAllText(path));
        }
        public static string Export(GameState state)
        {Validate(state);string body=JsonConvert.SerializeObject(state,Settings);return JsonConvert.SerializeObject(new Envelope{body=body,checksum=Hash(body)},Settings);}
        public static GameState Decode(string json)
        {
            if(string.IsNullOrEmpty(json)||Encoding.UTF8.GetByteCount(json)>250000)throw new InvalidDataException("Save is too large.");
            var envelope=JsonConvert.DeserializeObject<Envelope>(json,Settings);
            if(envelope==null||envelope.format!=2||envelope.body==null||envelope.checksum!=Hash(envelope.body))throw new InvalidDataException("Checksum mismatch.");
            var state=JsonConvert.DeserializeObject<GameState>(envelope.body,Settings);Validate(state);return state;
        }
        private static string Hash(string body)
        {
            using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(body))).Replace("-","").ToLowerInvariant();
        }
        public static void Validate(GameState s)
        {
            if(s==null||s.version!=2||s.day<1||s.day>28||s.season<0||s.season>3||s.year<1||s.totalDays<0||s.minute<360||s.minute>1560||s.gold<0||s.capacity<1||s.capacity>100||s.energy<0||s.energy>s.maxEnergy||s.maxEnergy<1||s.maxEnergy>500) throw new InvalidDataException("Invalid farm values.");
            if(float.IsNaN(s.x)||float.IsInfinity(s.x)||float.IsNaN(s.y)||float.IsInfinity(s.y)||Math.Abs(s.x)>300||Math.Abs(s.y)>300)throw new InvalidDataException("Invalid position.");
            if(s.playerName==null||s.playerName.Length>20||s.farmName==null||s.farmName.Length>24||s.area==null||s.area.Length>60)throw new InvalidDataException("Invalid names.");
            if(s.inventory==null||s.shipping==null||s.storage==null||s.storage.Count>100||s.inventory.Count>s.capacity||s.receipts==null||s.receipts.Count>3000||s.receipts.Distinct().Count()!=s.receipts.Count)throw new InvalidDataException("Invalid inventory or receipts.");
            foreach(var pair in s.inventory.Concat(s.shipping).Concat(s.storage)) if(ContentRegistry.Items[pair.Key]==null||pair.Value<1||pair.Value>999)throw new InvalidDataException("Invalid item quantity.");
            if(s.plots==null||s.plots.Count>1000||s.plots.Any(p=>p==null)||s.plots.Select(p=>p.id).Distinct().Count()!=s.plots.Count)throw new InvalidDataException("Invalid growing patch.");
            foreach(var p in s.plots)if(p.id==null||p.id.Length>80||p.growth<0||p.growth>1000||(!string.IsNullOrEmpty(p.crop)&&ContentRegistry.Crops[p.crop]==null))throw new InvalidDataException("Invalid crop.");
            if(!ContentRegistry.AreaIds.Contains(s.area)||s.friends==null||s.stats==null||s.completed==null||s.accepted==null||s.discoveries==null||s.removed==null||s.mechanisms==null||s.animals==null||s.upgrades==null||s.equipment==null||s.equipment.Count>16)throw new InvalidDataException("Invalid world state.");
            if(s.animals.Count>9||s.friends.Count>25||s.completed.Count>500||s.accepted.Count>100||s.stats.Count>300||s.mechanisms.Count>1000||s.removed.Count>3000)throw new InvalidDataException("Too much world data.");
            foreach(var pair in s.friends)if(ContentRegistry.Find(ContentRegistry.Residents,pair.Key)==null||pair.Value==null||pair.Value.points<0||pair.Value.points>1000)throw new InvalidDataException("Invalid friendship.");
            foreach(var animal in s.animals)if(animal==null||string.IsNullOrEmpty(animal.id)||animal.id.Length>80||animal.name==null||animal.name.Length>24||animal.hearts<0||animal.hearts>10||!new[]{"chicken","pig","rabbit"}.Contains(animal.kind))throw new InvalidDataException("Invalid animal.");
            foreach(var key in s.completed.Concat(s.accepted).Concat(s.receipts).Concat(s.mechanisms.Keys).Concat(s.stats.Keys))if(key==null||key.Length>120)throw new InvalidDataException("Invalid progress key.");
        }
    }
}

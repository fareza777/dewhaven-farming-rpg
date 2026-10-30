using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
namespace Dewhaven.Editor
{
    public static class VoiceAssets
    {
        public static string QueueImport()
        {
            EditorBridge.EnsureProject();string report=Path.GetFullPath("../../docs/unity/voiceover-import.json");
            if(File.Exists(report))File.Delete(report);
            EditorApplication.delayCall+=()=>
            {
                try
                {
                    AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                    var entries=ContentRegistry.Read("voiceover")["entries"].ToArray();
                    var segments=entries.SelectMany(e=>e["segments"]).GroupBy(s=>(string)s["id"]).Select(g=>g.First()).ToArray();
                    foreach(var segment in segments)
                    {
                        string path="Assets/Dewhaven/Resources/"+(string)segment["path"]+".wav";
                        var importer=(AudioImporter)AssetImporter.GetAtPath(path);if(!importer)throw new InvalidDataException("Missing voice clip: "+path);
                        var sample=importer.defaultSampleSettings;sample.loadType=AudioClipLoadType.CompressedInMemory;sample.compressionFormat=AudioCompressionFormat.Vorbis;sample.quality=.85f;sample.sampleRateSetting=AudioSampleRateSetting.PreserveSampleRate;sample.preloadAudioData=false;
                        importer.defaultSampleSettings=sample;importer.forceToMono=true;importer.loadInBackground=true;importer.SaveAndReimport();
                    }
                    var clips=segments.Select(s=>
                    {
                        string path="Assets/Dewhaven/Resources/"+(string)s["path"]+".wav";var clip=AssetDatabase.LoadAssetAtPath<AudioClip>(path);
                        if(!clip||clip.length<=0||clip.channels!=1||clip.frequency!=24000)throw new InvalidDataException("Invalid imported speech: "+path);
                        return new{id=(string)s["id"],seconds=clip.length,channels=clip.channels,rate=clip.frequency};
                    }).ToArray();
                    File.WriteAllText(report,Newtonsoft.Json.JsonConvert.SerializeObject(new{success=true,passages=entries.Length,clips=clips.Length,seconds=clips.Sum(c=>c.seconds),loadType="CompressedInMemory",preload=false,background=true,quality=.85f,files=clips},Newtonsoft.Json.Formatting.Indented));
                }
                catch(Exception e){File.WriteAllText(report,Newtonsoft.Json.JsonConvert.SerializeObject(new{success=false,error=e.ToString()}));Debug.LogException(e);}
            };
            return "Narration import queued in the dedicated Dewhaven editor.";
        }
    }
}

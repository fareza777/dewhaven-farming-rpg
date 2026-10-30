using System;
using System.IO;
using System.Linq;
using System.Collections;
using System.Reflection;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
namespace Dewhaven.Tests
{
    public sealed class NarrationTests
    {
        [Test] public void EveryIntroAndMainQuestPassageHasMatchingBundledSpeech()
        {
            var entries=(JArray)ContentRegistry.Read("voiceover")["entries"];
            Assert.That(entries.Count,Is.EqualTo(76));
            foreach(var page in ContentRegistry.Read("intro")["pages"])
                AssertEntry(entries,(string)page["voiceKey"],(string)page["text"]);
            foreach(var quest in QuestService.All.Where(q=>(bool?)q["main"]==true))
                foreach(var kind in new[]{"objective","opening","completion"})AssertEntry(entries,"quest-"+(string)quest["id"]+"-"+kind,(string)quest[kind]);
        }
        private static void AssertEntry(JArray entries,string key,string text)
        {
            var entry=entries.Single(e=>(string)e["key"]==key);Assert.That((string)entry["text"],Is.EqualTo(text));
            Assert.That(string.Join(" ",entry["segments"].Select(s=>(string)s["text"])),Is.EqualTo(text));
            foreach(var segment in entry["segments"])Assert.That(File.Exists("Assets/Dewhaven/Resources/"+(string)segment["path"]+".wav"),Is.True,key+" has missing speech.");
        }
        [Test] public void LegacyPreferencesEnableVoiceWithoutResettingExistingControls()
        {
            var parse=typeof(UserPreferences).GetMethod("FromJson",BindingFlags.Public|BindingFlags.Static);
            Assert.That(parse,Is.Not.Null,"Legacy preferences need additive voice defaults.");
            var pref=(UserPreferences)parse.Invoke(null,new object[]{"{\"floating\":false,\"natureVolume\":0.3}"});
            Assert.That(pref.floating,Is.False);Assert.That(pref.natureVolume,Is.EqualTo(.3f));
            Assert.That((bool)typeof(UserPreferences).GetField("voiceOver").GetValue(pref),Is.True);
            Assert.That((float)typeof(UserPreferences).GetField("voiceVolume").GetValue(pref),Is.EqualTo(.85f));
        }
        [Test] public void NarrationPaginationNeverDropsOrRepeatsSentences()
        {
            var catalog=typeof(ContentRegistry).Assembly.GetType("Dewhaven.NarrationCatalog");
            Assert.That(catalog,Is.Not.Null,"A sentence-aware catalogue is required for large text.");
            foreach(var entry in ContentRegistry.Read("voiceover")["entries"])
            {
                var pages=(IEnumerable)catalog.GetMethod("Pages").Invoke(null,new object[]{(string)entry["key"],new Func<string,bool>(s=>s.Length<=140)});
                var copy=new System.Collections.Generic.List<string>();var clips=new System.Collections.Generic.List<string>();
                foreach(var page in pages){var type=page.GetType();string text=(string)type.GetField("Text").GetValue(page);Assert.That(text.Length,Is.LessThanOrEqualTo(140));copy.Add(text);clips.AddRange((string[])type.GetField("Clips").GetValue(page));}
                Assert.That(string.Join(" ",copy),Is.EqualTo((string)entry["text"]));
                Assert.That(clips,Is.EqualTo(entry["segments"].Select(s=>(string)s["id"]).ToArray()));
            }
        }
    }
}

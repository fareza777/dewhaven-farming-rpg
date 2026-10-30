using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEngine;
namespace Dewhaven.Editor
{
    public static class ImportSettings
    {
        public static string ApplyPortraits()
        {
            EditorBridge.EnsureProject();int count=0;
            foreach(var guid in AssetDatabase.FindAssets("t:Texture2D",new[]{"Assets/Dewhaven/Resources/Dewhaven/Art/Portraits"}))
            {
                var path=AssetDatabase.GUIDToAssetPath(guid);var importer=(TextureImporter)AssetImporter.GetAtPath(path);
                var current=importer.GetPlatformTextureSettings("Android");
                if(current.overridden&&current.format==TextureImporterFormat.ASTC_6x6&&!importer.mipmapEnabled&&!importer.isReadable){count++;continue;}
                importer.textureType=TextureImporterType.Default;importer.mipmapEnabled=false;importer.filterMode=FilterMode.Bilinear;importer.wrapMode=TextureWrapMode.Clamp;
                importer.alphaIsTransparency=true;importer.maxTextureSize=512;importer.isReadable=false;
                importer.textureCompression=TextureImporterCompression.CompressedHQ;
                importer.SetPlatformTextureSettings(new TextureImporterPlatformSettings{name="Android",overridden=true,maxTextureSize=512,format=TextureImporterFormat.ASTC_6x6,compressionQuality=100});
                importer.SaveAndReimport();count++;
            }
            AssetDatabase.SaveAssets();return "Configured "+count+" lazy-loaded transparent portraits; Android ASTC 6x6, no mipmaps or CPU copy.";
        }
        public static string QueueFinishingAssets(string reportName="compact-asset-import.json")
        {
            EditorBridge.EnsureProject();
            EditorApplication.delayCall+=()=>
            {
                string report=Path.GetFullPath("../../docs/unity/"+reportName);
                try
                {
                    AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);string portraits=ApplyPortraits();int audio=0;
                    foreach(string folder in new[]{"Nature","Foley","Music"})
                        foreach(var guid in AssetDatabase.FindAssets("t:AudioClip",new[]{"Assets/Dewhaven/Resources/Dewhaven/Audio/"+folder}))
                        {
                            var path=AssetDatabase.GUIDToAssetPath(guid);var importer=(AudioImporter)AssetImporter.GetAtPath(path);var sample=importer.defaultSampleSettings;
                            sample.loadType=folder!="Foley"?AudioClipLoadType.Streaming:AudioClipLoadType.DecompressOnLoad;sample.compressionFormat=AudioCompressionFormat.Vorbis;sample.quality=.8f;sample.sampleRateSetting=AudioSampleRateSetting.PreserveSampleRate;sample.preloadAudioData=folder=="Foley";
                            importer.defaultSampleSettings=sample;importer.forceToMono=folder=="Foley";importer.loadInBackground=folder!="Foley";importer.SaveAndReimport();audio++;
                        }
                    File.WriteAllText(report,Newtonsoft.Json.JsonConvert.SerializeObject(new{success=true,portraits,audio,originalAmbientMusic=true,percussion=false}));
                }
                catch(Exception e){File.WriteAllText(report,Newtonsoft.Json.JsonConvert.SerializeObject(new{success=false,error=e.ToString()}));Debug.LogException(e);}
            };
            return "Finishing art and audio imports queued.";
        }
        public static string ApplyHudIcons()
        {
            EditorBridge.EnsureProject();int count=0;
            foreach(var guid in AssetDatabase.FindAssets("t:Texture2D",new[]{"Assets/Dewhaven/Resources/Dewhaven/Art/Hud"}))
            {
                var path=AssetDatabase.GUIDToAssetPath(guid);if(!(AssetImporter.GetAtPath(path) is TextureImporter importer))continue;
                importer.textureType=TextureImporterType.Default;importer.mipmapEnabled=false;importer.filterMode=FilterMode.Bilinear;
                importer.wrapMode=TextureWrapMode.Clamp;importer.textureCompression=TextureImporterCompression.Uncompressed;
                importer.alphaIsTransparency=true;importer.maxTextureSize=256;importer.SaveAndReimport();count++;
            }
            AssetDatabase.SaveAssets();return "Configured "+count+" transparent painted HUD icons at 256 pixels, without mipmaps.";
        }
        public static string Apply()
        {
            EditorBridge.EnsureProject();
            int count=0;
            foreach(var guid in AssetDatabase.FindAssets("t:Texture2D",new[]{"Assets/Dewhaven"}))
            {
                var path=AssetDatabase.GUIDToAssetPath(guid);
                if(!(AssetImporter.GetAtPath(path) is TextureImporter importer)) continue;
                bool pixel=path.Contains("/Atlases/")||path.Contains("/OriginalCharacters/");
                importer.textureType=TextureImporterType.Default;importer.mipmapEnabled=false;
                importer.filterMode=pixel?FilterMode.Point:FilterMode.Bilinear;
                importer.wrapMode=TextureWrapMode.Clamp;importer.textureCompression=TextureImporterCompression.Uncompressed;
                importer.maxTextureSize=2048; importer.alphaIsTransparency=true;
                importer.SaveAndReimport();count++;
            }
            PlayerSettings.companyName="Dewhaven Studio";PlayerSettings.productName="Dewhaven";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android,"com.fajar.dewhaven.unity");
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.Portrait;
            PlayerSettings.allowedAutorotateToLandscapeLeft=false; PlayerSettings.allowedAutorotateToLandscapeRight=false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown=false;
            PlayerSettings.defaultScreenWidth=390;PlayerSettings.defaultScreenHeight=844;
            PlayerSettings.runInBackground=false;PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.bundleVersion="2.0.0";PlayerSettings.Android.bundleVersionCode=10;
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.renderOutsideSafeArea=true;
            AssetDatabase.SaveAssets();
            return "Configured "+count+" textures and Android portrait player settings.";
        }
    }
}

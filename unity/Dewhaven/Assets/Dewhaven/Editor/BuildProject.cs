using System;
using System.IO;
using System.Linq;
using System.Reflection;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build.Reporting;
using UnityEditor.Build;
using UnityEngine;

namespace Dewhaven.Editor
{
    public static class BuildProject
    {
        public static string Prepare()
        {
            EditorBridge.EnsureProject();
            string essentials=Directory.GetFiles("Library/PackageCache","TMP Essential Resources.unitypackage",SearchOption.AllDirectories).FirstOrDefault();
            if(!File.Exists("Assets/TextMesh Pro/Resources/TMP Settings.asset")&&essentials!=null)AssetDatabase.ImportPackage(essentials,false);
            var shader=Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            string matPath="Assets/Dewhaven/Resources/Dewhaven/Art/WorldMaterial.mat";
            if(!AssetDatabase.LoadAssetAtPath<Material>(matPath))AssetDatabase.CreateAsset(new Material(shader),matPath);
            Font("nunito-400","Nunito");Font("fraunces-400","Fraunces");
            var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            new GameObject("Dewhaven · native simulation").AddComponent<DewhavenGame>();
            EditorSceneManager.SaveScene(scene,"Assets/Dewhaven/Scenes/Bootstrap.unity");
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene("Assets/Dewhaven/Scenes/Bootstrap.unity",true)};
            QualitySettings.vSyncCount=0;QualitySettings.antiAliasing=0;
            SetPortraitGameView();AssetDatabase.SaveAssets();
            return "Native bootstrap, bundled fonts, 2D material and portrait preview prepared.";
        }
        private static void Font(string source,string name)
        {
            string path="Assets/Dewhaven/Resources/Dewhaven/Art/Fonts/"+name+".asset";
            if(AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(path))return;
            var font=TMP_FontAsset.CreateFontAsset(Resources.Load<Font>("Dewhaven/Art/Fonts/"+source));font.name=name;font.isMultiAtlasTexturesEnabled=true;
            font.TryAddCharacters("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?'-–—‘’“”:/+−×()%&·…");
            AssetDatabase.CreateAsset(font,path);
            if(font.material&&!AssetDatabase.Contains(font.material))AssetDatabase.AddObjectToAsset(font.material,font);
            foreach(var atlas in font.atlasTextures)if(atlas&&!AssetDatabase.Contains(atlas))AssetDatabase.AddObjectToAsset(atlas,font);
        }
        public static string SetPortraitGameView(int width=390,int height=844)
        {
            EditorBridge.EnsureProject();
            var assembly=typeof(EditorWindow).Assembly;
            var sizesType=assembly.GetType("UnityEditor.GameViewSizes");
            var singleton=typeof(ScriptableSingleton<>).MakeGenericType(sizesType);
            var instance=singleton.GetProperty("instance",BindingFlags.Static|BindingFlags.Public).GetValue(null);
            var groupType=assembly.GetType("UnityEditor.GameViewSizeGroupType");
            string groupName=EditorUserBuildSettings.activeBuildTarget==BuildTarget.Android?"Android":"Standalone";
            var group=sizesType.GetMethod("GetGroup").Invoke(instance,new[]{Enum.Parse(groupType,groupName)});
            var sizeType=assembly.GetType("UnityEditor.GameViewSize");var enumType=assembly.GetType("UnityEditor.GameViewSizeType");
            var size=Activator.CreateInstance(sizeType,new object[]{Enum.Parse(enumType,"FixedResolution"),width,height,"Dewhaven portrait"});
            group.GetType().GetMethod("AddCustomSize").Invoke(group,new[]{size});
            int count=(int)group.GetType().GetMethod("GetTotalCount").Invoke(group,null);
            var viewType=assembly.GetType("UnityEditor.GameView");var view=EditorWindow.GetWindow(viewType);
            viewType.GetProperty("selectedSizeIndex",BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic).SetValue(view,count-1);
            view.Repaint();return width+" × "+height+" portrait preview";
        }
        public static string Play()
        {
            EditorBridge.EnsureProject();if(EditorApplication.isCompiling)throw new InvalidOperationException("Compilation is still running.");
            if(!EditorApplication.isPlaying&&UnityEngine.SceneManagement.SceneManager.GetActiveScene().path!="Assets/Dewhaven/Scenes/Bootstrap.unity")EditorSceneManager.OpenScene("Assets/Dewhaven/Scenes/Bootstrap.unity",OpenSceneMode.Single);
            EditorApplication.isPlaying=true;return "Dewhaven play mode requested.";
        }
        public static string ConfigureBrand()
        {
            EditorBridge.EnsureProject();
            var icon=Resources.Load<Texture2D>("Dewhaven/Art/Brand/icon");
            string backgroundPath="Assets/Dewhaven/Resources/Dewhaven/Art/Brand/icon-background.asset";
            var background=AssetDatabase.LoadAssetAtPath<Texture2D>(backgroundPath);
            if(!background)
            {
                background=new Texture2D(4,4,TextureFormat.RGB24,false);background.SetPixels(Enumerable.Repeat((Color)new Color32(28,38,41,255),16).ToArray());background.Apply();AssetDatabase.CreateAsset(background,backgroundPath);
            }
            var target=NamedBuildTarget.Android;
            foreach(var kind in PlayerSettings.GetSupportedIconKinds(target))
            {
                var slots=PlayerSettings.GetPlatformIcons(target,kind);
                foreach(var slot in slots)slot.SetTextures(slot.minLayerCount>1?new[]{background,icon}:new[]{icon});
                PlayerSettings.SetPlatformIcons(target,kind,slots);
            }
            var defaultSizes=PlayerSettings.GetIconSizes(NamedBuildTarget.Unknown,IconKind.Any);
            if(defaultSizes.Length>0)PlayerSettings.SetIcons(NamedBuildTarget.Unknown,Enumerable.Repeat(icon,defaultSizes.Length).ToArray(),IconKind.Any);
            PlayerSettings.SplashScreen.show=false;PlayerSettings.SplashScreen.backgroundColor=new Color32(244,239,229,255);
            AssetDatabase.SaveAssets();return "Dewhaven adaptive and legacy icons configured; custom splash enabled.";
        }
        public static string Android()=>AndroidPackage("2.1.0",11,"Dewhaven-Unity-2.1.apk");
        public static string AndroidVoice()=>AndroidPackage("2.2.0",12,"Dewhaven-Unity-2.2-VO.apk");
        public static string AndroidCompact()=>AndroidPackage("2.3.0",13,"Dewhaven-Unity-2.3.apk");
        public static string AndroidQuietWorld()=>AndroidPackage("2.4.0",14,"Dewhaven-Unity-2.4.apk");
        public static string AndroidPlay()=>AndroidBundle("1.0.3",4,"Dewhaven-1.0.3.aab");
        public static string QueueAndroidPlay()=>QueuePackage(AndroidPlay,"android-play-build-result.json");
        private static string AndroidBundle(string version,int code,string file)
        {
            EditorBridge.EnsureProject();
            if(EditorApplication.isPlaying)throw new InvalidOperationException("Leave play mode before building.");
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android,BuildTarget.Android);
            EditorUserBuildSettings.buildAppBundle=true;EditorUserBuildSettings.development=false;
            PlayerSettings.bundleVersion=version;PlayerSettings.Android.bundleVersionCode=code;
            string output=Path.GetFullPath("../../release/"+file);
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{"Assets/Dewhaven/Scenes/Bootstrap.unity"},locationPathName=output,target=BuildTarget.Android,options=BuildOptions.None});
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Android bundle: "+report.summary.result);
            return output+" | "+new FileInfo(output).Length+" bytes";
        }
        private static string AndroidPackage(string version,int code,string file)
        {
            EditorBridge.EnsureProject();
            if(EditorApplication.isPlaying)throw new InvalidOperationException("Leave play mode before building.");
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android,BuildTarget.Android);
            EditorUserBuildSettings.buildAppBundle=false;
            EditorUserBuildSettings.development=false;
            PlayerSettings.bundleVersion=version;PlayerSettings.Android.bundleVersionCode=code;
            string output=Path.GetFullPath("../../release/"+file);
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{"Assets/Dewhaven/Scenes/Bootstrap.unity"},locationPathName=output,target=BuildTarget.Android,options=BuildOptions.None});
            if(report.summary.result!=BuildResult.Succeeded)throw new InvalidOperationException("Android build: "+report.summary.result);
            return output+" | "+new FileInfo(output).Length+" bytes";
        }
        public static string QueueAndroid()
        {return QueuePackage(Android,"android-campaign-build-result.json");}
        public static string QueueAndroidVoice()
        {return QueuePackage(AndroidVoice,"android-voice-build-result.json");}
        public static string QueueAndroidCompact()
        {return QueuePackage(AndroidCompact,"android-compact-build-result.json");}
        public static string QueueAndroidQuietWorld()
        {return QueuePackage(AndroidQuietWorld,"android-quiet-world-build-result.json");}
        private static string QueuePackage(Func<string> build,string reportFile)
        {
            EditorBridge.EnsureProject();
            string report=Path.GetFullPath("../../docs/unity/"+reportFile);
            if(File.Exists(report))File.Delete(report);
            EditorApplication.delayCall+=()=>
            {
                try{string result=build();File.WriteAllText(report,Newtonsoft.Json.JsonConvert.SerializeObject(new{success=true,result,completedAt=DateTime.UtcNow}));}
                catch(Exception e){File.WriteAllText(report,Newtonsoft.Json.JsonConvert.SerializeObject(new{success=false,error=e.ToString(),completedAt=DateTime.UtcNow}));Debug.LogException(e);}
            };
            return "Android campaign build queued in the dedicated Dewhaven editor.";
        }
    }
}

using System.Collections;
using System.IO;
using System.Net;
using UnityEditor;
using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;


namespace BuilditTemplate.Editor 
{
    public struct PackageInfo
    {
        public string name;
        public string version;
    }
    
    public static class PackageUtility
    {
        public static IEnumerator ImportPackage(string title, string version)
        {
            var downloadUrl = Path.Combine(Constants.DOWNLOAD_PATH, title,
                version + Constants.EXTENSION_UNITYPACKAGE);

            var tempFilePath = Path.Combine(Application.temporaryCachePath,
                title + Constants.EXTENSION_UNITYPACKAGE);

            using var webClient = new WebClient();
            webClient.DownloadProgressChanged += (sender, e) =>
            {
                var progress = (float)e.BytesReceived / (float)e.TotalBytesToReceive;
                EditorUtility.DisplayProgressBar("Downloading", $"{(progress * 100f):F1}%", progress);
            };

            webClient.DownloadFileCompleted += (sender, e) =>
            {
                EditorUtility.ClearProgressBar();
                AssetDatabase.ImportPackage(tempFilePath, true);
                // File.Delete(tempFilePath);
            };

            yield return webClient.DownloadFileTaskAsync(downloadUrl, tempFilePath);
        }

        public static Dictionary<string, PackageInfo> GetThemesInfo()
        {
            var map = new Dictionary<string, PackageInfo>();
            
            foreach (var theme_dir in Directory.GetDirectories(Constants.THEME_PACKAGE_PATH))
            {
                var package = Directory.GetFiles(theme_dir, Constants.THEME_PACKAGE_FILENAME);
                if (package.Length <= 0) continue;
                
                var data = File.ReadAllText(package[0]);
                var packageInfo = JsonUtility.FromJson<PackageInfo>(data);
                map.Add(packageInfo.name, packageInfo);
            }

            return map;
        }
        
        public static string ThemeVersionCheck(string theme)
        {
            var path = Path.Join("Assets/BuilditTemplate/Themes", "ZepetoAsset_" + theme, "package.json");

            // Directory.GetFiles()
            
            if (File.Exists(path) == false)
                return "1.0.0";
            
            var data = File.ReadAllText(path);
            var packageInfo = JsonUtility.FromJson<PackageInfo>(data);
            
            return packageInfo.version;
        }
        
        public static string VersionCheck(string className)
        {
            var downloadedVersion = "";
        
            var type = GetTypeByName(className);
        
            if (type == null) return downloadedVersion;
            var field = type.GetField("VERSION", BindingFlags.Static | BindingFlags.Public);
        
            if (field != null)
            {
                downloadedVersion = (string)field.GetValue(null);
            }
        
            return downloadedVersion;
        }

        private static Type GetTypeByName(string className)
        {
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            return assemblies.Select(assembly => assembly.GetType(className)).FirstOrDefault(type => type != null);
        }
        
    }
    
}
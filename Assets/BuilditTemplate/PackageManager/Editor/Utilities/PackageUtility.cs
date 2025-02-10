using System.Collections;
using System.IO;
using System.Net;
using UnityEditor;
using UnityEngine;
using System;
using System.Linq;
using System.Reflection;


namespace BuilditTemplate.Editor 
{
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
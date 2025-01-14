using System.Collections;
using System.IO;
using System.Net;
using UnityEditor;
using UnityEngine;
using System;
using System.Reflection;

namespace BuilditTemplate
{
    public static class PackageUtilities
    {
        public static IEnumerator ImportPackage(string title, string version)
        {
            string downloadUrl = Path.Combine(ConstantManager.DOWNLOAD_PATH, title,
                version + ConstantManager.EXTENSION_UNITYPACKAGE);
            Debug.Log(downloadUrl);

            string tempFilePath = Path.Combine(Application.temporaryCachePath,
                title + ConstantManager.EXTENSION_UNITYPACKAGE);

            using var webClient = new WebClient();
            webClient.DownloadProgressChanged += (sender, e) =>
            {
                var progress = (float)e.BytesReceived / (float)e.TotalBytesToReceive;
                EditorUtility.DisplayProgressBar("Downloading Package", $"{(progress * 100f):F1}%", progress);
            };

            webClient.DownloadFileCompleted += (sender, e) =>
            {
                EditorUtility.ClearProgressBar();
                AssetDatabase.ImportPackage(tempFilePath, true);
                File.Delete(tempFilePath);
            };

            yield return webClient.DownloadFileTaskAsync(downloadUrl, tempFilePath);
        }
        
        public static string VersionCheck(string className)
        {
            string downloadedVersion = "UNKNOWN";

            Type type = GetTypeByName(className);

            if (type != null)
            {
                FieldInfo field = type.GetField("VERSION", BindingFlags.Static | BindingFlags.Public);

                if (field != null)
                {
                    downloadedVersion = (string)field.GetValue(null);
                }
            }

            return downloadedVersion;
        }

        private static Type GetTypeByName(string className)
        {
            Assembly[] assemblies = AppDomain.CurrentDomain.GetAssemblies();
            foreach (Assembly assembly in assemblies)
            {
                Type type = assembly.GetType(className);
                if (type != null)
                {
                    return type;
                }
            }

            return null;
        }
        
    }
    
    
}
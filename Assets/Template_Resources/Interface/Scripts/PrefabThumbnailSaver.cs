using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using System.IO;
using UnityEngine.WSA;

public class PrefabThumbnailSaver : EditorWindow
{
    private string destinationFolder = "";
    private string sourceFolder = "";
    
    
    [MenuItem("Window/Prefab Thumbnail Saver")]
    public static void ShowWindow()
    {
        GetWindow<PrefabThumbnailSaver>("Prefab Thumbnail Saver");
    }

    private void OnGUI()
    {
        GUILayout.Label("Settings", EditorStyles.boldLabel);
        sourceFolder = EditorGUILayout.TextField("Source Folder", sourceFolder);
        destinationFolder = EditorGUILayout.TextField("Destination Folder", destinationFolder);

        if (GUILayout.Button("Capture current Scene prefab"))
        {
            CaptureCurrentScene();
        }

        if (GUILayout.Button("Capture Save All"))
        {
            CaptureSave();
        }
    }

    private void CaptureCurrentScene()
    {
        if (string.IsNullOrEmpty(destinationFolder))
        {
            Debug.LogError("Destination Folder is empty.");
            return;
        }

        Camera mainCamera = Camera.main;
        if (mainCamera == null)
        {
            Debug.LogError("No Main Camera found in the scene.");
            return;
        }

        // 렌더 텍스처 설정
        RenderTexture rt = new RenderTexture(256, 256, 24);
        mainCamera.targetTexture = rt;
        mainCamera.clearFlags = CameraClearFlags.SolidColor;
        mainCamera.backgroundColor = Color.clear;

        // 카메라 렌더링
        mainCamera.Render();

        // 텍스처로부터 픽셀 읽기
        RenderTexture.active = rt;
        Texture2D screenShot = new Texture2D(256, 256, TextureFormat.RGBA32, false);
        screenShot.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
        screenShot.Apply();

        // 리소스 정리
        mainCamera.targetTexture = null;
        RenderTexture.active = null;
        DestroyImmediate(rt);

        // PNG로 저장
        byte[] bytes = screenShot.EncodeToPNG();
        string fileName = "Screenshot_" + System.DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".png";
        string filePath = Path.Combine(destinationFolder, fileName);
        File.WriteAllBytes(filePath, bytes);

        AssetDatabase.Refresh();
        Debug.Log("Screenshot saved to: " + filePath);
    }


    private void CaptureSave()
    {
        if (string.IsNullOrEmpty(destinationFolder))
        {
            Debug.LogError("Destination Folder is empty.");
            return;
        }
        if (string.IsNullOrEmpty(sourceFolder))
        {
            Debug.LogError("Source Folder is empty.");
            return;
        }
        var mainCamera = Camera.main;
        if (mainCamera == null)
        {
            Debug.LogError("No Main Camera found in the scene.");
            return;
        }
        
        
        // Itterate all prefabs in the folder
        var prefabs = GetPrefabs(sourceFolder);

        foreach (var prefab in prefabs)
        {
            // Instantiate
            var instance = Instantiate(prefab);
            
            // Capture
            // 렌더 텍스처 설정
            RenderTexture rt = new RenderTexture(256, 256, 24);
            mainCamera.targetTexture = rt;
            mainCamera.clearFlags = CameraClearFlags.SolidColor;
            mainCamera.backgroundColor = Color.clear;

            // 카메라 렌더링
            mainCamera.Render();

            // 텍스처로부터 픽셀 읽기
            RenderTexture.active = rt;
            Texture2D screenShot = new Texture2D(256, 256, TextureFormat.RGBA32, false);
            screenShot.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
            screenShot.Apply();

            // 리소스 정리
            mainCamera.targetTexture = null;
            RenderTexture.active = null;
            DestroyImmediate(rt);

            // PNG로 저장
            byte[] bytes = screenShot.EncodeToPNG();
            string fileName = prefab.name + ".png";
            string filePath = Path.Combine(destinationFolder, fileName);
            File.WriteAllBytes(filePath, bytes);

            AssetDatabase.Refresh();
            Debug.Log("Screenshot saved to: " + filePath);
            
            // Clean Scene
            DestroyImmediate(instance);
        }
        
        
        
        
    }
    
    private void GetAllPrefabs()
    {
        string[] foldersToSearch = {"Assets"};
        List<GameObject> allPrefabs = GetAssets<GameObject>(foldersToSearch, "t:prefab");
    }

    private List<GameObject> GetPrefabs(string searchLocation)
    {
        string[] foldersToSearch = { searchLocation };
        List<GameObject> prefabs = GetAssets<GameObject>(foldersToSearch, "t:prefab");
        return prefabs;
    }
    
    public static List<T> GetAssets<T>(string[] foldersToSearch, string filter) where T : UnityEngine.Object
    {
        string[] guids = AssetDatabase.FindAssets(filter, foldersToSearch);
        var assets = new List<T>();
        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            assets.Add(AssetDatabase.LoadAssetAtPath<T>(path));
        }
        return assets;
    }
    
    
    
}

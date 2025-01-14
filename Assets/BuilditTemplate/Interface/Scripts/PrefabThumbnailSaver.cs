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
        
        
        // 렌더 텍스처 설정
        RenderTexture rt = new RenderTexture(256, 256, 24);
        mainCamera.targetTexture = rt;
        mainCamera.clearFlags = CameraClearFlags.SolidColor;
        mainCamera.backgroundColor = Color.clear;
        
        
        
        // Itterate all prefabs in the folder
        var prefabs = GetPrefabs(sourceFolder);


        
        foreach (var prefab in prefabs)
        {
            // Instantiate
            Texture2D preview = null; 
            while (preview == null)
                preview = AssetPreview.GetAssetPreview(prefab);// GetMiniThumbnail(Object obj);
    
            
            
            
            //
            // GameObject instance = (GameObject)(GameObject.Instantiate(prefab, Vector3.zero, Quaternion.identity));
            //
            // // Capture
            // // float perspectiveCompensation = 0.95f;
            // //
            // Bounds bounds = getBounds(instance);
            // instance.transform.position = bounds.center;// += new Vector3(0, -bounds.max.y / 2.0f, 0); // center Y
            // // Vector2 screenSize = new Vector2(Screen.width, Screen.height);
            // // //Get the position on screen.
            // // Vector2 screenPosition = mainCamera.WorldToScreenPoint(bounds.center);
            // // //Get the position on screen from the position + the bounds of the object.
            // // Vector2 sizePosition = mainCamera.WorldToScreenPoint(bounds.center + bounds.size);
            // // //By subtracting the screen position from the size position, we get the size of the object on screen.
            // // Vector2 objectSize = sizePosition - screenPosition;
            // // //Calculate how many times the object can be scaled up.
            // // Vector2 scaleFactor = screenSize / objectSize;
            // // //The maximum scale is the one form the longest side, with the lowest scale factor.
            // // float maximumScale = Mathf.Min(scaleFactor.x, scaleFactor.y);
            //
            // // if (mainCamera.orthographic)
            // // {
            // //     //Scale the orthographic size.
            // //     mainCamera.orthographicSize = mainCamera.orthographicSize / maximumScale;
            // // }
            // // else
            // // {
            // //     //Set the scale of the object.
            // //     instance.transform.localScale = instance.transform.localScale * maximumScale * perspectiveCompensation;
            // // }
            //
            //
            // //mainCamera.transform.LookAt(instance.transform);
            // // Render It
            // mainCamera.Render();
            //
            // // 텍스처로부터 픽셀 읽기
            // RenderTexture.active = rt;
            // Texture2D screenShot = new Texture2D(256, 256, TextureFormat.RGBA32, false);
            // screenShot.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
            // screenShot.Apply();
            //
            //
            //
            // // PNG로 저장
            // byte[] bytes = screenShot.EncodeToPNG();
            // string fileName = prefab.name + ".png";
            // string filePath = Path.Combine(destinationFolder, fileName);
            // File.WriteAllBytes(filePath, bytes);
            //
            // AssetDatabase.Refresh();
            // Debug.Log("Screenshot saved to: " + filePath);
            //
            // // Clean Scene
            // DestroyImmediate(instance);
            
            string fileName = prefab.name + ".png";
            string filePath = Path.Combine(destinationFolder, fileName);
            
            File.WriteAllBytes(filePath, preview.EncodeToPNG());
            
            AssetDatabase.Refresh();
            Debug.Log("Screenshot saved to: " + filePath);
        }
        
        // 리소스 정리
        mainCamera.targetTexture = null;
        RenderTexture.active = null;
        DestroyImmediate(rt);
        
        
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
    
    Bounds getBounds(GameObject objeto){
        Bounds bounds;
        Renderer childRender;
        bounds = getRenderBounds(objeto);
        if(bounds.extents.x == 0){
            bounds = new Bounds(objeto.transform.position,Vector3.zero);
            foreach (Transform child in objeto.transform) {
                childRender = child.GetComponent<Renderer>();
                if (childRender) {
                    bounds.Encapsulate(childRender.bounds);
                }else{
                    bounds.Encapsulate(getBounds(child.gameObject));
                }
            }
        }
        return bounds;
    }
    Bounds getRenderBounds(GameObject objeto){
        Bounds bounds = new  Bounds(Vector3.zero,Vector3.zero);
        Renderer render = objeto.GetComponent<Renderer>();
        if(render!=null){
            return render.bounds;
        }
        return bounds;
    }
    
    
}

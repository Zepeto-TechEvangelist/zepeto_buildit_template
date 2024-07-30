using UnityEngine;
using UnityEditor;

public class ZepetoSceneSettings : EditorWindow
{
    private Material skyboxMaterial;
    private Texture2D previewTexture;

    private Color topColor;
    private Color centerColor;
    private Color bottomColor;
    private Vector3 upVector;
    private float exp;

    [MenuItem("ZEPETO/Zepeto Scene Settings")]
    public static void ShowWindow()
    {
        GetWindow<ZepetoSceneSettings>("Zepeto Scene Settings");
    }

    private void OnEnable()
    {
        skyboxMaterial = RenderSettings.skybox;
        if (skyboxMaterial != null)
        {
            if (skyboxMaterial.HasProperty("_TopColor"))
                topColor = skyboxMaterial.GetColor("_TopColor");

            if (skyboxMaterial.HasProperty("_CenterColor"))
                centerColor = skyboxMaterial.GetColor("_CenterColor");

            if (skyboxMaterial.HasProperty("_BottomColor"))
                bottomColor = skyboxMaterial.GetColor("_BottomColor");

            if (skyboxMaterial.HasProperty("_Up"))
                upVector = skyboxMaterial.GetVector("_Up");

            if (skyboxMaterial.HasProperty("_Exp"))
                exp = skyboxMaterial.GetFloat("_Exp");

            // 프리뷰 텍스처 생성
            previewTexture = AssetPreview.GetAssetPreview(skyboxMaterial);
        }
    }

    private void OnGUI()
    {
        if (skyboxMaterial == null)
        {
            EditorGUILayout.HelpBox("No Skybox Material found in RenderSettings.", MessageType.Warning);
            return;
        }

        EditorGUI.BeginChangeCheck();

        topColor = EditorGUILayout.ColorField("Top Color", topColor);
        centerColor = EditorGUILayout.ColorField("Center Color", centerColor);
        bottomColor = EditorGUILayout.ColorField("Bottom Color", bottomColor);
        upVector = EditorGUILayout.Vector3Field("Up Vector", upVector);
        exp = EditorGUILayout.Slider("Exp", exp, 0f, 1f);

        if (EditorGUI.EndChangeCheck())
        {
            skyboxMaterial.SetColor("_TopColor", topColor);
            skyboxMaterial.SetColor("_CenterColor", centerColor);
            skyboxMaterial.SetColor("_BottomColor", bottomColor);
            skyboxMaterial.SetVector("_Up", upVector);
            skyboxMaterial.SetFloat("_Exp", exp);

            // 프리뷰 텍스처 업데이트
            previewTexture = AssetPreview.GetAssetPreview(skyboxMaterial);
            SceneView.RepaintAll();
        }

        GUILayout.Label("Skybox Preview", EditorStyles.boldLabel);
        if (previewTexture != null)
        {
            GUILayout.Label(previewTexture, GUILayout.Width(300), GUILayout.Height(100));
        }
    }
}

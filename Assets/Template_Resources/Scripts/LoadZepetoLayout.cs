using UnityEditor;
using UnityEngine;

[InitializeOnLoad]
public class LoadZepetoLayout
{
    static LoadZepetoLayout()
    {
        // 프로젝트가 열릴 때 호출되는 이벤트 등록
         EditorApplication.delayCall += LoadLayoutOnStartup;
    }

    private static void LoadLayoutOnStartup()
    {
        // 런타임이 실행 중인지 확인
        if (EditorApplication.isPlaying)
        {
            Debug.Log("Editor is in play mode. Skipping layout loading.");
            return; // 런타임이 실행 중이면 즉시 반환
        }

        // "ZEPETO_Buildit" 레이아웃 파일의 경로를 설정합니다.
        string layoutPath = "Assets/Template_Resources/Scripts/ZEPETO_Buildit.wlt";

        // 레이아웃 파일이 존재하는지 확인합니다.
        if (System.IO.File.Exists(layoutPath))
        {
            Debug.Log("Loading ZEPETO_Buildit layout...");
            // 레이아웃을 로드합니다.
            EditorUtility.LoadWindowLayout(layoutPath);
        }
        else
        {
            Debug.LogWarning($"Layout file not found at {layoutPath}");
        }
    }    
}

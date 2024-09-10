using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Threading.Tasks;
using ZEPETO.Script.Build;
using TemplateAnalytics;
using ZEPETO.World.Editor;
using System;
using System.Text;
using UnityEngine.Networking;


public class TestAnalytics : MonoBehaviour
{

    [Serializable]
    private class EventData
    {
        public string projectId;
        public string userId;
        public string templateId;
    }

    [Serializable]
    private class Properties
    {
        public string template_id;
        public string world_id;
    }

    void Start()
    {
        string templateId = "Buildit";
        string userId = WorldEditorSettings.instance.User.userId;
        string worldId = WorldPlayerSettings.instance.worldId;
        StartCoroutine(CoSendAnalytics(templateId, worldId, userId));
    }


    public IEnumerator CoSendAnalytics(string templateId, string projectId, string userId)
    {
        string url = "https://dev-api.playbaas.xyz/zepeto/zetta/template";

        var eventData = new EventData
        {
            projectId = projectId,
            userId = userId,
            templateId = templateId
        };

        string jsonData = JsonUtility.ToJson(eventData);

        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            byte[] jsonToSend = new UTF8Encoding().GetBytes(jsonData);
            request.uploadHandler = (UploadHandler)new UploadHandlerRaw(jsonToSend);
            request.downloadHandler = (DownloadHandler)new DownloadHandlerBuffer();

            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            Debug.Log("jsonData : " + jsonData + ", isDone : " + request.isDone.ToString());

            if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
            {
                Debug.LogError("User Analystics Error: " + request.error);
            }
        }


    }
}

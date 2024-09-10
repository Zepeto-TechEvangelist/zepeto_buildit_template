using System.Threading.Tasks;
using UnityEngine;
using ZEPETO.Script.Build;
using TemplateAnalytics;
using ZEPETO.World.Editor;

[ZepetoScriptBuildTask(10000)]
public class CustomBuildTask : ZepetoScriptBuildTask
{
    public override Task Run()
    {
        UserAnalyticsMonoBehaviour userAnalyticsMonoBehaviour = GameObject.FindObjectOfType<UserAnalyticsMonoBehaviour>();
        if (!userAnalyticsMonoBehaviour){
            GameObject managers = GameObject.FindWithTag("Managers");
            GameObject tempObject = new GameObject("TemporaryUserAnalytics");
            userAnalyticsMonoBehaviour = tempObject.AddComponent<UserAnalyticsMonoBehaviour>();
            tempObject.transform.parent = managers.gameObject.transform;
        }

        userAnalyticsMonoBehaviour.SendAnalytics();

        return Task.CompletedTask;
    }
}

public class UserAnalyticsMonoBehaviour : MonoBehaviour
{
    public void SendAnalytics()
    {
        string templateId = "Buildit";
        string userId = WorldEditorSettings.instance.User.userId;
        string worldId = WorldPlayerSettings.instance.worldId;

        UserActivityReporter reporter = new UserActivityReporter();
        StartCoroutine(reporter.CoSendAnalytics(templateId, worldId, userId));

        //GameObject.DestroyImmediate(tempGameObject);
    }
}
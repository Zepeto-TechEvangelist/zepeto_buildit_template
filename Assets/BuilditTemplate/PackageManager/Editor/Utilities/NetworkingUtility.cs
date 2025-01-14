using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace BuilditTemplate
{
    public static class NetworkingUtilities
    {
        
        public static IEnumerator GetDataAsync(System.Action<string> onDataLoaded)
        {
            var www = UnityWebRequest.Get(ConstantManager.CONTENT_DATA_PATH);
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError(www.error);

                onDataLoaded(null);
            }
            else
            {
                onDataLoaded(www.downloadHandler.text);
            }
        }

        public static IEnumerator GetTextureAsync(string url, System.Action<Texture2D> onTextureLoaded)
        {
            var www = UnityWebRequestTexture.GetTexture(url);
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {

                var texture = ((DownloadHandlerTexture)www.downloadHandler).texture;
                var max_width = Constants.PREVIEW_MAX_WIDTH;
                var max_height = Constants.PREVIEW_MAX_HEIGHT;

                var width = texture.width;
                var height = texture.height;

                var aspect_ratio = (float)width / (float)height;

                if (width >= max_width)
                {
                    width = max_width;
                    height = (int)((float)width / aspect_ratio);
                }
                else if (height >= max_height)
                {
                    height = max_height;
                    width = (int)((float)height * aspect_ratio);
                }

                texture = ScaleTexture(texture, width, height);

                onTextureLoaded(texture);
            }
            else
            {
                Debug.Log("Failed to download image. Error: " + www.error);

                onTextureLoaded(null);
            }
        }

        private static Texture2D ScaleTexture(Texture2D texture, int targetWidth, int targetHeight)
        {
            var rt = RenderTexture.GetTemporary(targetWidth, targetHeight, 0, RenderTextureFormat.Default,
                RenderTextureReadWrite.Linear);

            Graphics.Blit(texture, rt);
            var previous = RenderTexture.active;
            RenderTexture.active = rt;

            var scaledTexture = new Texture2D(targetWidth, targetHeight);
            scaledTexture.ReadPixels(new Rect(0, 0, targetWidth, targetHeight), 0, 0);
            scaledTexture.Apply();

            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(rt);

            return scaledTexture;
        }

    }
}
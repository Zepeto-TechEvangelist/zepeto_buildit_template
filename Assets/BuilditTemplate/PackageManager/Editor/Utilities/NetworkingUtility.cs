using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace BuilditTemplate.Editor
{
    public static class NetworkingUtility
    {
        public static IEnumerator GetDataAsync(System.Action<string> onDataLoaded)
        {
            var www = UnityWebRequest.Get(Constants.CONTENT_DATA_PATH);
            yield return www.SendWebRequest();
            
            onDataLoaded(www.result == UnityWebRequest.Result.Success ? www.downloadHandler.text : null);
        }

        public static IEnumerator GetTextureAsync(string url, System.Action<Texture2D> onTextureLoaded)
        {
            var www = UnityWebRequestTexture.GetTexture(url);
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                var texture = ((DownloadHandlerTexture)www.downloadHandler).texture;
                const int maxWidth = Constants.PREVIEW_MAX_WIDTH;
                const int maxHeight = Constants.PREVIEW_MAX_HEIGHT;
                var width = texture.width;
                var height = texture.height;
                var aspect_ratio = (float)width / height;

                if (width >= maxWidth)
                {
                    width = maxWidth;
                    height = (int)(width / aspect_ratio);
                }
                else if (height >= maxHeight)
                {
                    height = maxHeight;
                    width = (int)(height * aspect_ratio);
                }

                // texture = ScaleTexture(texture, width, height);

                onTextureLoaded(texture);
            }
            else
            {
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
Shader "BuildIt/Morp"
{
    Properties
    {
        _NoiseTexture("Noise Texture", 2D) = "noise"{}
        _NoiseDirection("Noise Direction", Vector) = (1,0,0,0)
        _NoisePower("Noise Power", Float) = 1
        _NoiseSpeed("Noise Speed", Float) = 1
        _SurfaceColor("Surface Color", Color) = (1,1,1,1)
        _RimColor("Rim Color", Color) = (1,1,1,1)
        _RimPower("Rim Power", Float) = 0.2
        _SurfaceRimLerp("Surface Rim Lerp", Range(0,1)) = 0.5
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Transparent+100" }
        Blend SrcAlpha OneMinusSrcAlpha
        LOD 100

        GrabPass { "_GrabTexture" }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            #include "UnityLightingCommon.cginc"



            struct v2f
            {
                float4 vertex : SV_POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
                float4 uvGrab : TEXCOORD1;
                float4 posWorld : TEXCOORD2;
            };



            sampler2D _NoiseTexture;
            float4 _NoiseTexture_ST;
            fixed4 _NoiseDirection;
            float _NoisePower;
            float _NoiseSpeed;
            fixed4 _SurfaceColor;
            fixed4 _RimColor;
            float _RimPower;
            fixed _SurfaceRimLerp;

            sampler2D _GrabTexture;



            v2f vert (appdata_base v)
            {
                v2f o;

                // Vertex Position
                o.vertex = UnityObjectToClipPos(v.vertex);

                // UV
                o.uv = v.texcoord.xy;
                // o.uv = o.vertex.xy;

                // Normal
                o.normal = UnityObjectToWorldNormal(v.normal);

                // UV Grab
                o.uvGrab = ComputeGrabScreenPos(o.vertex);

                // World Position
                o.posWorld = mul(unity_ObjectToWorld, v.vertex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // Screen Position
                float4 screenPosition = ComputeGrabScreenPos(i.vertex);

                // Noise
                float noiseA = tex2D(_NoiseTexture, i.uv + _NoiseTexture_ST.xy + _NoiseTexture_ST.zw + _NoiseDirection * _Time.x * _NoiseSpeed) * 2 - 1;
                float noiseB = tex2D(_NoiseTexture, i.uv + _NoiseTexture_ST.xy + _NoiseTexture_ST.zw + float2(0.5, 0.5) - _NoiseDirection * _Time.x * _NoiseSpeed) * 2 - 1;
                float noise = (noiseA + noiseB) / 2;
                noise *= _NoisePower;

                // Grab Texture
                float4 uvGrab = i.uvGrab + noise;
                float4 grabResult = tex2Dproj(_GrabTexture, UNITY_PROJ_COORD(uvGrab));

                // World Position
                float3 worldPos = i.posWorld;

                // View Direction
                float3 viewDirection = normalize(UnityWorldSpaceViewDir(worldPos));
                
                // Surface And Rim
                fixed4 rim = 1 - saturate(pow(dot(i.normal, viewDirection), _RimPower));
                fixed4 rimResult = rim * _RimColor;
                fixed4 surfaceRimResult = lerp(_SurfaceColor, rimResult, _SurfaceRimLerp);
                


                // Result
                fixed4 result = saturate(grabResult + surfaceRimResult);
                return result;
            }
            ENDCG
        }
    }
}

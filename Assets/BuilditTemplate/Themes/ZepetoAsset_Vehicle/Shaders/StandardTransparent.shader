Shader "Wit/Standard Transparent"  {
	Properties{

		_Color ("Color", Color) = (1,1,1,1)
		_MainTex("Albedo (RGB)", 2D) = "white" {}
		_Glossiness("Smoothness", Range(0,1)) = 0.5
		_Shininess("Shininess", Range(0.03, 1)) = 0.078125
		_BumpMap("Normal map", 2D) = "bump" {}

		[HideInInspector]_LogLut("_LogLut", 2D) = "white" {}
	}
		SubShader{
			Tags {"RenderType" = "Opaque"  "Queue" = "Geometry+1" }
			LOD 200
			ZWrite Off


			
			
			CGPROGRAM
		#pragma surface surf StandardSpecular alpha:fade finalcolor:tonemapping
		#include "ToneMapping.cginc"

		#pragma target 3.0

		sampler2D _MainTex;
		sampler2D _BumpMap;
		sampler2D _SpecularTex;


		struct Input {
			float2 uv_MainTex;
			float2 uv_BumpMap;
			float2 uv_SpecularTex;

		};

		half _Glossiness;
		half _Shininess;
		fixed4 _Color;		



		void surf(Input IN, inout SurfaceOutputStandardSpecular o) {
			fixed4 c = tex2D(_MainTex, IN.uv_MainTex)* _Color;


			o.Albedo = c.rgb;
			o.Smoothness = _Glossiness;
			o.Normal = UnpackNormal(tex2D(_BumpMap, IN.uv_BumpMap));
			o.Specular = _Shininess;
			

			o.Alpha = c.a;
		}

		void tonemapping(Input IN, SurfaceOutputStandardSpecular o, inout fixed4 color) {
			color = ApplyColorGrading(color);
		}
		ENDCG

		       // 보물 for js
        pass {                
            Name "ALPHA_WRITER"
            Blend One OneMinusSrcAlpha
            ColorMask A
            CGPROGRAM
                #pragma vertex vert
                #pragma fragment frag
                #include "UnityCG.cginc"
       
                struct appdata_t {
                    float4 vertex : POSITION;
                    float4 color : COLOR;
                    float2 texcoord : TEXCOORD0;
                };       
                struct v2f {
                    float4 vertex : SV_POSITION;
                    fixed4 color : COLOR;
                    float2 texcoord : TEXCOORD0;
                };
    
                sampler2D _MainTex;
                float4 _MainTex_ST;
                fixed4 _Color;
    
                v2f vert (appdata_t v)
                {
                    v2f o;
                    o.vertex = UnityObjectToClipPos(v.vertex);
                    o.color = v.color;
                    o.texcoord = TRANSFORM_TEX(v.texcoord, _MainTex);
                    return o;
                }                           
                fixed4 frag (v2f i) : SV_Target
                {
                    return _Color * tex2D(_MainTex, i.texcoord);
                }
            ENDCG                                
        }
	}
		FallBack "ZEPETO/Standard(NoColor)"
}

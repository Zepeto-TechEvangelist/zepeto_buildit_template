// Upgrade NOTE: replaced '_Object2World' with 'unity_ObjectToWorld'
// Upgrade NOTE: replaced '_World2Object' with 'unity_WorldToObject'

Shader "Wit/carTransparent"
{
    Properties
    {
        _Color ("Color", Color) = (1, 1, 1, 1)
		_MainTex ("Albedo (RGB)", 2D) = "white" {}
		
		[Header(Base Spec)]
		_Glossiness ("Glossiness", Range(0,1)) = 0.5
		_Shininess ("Shininess", Range(0,1)) = 0.0
		[Space][Space][Space][Space][Space]
		
		
        //rim lighting variables
        _RimColor("RimColor", Color) = (1,1,1,1) //color of rim lighting
        _RimPower("RimPower", range(0.5, 5)) = 1 //intensity of rim lighting

		[HideInInspector]_LogLut ("_LogLut", 2D)  = "white" {}
     
    }
    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue" = "Transparent" }

        zwrite off
        CGPROGRAM
 
        #pragma surface surf StandardSpecular alpha:blend finalcolor:tonemapping
		#include "ToneMapping.cginc"
 
        sampler2D _MainTex;

        //rim lighting variables
        half4 _RimColor;
        float _RimPower;


        struct Input
        {
           float2 uv_MainTex;

		   float3 viewDir;
		   float3 worldNormal; INTERNAL_DATA
        };
 
        half _Glossiness, _Shininess;
		fixed4 _Color;


        void surf(Input IN, inout SurfaceOutputStandardSpecular o)
        {
            // Albedo comes from a texture tinted by color
			fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;

			
			//Metallic and smoothness come from slider variables
			o.Specular = _Shininess;
			o.Smoothness = _Glossiness;
						
			
			//rim lighting
			float rim = dot(o.Normal, IN.viewDir);

			o.Albedo = c.rgb;
			o.Emission = clamp(pow(1 - rim, _RimPower) * _RimColor.rgb, 0, 1) * step(1, IN.uv_MainTex.y);
            o.Emission = max(0, o.Emission);
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
                    float3 normal : NORMAL;
                };       
                struct v2f {
                    float4 vertex : SV_POSITION;
                    fixed4 color : COLOR;
                    float2 texcoord : TEXCOORD0;
                    float4 posWorld: TEXCOORD2;
                    float3 normalDir: TEXCOORD1;
                };
    
                sampler2D _MainTex;
                float4 _MainTex_ST;
                fixed4 _Color;
                fixed _RimPower;
    
                v2f vert (appdata_t v)
                {
                    v2f o;
                    o.posWorld = mul(unity_ObjectToWorld, v.vertex);
				    o.normalDir = normalize( mul( float4(v.normal, 0.0), unity_WorldToObject).xyz);
                    o.vertex = UnityObjectToClipPos(v.vertex);
                    o.color = v.color;
                    o.texcoord = TRANSFORM_TEX(v.texcoord, _MainTex);
                    return o;
                }                           
                fixed4 frag (v2f i) : SV_Target
                {
                    float3 normalDirection = i.normalDir;
                    float3 viewDirection = normalize( _WorldSpaceCameraPos.xyz - i.posWorld.xyz);
                    float rim  = 1 - dot(viewDirection, normalDirection);
                    float4 col = _Color * tex2D(_MainTex, i.texcoord);
                    

                    return fixed4(col.r, col.g, col.b, col.a);
                }
            ENDCG      
        }            
    }
    FallBack "ZEPETO/Standard(NoColor)"
}

// Upgrade NOTE: replaced 'mul(UNITY_MATRIX_MVP,*)' with 'UnityObjectToClipPos(*)'

Shader "Wit/MatCapCar" {

	Properties {

		_MainTex ("Base (RGB)", 2D) = "white" {}

		_AOMap ("AO (RGB)", 2D) = "white" {}

		_AOFactor ("AO Factor" , Range(0.0,2.0)) =1.0

		_BumpMap ("Normal Map", 2D) = "bump" {}

		_MetalicMap ("Metallic (RGB)", 2D) = "white" {}

		_MetalicMultiply ("Metallic Multiply" , Range(0.0,10.0)) =1.0

		_EmissiveTex ("Emissive (RGB)", 2D) = "black" {}

		_EmissiveMultiply ("Emissive Multiply" , Range(0.0,10.0)) =1.0

		_MatCapDiffuse ("MatCap Diffuse (RGB)", 2D) = "white" {}

		_MatCapReflect ("MatCap Reflect (RGB)", 2D) = "white" {}

		_MatCapReflectMultiply ("MatCap Reflect Multiply" , Range(0.0,10.0)) =1.0

	}

	

	Subshader {

		Tags { "RenderType"="Opaque" }

		

		Pass {

			Tags { "LightMode" = "Always" }

			

			CGPROGRAM

				#pragma vertex vert

				#pragma fragment frag

				#pragma fragmentoption ARB_precision_hint_fastest

				#include "UnityCG.cginc"

				

				struct v2f {

					float4 pos	: SV_POSITION;

					float4 uv 	: TEXCOORD0;

					float3 c0 : TEXCOORD1;

					float3 c1 : TEXCOORD2;

				};

				

				uniform float4 _MainTex_ST;

				uniform float4 _BumpMap_ST;

				

				v2f vert (appdata_tan v) {

					v2f o;

					o.pos = UnityObjectToClipPos (v.vertex);

					o.uv.xy = TRANSFORM_TEX(v.texcoord, _MainTex);

					o.uv.zw = TRANSFORM_TEX(v.texcoord, _BumpMap);

					

					float3 n = normalize(v.normal).xyz;

					float3 t = normalize(v.tangent).xyz;

					float3 b = normalize(cross( n, t ) * v.tangent.w);

					float3x3 rotation = float3x3( t, b, n );

					o.c0 = mul(rotation, normalize(UNITY_MATRIX_IT_MV[0].xyz));

					o.c1 = mul(rotation, normalize(UNITY_MATRIX_IT_MV[1].xyz));

					

					return o;

				}

				

				uniform sampler2D _MainTex;

				uniform sampler2D _BumpMap;

				uniform sampler2D _AOMap;

				uniform sampler2D _MetalicMap;

				uniform sampler2D _MatCapDiffuse;

				uniform sampler2D _MatCapReflect;

				uniform sampler2D _EmissiveTex;

				uniform float _MatCapReflectMultiply;

				uniform float _AOFactor;

				uniform float _EmissiveMultiply;

				uniform float _MetalicMultiply;

				

				fixed4 frag (v2f i) : COLOR {

					fixed4 tex = tex2D(_MainTex, i.uv.xy);

					fixed4 ao = tex2D(_AOMap, i.uv.xy);

					fixed4 metalic = tex2D(_MetalicMap, i.uv.xy);								

					fixed3 normals = UnpackNormal(tex2D(_BumpMap, i.uv.zw));

					half2 capCoord = half2(dot(i.c0, normals), dot(i.c1, normals));

					fixed4 diff = tex2D(_MatCapDiffuse, capCoord*0.5+0.5) * tex;

					fixed4 refl = tex2D(_MatCapReflect, capCoord*0.5+0.5);

					refl.a = 1;

					refl *= _MatCapReflectMultiply;



					fixed4 ret = lerp( diff, refl, saturate(float4(metalic.rgb * _MetalicMultiply,1)));

					return ret;

				}

			ENDCG

		}

	}

	Fallback "VertexLit"

}
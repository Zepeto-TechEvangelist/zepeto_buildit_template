Shader "Custom/Water_Optimize"
{
	Properties
	{
		_TintColor("Tint Color", Color) = (1,1,1,1)
		_DistanceFade("Distance Fade", Float) = 1000
		_DistanceFadeOffset("Distance Fade Offset", Float) = 500
		[Space(10)][Header(Main Parameters)][Space(10)]_NormalMap("Normal", 2D) = "bump" {}
		_NormalPower("Normal Power", Range( 0 , 1)) = 1
		_RefractionPower("Refraction Power", Range( 0 , 5)) = 1
		_NormalScale("Normal Scale", Float) = 1
		_NormalSpeed("Normal Speed", Float) = 0.1
		_NormalDirection("Normal Direction", Vector) = (1,0,-1,0.2)
		[Space(10)][Header(Foam)][Space(10)]_FoamMask("Foam Mask", 2D) = "white" {}
		_FoamNormal("Foam Normal", 2D) = "bump" {}
		_FoamDistance("Foam Distance", Range( 0 , 100)) = 1
		_FoamPower("Foam Power", Range( 0 , 1)) = 1
		_FoamScale("Foam Scale", Float) = 1
		_FoamContrast("Foam Contrast", Float) = 0
		_FoamSpeed("Foam Speed", Float) = 0.1
		[Space(30)]_EdgesFade("Edges Fade", Float) = 0.1
		_DepthColor1("Shallow Color (RGBA)", Color) = (0,0.6810271,0.6886792,1)
		_DepthColor("Depth Color (RGBA)", Color) = (0,0.6810271,0.6886792,1)
		_Depth("Depth", Float) = 1
		[Space(30)]_CausticsColor("Caustics Color", Color) = (0.5404058,0.8679245,0.8414827,1)
		_CausticsScale("Caustics Scale", Float) = 0.5
		_CausticsSpeed("Caustics Speed", Float) = 2
		_CousticOffset("Coustic Offset", Float) = 0
		[Space(10)][Header(Waves)][Space(10)]_WavesHeight("Waves Height", Float) = 25
		_WavesSpeed("Waves Speed", Float) = 5
		_WavesScale("Waves Scale", Float) = 10
		[Space(10)][Header(Metallic Smoothness)][Space(10)]_MetallicPower("Metallic Power", Range( 0 , 1)) = 1
		_SmoothnessPower("Smoothness Power", Range( 0 , 1)) = 1
		[HideInInspector] __dirty( "", Int ) = 1

		[Space(10)][Header(WaterSurface)][Space(10)]
		_SurfaceColor("Color", Color) = (1,1,1,1)
		_SurfaceNormalTex("Normal", 2D) = "bump" {}
        _SurfaceNormalTex2("Normal2", 2D) = "bump" {}
        _SurfaceNormalPower("NormalPower", range(0, 3)) = 1
        _SurfaceWaveRange("WaveRange", range(1, 30)) = 20
        _SurfaceWaveSpeed("WaveSpeed", range(0, 0.1)) = 0.05
	}

	SubShader
	{
		Tags{ "RenderType" = "Transparent"  "Queue" = "Transparent+0" "IgnoreProjector" = "True" }
		Cull Back
		GrabPass{ }
		CGINCLUDE
		#include "UnityShaderVariables.cginc"
		#include "UnityStandardUtils.cginc"
		#include "UnityCG.cginc"
		#include "UnityPBSLighting.cginc"
		#include "Lighting.cginc"
		#pragma target 4.6

		#if defined(UNITY_STEREO_INSTANCING_ENABLED) || defined(UNITY_STEREO_MULTIVIEW_ENABLED)
		#define ASE_DECLARE_SCREENSPACE_TEXTURE(tex) UNITY_DECLARE_SCREENSPACE_TEXTURE(tex);
		#else
		#define ASE_DECLARE_SCREENSPACE_TEXTURE(tex) UNITY_DECLARE_SCREENSPACE_TEXTURE(tex)
		#endif

		struct Input
		{
			float3 worldPos;
			float4 screenPos;
			float2 uv_SurfaceNormalTex;
            float2 uv_SurfaceNormalTex2;
            float3 viewDir;
            // float3 worldNormal;
			// float3 worldRefl; INTERNAL_DATA
			float3 worldNormal; INTERNAL_DATA
		};

		uniform float _WavesSpeed;
		uniform float _WavesScale;
		uniform float _WavesHeight;
		uniform sampler2D _NormalMap;
		uniform float4 _NormalDirection;
		uniform float _NormalSpeed;
		uniform float _NormalScale;
		uniform float _NormalPower;
		uniform sampler2D _FoamNormal;
		uniform float _FoamSpeed;
		uniform float _FoamScale;
		uniform float _FoamContrast;
		UNITY_DECLARE_DEPTH_TEXTURE( _CameraDepthTexture );
		uniform float4 _CameraDepthTexture_TexelSize;
		uniform float _EdgesFade;
		uniform float _FoamDistance;
		uniform sampler2D _FoamMask;
		uniform float _FoamPower;
		ASE_DECLARE_SCREENSPACE_TEXTURE( _GrabTexture )
		uniform float _RefractionPower;
		uniform float4 _DepthColor1;
		uniform float4 _DepthColor;
		uniform float _Depth;
		uniform float4 _CausticsColor;
		uniform float _CausticsScale;
		uniform float _CausticsSpeed;
		uniform float _CousticOffset;
		uniform float _MetallicPower;
		uniform float _SmoothnessPower;
		uniform float _DistanceFade;
		uniform float _DistanceFadeOffset;
		uniform float _DistanceMin;
		uniform float _DistanceMax;
		sampler2D _SurfaceNormalTex, _SurfaceNormalTex2;
		uniform float _SurfaceNormalPower, _SurfaceWaveRange, _SurfaceWaveSpeed;
		uniform float4 _SurfaceColor, _TintColor;

		float3 mod2D289( float3 x ) { return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0; }

		float2 mod2D289( float2 x ) { return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0; }

		float3 permute( float3 x ) { return mod2D289( ( ( x * 34.0 ) + 1.0 ) * x ); }

		float snoise( float2 v )
		{
			const float4 C = float4( 0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439 );
			float2 i = floor( v + dot( v, C.yy ) );
			float2 x0 = v - i + dot( i, C.xx );
			float2 i1;
			i1 = ( x0.x > x0.y ) ? float2( 1.0, 0.0 ) : float2( 0.0, 1.0 );
			float4 x12 = x0.xyxy + C.xxzz;
			x12.xy -= i1;
			i = mod2D289( i );
			float3 p = permute( permute( i.y + float3( 0.0, i1.y, 1.0 ) ) + i.x + float3( 0.0, i1.x, 1.0 ) );
			float3 m = max( 0.5 - float3( dot( x0, x0 ), dot( x12.xy, x12.xy ), dot( x12.zw, x12.zw ) ), 0.0 );
			m = m * m;
			m = m * m;
			float3 x = 2.0 * frac( p * C.www ) - 1.0;
			float3 h = abs( x ) - 0.5;
			float3 ox = floor( x + 0.5 );
			float3 a0 = x - ox;
			m *= 1.79284291400159 - 0.85373472095314 * ( a0 * a0 + h * h );
			float3 g;
			g.x = a0.x * x0.x + h.x * x0.y;
			g.yz = a0.yz * x12.xz + h.yz * x12.yw;
			return 130.0 * dot( m, g );
		}

		float4 CalculateContrast( float contrastValue, float4 colorTarget )
		{
			float t = 0.5 * ( 1.0 - contrastValue );
			return mul( float4x4( contrastValue,0,0,t, 0,contrastValue,0,t, 0,0,contrastValue,t, 0,0,0,1 ), colorTarget );
		}

		inline float4 ASE_ComputeGrabScreenPos( float4 pos )
		{
			#if UNITY_UV_STARTS_AT_TOP
			float scale = -1.0;
			#else
			float scale = 1.0;
			#endif
			float4 o = pos;
			o.y = pos.w * 0.5f;
			o.y = ( pos.y - o.y ) * _ProjectionParams.x * scale + o.y;
			return o;
		}

		float2 voronoihash110( float2 p )
		{
			
			p = float2( dot( p, float2( 127.1, 311.7 ) ), dot( p, float2( 269.5, 183.3 ) ) );
			return frac( sin( p ) *43758.5453);
		}

		float voronoi110( float2 v, float time, inout float2 id, inout float2 mr, float smoothness )
		{
			float2 n = floor( v );
			float2 f = frac( v );
			float F1 = 8.0;
			float F2 = 8.0; float2 mg = 0;
			for ( int j = -1; j <= 1; j++ )
			{
				for ( int i = -1; i <= 1; i++ )
			 	{
			 		float2 g = float2( i, j );
			 		float2 o = voronoihash110( n + g );
					o = ( sin( time + o * 6.2831 ) * 0.5 + 0.5 ); float2 r = f - g - o;
					float d = 0.5 * dot( r, r );
			 		if( d<F1 ) {
			 			F2 = F1;
			 			F1 = d; mg = g; mr = r; id = o;
			 		} else if( d<F2 ) {
			 			F2 = d;
			 		}
			 	}
			}
			return F1;
		}

		float2 UnStereo( float2 UV )
		{
			#if UNITY_SINGLE_PASS_STEREO
			float4 scaleOffset = unity_StereoScaleOffset[ unity_StereoEyeIndex ];
			UV.xy = (UV.xy - scaleOffset.zw) / scaleOffset.xy;
			#endif
			return UV;
		}


		float3 InvertDepthDir72_g1( float3 In )
		{
			float3 result = In;
			#if !defined(ASE_SRP_VERSION) || ASE_SRP_VERSION <= 70301
			result *= float3(1,1,-1);
			#endif
			return result;
		}

		float2 voronoihash129( float2 p )
		{
			
			p = float2( dot( p, float2( 127.1, 311.7 ) ), dot( p, float2( 269.5, 183.3 ) ) );
			return frac( sin( p ) *43758.5453);
		}

		float voronoi129( float2 v, float time, inout float2 id, inout float2 mr, float smoothness )
		{
			float2 n = floor( v );
			float2 f = frac( v );
			float F1 = 8.0;
			float F2 = 8.0; float2 mg = 0;
			for ( int j = -1; j <= 1; j++ )
			{
				for ( int i = -1; i <= 1; i++ )
			 	{
			 		float2 g = float2( i, j );
			 		float2 o = voronoihash129( n + g );
					o = ( sin( time + o * 6.2831 ) * 0.5 + 0.5 ); float2 r = f - g - o;
					float d = 0.5 * dot( r, r );
			 		if( d<F1 ) {
			 			F2 = F1;
			 			F1 = d; mg = g; mr = r; id = o;
			 		} else if( d<F2 ) {
			 			F2 = d;
			 		}
			 	}
			}
			return F1;
		}

		void vertexDataFunc( inout appdata_full v )
		{
			float3 ase_vertexNormal = v.normal.xyz;
			float2 appendResult195 = (float2(_WavesSpeed , _WavesSpeed));
			float3 ase_worldPos = mul( unity_ObjectToWorld, v.vertex );
			float2 appendResult194 = (float2(ase_worldPos.x , ase_worldPos.z));
			float2 panner196 = ( 1.0 * _Time.y * appendResult195 + appendResult194);
			float simplePerlin2D199 = snoise( panner196*( _WavesScale / 100.0 ) );
			simplePerlin2D199 = simplePerlin2D199*0.5 + 0.5;
			float3 worldToObjDir273 = mul( unity_WorldToObject, float4( ( ase_vertexNormal * ( simplePerlin2D199 * _WavesHeight ) ), 0 ) ).xyz;
			float3 WavesHeight49 = worldToObjDir273;
			v.vertex.xyz += WavesHeight49;
			v.vertex.w = 1;
		}

		void surf( Input i , inout SurfaceOutputStandard o )
		{
			float2 appendResult337 = (float2(_NormalDirection.x , _NormalDirection.y));
			float temp_output_106_0 = ( _NormalSpeed / 100.0 );
			float3 ase_worldPos = i.worldPos;
			float4 appendResult31 = (float4(ase_worldPos.x , ase_worldPos.z , 0.0 , 0.0));
			float4 WorldSpace32 = appendResult31;
			float4 temp_output_68_0 = ( ( WorldSpace32 / 100.0 ) * _NormalScale );
			float2 panner72 = ( 1.0 * _Time.y * ( appendResult337 * temp_output_106_0 ) + temp_output_68_0.xy);
			float2 appendResult338 = (float2(_NormalDirection.z , _NormalDirection.w));
			float2 panner73 = ( 1.0 * _Time.y * ( appendResult338 * ( temp_output_106_0 * 2.0 ) ) + ( temp_output_68_0 * ( _NormalScale * 1.2 ) ).xy);
			float temp_output_215_0 = ( _FoamSpeed / 100.0 );
			float2 temp_cast_2 = (temp_output_215_0).xx;
			float4 temp_output_225_0 = ( WorldSpace32 * ( _FoamScale / 100.0 ) );
			float2 panner213 = ( 1.0 * _Time.y * temp_cast_2 + temp_output_225_0.xy);
			float3 ase_worldViewDir = normalize( UnityWorldSpaceViewDir( ase_worldPos ) );
			float temp_output_368_0 = abs( ase_worldViewDir.y );
			float4 ase_screenPos = float4( i.screenPos.xyz , i.screenPos.w + 0.00000000001 );
			float4 ase_screenPosNorm = ase_screenPos / ase_screenPos.w;
			ase_screenPosNorm.z = ( UNITY_NEAR_CLIP_VALUE >= 0 ) ? ase_screenPosNorm.z : ase_screenPosNorm.z * 0.5 + 0.5;
			float screenDepth241 = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE( _CameraDepthTexture, ase_screenPosNorm.xy ));
			float distanceDepth241 = abs( ( screenDepth241 - LinearEyeDepth( ase_screenPosNorm.z ) ) / ( _EdgesFade ) );
			float temp_output_377_0 = ( temp_output_368_0 * distanceDepth241 );
			float screenDepth230 = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE( _CameraDepthTexture, ase_screenPosNorm.xy ));
			float distanceDepth230 = abs( ( screenDepth230 - LinearEyeDepth( ase_screenPosNorm.z ) ) / ( ( _FoamDistance * 0.1 ) ) );
			float screenDepth4 = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE( _CameraDepthTexture, ase_screenPosNorm.xy ));
			float distanceDepth4 = abs( ( screenDepth4 - LinearEyeDepth( ase_screenPosNorm.z ) ) / ( _FoamDistance ) );
			float temp_output_6_0 = ( 1.0 - ( temp_output_368_0 * distanceDepth4 ) );
			float2 temp_cast_4 = (temp_output_215_0).xx;
			float2 panner254 = ( 1.0 * _Time.y * temp_cast_4 + ( 1.0 - temp_output_225_0 ).xy);
			float4 temp_cast_6 = (( temp_output_377_0 * ( ( ( 1.0 - ( temp_output_368_0 * distanceDepth230 ) ) + ( temp_output_6_0 * pow( ( temp_output_6_0 * ( tex2D( _FoamMask, panner213 ).r * tex2D( _FoamMask, panner254 ).r ) ) , ( 1.0 - 0.5 ) ) ) ) * _FoamPower ) )).xxxx;
			float4 clampResult9 = clamp( CalculateContrast(_FoamContrast,temp_cast_6) , float4( 0,0,0,0 ) , float4( 1,1,1,0 ) );
			float4 Edges62 = clampResult9;
			float3 lerpResult237 = lerp( BlendNormals( UnpackScaleNormal( tex2D( _NormalMap, panner72 ), _NormalPower ) , UnpackScaleNormal( tex2D( _NormalMap, panner73 ), _NormalPower ) ) , UnpackNormal( tex2D( _FoamNormal, panner213 ) ) , Edges62.rgb);
			float3 Normals81 = lerpResult237;
			o.Normal = Normals81;
			float4 ase_grabScreenPos = ASE_ComputeGrabScreenPos( ase_screenPos );
			float4 ase_grabScreenPosNorm = ase_grabScreenPos / ase_grabScreenPos.w;
			float4 screenColor20 = UNITY_SAMPLE_SCREENSPACE_TEXTURE(_GrabTexture,( ase_grabScreenPosNorm + float4( ( ( _RefractionPower / 10.0 ) * Normals81 ) , 0.0 ) ).xy);
			float4 Refraction60 = clamp( screenColor20 , float4( 0,0,0,0 ) , float4( 1,1,1,0 ) );
			float screenDepth95 = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE( _CameraDepthTexture, ase_screenPosNorm.xy ));
			float distanceDepth95 = abs( ( screenDepth95 - LinearEyeDepth( ase_screenPosNorm.z ) ) / ( _Depth ) );
			// float3 temp_cast_10 = (( 1.0 - saturate( ( distanceDepth95 * abs( ase_worldViewDir.y ) ) ) )).xxx;
			float3 temp_cast_11 = (( 1.0 - saturate( ( distanceDepth95 * abs( ase_worldViewDir.y ) ) ) )).xxx;

			float saturatedDistance = saturate(distanceDepth95);
			float4 depthColor = saturate((saturatedDistance * _DepthColor) + ((1 - saturatedDistance) * _DepthColor1));

			float3 gammaToLinear330 = GammaToLinearSpace( temp_cast_11 );
			float Depth98 = gammaToLinear330.x;
			// float4 lerpResult326 = lerp( _DepthColor1 , _DepthColor , ( 1.0 - Depth98 ));
			float4 lerpResult326 = depthColor;
			float mulTime27 = _Time.y * _CausticsSpeed;
			float time110 = ( mulTime27 * 1.0 );
			float2 UV22_g3 = ase_screenPosNorm.xy;
			float2 localUnStereo22_g3 = UnStereo( UV22_g3 );
			float2 break64_g1 = localUnStereo22_g3;
			float clampDepth69_g1 = SAMPLE_DEPTH_TEXTURE( _CameraDepthTexture, ase_screenPosNorm.xy );
			#ifdef UNITY_REVERSED_Z
				float staticSwitch38_g1 = ( 1.0 - clampDepth69_g1 );
			#else
				float staticSwitch38_g1 = clampDepth69_g1;
			#endif
			float3 appendResult39_g1 = (float3(break64_g1.x , break64_g1.y , staticSwitch38_g1));
			float4 appendResult42_g1 = (float4((appendResult39_g1*2.0 + -1.0) , 1.0));
			float4 temp_output_43_0_g1 = mul( unity_CameraInvProjection, appendResult42_g1 );
			float3 temp_output_46_0_g1 = ( (temp_output_43_0_g1).xyz / (temp_output_43_0_g1).w );
			float3 In72_g1 = temp_output_46_0_g1;
			float3 localInvertDepthDir72_g1 = InvertDepthDir72_g1( In72_g1 );
			float4 appendResult49_g1 = (float4(localInvertDepthDir72_g1 , 1.0));
			float4 temp_output_348_0 = mul( unity_CameraToWorld, appendResult49_g1 );
			#if defined(LIGHTMAP_ON) && UNITY_VERSION < 560 //aseld
			float3 ase_worldlightDir = 0;
			#else //aseld
			float3 ase_worldlightDir = normalize( UnityWorldSpaceLightDir( ase_worldPos ) );
			#endif //aseld
			float2 appendResult353 = (float2(ase_worldlightDir.x , ase_worldlightDir.z));
			float3 worldToObj350 = mul( unity_WorldToObject, float4( temp_output_348_0.xyz, 1 ) ).xyz;
			float2 temp_output_355_0 = ( (temp_output_348_0).xz + ( appendResult353 * -worldToObj350.y * _CousticOffset ) );
			float2 coords110 = temp_output_355_0 * ( _CausticsScale * 0.5 );
			float2 id110 = 0;
			float2 uv110 = 0;
			float voroi110 = voronoi110( coords110, time110, id110, uv110, 0 );
			float time129 = mulTime27;
			float2 coords129 = temp_output_355_0 * _CausticsScale;
			float2 id129 = 0;
			float2 uv129 = 0;
			float voroi129 = voronoi129( coords129, time129, id129, uv129, 0 );
			float Caustics47 = saturate( ( voroi110 + voroi129 ) );
			float clampResult56 = clamp( Caustics47 , 0.0 , 1.0 );
			float4 blendOpDest173 = lerp( lerpResult326 , _CausticsColor , clampResult56);
			float4 lerpBlendMode173 = lerp(blendOpDest173, (( blendOpDest173 > 0.5 ) ? ( 1.0 - 2.0 * ( 1.0 - blendOpDest173 ) * ( 1.0 - Refraction60 ) ) : ( 2.0 * blendOpDest173 * Refraction60 ) ), ( 1.0 - _DepthColor.a ));
			float4 Albedo58 = ( saturate( lerpBlendMode173 ));
			float4 lerpResult100 = lerp( Albedo58 , Refraction60 , Depth98);
			// float4 lerpResult100 = Refraction60;
			float4 clampResult109 = clamp( ( Edges62 + lerpResult100 ) , float4( 0,0,0,0 ) , float4( 1,1,1,0 ) );
			o.Albedo = clampResult109.rgb * _TintColor.rgb;
			// o.Albedo = blendOpDest173;// * (_DepthColor.a) * _TintColor.rgb;

			o.Metallic = _MetallicPower;
			o.Smoothness = _SmoothnessPower;
			float clampResult249 = clamp( temp_output_377_0 , 0.0 , 1.0 );
			float4 ase_vertex4Pos = mul( unity_WorldToObject, float4( i.worldPos , 1 ) );
			float3 ase_viewPos = UnityObjectToViewPos( ase_vertex4Pos );
			float ase_screenDepth = -ase_viewPos.z;
			float cameraDepthFade293 = (( ase_screenDepth -_ProjectionParams.y - _DistanceFadeOffset ) / _DistanceFade);
			float Opacity263 = ( clampResult249 * saturate( ( 1.0 - ( temp_output_368_0 * cameraDepthFade293 ) ) ) );
			o.Alpha = Opacity263;

			float3 Normal = UnpackNormal(tex2D(_SurfaceNormalTex, i.uv_SurfaceNormalTex + _Time.y * _SurfaceWaveSpeed)) * UnpackNormal(tex2D(_SurfaceNormalTex2, i.uv_SurfaceNormalTex2 - _Time.z * _SurfaceWaveSpeed * 0.5));
            o.Normal = Normal * float3(_SurfaceNormalPower, _SurfaceNormalPower, 1);
            float rim = dot(o.Normal, i.viewDir);
            o.Emission = pow(1 - rim, _SurfaceWaveRange) * (1 - dot(i.worldNormal, i.viewDir)) * 0.5 * _SurfaceColor;
		}

		ENDCG

		CGPROGRAM
		#pragma surface surf Standard alpha:fade keepalpha fullforwardshadows vertex:vertexDataFunc

		ENDCG

		// Pass
		// {
		// 	Name "ShadowCaster"
		// 	Tags{ "LightMode" = "ShadowCaster" }
		// 	ZWrite On
		// 	CGPROGRAM
		// 	#pragma vertex vert
		// 	#pragma fragment frag
		// 	#pragma target 4.6
		// 	#pragma multi_compile_shadowcaster
		// 	#pragma multi_compile UNITY_PASS_SHADOWCASTER
		// 	#pragma skip_variants FOG_LINEAR FOG_EXP FOG_EXP2
		// 	#include "HLSLSupport.cginc"
		// 	#if ( SHADER_API_D3D11 || SHADER_API_GLCORE || SHADER_API_GLES || SHADER_API_GLES3 || SHADER_API_METAL || SHADER_API_VULKAN )
		// 		#define CAN_SKIP_VPOS
		// 	#endif
		// 	#include "UnityCG.cginc"
		// 	#include "Lighting.cginc"
		// 	#include "UnityPBSLighting.cginc"
		// 	sampler3D _DitherMaskLOD;
		// 	struct v2f
		// 	{
		// 		V2F_SHADOW_CASTER;
		// 		float3 worldPos : TEXCOORD1;
		// 		float4 screenPos : TEXCOORD2;
		// 		float4 tSpace0 : TEXCOORD3;
		// 		float4 tSpace1 : TEXCOORD4;
		// 		float4 tSpace2 : TEXCOORD5;
		// 		UNITY_VERTEX_INPUT_INSTANCE_ID
		// 		UNITY_VERTEX_OUTPUT_STEREO
		// 	};
		// 	v2f vert( appdata_full v )
		// 	{
		// 		v2f o;
		// 		UNITY_SETUP_INSTANCE_ID( v );
		// 		UNITY_INITIALIZE_OUTPUT( v2f, o );
		// 		UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO( o );
		// 		UNITY_TRANSFER_INSTANCE_ID( v, o );
		// 		Input customInputData;
		// 		vertexDataFunc( v );
		// 		float3 worldPos = mul( unity_ObjectToWorld, v.vertex ).xyz;
		// 		half3 worldNormal = UnityObjectToWorldNormal( v.normal );
		// 		half3 worldTangent = UnityObjectToWorldDir( v.tangent.xyz );
		// 		half tangentSign = v.tangent.w * unity_WorldTransformParams.w;
		// 		half3 worldBinormal = cross( worldNormal, worldTangent ) * tangentSign;
		// 		o.tSpace0 = float4( worldTangent.x, worldBinormal.x, worldNormal.x, worldPos.x );
		// 		o.tSpace1 = float4( worldTangent.y, worldBinormal.y, worldNormal.y, worldPos.y );
		// 		o.tSpace2 = float4( worldTangent.z, worldBinormal.z, worldNormal.z, worldPos.z );
		// 		o.worldPos = worldPos;
		// 		TRANSFER_SHADOW_CASTER_NORMALOFFSET( o )
		// 		o.screenPos = ComputeScreenPos( o.pos );
		// 		return o;
		// 	}
		// 	half4 frag( v2f IN
		// 	#if !defined( CAN_SKIP_VPOS )
		// 	, UNITY_VPOS_TYPE vpos : VPOS
		// 	#endif
		// 	) : SV_Target
		// 	{
		// 		UNITY_SETUP_INSTANCE_ID( IN );
		// 		Input surfIN;
		// 		UNITY_INITIALIZE_OUTPUT( Input, surfIN );
		// 		float3 worldPos = IN.worldPos;
		// 		half3 worldViewDir = normalize( UnityWorldSpaceViewDir( worldPos ) );
		// 		surfIN.worldPos = worldPos;
		// 		surfIN.screenPos = IN.screenPos;
		// 		SurfaceOutputStandard o;
		// 		UNITY_INITIALIZE_OUTPUT( SurfaceOutputStandard, o )
		// 		surf( surfIN, o );
		// 		#if defined( CAN_SKIP_VPOS )
		// 		float2 vpos = IN.pos;
		// 		#endif
		// 		half alphaRef = tex3D( _DitherMaskLOD, float3( vpos.xy * 0.25, o.Alpha * 0.9375 ) ).a;
		// 		clip( alphaRef - 0.01 );
		// 		SHADOW_CASTER_FRAGMENT( IN )
		// 	}
		// 	ENDCG
		// }
	}
	Fallback "Diffuse"
	CustomEditor "ASEMaterialInspector"
}
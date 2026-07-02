import{S as t}from"./app-Cs0zFCuS.js";const e="logDepthVertex",r=`#ifdef LOGARITHMICDEPTH
vertexOutputs.vFragmentDepth=1.0+vertexOutputs.position.w;vertexOutputs.position.z=log2(max(0.000001,vertexOutputs.vFragmentDepth))*uniforms.logarithmicDepthConstant;
#endif
`;t.IncludesShadersStoreWGSL[e]||(t.IncludesShadersStoreWGSL[e]=r);

import{S as r}from"./app-DSJ_ZURW.js";import"./index-CcqAbjAb.js";const a="shadowMapFragmentSoftTransparentShadow",o=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;r.IncludesShadersStore[a]||(r.IncludesShadersStore[a]=o);const S={name:a,shader:o};export{S as shadowMapFragmentSoftTransparentShadow};

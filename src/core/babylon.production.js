// Keep this as an explicit export, not only a bare side-effect import.
// Vite/esbuild preserves entry exports during dependency pre-bundling, which
// guarantees that the component patches the exact ShadowGenerator class
// exported by this runtime bundle.
export { ShadowGeneratorSceneComponent } from '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js';

export { Engine } from '@babylonjs/core/Engines/engine.js';
export { Scene } from '@babylonjs/core/scene.js';
export { Node } from '@babylonjs/core/node.js';
export { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.js';
export { Mesh } from '@babylonjs/core/Meshes/mesh.js';
export { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
export { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
export { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
export { CSG } from '@babylonjs/core/Meshes/csg.js';
export { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js';
export { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
export { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
export { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector.js';
export { Plane } from '@babylonjs/core/Maths/math.plane.js';
export { Ray } from '@babylonjs/core/Culling/ray.js';
export { Material } from '@babylonjs/core/Materials/material.js';
export { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.js';
export { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage.js';
export { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
export { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture.js';
export { MirrorTexture } from '@babylonjs/core/Materials/Textures/mirrorTexture.js';
export { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture.js';
export { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
export { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
export { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
export { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
export { PointLight } from '@babylonjs/core/Lights/pointLight.js';
export { SpotLight } from '@babylonjs/core/Lights/spotLight.js';
export { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
export { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
export { Tools } from '@babylonjs/core/Misc/tools.js';
export { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe.js';
export { PhotoDome } from '@babylonjs/core/Helpers/photoDome.js';


// 确保在运行时所需的加载器和着色器被提前打包，防止开发环境（如 Vite 依赖预构建）动态导入时出现 404 错误
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader.js';
import '@babylonjs/core/Materials/Textures/Loaders/exrTextureLoader.js';
import '@babylonjs/core/Shaders/default.vertex.js';
import '@babylonjs/core/Shaders/default.fragment.js';
import '@babylonjs/core/Culling/ray.js';
import '@babylonjs/core/Rendering/outlineRenderer.js';
import '@babylonjs/core/Shaders/outline.vertex.js';
import '@babylonjs/core/Shaders/outline.fragment.js';
import '@babylonjs/core/Misc/screenshotTools.js';
import '@babylonjs/core/XR/features/WebXRLayers.js';

// 显式导入引擎的常用扩展，以防止其在模块化打包或依赖排除时因副作用未执行导致相关 prototype 方法缺失
import '@babylonjs/core/Engines/Extensions/engine.alpha.js';
import '@babylonjs/core/Engines/Extensions/engine.rawTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.readTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.dynamicBuffer.js';
import '@babylonjs/core/Engines/Extensions/engine.cubeTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.renderTarget.js';
import '@babylonjs/core/Engines/Extensions/engine.renderTargetTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.renderTargetCube.js';
import '@babylonjs/core/Engines/Extensions/engine.prefilteredCubeTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.uniformBuffer.js';

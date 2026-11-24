import {
  Camera, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial,
  SRGBColorSpace, Vector4, WebGLRenderTarget, type WebGLRenderer,
} from 'three';

type CameraImage = { width: number; height: number };

export function roomPhoto(renderer: WebGLRenderer, scene: Scene, view: XRView) {
  const image = (view as XRView & { camera?: CameraImage }).camera;
  if (!image) throw new Error('Use the tablet screenshot option on this device.');
  // Three types this argument as a rendering camera, but WebXRManager keys it by XRView.camera.
  const texture = renderer.xr.getCameraTexture(image as unknown as Parameters<typeof renderer.xr.getCameraTexture>[0]);
  if (!texture?.sourceTexture) throw new Error('Camera image unavailable. Use the tablet screenshot option.');
  const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const target = new WebGLRenderTarget(width, height, { colorSpace: SRGBColorSpace });
  const material = new ShaderMaterial({
    uniforms: { cameraImage: { value: texture } },
    vertexShader: 'varying vec2 coords; void main(){coords=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: 'uniform sampler2D cameraImage; varying vec2 coords; void main(){gl_FragColor=vec4(texture2D(cameraImage,coords).rgb,1.);}',
    depthTest: false, depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const backdrop = new Scene();
  backdrop.add(quad);
  const camera = new PerspectiveCamera();
  camera.projectionMatrix.fromArray(view.projectionMatrix);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.matrix.fromArray(view.transform.matrix);
  camera.matrixAutoUpdate = false;
  const previous = renderer.getRenderTarget();
  const viewport = renderer.getViewport(new Vector4());
  const autoClear = renderer.autoClear;
  const xr = renderer.xr.enabled;
  const pixels = new Uint8Array(width * height * 4);
  try {
    renderer.xr.enabled = false;
    renderer.setRenderTarget(target);
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backdrop, new Camera());
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
  } finally {
    renderer.setRenderTarget(previous);
    renderer.setViewport(viewport);
    renderer.autoClear = autoClear;
    renderer.xr.enabled = xr;
    target.dispose();
    quad.geometry.dispose();
    material.dispose();
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create photo.');
  const data = context.createImageData(width, height);
  const stride = width * 4;
  for (let row = 0; row < height; row++) {
    data.data.set(pixels.subarray(row * stride, (row + 1) * stride), (height - row - 1) * stride);
  }
  context.putImageData(data, 0, 0);
  return canvas.toDataURL('image/jpeg', .94);
}

export type ARSupport = 'checking'|'available'|'insecure'|'embedded'|'blocked'|'missing-api'|'unsupported'|'error';
export interface ARProbe {
 secure:boolean; embedded:boolean; policyAllowed:boolean; hasXR:boolean; hasHitTest:boolean;
 supportsSession:()=>Promise<boolean>;
}
export async function detectARSupport(probe:ARProbe):Promise<ARSupport> {
 if(!probe.secure)return 'insecure';
 if(!probe.policyAllowed)return 'blocked';
 if(probe.embedded)return 'embedded';
 if(!probe.hasXR||!probe.hasHitTest)return 'missing-api';
 try{return await probe.supportsSession()?'available':'unsupported'}catch{return 'error'}
}
export function browserARProbe():ARProbe {
 const policy=(document as Document & {permissionsPolicy?:{allowsFeature:(name:string)=>boolean};featurePolicy?:{allowsFeature:(name:string)=>boolean}}).permissionsPolicy || (document as Document & {featurePolicy?:{allowsFeature:(name:string)=>boolean}}).featurePolicy;
 const session=(window as unknown as {XRSession?:{prototype:object}}).XRSession;
 return {secure:window.isSecureContext,embedded:window.self!==window.top,policyAllowed:policy?.allowsFeature('xr-spatial-tracking')!==false,hasXR:!!navigator.xr,hasHitTest:!!session&&'requestHitTestSource' in session.prototype,supportsSession:()=>navigator.xr?.isSessionSupported('immersive-ar')||Promise.resolve(false)};
}
export const supportMessages:Record<ARSupport,{title:string;body:string}>={
 checking:{title:'Checking this device…',body:'Checking browser support before requesting the camera.'},
 available:{title:'This browser reports AR support.',body:'Tap View in your room, allow the permission prompt, then move the device slowly over a well-lit floor.'},
 insecure:{title:'Use the secure HTTPS preview.',body:'The current address uses HTTP. Open the secure preview on your Android device.'},
 embedded:{title:'Open this page directly in Chrome.',body:'This preview is embedded in another page. Open the direct link below in the full Chrome app, then check again.'},
 blocked:{title:'This page is not allowed to start AR.',body:'The page or its embedding browser blocks spatial tracking. Open the direct link in Chrome. If it remains blocked, the hosting policy must be corrected.'},
 'missing-api':{title:'This browser does not expose room-tracking AR.',body:'Use updated Chrome on an ARCore-supported Android phone or tablet, with Google Play Services for AR installed. A working camera alone does not provide AR tracking.'},
 unsupported:{title:'This device reports that AR is unsupported.',body:'Chrome cannot start an immersive AR session here. Check Google’s supported-device list and Google Play Services for AR. You can still rotate and recolour the 3D model.'},
 error:{title:'The AR compatibility check failed.',body:'Open the direct page in Chrome and try Check again. The browser may be blocking spatial tracking.'}
};

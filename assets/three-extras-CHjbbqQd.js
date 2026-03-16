import{C as Me,V as E,M as z,T as U,Q as ie,S as le,a as b,R as Se,P as ve,b as Q,c as G,d as ye,B as I,e as Ae,f as $,g as De,N as Re,h as Ce,I as Le,D as Pe,i as q,j as Ie,k as he,l as Ne,m as Ue,n as Oe,o as ze,L as Fe,p as Be,q as ke,r as He,s as Ge,t as je,u as Ve,v as Ye,O as Ke,w as Xe,F as ce,x as O,U as ne,W as X,H as W,y as We,z as Ze,A as Qe,E as qe}from"./three-core-CzqpXnrg.js";const ue={type:"change"},re={type:"start"},Te={type:"end"},K=new Se,fe=new ve,Je=Math.cos(70*Q.DEG2RAD),w=new E,D=2*Math.PI,y={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},ee=1e-6;class Gt extends Me{constructor(e,t=null){super(e,t),this.state=y.NONE,this.target=new E,this.cursor=new E,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:z.ROTATE,MIDDLE:z.DOLLY,RIGHT:z.PAN},this.touches={ONE:U.ROTATE,TWO:U.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new E,this._lastQuaternion=new ie,this._lastTargetPosition=new E,this._quat=new ie().setFromUnitVectors(e.up,new E(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new le,this._sphericalDelta=new le,this._scale=1,this._panOffset=new E,this._rotateStart=new b,this._rotateEnd=new b,this._rotateDelta=new b,this._panStart=new b,this._panEnd=new b,this._panDelta=new b,this._dollyStart=new b,this._dollyEnd=new b,this._dollyDelta=new b,this._dollyDirection=new E,this._mouse=new b,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=et.bind(this),this._onPointerDown=$e.bind(this),this._onPointerUp=tt.bind(this),this._onContextMenu=lt.bind(this),this._onMouseWheel=nt.bind(this),this._onKeyDown=ot.bind(this),this._onTouchStart=rt.bind(this),this._onTouchMove=at.bind(this),this._onMouseDown=st.bind(this),this._onMouseMove=it.bind(this),this._interceptControlDown=ht.bind(this),this._interceptControlUp=ct.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(ue),this.update(),this.state=y.NONE}update(e=null){const t=this.object.position;w.copy(t).sub(this.target),w.applyQuaternion(this._quat),this._spherical.setFromVector3(w),this.autoRotate&&this.state===y.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=D:i>Math.PI&&(i-=D),s<-Math.PI?s+=D:s>Math.PI&&(s-=D),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let n=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),n=o!=this._spherical.radius}if(w.setFromSpherical(this._spherical),w.applyQuaternion(this._quatInverse),t.copy(this.target).add(w),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=w.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),n=!!l}else if(this.object.isOrthographicCamera){const a=new E(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),n=l!==this.object.zoom;const c=new E(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=w.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(K.origin.copy(this.object.position),K.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(K.direction))<Je?this.object.lookAt(this.target):(fe.setFromNormalAndCoplanarPoint(this.object.up,this.target),K.intersectPlane(fe,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),n=!0)}return this._scale=1,this._performCursorZoom=!1,n||this._lastPosition.distanceToSquared(this.object.position)>ee||8*(1-this._lastQuaternion.dot(this.object.quaternion))>ee||this._lastTargetPosition.distanceToSquared(this.target)>ee?(this.dispatchEvent(ue),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?D/60*this.autoRotateSpeed*e:D/60/60*this.autoRotateSpeed}_getZoomScale(e){const t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){w.setFromMatrixColumn(t,0),w.multiplyScalar(-e),this._panOffset.add(w)}_panUp(e,t){this.screenSpacePanning===!0?w.setFromMatrixColumn(t,1):(w.setFromMatrixColumn(t,0),w.crossVectors(this.object.up,w)),w.multiplyScalar(e),this._panOffset.add(w)}_pan(e,t){const i=this.domElement;if(this.object.isPerspectiveCamera){const s=this.object.position;w.copy(s).sub(this.target);let n=w.length();n*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*n/i.clientHeight,this.object.matrix),this._panUp(2*t*n/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),s=e-i.left,n=t-i.top,o=i.width,a=i.height;this._mouse.x=s/o*2-1,this._mouse.y=-(n/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(D*this._rotateDelta.x/t.clientHeight),this._rotateUp(D*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(D*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-D*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(D*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-D*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(i,s)}}_handleTouchStartDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,n=Math.sqrt(i*i+s*s);this._dollyStart.set(0,n)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),n=.5*(e.pageY+i.y);this._rotateEnd.set(s,n)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(D*this._rotateDelta.x/t.clientHeight),this._rotateUp(D*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,n=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,n),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new b,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){const t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function $e(r){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(r.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(r)&&(this._addPointer(r),r.pointerType==="touch"?this._onTouchStart(r):this._onMouseDown(r)))}function et(r){this.enabled!==!1&&(r.pointerType==="touch"?this._onTouchMove(r):this._onMouseMove(r))}function tt(r){switch(this._removePointer(r),this._pointers.length){case 0:this.domElement.releasePointerCapture(r.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Te),this.state=y.NONE;break;case 1:const e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function st(r){let e;switch(r.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case z.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(r),this.state=y.DOLLY;break;case z.ROTATE:if(r.ctrlKey||r.metaKey||r.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(r),this.state=y.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(r),this.state=y.ROTATE}break;case z.PAN:if(r.ctrlKey||r.metaKey||r.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(r),this.state=y.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(r),this.state=y.PAN}break;default:this.state=y.NONE}this.state!==y.NONE&&this.dispatchEvent(re)}function it(r){switch(this.state){case y.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(r);break;case y.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(r);break;case y.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(r);break}}function nt(r){this.enabled===!1||this.enableZoom===!1||this.state!==y.NONE||(r.preventDefault(),this.dispatchEvent(re),this._handleMouseWheel(this._customWheelEvent(r)),this.dispatchEvent(Te))}function ot(r){this.enabled!==!1&&this._handleKeyDown(r)}function rt(r){switch(this._trackPointer(r),this._pointers.length){case 1:switch(this.touches.ONE){case U.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(r),this.state=y.TOUCH_ROTATE;break;case U.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(r),this.state=y.TOUCH_PAN;break;default:this.state=y.NONE}break;case 2:switch(this.touches.TWO){case U.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(r),this.state=y.TOUCH_DOLLY_PAN;break;case U.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(r),this.state=y.TOUCH_DOLLY_ROTATE;break;default:this.state=y.NONE}break;default:this.state=y.NONE}this.state!==y.NONE&&this.dispatchEvent(re)}function at(r){switch(this._trackPointer(r),this.state){case y.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(r),this.update();break;case y.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(r),this.update();break;case y.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(r),this.update();break;case y.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(r),this.update();break;default:this.state=y.NONE}}function lt(r){this.enabled!==!1&&r.preventDefault()}function ht(r){r.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function ct(r){r.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const pe={POSITION:["byte","byte normalized","unsigned byte","unsigned byte normalized","short","short normalized","unsigned short","unsigned short normalized"],NORMAL:["byte normalized","short normalized"],TANGENT:["byte normalized","short normalized"],TEXCOORD:["byte","byte normalized","unsigned byte","short","short normalized","unsigned short"]};class oe{constructor(){this.textureUtils=null,this.pluginCallbacks=[],this.register(function(e){return new bt(e)}),this.register(function(e){return new wt(e)}),this.register(function(e){return new vt(e)}),this.register(function(e){return new At(e)}),this.register(function(e){return new Dt(e)}),this.register(function(e){return new Rt(e)}),this.register(function(e){return new Et(e)}),this.register(function(e){return new Mt(e)}),this.register(function(e){return new St(e)}),this.register(function(e){return new Ct(e)}),this.register(function(e){return new Lt(e)}),this.register(function(e){return new Pt(e)}),this.register(function(e){return new It(e)}),this.register(function(e){return new Nt(e)})}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}setTextureUtils(e){return this.textureUtils=e,this}parse(e,t,i,s){const n=new Tt,o=[];for(let a=0,l=this.pluginCallbacks.length;a<l;a++)o.push(this.pluginCallbacks[a](n));n.setPlugins(o),n.setTextureUtils(this.textureUtils),n.writeAsync(e,t,s).catch(i)}parseAsync(e,t){const i=this;return new Promise(function(s,n){i.parse(e,s,n,t)})}}const _={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,BYTE:5120,UNSIGNED_BYTE:5121,SHORT:5122,UNSIGNED_SHORT:5123,INT:5124,UNSIGNED_INT:5125,FLOAT:5126,ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,NEAREST:9728,LINEAR:9729,NEAREST_MIPMAP_NEAREST:9984,LINEAR_MIPMAP_NEAREST:9985,NEAREST_MIPMAP_LINEAR:9986,LINEAR_MIPMAP_LINEAR:9987,CLAMP_TO_EDGE:33071,MIRRORED_REPEAT:33648,REPEAT:10497},te="KHR_mesh_quantization",C={};C[Ue]=_.NEAREST;C[Oe]=_.NEAREST_MIPMAP_NEAREST;C[ze]=_.NEAREST_MIPMAP_LINEAR;C[Fe]=_.LINEAR;C[Be]=_.LINEAR_MIPMAP_NEAREST;C[ke]=_.LINEAR_MIPMAP_LINEAR;C[He]=_.CLAMP_TO_EDGE;C[Ge]=_.REPEAT;C[je]=_.MIRRORED_REPEAT;const de={scale:"scale",position:"translation",quaternion:"rotation",morphTargetInfluences:"weights"},ut=new G,me=12,ft=1179937895,pt=2,ge=8,dt=1313821514,mt=5130562;function H(r,e){return r.length===e.length&&r.every(function(t,i){return t===e[i]})}function gt(r){return new TextEncoder().encode(r).buffer}function xt(r){return H(r.elements,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function _t(r,e,t){const i={min:new Array(r.itemSize).fill(Number.POSITIVE_INFINITY),max:new Array(r.itemSize).fill(Number.NEGATIVE_INFINITY)};for(let s=e;s<e+t;s++)for(let n=0;n<r.itemSize;n++){let o;r.itemSize>4?o=r.array[s*r.itemSize+n]:(n===0?o=r.getX(s):n===1?o=r.getY(s):n===2?o=r.getZ(s):n===3&&(o=r.getW(s)),r.normalized===!0&&(o=Q.normalize(o,r.array))),i.min[n]=Math.min(i.min[n],o),i.max[n]=Math.max(i.max[n],o)}return i}function be(r){return Math.ceil(r/4)*4}function se(r,e=0){const t=be(r.byteLength);if(t!==r.byteLength){const i=new Uint8Array(t);if(i.set(new Uint8Array(r)),e!==0)for(let s=r.byteLength;s<t;s++)i[s]=e;return i.buffer}return r}function xe(){return typeof document>"u"&&typeof OffscreenCanvas<"u"?new OffscreenCanvas(1,1):document.createElement("canvas")}function yt(r,e){if(typeof OffscreenCanvas<"u"&&r instanceof OffscreenCanvas){let t;return e==="image/jpeg"?t=.92:e==="image/webp"&&(t=.8),r.convertToBlob({type:e,quality:t})}else return new Promise(t=>r.toBlob(t,e))}class Tt{constructor(){this.plugins=[],this.options={},this.pending=[],this.buffers=[],this.byteOffset=0,this.buffers=[],this.nodeMap=new Map,this.skins=[],this.extensionsUsed={},this.extensionsRequired={},this.uids=new Map,this.uid=0,this.json={asset:{version:"2.0",generator:"THREE.GLTFExporter r"+Ae}},this.cache={meshes:new Map,attributes:new Map,attributesNormalized:new Map,materials:new Map,textures:new Map,images:new Map},this.textureUtils=null}setPlugins(e){this.plugins=e}setTextureUtils(e){this.textureUtils=e}async writeAsync(e,t,i={}){this.options=Object.assign({binary:!1,trs:!1,onlyVisible:!0,maxTextureSize:1/0,animations:[],includeCustomExtensions:!1},i),this.options.animations.length>0&&(this.options.trs=!0),await this.processInputAsync(e),await Promise.all(this.pending);const s=this,n=s.buffers,o=s.json;i=s.options;const a=s.extensionsUsed,l=s.extensionsRequired,c=new Blob(n,{type:"application/octet-stream"}),u=Object.keys(a),h=Object.keys(l);if(u.length>0&&(o.extensionsUsed=u),h.length>0&&(o.extensionsRequired=h),o.buffers&&o.buffers.length>0&&(o.buffers[0].byteLength=c.size),i.binary===!0){const d=new FileReader;d.readAsArrayBuffer(c),d.onloadend=function(){const f=se(d.result),m=new DataView(new ArrayBuffer(ge));m.setUint32(0,f.byteLength,!0),m.setUint32(4,mt,!0);const g=se(gt(JSON.stringify(o)),32),x=new DataView(new ArrayBuffer(ge));x.setUint32(0,g.byteLength,!0),x.setUint32(4,dt,!0);const S=new ArrayBuffer(me),L=new DataView(S);L.setUint32(0,ft,!0),L.setUint32(4,pt,!0);const Y=me+x.byteLength+g.byteLength+m.byteLength+f.byteLength;L.setUint32(8,Y,!0);const p=new Blob([S,x,g,m,f],{type:"application/octet-stream"}),T=new FileReader;T.readAsArrayBuffer(p),T.onloadend=function(){t(T.result)}}}else if(o.buffers&&o.buffers.length>0){const d=new FileReader;d.readAsDataURL(c),d.onloadend=function(){const f=d.result;o.buffers[0].uri=f,t(o)}}else t(o)}serializeUserData(e,t){if(Object.keys(e.userData).length===0)return;const i=this.options,s=this.extensionsUsed;try{const n=JSON.parse(JSON.stringify(e.userData));if(i.includeCustomExtensions&&n.gltfExtensions){t.extensions===void 0&&(t.extensions={});for(const o in n.gltfExtensions)t.extensions[o]=n.gltfExtensions[o],s[o]=!0;delete n.gltfExtensions}Object.keys(n).length>0&&(t.extras=n)}catch(n){console.warn("THREE.GLTFExporter: userData of '"+e.name+"' won't be serialized because of JSON.stringify error - "+n.message)}}getUID(e,t=!1){if(this.uids.has(e)===!1){const s=new Map;s.set(!0,this.uid++),s.set(!1,this.uid++),this.uids.set(e,s)}return this.uids.get(e).get(t)}isNormalizedNormalAttribute(e){if(this.cache.attributesNormalized.has(e))return!1;const i=new E;for(let s=0,n=e.count;s<n;s++)if(Math.abs(i.fromBufferAttribute(e,s).length()-1)>5e-4)return!1;return!0}createNormalizedNormalAttribute(e){const t=this.cache;if(t.attributesNormalized.has(e))return t.attributesNormalized.get(e);const i=e.clone(),s=new E;for(let n=0,o=i.count;n<o;n++)s.fromBufferAttribute(i,n),s.x===0&&s.y===0&&s.z===0?s.setX(1):s.normalize(),i.setXYZ(n,s.x,s.y,s.z);return t.attributesNormalized.set(e,i),i}applyTextureTransform(e,t){let i=!1;const s={};(t.offset.x!==0||t.offset.y!==0)&&(s.offset=t.offset.toArray(),i=!0),t.rotation!==0&&(s.rotation=t.rotation,i=!0),(t.repeat.x!==1||t.repeat.y!==1)&&(s.scale=t.repeat.toArray(),i=!0),i&&(e.extensions=e.extensions||{},e.extensions.KHR_texture_transform=s,this.extensionsUsed.KHR_texture_transform=!0)}async buildMetalRoughTextureAsync(e,t){if(e===t)return e;function i(f){return f.colorSpace===Ne?function(g){return g<.04045?g*.0773993808:Math.pow(g*.9478672986+.0521327014,2.4)}:function(g){return g}}e instanceof $&&(e=await this.decompressTextureAsync(e)),t instanceof $&&(t=await this.decompressTextureAsync(t));const s=e?e.image:null,n=t?t.image:null,o=Math.max(s?s.width:0,n?n.width:0),a=Math.max(s?s.height:0,n?n.height:0),l=xe();l.width=o,l.height=a;const c=l.getContext("2d",{willReadFrequently:!0});c.fillStyle="#00ffff",c.fillRect(0,0,o,a);const u=c.getImageData(0,0,o,a);if(s){c.drawImage(s,0,0,o,a);const f=i(e),m=c.getImageData(0,0,o,a).data;for(let g=2;g<m.length;g+=4)u.data[g]=f(m[g]/256)*256}if(n){c.drawImage(n,0,0,o,a);const f=i(t),m=c.getImageData(0,0,o,a).data;for(let g=1;g<m.length;g+=4)u.data[g]=f(m[g]/256)*256}c.putImageData(u,0,0);const d=(e||t).clone();return d.source=new De(l),d.colorSpace=Re,d.channel=(e||t).channel,e&&t&&e.channel!==t.channel&&console.warn("THREE.GLTFExporter: UV channels for metalnessMap and roughnessMap textures must match."),console.warn("THREE.GLTFExporter: Merged metalnessMap and roughnessMap textures."),d}async decompressTextureAsync(e,t=1/0){if(this.textureUtils===null)throw new Error("THREE.GLTFExporter: setTextureUtils() must be called to process compressed textures.");return await this.textureUtils.decompress(e,t)}processBuffer(e){const t=this.json,i=this.buffers;return t.buffers||(t.buffers=[{byteLength:0}]),i.push(e),0}processBufferView(e,t,i,s,n){const o=this.json;o.bufferViews||(o.bufferViews=[]);let a;switch(t){case _.BYTE:case _.UNSIGNED_BYTE:a=1;break;case _.SHORT:case _.UNSIGNED_SHORT:a=2;break;default:a=4}let l=e.itemSize*a;n===_.ARRAY_BUFFER&&(l=Math.ceil(l/4)*4);const c=be(s*l),u=new DataView(new ArrayBuffer(c));let h=0;for(let m=i;m<i+s;m++){for(let g=0;g<e.itemSize;g++){let x;e.itemSize>4?x=e.array[m*e.itemSize+g]:(g===0?x=e.getX(m):g===1?x=e.getY(m):g===2?x=e.getZ(m):g===3&&(x=e.getW(m)),e.normalized===!0&&(x=Q.normalize(x,e.array))),t===_.FLOAT?u.setFloat32(h,x,!0):t===_.INT?u.setInt32(h,x,!0):t===_.UNSIGNED_INT?u.setUint32(h,x,!0):t===_.SHORT?u.setInt16(h,x,!0):t===_.UNSIGNED_SHORT?u.setUint16(h,x,!0):t===_.BYTE?u.setInt8(h,x):t===_.UNSIGNED_BYTE&&u.setUint8(h,x),h+=a}h%l!==0&&(h+=l-h%l)}const d={buffer:this.processBuffer(u.buffer),byteOffset:this.byteOffset,byteLength:c};return n!==void 0&&(d.target=n),n===_.ARRAY_BUFFER&&(d.byteStride=l),this.byteOffset+=c,o.bufferViews.push(d),{id:o.bufferViews.length-1,byteLength:0}}processBufferViewImage(e){const t=this,i=t.json;return i.bufferViews||(i.bufferViews=[]),new Promise(function(s){const n=new FileReader;n.readAsArrayBuffer(e),n.onloadend=function(){const o=se(n.result),a={buffer:t.processBuffer(o),byteOffset:t.byteOffset,byteLength:o.byteLength};t.byteOffset+=o.byteLength,s(i.bufferViews.push(a)-1)}})}processAccessor(e,t,i,s){const n=this.json,o={1:"SCALAR",2:"VEC2",3:"VEC3",4:"VEC4",9:"MAT3",16:"MAT4"};let a;if(e.array.constructor===Float32Array)a=_.FLOAT;else if(e.array.constructor===Int32Array)a=_.INT;else if(e.array.constructor===Uint32Array)a=_.UNSIGNED_INT;else if(e.array.constructor===Int16Array)a=_.SHORT;else if(e.array.constructor===Uint16Array)a=_.UNSIGNED_SHORT;else if(e.array.constructor===Int8Array)a=_.BYTE;else if(e.array.constructor===Uint8Array)a=_.UNSIGNED_BYTE;else throw new Error("THREE.GLTFExporter: Unsupported bufferAttribute component type: "+e.array.constructor.name);if(i===void 0&&(i=0),(s===void 0||s===1/0)&&(s=e.count),s===0)return null;const l=_t(e,i,s);let c;t!==void 0&&(c=e===t.index?_.ELEMENT_ARRAY_BUFFER:_.ARRAY_BUFFER);const u=this.processBufferView(e,a,i,s,c),h={bufferView:u.id,byteOffset:u.byteOffset,componentType:a,count:s,max:l.max,min:l.min,type:o[e.itemSize]};return e.normalized===!0&&(h.normalized=!0),n.accessors||(n.accessors=[]),n.accessors.push(h)-1}processImage(e,t,i,s="image/png"){if(e!==null){const n=this,o=n.cache,a=n.json,l=n.options,c=n.pending;o.images.has(e)||o.images.set(e,{});const u=o.images.get(e),h=s+":flipY/"+i.toString();if(u[h]!==void 0)return u[h];a.images||(a.images=[]);const d={mimeType:s},f=xe();f.width=Math.min(e.width,l.maxTextureSize),f.height=Math.min(e.height,l.maxTextureSize);const m=f.getContext("2d",{willReadFrequently:!0});if(i===!0&&(m.translate(0,f.height),m.scale(1,-1)),e.data!==void 0){t!==Ce&&console.error("GLTFExporter: Only RGBAFormat is supported.",t),(e.width>l.maxTextureSize||e.height>l.maxTextureSize)&&console.warn("GLTFExporter: Image size is bigger than maxTextureSize",e);const x=new Uint8ClampedArray(e.height*e.width*4);for(let S=0;S<x.length;S+=4)x[S+0]=e.data[S+0],x[S+1]=e.data[S+1],x[S+2]=e.data[S+2],x[S+3]=e.data[S+3];m.putImageData(new ImageData(x,e.width,e.height),0,0)}else if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap||typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas)m.drawImage(e,0,0,f.width,f.height);else throw new Error("THREE.GLTFExporter: Invalid image type. Use HTMLImageElement, HTMLCanvasElement, ImageBitmap or OffscreenCanvas.");l.binary===!0?c.push(yt(f,s).then(x=>n.processBufferViewImage(x)).then(x=>{d.bufferView=x})):d.uri=Le.getDataURL(f,s);const g=a.images.push(d)-1;return u[h]=g,g}else throw new Error("THREE.GLTFExporter: No valid image data found. Unable to process texture.")}processSampler(e){const t=this.json;t.samplers||(t.samplers=[]);const i={magFilter:C[e.magFilter],minFilter:C[e.minFilter],wrapS:C[e.wrapS],wrapT:C[e.wrapT]};return t.samplers.push(i)-1}async processTextureAsync(e){const i=this.options,s=this.cache,n=this.json;if(s.textures.has(e))return s.textures.get(e);n.textures||(n.textures=[]),e instanceof $&&(e=await this.decompressTextureAsync(e,i.maxTextureSize));let o=e.userData.mimeType;o==="image/webp"&&(o="image/png");const a={sampler:this.processSampler(e),source:this.processImage(e.image,e.format,e.flipY,o)};e.name&&(a.name=e.name),await this._invokeAllAsync(async function(c){c.writeTexture&&await c.writeTexture(e,a)});const l=n.textures.push(a)-1;return s.textures.set(e,l),l}async processMaterialAsync(e){const t=this.cache,i=this.json;if(t.materials.has(e))return t.materials.get(e);if(e.isShaderMaterial)return console.warn("GLTFExporter: THREE.ShaderMaterial not supported."),null;i.materials||(i.materials=[]);const s={pbrMetallicRoughness:{}};e.isMeshStandardMaterial!==!0&&e.isMeshBasicMaterial!==!0&&console.warn("GLTFExporter: Use MeshStandardMaterial or MeshBasicMaterial for best results.");const n=e.color.toArray().concat([e.opacity]);if(H(n,[1,1,1,1])||(s.pbrMetallicRoughness.baseColorFactor=n),e.isMeshStandardMaterial?(s.pbrMetallicRoughness.metallicFactor=e.metalness,s.pbrMetallicRoughness.roughnessFactor=e.roughness):(s.pbrMetallicRoughness.metallicFactor=0,s.pbrMetallicRoughness.roughnessFactor=1),e.metalnessMap||e.roughnessMap){const a=await this.buildMetalRoughTextureAsync(e.metalnessMap,e.roughnessMap),l={index:await this.processTextureAsync(a),texCoord:a.channel};this.applyTextureTransform(l,a),s.pbrMetallicRoughness.metallicRoughnessTexture=l}if(e.map){const a={index:await this.processTextureAsync(e.map),texCoord:e.map.channel};this.applyTextureTransform(a,e.map),s.pbrMetallicRoughness.baseColorTexture=a}if(e.emissive){const a=e.emissive;if(Math.max(a.r,a.g,a.b)>0&&(s.emissiveFactor=e.emissive.toArray()),e.emissiveMap){const c={index:await this.processTextureAsync(e.emissiveMap),texCoord:e.emissiveMap.channel};this.applyTextureTransform(c,e.emissiveMap),s.emissiveTexture=c}}if(e.normalMap){const a={index:await this.processTextureAsync(e.normalMap),texCoord:e.normalMap.channel};e.normalScale&&e.normalScale.x!==1&&(a.scale=e.normalScale.x),this.applyTextureTransform(a,e.normalMap),s.normalTexture=a}if(e.aoMap){const a={index:await this.processTextureAsync(e.aoMap),texCoord:e.aoMap.channel};e.aoMapIntensity!==1&&(a.strength=e.aoMapIntensity),this.applyTextureTransform(a,e.aoMap),s.occlusionTexture=a}e.transparent?s.alphaMode="BLEND":e.alphaTest>0&&(s.alphaMode="MASK",s.alphaCutoff=e.alphaTest),e.side===Pe&&(s.doubleSided=!0),e.name!==""&&(s.name=e.name),this.serializeUserData(e,s),await this._invokeAllAsync(async function(a){a.writeMaterialAsync&&await a.writeMaterialAsync(e,s)});const o=i.materials.push(s)-1;return t.materials.set(e,o),o}async processMeshAsync(e){const t=this.cache,i=this.json,s=[e.geometry.uuid];if(Array.isArray(e.material))for(let p=0,T=e.material.length;p<T;p++)s.push(e.material[p].uuid);else s.push(e.material.uuid);const n=s.join(":");if(t.meshes.has(n))return t.meshes.get(n);const o=e.geometry;let a;e.isLineSegments?a=_.LINES:e.isLineLoop?a=_.LINE_LOOP:e.isLine?a=_.LINE_STRIP:e.isPoints?a=_.POINTS:a=e.material.wireframe?_.LINES:_.TRIANGLES;const l={},c={},u=[],h=[],d={uv:"TEXCOORD_0",uv1:"TEXCOORD_1",uv2:"TEXCOORD_2",uv3:"TEXCOORD_3",color:"COLOR_0",skinWeight:"WEIGHTS_0",skinIndex:"JOINTS_0"},f=o.getAttribute("normal");f!==void 0&&!this.isNormalizedNormalAttribute(f)&&(console.warn("THREE.GLTFExporter: Creating normalized normal attribute from the non-normalized one."),o.setAttribute("normal",this.createNormalizedNormalAttribute(f)));let m=null;for(let p in o.attributes){if(p.slice(0,5)==="morph")continue;const T=o.attributes[p];if(p=d[p]||p.toUpperCase(),/^(POSITION|NORMAL|TANGENT|TEXCOORD_\d+|COLOR_\d+|JOINTS_\d+|WEIGHTS_\d+)$/.test(p)||(p="_"+p),t.attributes.has(this.getUID(T))){c[p]=t.attributes.get(this.getUID(T));continue}m=null;const M=T.array;p==="JOINTS_0"&&!(M instanceof Uint16Array)&&!(M instanceof Uint8Array)?(console.warn('GLTFExporter: Attribute "skinIndex" converted to type UNSIGNED_SHORT.'),m=new I(new Uint16Array(M),T.itemSize,T.normalized)):(M instanceof Uint32Array||M instanceof Int32Array)&&!p.startsWith("_")&&(console.warn(`GLTFExporter: Attribute "${p}" converted to type FLOAT.`),m=oe.Utils.toFloat32BufferAttribute(T));const R=this.processAccessor(m||T,o);R!==null&&(p.startsWith("_")||this.detectMeshQuantization(p,T),c[p]=R,t.attributes.set(this.getUID(T),R))}if(f!==void 0&&o.setAttribute("normal",f),Object.keys(c).length===0)return null;if(e.morphTargetInfluences!==void 0&&e.morphTargetInfluences.length>0){const p=[],T=[],v={};if(e.morphTargetDictionary!==void 0)for(const M in e.morphTargetDictionary)v[e.morphTargetDictionary[M]]=M;for(let M=0;M<e.morphTargetInfluences.length;++M){const R={};let ae=!1;for(const F in o.morphAttributes){if(F!=="position"&&F!=="normal"){ae||(console.warn("GLTFExporter: Only POSITION and NORMAL morph are supported."),ae=!0);continue}const P=o.morphAttributes[F][M],J=F.toUpperCase(),B=o.attributes[F];if(t.attributes.has(this.getUID(P,!0))){R[J]=t.attributes.get(this.getUID(P,!0));continue}const k=P.clone();if(!o.morphTargetsRelative)for(let A=0,Ee=P.count;A<Ee;A++)for(let N=0;N<P.itemSize;N++)N===0&&k.setX(A,P.getX(A)-B.getX(A)),N===1&&k.setY(A,P.getY(A)-B.getY(A)),N===2&&k.setZ(A,P.getZ(A)-B.getZ(A)),N===3&&k.setW(A,P.getW(A)-B.getW(A));R[J]=this.processAccessor(k,o),t.attributes.set(this.getUID(B,!0),R[J])}h.push(R),p.push(e.morphTargetInfluences[M]),e.morphTargetDictionary!==void 0&&T.push(v[M])}l.weights=p,T.length>0&&(l.extras={},l.extras.targetNames=T)}const g=Array.isArray(e.material);if(g&&o.groups.length===0)return null;let x=!1;if(g&&o.index===null){const p=[];for(let T=0,v=o.attributes.position.count;T<v;T++)p[T]=T;o.setIndex(p),x=!0}const S=g?e.material:[e.material],L=g?o.groups:[{materialIndex:0,start:void 0,count:void 0}];for(let p=0,T=L.length;p<T;p++){const v={mode:a,attributes:c};if(this.serializeUserData(o,v),h.length>0&&(v.targets=h),o.index!==null){let R=this.getUID(o.index);(L[p].start!==void 0||L[p].count!==void 0)&&(R+=":"+L[p].start+":"+L[p].count),t.attributes.has(R)?v.indices=t.attributes.get(R):(v.indices=this.processAccessor(o.index,o,L[p].start,L[p].count),t.attributes.set(R,v.indices)),v.indices===null&&delete v.indices}const M=await this.processMaterialAsync(S[L[p].materialIndex]);M!==null&&(v.material=M),u.push(v)}x===!0&&o.setIndex(null),l.primitives=u,i.meshes||(i.meshes=[]),await this._invokeAllAsync(function(p){p.writeMesh&&p.writeMesh(e,l)});const Y=i.meshes.push(l)-1;return t.meshes.set(n,Y),Y}detectMeshQuantization(e,t){if(this.extensionsUsed[te])return;let i;switch(t.array.constructor){case Int8Array:i="byte";break;case Uint8Array:i="unsigned byte";break;case Int16Array:i="short";break;case Uint16Array:i="unsigned short";break;default:return}t.normalized&&(i+=" normalized");const s=e.split("_",1)[0];pe[s]&&pe[s].includes(i)&&(this.extensionsUsed[te]=!0,this.extensionsRequired[te]=!0)}processCamera(e){const t=this.json;t.cameras||(t.cameras=[]);const i=e.isOrthographicCamera,s={type:i?"orthographic":"perspective"};return i?s.orthographic={xmag:e.right*2,ymag:e.top*2,zfar:e.far<=0?.001:e.far,znear:e.near<0?0:e.near}:s.perspective={aspectRatio:e.aspect,yfov:Q.degToRad(e.fov),zfar:e.far<=0?.001:e.far,znear:e.near<0?0:e.near},e.name!==""&&(s.name=e.type),t.cameras.push(s)-1}processAnimation(e,t){const i=this.json,s=this.nodeMap;i.animations||(i.animations=[]),e=oe.Utils.mergeMorphTargetTracks(e.clone(),t);const n=e.tracks,o=[],a=[];for(let c=0;c<n.length;++c){const u=n[c],h=q.parseTrackName(u.name);let d=q.findNode(t,h.nodeName);const f=de[h.propertyName];if(h.objectName==="bones"&&(d.isSkinnedMesh===!0?d=d.skeleton.getBoneByName(h.objectIndex):d=void 0),!d||!f){console.warn('THREE.GLTFExporter: Could not export animation track "%s".',u.name);continue}const m=1;let g=u.values.length/u.times.length;f===de.morphTargetInfluences&&(g/=d.morphTargetInfluences.length);let x;u.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline===!0?(x="CUBICSPLINE",g/=3):u.getInterpolation()===Ie?x="STEP":x="LINEAR",a.push({input:this.processAccessor(new I(u.times,m)),output:this.processAccessor(new I(u.values,g)),interpolation:x}),o.push({sampler:a.length-1,target:{node:s.get(d),path:f}})}const l={name:e.name||"clip_"+i.animations.length,samplers:a,channels:o};return this.serializeUserData(e,l),i.animations.push(l),i.animations.length-1}processSkin(e){const t=this.json,i=this.nodeMap,s=t.nodes[i.get(e)],n=e.skeleton;if(n===void 0)return null;const o=e.skeleton.bones[0];if(o===void 0)return null;const a=[],l=new Float32Array(n.bones.length*16),c=new ye;for(let h=0;h<n.bones.length;++h)a.push(i.get(n.bones[h])),c.copy(n.boneInverses[h]),c.multiply(e.bindMatrix).toArray(l,h*16);return t.skins===void 0&&(t.skins=[]),t.skins.push({inverseBindMatrices:this.processAccessor(new I(l,16)),joints:a,skeleton:i.get(o)}),s.skin=t.skins.length-1}async processNodeAsync(e){const t=this.json,i=this.options,s=this.nodeMap;t.nodes||(t.nodes=[]);const n={};if(i.trs){const a=e.quaternion.toArray(),l=e.position.toArray(),c=e.scale.toArray();H(a,[0,0,0,1])||(n.rotation=a),H(l,[0,0,0])||(n.translation=l),H(c,[1,1,1])||(n.scale=c)}else e.matrixAutoUpdate&&e.updateMatrix(),xt(e.matrix)===!1&&(n.matrix=e.matrix.elements);if(e.name!==""&&(n.name=String(e.name)),this.serializeUserData(e,n),e.isMesh||e.isLine||e.isPoints){const a=await this.processMeshAsync(e);a!==null&&(n.mesh=a)}else e.isCamera&&(n.camera=this.processCamera(e));e.isSkinnedMesh&&this.skins.push(e);const o=t.nodes.push(n)-1;if(s.set(e,o),e.children.length>0){const a=[];for(let l=0,c=e.children.length;l<c;l++){const u=e.children[l];if(u.visible||i.onlyVisible===!1){const h=await this.processNodeAsync(u);h!==null&&a.push(h)}}a.length>0&&(n.children=a)}return await this._invokeAllAsync(function(a){a.writeNode&&a.writeNode(e,n)}),o}async processSceneAsync(e){const t=this.json,i=this.options;t.scenes||(t.scenes=[],t.scene=0);const s={};e.name!==""&&(s.name=e.name),t.scenes.push(s);const n=[];for(let o=0,a=e.children.length;o<a;o++){const l=e.children[o];if(l.visible||i.onlyVisible===!1){const c=await this.processNodeAsync(l);c!==null&&n.push(c)}}n.length>0&&(s.nodes=n),this.serializeUserData(e,s)}async processObjectsAsync(e){const t=new he;t.name="AuxScene";for(let i=0;i<e.length;i++)t.children.push(e[i]);await this.processSceneAsync(t)}async processInputAsync(e){const t=this.options;e=e instanceof Array?e:[e],await this._invokeAllAsync(function(s){s.beforeParse&&s.beforeParse(e)});const i=[];for(let s=0;s<e.length;s++)e[s]instanceof he?await this.processSceneAsync(e[s]):i.push(e[s]);i.length>0&&await this.processObjectsAsync(i);for(let s=0;s<this.skins.length;++s)this.processSkin(this.skins[s]);for(let s=0;s<t.animations.length;++s)this.processAnimation(t.animations[s],e[0]);await this._invokeAllAsync(function(s){s.afterParse&&s.afterParse(e)})}async _invokeAllAsync(e){for(let t=0,i=this.plugins.length;t<i;t++)await e(this.plugins[t])}}class bt{constructor(e){this.writer=e,this.name="KHR_lights_punctual"}writeNode(e,t){if(!e.isLight)return;if(!e.isDirectionalLight&&!e.isPointLight&&!e.isSpotLight){console.warn("THREE.GLTFExporter: Only directional, point, and spot lights are supported.",e);return}const i=this.writer,s=i.json,n=i.extensionsUsed,o={};e.name&&(o.name=e.name),o.color=e.color.toArray(),o.intensity=e.intensity,e.isDirectionalLight?o.type="directional":e.isPointLight?(o.type="point",e.distance>0&&(o.range=e.distance)):e.isSpotLight&&(o.type="spot",e.distance>0&&(o.range=e.distance),o.spot={},o.spot.innerConeAngle=(1-e.penumbra)*e.angle,o.spot.outerConeAngle=e.angle),e.decay!==void 0&&e.decay!==2&&console.warn("THREE.GLTFExporter: Light decay may be lost. glTF is physically-based, and expects light.decay=2."),e.target&&(e.target.parent!==e||e.target.position.x!==0||e.target.position.y!==0||e.target.position.z!==-1)&&console.warn("THREE.GLTFExporter: Light direction may be lost. For best results, make light.target a child of the light with position 0,0,-1."),n[this.name]||(s.extensions=s.extensions||{},s.extensions[this.name]={lights:[]},n[this.name]=!0);const a=s.extensions[this.name].lights;a.push(o),t.extensions=t.extensions||{},t.extensions[this.name]={light:a.length-1}}}class wt{constructor(e){this.writer=e,this.name="KHR_materials_unlit"}async writeMaterialAsync(e,t){if(!e.isMeshBasicMaterial)return;const s=this.writer.extensionsUsed;t.extensions=t.extensions||{},t.extensions[this.name]={},s[this.name]=!0,t.pbrMetallicRoughness.metallicFactor=0,t.pbrMetallicRoughness.roughnessFactor=.9}}class Et{constructor(e){this.writer=e,this.name="KHR_materials_clearcoat"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.clearcoat===0)return;const i=this.writer,s=i.extensionsUsed,n={};if(n.clearcoatFactor=e.clearcoat,e.clearcoatMap){const o={index:await i.processTextureAsync(e.clearcoatMap),texCoord:e.clearcoatMap.channel};i.applyTextureTransform(o,e.clearcoatMap),n.clearcoatTexture=o}if(n.clearcoatRoughnessFactor=e.clearcoatRoughness,e.clearcoatRoughnessMap){const o={index:await i.processTextureAsync(e.clearcoatRoughnessMap),texCoord:e.clearcoatRoughnessMap.channel};i.applyTextureTransform(o,e.clearcoatRoughnessMap),n.clearcoatRoughnessTexture=o}if(e.clearcoatNormalMap){const o={index:await i.processTextureAsync(e.clearcoatNormalMap),texCoord:e.clearcoatNormalMap.channel};e.clearcoatNormalScale.x!==1&&(o.scale=e.clearcoatNormalScale.x),i.applyTextureTransform(o,e.clearcoatNormalMap),n.clearcoatNormalTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Mt{constructor(e){this.writer=e,this.name="KHR_materials_dispersion"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.dispersion===0)return;const s=this.writer.extensionsUsed,n={};n.dispersion=e.dispersion,t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class St{constructor(e){this.writer=e,this.name="KHR_materials_iridescence"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.iridescence===0)return;const i=this.writer,s=i.extensionsUsed,n={};if(n.iridescenceFactor=e.iridescence,e.iridescenceMap){const o={index:await i.processTextureAsync(e.iridescenceMap),texCoord:e.iridescenceMap.channel};i.applyTextureTransform(o,e.iridescenceMap),n.iridescenceTexture=o}if(n.iridescenceIor=e.iridescenceIOR,n.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],n.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1],e.iridescenceThicknessMap){const o={index:await i.processTextureAsync(e.iridescenceThicknessMap),texCoord:e.iridescenceThicknessMap.channel};i.applyTextureTransform(o,e.iridescenceThicknessMap),n.iridescenceThicknessTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class vt{constructor(e){this.writer=e,this.name="KHR_materials_transmission"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.transmission===0)return;const i=this.writer,s=i.extensionsUsed,n={};if(n.transmissionFactor=e.transmission,e.transmissionMap){const o={index:await i.processTextureAsync(e.transmissionMap),texCoord:e.transmissionMap.channel};i.applyTextureTransform(o,e.transmissionMap),n.transmissionTexture=o}t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class At{constructor(e){this.writer=e,this.name="KHR_materials_volume"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.transmission===0)return;const i=this.writer,s=i.extensionsUsed,n={};if(n.thicknessFactor=e.thickness,e.thicknessMap){const o={index:await i.processTextureAsync(e.thicknessMap),texCoord:e.thicknessMap.channel};i.applyTextureTransform(o,e.thicknessMap),n.thicknessTexture=o}e.attenuationDistance!==1/0&&(n.attenuationDistance=e.attenuationDistance),n.attenuationColor=e.attenuationColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Dt{constructor(e){this.writer=e,this.name="KHR_materials_ior"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.ior===1.5)return;const s=this.writer.extensionsUsed,n={};n.ior=e.ior,t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Rt{constructor(e){this.writer=e,this.name="KHR_materials_specular"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.specularIntensity===1&&e.specularColor.equals(ut)&&!e.specularIntensityMap&&!e.specularColorMap)return;const i=this.writer,s=i.extensionsUsed,n={};if(e.specularIntensityMap){const o={index:await i.processTextureAsync(e.specularIntensityMap),texCoord:e.specularIntensityMap.channel};i.applyTextureTransform(o,e.specularIntensityMap),n.specularTexture=o}if(e.specularColorMap){const o={index:await i.processTextureAsync(e.specularColorMap),texCoord:e.specularColorMap.channel};i.applyTextureTransform(o,e.specularColorMap),n.specularColorTexture=o}n.specularFactor=e.specularIntensity,n.specularColorFactor=e.specularColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Ct{constructor(e){this.writer=e,this.name="KHR_materials_sheen"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.sheen==0)return;const i=this.writer,s=i.extensionsUsed,n={};if(e.sheenRoughnessMap){const o={index:await i.processTextureAsync(e.sheenRoughnessMap),texCoord:e.sheenRoughnessMap.channel};i.applyTextureTransform(o,e.sheenRoughnessMap),n.sheenRoughnessTexture=o}if(e.sheenColorMap){const o={index:await i.processTextureAsync(e.sheenColorMap),texCoord:e.sheenColorMap.channel};i.applyTextureTransform(o,e.sheenColorMap),n.sheenColorTexture=o}n.sheenRoughnessFactor=e.sheenRoughness,n.sheenColorFactor=e.sheenColor.toArray(),t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Lt{constructor(e){this.writer=e,this.name="KHR_materials_anisotropy"}async writeMaterialAsync(e,t){if(!e.isMeshPhysicalMaterial||e.anisotropy==0)return;const i=this.writer,s=i.extensionsUsed,n={};if(e.anisotropyMap){const o={index:await i.processTextureAsync(e.anisotropyMap)};i.applyTextureTransform(o,e.anisotropyMap),n.anisotropyTexture=o}n.anisotropyStrength=e.anisotropy,n.anisotropyRotation=e.anisotropyRotation,t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Pt{constructor(e){this.writer=e,this.name="KHR_materials_emissive_strength"}async writeMaterialAsync(e,t){if(!e.isMeshStandardMaterial||e.emissiveIntensity===1)return;const s=this.writer.extensionsUsed,n={};n.emissiveStrength=e.emissiveIntensity,t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class It{constructor(e){this.writer=e,this.name="EXT_materials_bump"}async writeMaterialAsync(e,t){if(!e.isMeshStandardMaterial||e.bumpScale===1&&!e.bumpMap)return;const i=this.writer,s=i.extensionsUsed,n={};if(e.bumpMap){const o={index:await i.processTextureAsync(e.bumpMap),texCoord:e.bumpMap.channel};i.applyTextureTransform(o,e.bumpMap),n.bumpTexture=o}n.bumpFactor=e.bumpScale,t.extensions=t.extensions||{},t.extensions[this.name]=n,s[this.name]=!0}}class Nt{constructor(e){this.writer=e,this.name="EXT_mesh_gpu_instancing"}writeNode(e,t){if(!e.isInstancedMesh)return;const i=this.writer,s=e,n=new Float32Array(s.count*3),o=new Float32Array(s.count*4),a=new Float32Array(s.count*3),l=new ye,c=new E,u=new ie,h=new E;for(let f=0;f<s.count;f++)s.getMatrixAt(f,l),l.decompose(c,u,h),c.toArray(n,f*3),u.toArray(o,f*4),h.toArray(a,f*3);const d={TRANSLATION:i.processAccessor(new I(n,3)),ROTATION:i.processAccessor(new I(o,4)),SCALE:i.processAccessor(new I(a,3))};s.instanceColor&&(d._COLOR_0=i.processAccessor(s.instanceColor)),t.extensions=t.extensions||{},t.extensions[this.name]={attributes:d},i.extensionsUsed[this.name]=!0,i.extensionsRequired[this.name]=!0}}oe.Utils={insertKeyframe:function(r,e){const i=r.getValueSize(),s=new r.TimeBufferType(r.times.length+1),n=new r.ValueBufferType(r.values.length+i),o=r.createInterpolant(new r.ValueBufferType(i));let a;if(r.times.length===0){s[0]=e;for(let l=0;l<i;l++)n[l]=0;a=0}else if(e<r.times[0]){if(Math.abs(r.times[0]-e)<.001)return 0;s[0]=e,s.set(r.times,1),n.set(o.evaluate(e),0),n.set(r.values,i),a=0}else if(e>r.times[r.times.length-1]){if(Math.abs(r.times[r.times.length-1]-e)<.001)return r.times.length-1;s[s.length-1]=e,s.set(r.times,0),n.set(r.values,0),n.set(o.evaluate(e),r.values.length),a=s.length-1}else for(let l=0;l<r.times.length;l++){if(Math.abs(r.times[l]-e)<.001)return l;if(r.times[l]<e&&r.times[l+1]>e){s.set(r.times.slice(0,l+1),0),s[l+1]=e,s.set(r.times.slice(l+1),l+2),n.set(r.values.slice(0,(l+1)*i),0),n.set(o.evaluate(e),(l+1)*i),n.set(r.values.slice((l+1)*i),(l+2)*i),a=l+1;break}}return r.times=s,r.values=n,a},mergeMorphTargetTracks:function(r,e){const t=[],i={},s=r.tracks;for(let n=0;n<s.length;++n){let o=s[n];const a=q.parseTrackName(o.name),l=q.findNode(e,a.nodeName);if(a.propertyName!=="morphTargetInfluences"||a.propertyIndex===void 0){t.push(o);continue}if(o.createInterpolant!==o.InterpolantFactoryMethodDiscrete&&o.createInterpolant!==o.InterpolantFactoryMethodLinear){if(o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline)throw new Error("THREE.GLTFExporter: Cannot merge tracks with glTF CUBICSPLINE interpolation.");console.warn("THREE.GLTFExporter: Morph target interpolation mode not yet supported. Using LINEAR instead."),o=o.clone(),o.setInterpolation(Ve)}const c=l.morphTargetInfluences.length,u=l.morphTargetDictionary[a.propertyIndex];if(u===void 0)throw new Error("THREE.GLTFExporter: Morph target name not found: "+a.propertyIndex);let h;if(i[l.uuid]===void 0){h=o.clone();const f=new h.ValueBufferType(c*h.times.length);for(let m=0;m<h.times.length;m++)f[m*c+u]=h.values[m];h.name=(a.nodeName||"")+".morphTargetInfluences",h.values=f,i[l.uuid]=h,t.push(h);continue}const d=o.createInterpolant(new o.ValueBufferType(1));h=i[l.uuid];for(let f=0;f<h.times.length;f++)h.values[f*c+u]=d.evaluate(h.times[f]);for(let f=0;f<o.times.length;f++){const m=this.insertKeyframe(h,o.times[f]);h.values[m*c+u]=o.values[f]}}return r.tracks=t,r},toFloat32BufferAttribute:function(r){const e=new I(new Float32Array(r.count*r.itemSize),r.itemSize,!1);if(!r.normalized&&!r.isInterleavedBufferAttribute)return e.array.set(r.array),e;for(let t=0,i=r.count;t<i;t++)for(let s=0;s<r.itemSize;s++)e.setComponent(t,s,r.getComponent(t,s));return e}};const Z={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class V{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Ut=new Ke(-1,1,1,-1,0,1);class Ot extends Xe{constructor(){super(),this.setAttribute("position",new ce([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new ce([0,2,0,0,2,0],2))}}const zt=new Ot;class we{constructor(e){this._mesh=new Ye(zt,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ut)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Ft extends V{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof O?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=ne.clone(e.uniforms),this.material=new O({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new we(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class _e extends V{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){const s=e.getContext(),n=e.state;n.buffers.color.setMask(!1),n.buffers.depth.setMask(!1),n.buffers.color.setLocked(!0),n.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),n.buffers.stencil.setTest(!0),n.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),n.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),n.buffers.stencil.setClear(a),n.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),n.buffers.color.setLocked(!1),n.buffers.depth.setLocked(!1),n.buffers.color.setMask(!0),n.buffers.depth.setMask(!0),n.buffers.stencil.setLocked(!1),n.buffers.stencil.setFunc(s.EQUAL,1,4294967295),n.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),n.buffers.stencil.setLocked(!0)}}class Bt extends V{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class jt{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const i=e.getSize(new b);this._width=i.width,this._height=i.height,t=new X(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:W}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ft(Z),this.copyPass.material.blending=We,this.clock=new Ze}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let i=!1;for(let s=0,n=this.passes.length;s<n;s++){const o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),o.needsSwap){if(i){const a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}_e!==void 0&&(o instanceof _e?i=!0:o instanceof Bt&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new b);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const i=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(i,s),this.renderTarget2.setSize(i,s);for(let n=0;n<this.passes.length;n++)this.passes[n].setSize(i,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Vt extends V{constructor(e,t,i=null,s=null,n=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=s,this.clearAlpha=n,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new G}render(e,t,i){const s=e.autoClear;e.autoClear=!1;let n,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(n=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(n),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=s}}const kt={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new G(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class j extends V{constructor(e,t=1,i,s){super(),this.strength=t,this.radius=i,this.threshold=s,this.resolution=e!==void 0?new b(e.x,e.y):new b(256,256),this.clearColor=new G(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let n=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new X(n,o,{type:W}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const h=new X(n,o,{type:W});h.texture.name="UnrealBloomPass.h"+u,h.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(h);const d=new X(n,o,{type:W});d.texture.name="UnrealBloomPass.v"+u,d.texture.generateMipmaps=!1,this.renderTargetsVertical.push(d),n=Math.round(n/2),o=Math.round(o/2)}const a=kt;this.highPassUniforms=ne.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new O({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];const l=[6,10,14,18,22];n=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new b(1/n,1/o),n=Math.round(n/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new E(1,1,1),new E(1,1,1),new E(1,1,1),new E(1,1,1),new E(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=ne.clone(Z.uniforms),this.blendMaterial=new O({uniforms:this.copyUniforms,vertexShader:Z.vertexShader,fragmentShader:Z.fragmentShader,premultipliedAlpha:!0,blending:Qe,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new G,this._oldClearAlpha=1,this._basic=new qe,this._fsQuad=new we(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let i=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(i,s);for(let n=0;n<this.nMips;n++)this.renderTargetsHorizontal[n].setSize(i,s),this.renderTargetsVertical[n].setSize(i,s),this.separableBlurMaterials[n].uniforms.invSize.value=new b(1/i,1/s),i=Math.round(i/2),s=Math.round(s/2)}render(e,t,i,s,n){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),n&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=i.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let a=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[l].uniforms.direction.value=j.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=j.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),a=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,n&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){const t=[],i=e/3;for(let s=0;s<e;s++)t.push(.39894*Math.exp(-.5*s*s/(i*i))/i);return new O({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new b(.5,.5)},direction:{value:new b(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new O({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}}j.BlurDirectionX=new b(1,0);j.BlurDirectionY=new b(0,1);const Yt={name:"FXAAShader",uniforms:{tDiffuse:{value:null},resolution:{value:new b(1/1024,1/512)}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`};export{jt as E,Yt as F,oe as G,Gt as O,Vt as R,Ft as S,j as U};

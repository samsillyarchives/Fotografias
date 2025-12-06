import './style.css'
import * as THREE from 'three' 
import { addDefaultMeshes, addStandardMesh } from './addDefaultMeshes.js'
import { addLight } from './addLight.js'
import Model from './model'
import { manager } from './manager'
import { HDRI } from './enviornment.js'
import { rotate } from 'three/tsl'
import { emissive } from 'three/src/nodes/TSL.js'
import gsap from 'gsap' // so we can do animation!!!
//import { InteractionManager } from 'three.interaction' // we need this to manage the click stuff



const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000)
camera.position.set(0,0,5)
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true, 
})

const meshes = {} 
const lights = {}
const mixers = []
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

const clock = new THREE.Clock()
const loadingManager = manager()

//scene.background = HDRI() // idk if ill need this perhaps if the light isnt baked in 
scene.environment = HDRI()

let video

init()

function init(){
  renderer.setSize(window.innerWidth, window.innerHeight)
 
  document.body.appendChild(renderer.domElement)

  video = document.getElementById('video')

  const texture = new THREE.VideoTexture(video)
	texture.colorSpace = THREE.SRGBColorSpace

	const geometry = new THREE.PlaneGeometry(16, 9)
	geometry.scale(0.039, 0.048, 0.04)
	const material = new THREE.MeshBasicMaterial({ map: texture })
	meshes.webcam = new THREE.Mesh(geometry, material)
  meshes.webcam.visible = false, // hide until gsap animation
  meshes.webcam.position.set(0.1,0,1.20)
  meshes.webcam.rotation.y = -60.5 * (Math.PI / 180)
  meshes.webcam.scale.x = -1; //this inverts the video so it acts like a mirror

  scene.add(meshes.webcam)
  
 // meshes.default = addDefaultMeshes() 
 // meshes.standard = addStandardMesh({xpos: 2})

 // lights.directional = addLight()
  
 // scene.add(meshes.default)
 // scene.add(meshes.standard)
 // scene.add(lights.directional)
  webcam()
  instances()
  raycast()
  animate()
}

function webcam() {
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		const constraints = {
			video: { width: 1280, height: 720, facingMode: 'user' },
		}

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(function (stream) {
				// apply the stream to the video element used in the texture

				video.srcObject = stream
				video.play()
			})
			.catch(function (error) {
				console.error('Unable to access the camera/webcam.', error)
			})
	} else {
		console.error('MediaDevices interface not available.')
	}
}

function raycast() {
	window.addEventListener('click', (event) => {
		pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)
		const intersects = raycaster.intersectObjects(scene.children)
		for (let i = 0; i < intersects.length; i++) {
			//
			let object = intersects[i].object
			while (object) {
				if (object.userData.groupName == 'photobooth') {
					gsap.to(camera.position, {
						x: -.5,
            y: 0,
            z: 1.6,
            duration: 2,
            animation: "power2.inOut",
					})
          gsap.to(camera.rotation, {
            x: 0,
            y: -60.5 * (Math.PI / 180), 
            z: 0,
            duration: 2,
            delay: 1,
            animation: "power2.inOut",
          })
          gsap.to(camera.position, {
            x: -.3,
            z: 1.40,
            duration: 1,
            delay: 1.4,
            animation: "power2.inOut",
         })
         gsap.to(meshes.webcam, {
          visible: true,
          duration: 1, 
          delay: 3.4,
          animation: "power2.inOut",
          onComplete: () => {
            window.setTimeout(() => {
              captureSnapshot()
            }, 4000)
          }
         })
         break;
        //gsap.delayedCall(4, captureSnapshot, null, null) 
      }
				object = object.parent
			}
		}
	})
}

function captureSnapshot() {
    // Ensure the scene is rendered one last time to capture the current state
    renderer.render(scene, camera); 
    
    const imageDataUrl = renderer.domElement.toDataURL('image/png');
    
    // Logic to handle the snapshot (e.g., download it automatically)
    const link = document.createElement('a');
    link.download = 'webcam-snapshot.png';
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Snapshot captured automatically!");
}

function instances(){
  const photobooth = new Model({
    url: '/photobooth.glb',
    name: 'photobooth',
    scene: scene, 
    meshes: meshes,
    scale: new THREE.Vector3(.5,.5,.5),
    position: new THREE.Vector3(-.25,-1.20,1.5),
    rotation: new THREE.Vector3(0,2.08,0),
    animationState: false, 
    mixers: mixers,
    replace: false, 
    emissive: true, 
    emissiveIntensity: 1,
    emissiveColor: 0xffffff,
    //replaceURL: '/mat.png',
    manager: loadingManager,
  })
  photobooth.init()

}
function animate(){

  const delta = clock.getDelta()
  for (const mixer of mixers){
    mixer.update(delta)
  }
  //meshes.standard.rotation.x += 0.01
  //meshes.standard.rotation.y += 0.01
 // meshes.default.rotation.x -= 0.01
  //meshes.default.rotation.y -= 0.01
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
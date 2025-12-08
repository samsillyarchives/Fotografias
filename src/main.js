import './style.css'
import * as THREE from 'three' 
//import { addDefaultMeshes, addStandardMesh } from './addDefaultMeshes.js'
//import { addLight } from './addLight.js'
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
  preserveDrawingBuffer: true, //This allows us to take screenshots
})

const meshes = {} 
const lights = {}
const mixers = []

const pointer = new THREE.Vector2() // tracks mouse position 
const raycaster = new THREE.Raycaster() // shoots rays to detect meshes 

const clock = new THREE.Clock()
const loadingManager = manager() // track when meshes are loaded 

//scene.background = HDRI() // idk if ill need the backgroud doesnt fit the vibe
scene.environment = HDRI() // for lighting 


let video
let capturedPhotos = [] // array that stores photos 
// I believe in Python this is like capturedPhotos = []


init()

function init(){
  renderer.setSize(window.innerWidth, window.innerHeight)
 
  document.body.appendChild(renderer.domElement) // adds canvas to the html so we can see it
  video = document.getElementById('video')

  const texture = new THREE.VideoTexture(video) //makes webcam video a texture
	texture.colorSpace = THREE.SRGBColorSpace // makes the colors look correct

	const geometry = new THREE.PlaneGeometry(16, 9) // plane geometry for the webcam video 
	geometry.scale(0.039, 0.048, 0.04) 
	const material = new THREE.MeshBasicMaterial({ map: texture }) // this is the video material 
	meshes.webcam = new THREE.Mesh(geometry, material) // this is the actual mesh

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
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) { // checks if we can use webcam 
		const constraints = {
			video: { width: 1280, height: 720, facingMode: 'user' }, // this is what we want from the webcam
		}

		navigator.mediaDevices // request access to webcam 
			.getUserMedia(constraints)
			.then(function (stream) { // if we got access
				// apply the stream to the video element used in the texture

				video.srcObject = stream // connect webcam to video element 
				video.play()
			})
			.catch(function (error) { // if we didnt get access
				console.error('Unable to access the camera/webcam.', error)
			})
	} else { // if no webcam available
		console.error('MediaDevices interface not available.')
	}
}

function raycast() {
	window.addEventListener('click', (event) => {

		pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)

		const intersects = raycaster.intersectObjects(scene.children) // list of things the ray intersected 

		for (let i = 0; i < intersects.length; i++) { // loop through the intersected objects
			
			let object = intersects[i].object
			while (object) {

				if (object.userData.groupName == 'photobooth') { // check ir we clicked the photobooth if so start the animation
					
          // to make things cleaner I moved the sequence into a separate function we canll here 
           photoBoothSequence() // calling this start the gsap sequence 
        
           return 
      }
				object = object.parent
			}
		}
	})
}

function photoBoothSequence(){

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
} 

function captureSnapshot() {
  renderer.render(scene, camera)
  const canvas = document.createElement('canvas') // not added to canvas is temporary 
  const context = canvas.getContext('2d') 
  const width = 1280 
  const height = 720 
  canvas.width = width 
  canvas.height = height
  context.drawImage(video, 0, 0, width, height) // draw webcam image to canvas
  const data = canvas.toDataURL('image/png') // create png from canvas

  // Instead of dowloading the image directly we store it so we can take three of them 
  // and combine them into a photo booth strip later

  //const link = document.createElement('a')
  //link.download = `webcam-photo-${Date.now()}.png`

  
  //  put the picture in our array (I think is same vibe as phyton list but only stores items of the same datatype)
  capturedPhotos.push(data) 

  // to make sure it works we log to console when picture is taken 
  // not necessary technically makes things easier to debug
  console.log(`Photo ${capturedPhotos.length} taken!`) // ` = not regular apostrophe important for syntax idk why
  // ${capturedPhotos.length} tells us the number of photos in the array so far


    //link.href = data -- this no longer since we don't download directly
    // Logic to handle the snapshot (e.g., download it automatically)
    //const link = document.createElement('a');
    //link.download = 'webcam-snapshot.png';
    //link.href = imageDataUrl;

  // this might need to be changed since we don't download it directly 

  //link.addEventListener('click', (e) => e.stopPropagation())
  //document.body.appendChild(link)
  // link.click();
  // document.body.removeChild(link)
  // console.log("Snapshot captured automatically!")

  // ^ deleted it and everything still works so I think its fine
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
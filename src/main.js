import './style.css'
import * as THREE from 'three' 
//import { addDefaultMeshes, addStandardMesh } from './addDefaultMeshes.js'
//import { addLight } from './addLight.js'
import Model from './model'
import { manager } from './manager'
import { HDRI } from './enviornment.js'
import { overlay, rotate } from 'three/tsl'
import { emissive } from 'three/src/nodes/TSL.js'
import {gsap}from 'gsap' // so we can do animation!!!
//import { bloomPass } from './postprocessing.js' 
import { postprocessing } from './postprocessing.js'


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
const postProcessing = postprocessing(scene, camera, renderer)
const shutterSound = new Audio('./Shutter.wav') // we assign audio file to a variable 
//scene.background = HDRI() // idk if ill need the backgroud doesnt fit the vibe
scene.environment = HDRI() // for lighting 


let video
let capturedPhotos = [] // array that stores photos 
// I believe in Python this is like capturedPhotos = []

// this boolean will prevent multiple clicks while program is running 
let isPhotoSessionActive = false


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
  countdownUI() // how was this not here before lol
  welcomeScreen()
}

// This is the countdown interface ill make it a function on main cuz it seems easier
// perhaps its better to put in in the html and css files respectively but idk how to do that yet

function countdownUI() {
  // crate the div (html)
  // the internet told me this is how to create html elements with js
  const countdownDiv = document.createElement('div')

  countdownDiv.id = 'countdown' // naming the div

  // css styling for the div
  // could be done in the css file perchance 

  // again idk what the ` is but it works for the syntax cuz google
  countdownDiv.style.cssText = `
  position: fixed; /* this is how you comment in css */
  top: 50%; 
  left: 50%; /* make the div centered */
  transform: translate(-50%, -50%);
  font-size: 150px;
  font-weight: bold;
  color: #880808;
  text-shadow: 0 0 20px black;
  display: none; /* hide until needed */
  z-index: 1000; /* at the very top of all elements */
  font-family: 'Courier New', monospace;
  `

  //adds the div to the page
  document.body.appendChild(countdownDiv) 

}

// we need to create a welcome screen which also acts as the 
// button that will allow us to play sound 

function welcomeScreen(){
  // we need a full screen div 

  const welcomeDiv = document.createElement('div')
  welcomeDiv.id = "welcomeDiv"
  welcomeDiv.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9); /* a lil transparent */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000; // on top of everything else
  `
  const welcomeText = document.createElement('h1')
  welcomeText.textContent =  "Welcome to Fortografias Photobooth!"
  welcomeText.style.cssText = `
  color: white;
  font-size: 48px;
  font-family: 'Courier New', monospace;
  margin-bottom: 30px;
  text-align: center;
  `
  const subtitle = document.createElement('p')
  subtitle.textContent = 'Click the photobooth to take your photos!'
  subtitle.style.cssText = `
  color: white;
  font-size: 24px;
  font-family: 'Courier New', monospace;
  margin-bottom: 50px;
  `
  const enterButton = document.createElement('button')
  enterButton.textContent = "ENTER"
  enterButton.style.cssText = `
  padding: 20px 60px;
  font-size: 28px;
  background-color: #880808;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s; /* this gives a smooth hover effect */
  `

  // little affordance on the button
  enterButton.onmouseenter = () => {
    enterButton.style.transform = 'scale(1.1)' // gets slightly bigger when you hover over it 
  }
  enterButton.onmouseleave = () => {
    enterButton.style.transform = 'scale(1.0)' // back to normal size when not hovering
  }

  // this is where we are going to sneak in the sound enabling lol
  enterButton.onclick = () => {
    // we play the sound very very low to unlock the audio 
    // browsers want the audio to be triggered by the user 

    shutterSound.volume = 0.0 // so it is inaudible here 
    shutterSound.play().then(() => {
      shutterSound.pause() // immediately we stop the sound to make sure it doesn't play further
      shutterSound.currentTime = 0 // reset audio to start 
      shutterSound.volume = 1.0 // make volume go back to normal 
      console.log("Audio unlocked!") // so we know this worked lol
    }).catch(e => console.log('Audio still cant play :(', e)) // this means our sneaky permission granting failed 

    document.body.removeChild(welcomeDiv) // close the welcome screen
  }

  welcomeDiv.appendChild(welcomeText)
  welcomeDiv.appendChild(subtitle)
  welcomeDiv.appendChild(enterButton) // add components to welcome div

  document.body.appendChild(welcomeDiv) // add welcome div to overall html
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

    // if a photo session is running the return will automatically
    // stop everything else from running 
    if (isPhotoSessionActive) return // if true dont execute the rest of the funciton

		pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)

		const intersects = raycaster.intersectObjects(scene.children) // list of things the ray intersected 

		for (let i = 0; i < intersects.length; i++) { // loop through the intersected objects
			
			let object = intersects[i].object
			while (object) {

				if (object.userData.groupName == 'photobooth') { // check ir we clicked the photobooth if so start the animation
					
          // we clicked the photobooht start the session and prevent the multiple clicks beginning here
          isPhotoSessionActive = true
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
            //ease: "power4.inOut",
					})
          gsap.to(camera.rotation, {
            x: 0,
            y: -60.5 * (Math.PI / 180), 
            z: 0,
            duration: 2,
            delay: 1,
            //ease: "power4.inOut",
          })
          gsap.to(camera.position, {
            x: -.3,
            z: 1.40,
            duration: 1,
            delay: 1.4,
            //ease: "power4.inOut",
         })
         gsap.to(meshes.webcam, {
          visible: true,
          duration: 1, 
          delay: 3.4,
          //ease: "power4.inOut", //check animation it says these aren't imported or something in console 
          onComplete: () => { 
            
            // we now call the function we made to take the three pictures
            countdownUI() // create the countdown div first 
            // we had made the function but never called it so the thingy was not working 
            // cant refer to something not created yet 
            setTimeout(() => {
              countdownAndPictures() 
            }, 1000)
          }
         })
} 

// function that calls countdown and takes 3 pictures
// called at the end of the gsap timeline function above

function countdownAndPictures(){
  // reference the countdown UI div by assigning to a variable
  const countdownDiv = document.getElementById('countdown')

  // make a counter so we can keep track of how many pictures taken
  let photoCount = 0 

  // function inside the function to do coundown and picutre taking 
  // multiple times 
  // were going to use it like a while loop with the counter as a sentinel value

  function takePhoto(photoNumber){

    let count = 3 // start the countdown display at 3

    // make the div visible this was previously None
    console.log('countdownDiv:', countdownDiv);
    countdownDiv.style.display = 'block' 

    countdownDiv.textContent = count 
    // the text is the string store in count 

    // create interval to count down every second
    const countdownInterval = setInterval(() => {
      count-- // this is like count -= 1 in python 

      if (count > 0){
        countdownDiv.textContent = count 
        // so 3,2,1 will be displayed
      } else {
        clearInterval(countdownInterval) // stops the countdown

        countdownDiv.textContent = 'Smile!' // shows cute message instead of 0

        setTimeout(() => {

          captureSnapshot() //take the picture

          flash() // we call the flash function

          shutter() // we call the shutter function

          countdownDiv.style.display = 'none'
          // we hide the div again 

          photoCount++ // we tell the counter we took a picture 
          // photoCount += 1 in python

          if (photoCount < 3){
            setTimeout(() => takePhoto(photoCount), 2000) 
            // we call the take photo function again after 2 seconds 
            // very recursion vibes 
          } else {
            setTimeout(() => {
              // we add instruction to make the photostrip here
              makePhotoStrip() // instruction in a separate function
            }, 1000) // one second delay
          }
        }, 500)
      }

    }, 1000) // makes sure it runs every 1 second 

  }

  takePhoto(0) // initializes the first call to function
}
function flash(){
  // use bloom to create the flash effect 
  gsap.to(postProcessing.bloomPass, { //really quick high intensity 
    strength: 1,
    duration: 0.1, 
    onComplete: () => {
      gsap.to(postProcessing.bloomPass, { //slower dim 
        strength: 0, 
        duration: 0.5, 
      })
    }
  })

}

function shutter(){
  shutterSound.currentTime = 0 // makes the sound restart from beginning

  //play the sound
  // .catch is to handle errors if we can't play audio
  shutterSound.play().catch(e => console.log("audio play error :(", e))
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

function makePhotoStrip(){
  // we make a canvas for the photo strip 
  // this is like a div but lets us draw graphics on it with javascript 
  const photoStripCanvas = document.createElement('canvas')

  // we get the 2D drawing context not sure what this really means yet
  // however if we don't do it the thingy doesn't work so...
  const ctx = photoStripCanvas.getContext('2d')

  // define the dimensions of each photo in the strip using variables
  const photoWidth = 600
  const photoHeight = 400
  const padding = 40

  //now we set the size of the canvas
  photoStripCanvas.width = photoWidth + (padding * 2)
  photoStripCanvas.height = (photoHeight * 3) + (padding * 4)

  // fill background really we make a square that fills the canvas
  ctx.fillStyle = 'black'
  ctx.fillRect(0,0, photoStripCanvas.width, photoStripCanvas.height)
  
  // we must track that our pictures are loading 
  let loadedPicCount = 0

  // we loop through our array of photos 
  capturedPhotos.forEach((photoData, index) => {

    // we make an image object for each iteration
    const img = new Image()

    // when we are sure the image loads we add it to the canvas
    img.onload = () => {
      // setting calculation for the image position
      const yPos = padding + (index * (photoHeight + padding))

      // save the canvas
      ctx.save()

      // I personally don't want the pictures mirrored so we fix that
      ctx.translate(padding + photoWidth, 0)
      ctx.scale(-1,1)
      ctx.drawImage(img, 0, yPos, photoWidth, photoHeight)

      //make sure we return the canvas to original state for the rest of the iterations
      ctx.restore()

      loadedPicCount ++ 

      // we check if all pictures have been added 
      // if they have we add finishing touches
      if (loadedPicCount == 3) {

        //little border
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.strokeRect(5,5, photoStripCanvas.width - 10, photoStripCanvas.height - 10)
        
        //add the date on there 
        ctx.fillStyle = '#ffffff'
        ctx.font = '20px Courier New, monospace'
        ctx.textAlign = 'center'
        
        // make date into string
        const date = new Date().toLocaleDateString()

        //add it to the bottom center
        ctx.fillText(date, photoStripCanvas.width / 2, photoStripCanvas.height - 15)

        // finally we mke the canvas to a png 
        const photoStripData = photoStripCanvas.toDataURL('image/png')

        // here we will add transition that takes viewer outside of the photobooth
        // and shows a download screen

        takeToDownload(photoStripData) // we also send it the photostrip png
      }
    }

    img.src = photoData
  })
}

function takeToDownload(photoStripData){
  // we must hide the webcam again 
  gsap.to(meshes.webcam, {
    visible: false,
    duration: 0.5
  })
  // move the camera to original position
  gsap.to(camera.position, {
    x: 0,
    y: 0, 
    z: 5, 
    duration: 2, 
    ease: "power2.inOut"
  })
  //reset camera rotation
  gsap.to(camera.rotation, {
    x: 0, 
    y:0, 
    z: 0, 
    duration: 2, 
    ease: "power2.inOut",
    onComplete: () => {
      // we show the download page!
      downloadPage(photoStripData) // pass it the info for the photostrip again 
    }
  })
}

function downloadPage(photoStripData){
  const downloadPg = document.createElement('div')
  downloadPg.id = 'download-page'
  downloadPg.style.cssText = `
  position: fixed; 
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  `

  // we must make an image as preview of photostrip
  const preview = document.createElement('img')
  preview.src = photoStripData // this is why me must make sure we pass it along throuhout the funcitons 
  preview.style.cssText = `
  mas-width: 400px;
  max-height: 70vh;
  border: 5pz solid white;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  margin-bottom: 30px;
  `
  //dowload button!!!!!! - the most important part
  const downloadBtn = document.createElement('button')
  downloadBtn.textContent = 'Download your Photo Strip!'
  downloadBtn.style.cssText = `
  padding: 15px 40px;
  font-size: 20px; 
  background: #880808;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 15px;
  `

  // when you click the button you get your picture
  downloadBtn.onclick = () => {
    // this is temp link
    const link = document.createElement('a')

    // the link is title + date for the download link
    link.download = `fotografias-${Date.now()}-.png`

    // we set the file data
    link.href = photoStripData

    //start download
    link.click()
  }

  // button to restart everything lol
  const resetBtn = document.createElement('button')
  resetBtn.textContent = 'Take Another!'
  resetBtn.style.cssText = `
  padding: 15px 40px;
  font-size: 18px;
  background: white;
  color: #880808;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  `

  //when click button remove overlay and restart everything 
  resetBtn.onclick = () => {
    document.body.removeChild(downloadPg)
    // then we call function to reset everything 
    reset()
    setTimeout(() => {
            photoBoothSequence()
    }, 500)
  }

  downloadPg.appendChild(preview)
  downloadPg.appendChild(downloadBtn)
  downloadPg.appendChild(resetBtn)
  
  document.body.appendChild(downloadPg)

}

function reset() {
  // we clear the array
  capturedPhotos = []

  // allow click again
  isPhotoSessionActive = false
  
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
  postProcessing.composer.render()
}
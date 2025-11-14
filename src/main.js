import './style.css'
import * as THREE from 'three' 
import { addDefaultMeshes, addStandardMesh } from './addDefaultMeshes.js'
import { addLight } from './addLight.js'
import Model from './model'
import { manager } from './manager'


const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000)
camera.position.set(0,0,5)
const renderer = new THREE.WebGLRenderer({antialias: true})

const meshes = {} 
const lights = {}
const mixers = []

const clock = new THREE.Clock()
const loadingManager = manager()

init()

function init(){
  renderer.setSize(window.innerWidth, window.innerHeight)
 
  document.body.appendChild(renderer.domElement)
  
  meshes.default = addDefaultMeshes() 
  meshes.standard = addStandardMesh({xpos: 2})

  lights.directional = addLight()
  
  scene.add(meshes.default)
  scene.add(meshes.standard)
  scene.add(lights.directional)

  instances()
  animate()
}

function instances(){
  const flowers = new Model({
    url: '/flowers.glb',
    name: 'flower',
    scene: scene, 
    meshes: meshes,
    scale: new THREE.Vector3(2,2,2),
    position: new THREE.Vector3(0,-0.8,3),
    animationState: true, 
    mixers: mixers,
    replace: true, 
    replaceURL: '/mat.png',
    manager: loadingManager,
  })
  flowers.init()

}
function animate(){

  const delta = clock.getDelta()
  for (const mixer of mixers){
    mixer.update(delta)
  }
  meshes.standard.rotation.x += 0.01
  meshes.standard.rotation.y += 0.01
  meshes.default.rotation.x -= 0.01
  meshes.default.rotation.y -= 0.01
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
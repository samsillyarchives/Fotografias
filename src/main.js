import './style.css'
import * as THREE from 'three' 
import { addDefaultMeshes, addStandardMesh } from './addDefaultMeshes.js'
import { addLight } from './addLight.js'

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

  animate()
}

function animate(){
  meshes.standard.rotation.x += 0.01
  meshes.standard.rotation.y += 0.01
  meshes.default.rotation.x -= 0.01
  meshes.default.rotation.y -= 0.01
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
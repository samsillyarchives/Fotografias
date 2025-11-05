import './style.css'
import * as THREE from 'three' 
import { addDefaultMeshes } from './addDefaultMeshes.js'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000)
camera.position.set(0,0,5)
const renderer = new THREE.WebGLRenderer({antialias: true})

const meshes = {} 

init()

function init(){
  renderer.setSize(window.innerWidth, window.innerHeight)
  //calculates what should be on our screen - this is full screen
  document.body.appendChild(renderer.domElement)
  // tell our website body to go to website 

  //add our meshes into our container then add to scene 
  meshes.default = addDefaultMeshes() 
  meshes.defaultbelow = addDefaultMeshes()
  meshes.copy = addDefaultMeshes()
  meshes.another = addDefaultMeshes()

  meshes.defaultbelow.position.y = -4
  meshes.copy.position.x = 4
  meshes.another.position.x = -4

  // add to scene 
  scene.add(meshes.default)
  scene.add(meshes.defaultbelow)
  scene.add(meshes.copy)
  scene.add(meshes.another)

  animate()
}

function animate(){
  meshes.default.position.y += .005
  meshes.defaultbelow.position.y += .005
  meshes.copy.position.y -= .005
  meshes.another.position.y -= .005
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
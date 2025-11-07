import * as THREE from 'three' 

export const addDefaultMeshes = ({xpos = 0, ypos = 0, zpos = 0} = {}) => {
    const geometry = new THREE.BoxGeometry(1,1,1,)
    const material = new THREE.MeshBasicMaterial({color: 0xff0000})
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(xpos, ypos, zpos)
    return mesh
}

export const addStandardMesh = ({xpos = 0, ypos = 0, zpos = 0} = {}) => {
    const geometry = new THREE.BoxGeometry(1,1,1)
    const material = new THREE.MeshStandardMaterial({
        color: 0xff00ff
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(xpos, ypos, zpos)
    return mesh 
}

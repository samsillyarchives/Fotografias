import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/Addons.js'


export function HDRI(){
    const rgbeLoader = new HDRLoader()
    const hdrMap = rgbeLoader.load('hdri3.hdr', (envMap)=>{
        envMap.mapping = THREE.EquirectangularReflectionMapping
        return envMap
    })
    return hdrMap
}

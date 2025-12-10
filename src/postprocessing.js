import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { Vector2 } from 'three'

export function postprocessing(scene, camera, renderer, mesh){
    const composer = new EffectComposer( renderer )
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(window.innerWidth, window.innerHeight)

    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    //const pixelPass = new RenderPixelatedPass(6, scene, camera)
    //composer.addPass(pixelPass)

    //const glitchPass = new GlitchPass()
    //glitchPass.enabled = false
    //composer.addPass(glitchPass)

    const bloomPass = new UnrealBloomPass()
    bloomPass.strength = 0
    composer.addPass(bloomPass)

    //const afterPass = new AfterimagePass()
    //afterPass.damp = .5
    //composer.addPass(afterPass)

    return { composer: composer, bloomPass: bloomPass  }
}

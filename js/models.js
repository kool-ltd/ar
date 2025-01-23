import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';

// Constants
const REAL_WORLD_LENGTH = 0.35; // Adjusted for mandoline size

export let models = { 
    blade: null, 
    frame: null, 
    handguard: null, 
    handle: null 
};
export let modelContainer;
export let originalPositions = new Map();

export async function loadModels() {
    const loader = new GLTFLoader();
    modelContainer = new THREE.Group();
    
    const loadPart = (url) => {
        return new Promise((resolve, reject) => {
            loader.load(url,
                (gltf) => resolve(gltf.scene),
                (xhr) => {
                    const percent = xhr.loaded / xhr.total * 100;
                    document.getElementById('loading-text').textContent = 
                        `Loading model... ${Math.round(percent)}%`;
                },
                (error) => reject(error)
            );
        });
    };

    try {
        const [bladePart, framePart, handguardPart, handlePart] = await Promise.all([
            loadPart('./kool-mandoline-blade.glb'),
            loadPart('./kool-mandoline-frame.glb'),
            loadPart('./kool-mandoline-handguard.glb'),
            loadPart('./kool-mandoline-handletpe.glb')
        ]);

        setupModelParts(bladePart, framePart, handguardPart, handlePart);
        scaleAndPositionModel();
        storeOriginalPositions();

        const previewModel = modelContainer.clone();
        previewModel.position.set(0, 0, 0);
        scene.add(previewModel);

        document.getElementById('loading-text').style.display = 'none';
        console.log('All models loaded successfully');

    } catch (error) {
        console.error('Error loading models:', error);
        document.getElementById('loading-text').textContent = 'Error loading models';
    }
}

function setupModelParts(bladePart, framePart, handguardPart, handlePart) {
    bladePart.name = 'blade';
    framePart.name = 'frame';
    handguardPart.name = 'handguard';
    handlePart.name = 'handle';

    models.blade = bladePart;
    models.frame = framePart;
    models.handguard = handguardPart;
    models.handle = handlePart;

    modelContainer.add(bladePart);
    modelContainer.add(framePart);
    modelContainer.add(handguardPart);
    modelContainer.add(handlePart);
}

function scaleAndPositionModel() {
    const bbox = new THREE.Box3().setFromObject(modelContainer);
    const modelSize = bbox.getSize(new THREE.Vector3());
    const scaleFactor = REAL_WORLD_LENGTH / modelSize.z;
    modelContainer.scale.set(scaleFactor, scaleFactor, scaleFactor);

    bbox.setFromObject(modelContainer);
    const center = bbox.getCenter(new THREE.Vector3());
    modelContainer.position.sub(center);
}

function storeOriginalPositions() {
    for (const part of [models.blade, models.frame, models.handguard, models.handle]) {
        originalPositions.set(part.name, {
            position: part.position.clone(),
            rotation: part.rotation.clone()
        });
    }
}

export function resetPartPositions(container) {
    container.children.forEach(part => {
        const originalPos = originalPositions.get(part.name);
        if (originalPos) {
            part.position.copy(originalPos.position);
            part.rotation.copy(originalPos.rotation);
        }
    });
}

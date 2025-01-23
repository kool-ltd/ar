import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';

const REAL_WORLD_LENGTH = 0.35;

export let models = { 
    blade: null, 
    frame: null, 
    handguard: null, 
    handle: null 
};
export let modelContainer;
export let originalPositions = new Map();
export let placedGroups = [];

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
        // Load each part into its own group
        const blade = new THREE.Group();
        const frame = new THREE.Group();
        const handguard = new THREE.Group();
        const handle = new THREE.Group();

        const [bladePart, framePart, handguardPart, handlePart] = await Promise.all([
            loadPart('./kool-mandoline-blade.glb'),
            loadPart('./kool-mandoline-frame.glb'),
            loadPart('./kool-mandoline-handguard.glb'),
            loadPart('./kool-mandoline-handletpe.glb')
        ]);

        // Set up each part in its own group
        blade.add(bladePart);
        frame.add(framePart);
        handguard.add(handguardPart);
        handle.add(handlePart);

        // Set names and userData for identification
        blade.name = 'blade';
        frame.name = 'frame';
        handguard.name = 'handguard';
        handle.name = 'handle';

        blade.userData.type = 'movable';
        frame.userData.type = 'movable';
        handguard.userData.type = 'movable';
        handle.userData.type = 'movable';

        // Store in models object
        models.blade = blade;
        models.frame = frame;
        models.handguard = handguard;
        models.handle = handle;

        // Add to container
        modelContainer.add(blade);
        modelContainer.add(frame);
        modelContainer.add(handguard);
        modelContainer.add(handle);

        // Scale and position
        scaleAndPositionModel();
        storeOriginalPositions();

        // Add to scene
        scene.add(modelContainer);

        document.getElementById('loading-text').style.display = 'none';
        console.log('All models loaded successfully');

    } catch (error) {
        console.error('Error loading models:', error);
        document.getElementById('loading-text').textContent = 'Error loading models';
    }
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
    Object.values(models).forEach(part => {
        originalPositions.set(part.name, {
            position: part.position.clone(),
            rotation: part.rotation.clone()
        });
    });
}

export function resetPartPositions() {
    Object.values(models).forEach(part => {
        const originalPos = originalPositions.get(part.name);
        if (originalPos) {
            part.position.copy(originalPos.position);
            part.rotation.copy(originalPos.rotation);
        }
    });
}
